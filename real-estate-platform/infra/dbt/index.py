"""
rlsir-analytics-dbt Lambda handler.

Per Phase D of docs/superpowers/plans/2026-05-04-execution-playbook.md.

Tasks:
  task=run         → dbt build --target ${target}
  task=run-and-test→ dbt build, then dbt test
  task=smoke       → dbt parse only (no SQL execution); for ORR readiness check
  task=full-refresh→ dbt build --full-refresh (manual recovery only)

Emits CloudWatch metrics in RLSIR/DataPipeline namespace:
  - DbtModelsBuilt (count)
  - DbtModelsFailed (count)
  - DbtRunSeconds (gauge)
  - DbtFreshnessSeconds (gauge — age of run_results.json)

Sidecar: writes run_results.json to s3://${BUCKET}/analytics/_meta/run_results-${ts}.json
so CloudWatch Logs Insights queries can correlate failures with model timings.
"""

# ─────────────────────────────────────────────────────────────────
# Lambda multiprocessing workaround — must run BEFORE importing dbt.
# Lambda containers don't expose /dev/shm, so multiprocessing.SemLock fails.
# Replace mp.RLock + mp.Lock with threading equivalents (single-process so safe).
# Source: dbt-labs/dbt-core#5160 + AWS Lambda Python multiprocessing limitations.
import multiprocessing
import multiprocessing.context
import threading

multiprocessing.RLock = threading.RLock  # type: ignore[assignment]
multiprocessing.Lock = threading.Lock  # type: ignore[assignment]
# Patch context-class methods too — dbt uses mp_context.RLock() not mp.RLock()
multiprocessing.context.BaseContext.RLock = lambda self: threading.RLock()  # type: ignore[assignment]
multiprocessing.context.BaseContext.Lock = lambda self: threading.Lock()  # type: ignore[assignment]
# ─────────────────────────────────────────────────────────────────

import json
import os
import sys
import time
from io import StringIO
from pathlib import Path

import boto3
from aws_lambda_powertools import Logger, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from dbt.cli.main import dbtRunner

logger = Logger(service="rlsir-analytics-dbt")
metrics = Metrics(namespace="RLSIR/DataPipeline", service="rlsir-analytics-dbt")

PROJECT_DIR = os.environ.get("DBT_PROJECT_DIR", "/opt/analytics")
PROFILES_DIR = os.environ.get("DBT_PROFILES_DIR", "/opt/analytics")
DEFAULT_TARGET = os.environ.get("DBT_TARGET", "prod")
ARTIFACTS_BUCKET = os.environ.get("ARTIFACTS_BUCKET")
ARTIFACTS_PREFIX = os.environ.get("ARTIFACTS_PREFIX", "analytics/_meta/")
RDS_SECRET_ID = os.environ.get("RDS_SECRET_ID", "rlsir/rds/dbt-readonly")


def _hydrate_rds_credentials_from_secrets_manager() -> None:
    """Pull RDS connection params from Secrets Manager → populate RDS_* env vars.

    Called once at module load. Lambda's execution role grants
    secretsmanager:GetSecretValue on rlsir/rds/dbt-readonly-* ARN.
    """
    try:
        sm = boto3.client("secretsmanager", region_name="us-east-1")
        resp = sm.get_secret_value(SecretId=RDS_SECRET_ID)
        secret = json.loads(resp["SecretString"])
        os.environ["RDS_HOST"] = secret.get("host", "")
        os.environ["RDS_PORT"] = str(secret.get("port", 5432))
        os.environ["RDS_USER"] = secret.get("username", "")
        os.environ["RDS_PASSWORD"] = secret.get("password", "")
        os.environ["RDS_DATABASE"] = secret.get("dbname", "")
        print(f"[startup] Hydrated RDS creds from Secrets Manager ({RDS_SECRET_ID})")
    except Exception as e:
        print(f"[startup] Could not hydrate RDS creds from Secrets Manager: {e}")
        # Fallback placeholders so dbt parse can complete (smoke task path).
        os.environ.setdefault("RDS_PASSWORD", "secret-not-configured-yet")
        os.environ.setdefault("RDS_HOST", "rds-not-configured")
        os.environ.setdefault("RDS_USER", "rds-not-configured")
        os.environ.setdefault("RDS_DATABASE", "rds-not-configured")
        os.environ.setdefault("RDS_PORT", "5432")


_hydrate_rds_credentials_from_secrets_manager()


