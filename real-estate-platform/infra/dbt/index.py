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
    # Clear stale state from prior warm-container invocations. Lambda /tmp is
    # 5GB but persists across warm invocations; without cleanup we accumulate
    # DuckDB spill files, dbt target artifacts, manifests, and old log files
    # until "No space left on device". Wipe target/ + logs/ each run, recreate.
    import shutil
    for d in ("/tmp/dbt-logs", "/tmp/dbt-target"):
        try:
            shutil.rmtree(d, ignore_errors=True)
        except Exception:
            pass
        os.makedirs(d, exist_ok=True)
    # Files (not dirs): the persistent DuckDB file + WAL + any DuckDB spill
    # tempfiles that linger if a previous run was killed mid-build.
    for stale in ("/tmp/dbt-prod.duckdb", "/tmp/dbt-prod.duckdb.wal"):
        try:
            os.remove(stale)
        except FileNotFoundError:
            pass
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
    """Parse run_results.json — split MODEL build outcomes from TEST outcomes.

    Model failures are urgent (broken pipeline → page operator).
    Test failures are data quality findings (track but don't page).

    Tests, snapshots, and seeds also have their own failure semantics:
      - test failure = data quality issue
      - snapshot failure = data capture issue (urgent)
      - seed failure = config/data issue (urgent)
    """
    empty = {
        "models_built": 0, "models_failed": 0,
        "tests_passed": 0, "tests_failed": 0,
        "snapshots_built": 0, "snapshots_failed": 0,
        "seeds_loaded": 0, "seeds_failed": 0,
        "model_errors": [], "test_errors": [],
    }
    if not run_results_path.exists():
        return empty
    raw = run_results_path.read_text()
    if not raw.strip():
        # Empty file — dbt crashed before it could finish writing. Treat as empty
        # rather than raising, so the handler still surfaces the dbt stdout tail.
        return empty
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Truncated / partial write — same fallback as empty.
        return empty
    results = data.get("results", [])

    def is_kind(r: dict, prefix: str) -> bool:
        return (r.get("unique_id", "") or "").startswith(prefix + ".")

    models_failed = [r for r in results if is_kind(r, "model") and r.get("status") in ("error", "fail")]
    tests_failed_list = [r for r in results if is_kind(r, "test") and r.get("status") in ("error", "fail")]

    return {
        "models_built": sum(1 for r in results if is_kind(r, "model") and r.get("status") == "success"),
        "models_failed": len(models_failed),
        "tests_passed": sum(1 for r in results if is_kind(r, "test") and r.get("status") == "pass"),
        "tests_failed": len(tests_failed_list),
        "snapshots_built": sum(1 for r in results if is_kind(r, "snapshot") and r.get("status") == "success"),
        "snapshots_failed": sum(1 for r in results if is_kind(r, "snapshot") and r.get("status") in ("error", "fail")),
        "seeds_loaded": sum(1 for r in results if is_kind(r, "seed") and r.get("status") == "success"),
        "seeds_failed": sum(1 for r in results if is_kind(r, "seed") and r.get("status") in ("error", "fail")),
        "model_errors": [
            {"unique_id": r.get("unique_id"), "message": r.get("message")}
            for r in models_failed[:10]
        ],
        "test_errors": [
            {"unique_id": r.get("unique_id"), "message": (r.get("message") or "")[:200]}
            for r in tests_failed_list[:10]
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
    elif task == "models-only":
        # Build models without running tests. Use when test failures upstream
        # are skipping downstream marts (dbt build cascades skips). Lets us
        # land mart Parquet in S3 even with known data-quality issues.
        args = ["run", "--target", target, "--full-refresh"]
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

    # Model build metrics — alarm-worthy (broken pipeline)
    metrics.add_metric(name="DbtModelsBuilt", unit=MetricUnit.Count, value=summary["models_built"])
    metrics.add_metric(name="DbtModelsFailed", unit=MetricUnit.Count, value=summary["models_failed"])
    # Snapshot + seed failures are also build issues
    metrics.add_metric(name="DbtSnapshotsFailed", unit=MetricUnit.Count, value=summary["snapshots_failed"])
    metrics.add_metric(name="DbtSeedsFailed", unit=MetricUnit.Count, value=summary["seeds_failed"])
    # Test metrics — informational (data quality, not build failures)
    metrics.add_metric(name="DbtTestsPassed", unit=MetricUnit.Count, value=summary["tests_passed"])
    metrics.add_metric(name="DbtTestsFailed", unit=MetricUnit.Count, value=summary["tests_failed"])
    metrics.add_metric(name="DbtRunSeconds", unit=MetricUnit.Seconds, value=elapsed)

    # Build success: pipeline produced marts. Test failures are data quality
    # findings, not build failures — they don't trigger urgent alarms.
    # If dbt crashed before writing run_results.json (no models attempted),
    # treat that as a build failure regardless of rc — the pipeline didn't run.
    no_results_produced = (
        summary["models_built"] == 0 and summary["tests_passed"] == 0
        and summary["snapshots_built"] == 0 and summary["seeds_loaded"] == 0
    )
    has_build_failure = (
        summary["models_failed"] > 0 or
        summary["snapshots_failed"] > 0 or
        summary["seeds_failed"] > 0 or
        (rc != 0 and no_results_produced)
    )
    if has_build_failure:
        logger.error("dbt build failed", extra={"summary": summary, "rc": rc})
    elif summary["tests_failed"] > 0:
        logger.warning("dbt build ok; data-quality tests failed",
                       extra={"summary": summary, "tests_failed": summary["tests_failed"]})
    else:
        logger.info("dbt run ok", extra={"summary": summary, "elapsed": elapsed})

    body_payload = {
        "task": task,
        "target": target,
        "exit_code": rc,
        "duration_seconds": elapsed,
        "models_built": summary["models_built"],
        "models_failed": summary["models_failed"],
        "tests_passed": summary["tests_passed"],
        "tests_failed": summary["tests_failed"],
        "snapshots_built": summary["snapshots_built"],
        "model_errors": summary["model_errors"],
        "test_errors": summary["test_errors"],
        "run_results_s3": s3_path,
    }
    # Surface dbt stdout only on actual BUILD failures (not test failures)
    if has_build_failure:
        body_payload["output_tail"] = out[-4000:]

    # Status semantics:
    # - 200: build succeeded (models, snapshots, seeds all built). Tests may
    #   have failed but those are data-quality findings, not pipeline errors.
    # - 500: build failed (model/snapshot/seed error) — alarm-worthy.
    return {
        "statusCode": 500 if has_build_failure else 200,
        "body": json.dumps(body_payload),
    }