def _run_dbt(args: list[str]) -> tuple[int, str]:
    """Run dbt in-process via dbtRunner.

    Lambda doesn't have /dev/shm, so dbt's CLI subprocess multiprocessing
    primitives (SemLock) fail. dbtRunner runs in the same process so it
    avoids the fork+SemLock path. Lambda's /opt is also read-only, so
    --log-path and --target-path must point at /tmp.
    """
    os.makedirs("/tmp/dbt-logs", exist_ok=True)
    os.makedirs("/tmp/dbt-target", exist_ok=True)
    # dbt scans cwd for things like profiles.yml fallback; pin it to /tmp.
    os.chdir("/tmp")
    full_args = [
        *args,
        "--project-dir", PROJECT_DIR,
        "--profiles-dir", PROFILES_DIR,
        "--log-path", "/tmp/dbt-logs",
        "--target-path", "/tmp/dbt-target",
    ]
    logger.info("dbt invoke", extra={"dbt_args": full_args})
    runner = dbtRunner()
    # Capture stdout while dbt runs (it prints to stdout normally)
    captured = StringIO()
    old_stdout = sys.stdout
    sys.stdout = captured
    try:
        result = runner.invoke(full_args)
    finally:
        sys.stdout = old_stdout
    out = captured.getvalue()
    rc = 0 if result.success else 1
    if result.exception:
        out += f"\n\nException: {result.exception}\n"
        rc = 2
    return rc, out


def _publish_run_results(run_id: str) -> str | None:
    """Upload target/run_results.json to S3 for CloudWatch Insights queries."""
    if not ARTIFACTS_BUCKET:
        return None
    src = Path("/tmp/dbt-target") / "run_results.json"
    if not src.exists():
        logger.warning("run_results.json not produced; skipping upload")
        return None
    s3 = boto3.client("s3")
    key = f"{ARTIFACTS_PREFIX.rstrip('/')}/run_results-{run_id}.json"
    s3.upload_file(str(src), ARTIFACTS_BUCKET, key)
    logger.info("run_results uploaded", extra={"bucket": ARTIFACTS_BUCKET, "key": key})
    return f"s3://{ARTIFACTS_BUCKET}/{key}"


def _summarize_run_results(run_results_path: Path) -> dict:
    """Parse run_results.json and emit metrics counts."""
    if not run_results_path.exists():
        return {"models_built": 0, "models_failed": 0, "errors": []}
    data = json.loads(run_results_path.read_text())
    results = data.get("results", [])
    failed = [r for r in results if r.get("status") in ("error", "fail")]
    return {
        "models_built": len([r for r in results if r.get("status") == "success"]),
        "models_failed": len(failed),
        "errors": [
            {"unique_id": r.get("unique_id"), "message": r.get("message")}
            for r in failed[:10]
        ],
    }


@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: dict, context) -> dict:
    """
    Lambda entry point.

    Event shape:
      { "task": "run" | "run-and-test" | "smoke" | "full-refresh",
        "target"?: "dev" | "prod",
        "select"?: "+tag:active",     # passed straight to dbt --select
        "exclude"?: "tag:experimental" # dbt --exclude
      }
    """
    started = time.time()
    task = event.get("task", "smoke")
    target = event.get("target", DEFAULT_TARGET)
    select = event.get("select")
    exclude = event.get("exclude")
    run_id = str(int(started))

    if task == "smoke":
        # ORR readiness check — parses project, exits without DB connections.
        rc, out = _run_dbt(["parse", "--target", "dev"])
        return {
            "statusCode": 200 if rc == 0 else 500,
            "body": json.dumps({
                "task": "smoke",
                "exit_code": rc,
                "duration_seconds": round(time.time() - started, 1),
                "output_tail": out[-2000:] if rc != 0 else "ok",
            }),
        }

    args: list[str]
    if task == "run":
        args = ["build", "--target", target]
    elif task == "run-and-test":
        args = ["build", "--target", target]
    elif task == "full-refresh":
        args = ["build", "--target", target, "--full-refresh"]
    else:
        return {"statusCode": 400, "body": json.dumps({"error": f"unknown task: {task}"})}

    if select:
        args.extend(["--select", select])
    if exclude:
        args.extend(["--exclude", exclude])

    rc, out = _run_dbt(args)
    elapsed = round(time.time() - started, 1)

    summary = _summarize_run_results(Path("/tmp/dbt-target") / "run_results.json")

    s3_path = _publish_run_results(run_id)

    metrics.add_metric(name="DbtModelsBuilt", unit=MetricUnit.Count, value=summary["models_built"])
    metrics.add_metric(name="DbtModelsFailed", unit=MetricUnit.Count, value=summary["models_failed"])
    metrics.add_metric(name="DbtRunSeconds", unit=MetricUnit.Seconds, value=elapsed)

    if rc != 0 or summary["models_failed"] > 0:
        logger.error("dbt run failed", extra={"summary": summary, "rc": rc})
    else:
        logger.info("dbt run ok", extra={"summary": summary, "elapsed": elapsed})

    body_payload = {
        "task": task,
        "target": target,
        "exit_code": rc,
        "duration_seconds": elapsed,
        "models_built": summary["models_built"],
        "models_failed": summary["models_failed"],
        "errors": summary["errors"],
        "run_results_s3": s3_path,
    }
    if rc != 0 or summary["models_failed"] > 0:
        body_payload["output_tail"] = out[-4000:]
    return {
        "statusCode": 200 if rc == 0 and summary["models_failed"] == 0 else 500,
        "body": json.dumps(body_payload),
    }
