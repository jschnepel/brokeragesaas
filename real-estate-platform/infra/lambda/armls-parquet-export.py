"""
ARMLS Parquet Export Lambda

Reads each ARMLS table from RDS via DuckDB's postgres extension and writes
per-run Parquet snapshots to S3 — preserving full history of every adjustment
across the listing lifecycle.

Trigger: EventBridge rate(4 hours), aligned with rlsir-armls-sync.

Path layout (every run, never overwritten):
  s3://.../bronze/parquet/{table}/sync_year=YYYY/sync_month=MM/sync_day=DD/run_id=<uuid>/data.parquet
  s3://.../bronze/parquet/_freshness.json                              (last successful run)
  s3://.../bronze/parquet/listing_change_log/_state.json               (watermark for incremental)

Two export modes:

  SNAPSHOT (5 tables):
    Full table dump per run. dbt staging picks the LATEST snapshot per
    listing for current state, OR globs all snapshots to reconstruct
    point-in-time history.
    Tables: listing_records, listing_members, listing_offices,
            listing_open_houses, listing_geography_links

  INCREMENTAL (1 table):
    Watermark-based — only rows where id > last_max_id_exported.
    State stored in S3 _state.json. Each run produces a small delta
    Parquet (~1MB instead of 150MB).
    Tables: listing_change_log

Why per-run snapshots (not per-day overwrite):
  At rate(4 hours), a list_price change at 09:00 and another at 13:00
  would be invisible if we overwrote the day. 6 snapshots/day preserve
  every state. Combined with the granular change_log, dbt can compute
  every adjustment in a listing's history.

Storage cost: ~13GB/mo at $0.023/GB = ~$0.30/mo.
"""

from __future__ import annotations

import json
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import Any

import boto3
import duckdb

S3_BUCKET = os.environ.get("S3_BUCKET", "rlsir-platform-assets-us-east-1")
S3_PREFIX = os.environ.get("S3_PREFIX", "bronze/parquet")
DSN_SECRET_ID = os.environ.get("DSN_SECRET_ID", "rlsir/db/url")
REGION = os.environ.get("AWS_REGION", "us-east-1")

# Tables that get a full snapshot every run.
# `select_columns` defaults to "*"; override for tables with PostGIS geom columns
# (DuckDB's postgres extension doesn't decode WKB natively — we keep the join
# keys + slugs and drop the geometry).
# `where_filter` (optional): SQL fragment applied as a WHERE clause to bound
# the export. Used for listing_records to ship only historical-status rows
# modified in the last N days — full snapshots take >900s and timeout, while
# incremental deltas finish in <30s. The historical base from the most recent
# full run stays in S3 and dbt staging globs both. Active-status analytics flow
# through bronze/active_snapshot.ndjson.gz (separate Lambda), not this stream.
SNAPSHOT_TABLES: list[dict[str, str]] = [
    {
        "table": "listing_records",
        "select_columns": "*",
        "where_filter": (
            "standard_status IN ('Closed', 'Expired', 'Withdrawn', 'Cancelled') "
            "AND modification_timestamp >= NOW() - INTERVAL '14 days'"
        ),
    },
    {"table": "listing_members",     "select_columns": "*"},
    {"table": "listing_offices",     "select_columns": "*"},
    {"table": "listing_open_houses", "select_columns": "*"},
    {
        "table": "listing_geography",
        # listing_geography has a PostGIS `point` column that fails WKB decode
        # through the duckdb postgres extension. Drop the geometry — keep all
        # classification slugs (community_slug, region_slug) which is what
        # downstream analytics actually uses.
        "select_columns": "* EXCLUDE (point)",
    },
]

# Tables exported incrementally by a monotonic id watermark.
INCREMENTAL_TABLES: list[dict[str, str]] = [
    {"table": "listing_change_log", "id_column": "id"},
]

sm = boto3.client("secretsmanager", region_name=REGION)
s3 = boto3.client("s3", region_name=REGION)
cw = boto3.client("cloudwatch", region_name=REGION)

# Set by handler() at the start of each invocation; used by step() to show
# elapsed seconds since invocation start so a stuck run is diagnosable from
# CloudWatch alone (timestamps + step labels pinpoint which phase hangs).
_HANDLER_START_PERF: float = 0.0


def step(label: str) -> None:
    """Structured progress log. Format: '[step  +12.3s] label'."""
    elapsed = time.perf_counter() - _HANDLER_START_PERF
    print(f"[step {elapsed:+7.2f}s] {label}", flush=True)


def get_dsn() -> str:
    step("secrets:get_dsn:start")
    secret = sm.get_secret_value(SecretId=DSN_SECRET_ID)
    step("secrets:get_dsn:done")
    return secret["SecretString"]


def emit_metric(name: str, value: float, unit: str, dimensions: dict[str, str] | None = None) -> None:
    try:
        cw.put_metric_data(
            Namespace="RLSIR/DataPipeline",
            MetricData=[{
                "MetricName": name,
                "Value": value,
                "Unit": unit,
                "Dimensions": [{"Name": k, "Value": v} for k, v in (dimensions or {}).items()],
            }],
        )
    except Exception as exc:
        print(f"[metric] failed: {exc}", file=sys.stderr)


def s3_path(table: str, partition_path: str, run_id: str) -> str:
    return f"s3://{S3_BUCKET}/{S3_PREFIX}/{table}/{partition_path}/run_id={run_id}/data.parquet"


def get_state(table: str) -> dict[str, Any]:
    """Read incremental-export state for a table. Returns {} if missing."""
    key = f"{S3_PREFIX}/{table}/_state.json"
    try:
        obj = s3.get_object(Bucket=S3_BUCKET, Key=key)
        return json.loads(obj["Body"].read())
    except s3.exceptions.NoSuchKey:
        return {}
    except Exception as exc:
        print(f"[state] {table}: read failed ({exc}); treating as empty", file=sys.stderr)
        return {}


def put_state(table: str, state: dict[str, Any]) -> None:
    key = f"{S3_PREFIX}/{table}/_state.json"
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=json.dumps(state, default=str).encode(),
        ContentType="application/json",
        CacheControl="no-cache",
    )


def head_object_size(s3_path_str: str) -> int:
    """HEAD an s3:// path to get its size in bytes."""
    bucket_key = s3_path_str.replace(f"s3://{S3_BUCKET}/", "")
    head = s3.head_object(Bucket=S3_BUCKET, Key=bucket_key)
    return int(head.get("ContentLength", 0))


def export_snapshot(
    con: duckdb.DuckDBPyConnection,
    table: str,
    partition_path: str,
    run_id: str,
    select_columns: str = "*",
    where_filter: str | None = None,
) -> dict[str, Any]:
    """Snapshot exported as Parquet. Per-run partition preserves history.

    `where_filter`: optional SQL fragment for the WHERE clause. When set, this
    is a bounded delta export (e.g. last-14-day modification window) rather
    than a full snapshot. The historical base from the most recent full run
    remains in S3 and dbt staging globs both.

    When `where_filter` is set, the query is dispatched to PG via
    `postgres_query('rds', ...)` so PG executes the predicate (using indexes
    where available). DuckDB's postgres extension foreign-table reads do NOT
    push predicates down — without this, a "WHERE modification_timestamp >= ..."
    over 1.9M rows pulls the full table to DuckDB then filters locally
    (≥7min, exceeding Lambda's 900s budget).
    """
    started_at = time.perf_counter()
    out_path = s3_path(table, partition_path, run_id)
    mode = "snapshot_delta" if where_filter else "snapshot"

    if where_filter:
        # Escape single quotes ONCE so the inner SQL becomes a valid string
        # literal inside DuckDB's postgres_query('rds', '...') call. DuckDB
        # un-doubles the quotes when parsing the literal and sends correctly
        # quoted SQL to PG. Don't escape twice — that produces ''''Closed''''
        # which PG rejects as a syntax error.
        pg_where = where_filter.replace("'", "''")
        # COUNT goes server-side — PG returns one integer, instant.
        count_sql = (
            f"SELECT * FROM postgres_query('rds', "
            f"'SELECT COUNT(*) AS n FROM {table} WHERE {pg_where}')"
        )
        # SELECT for COPY also goes server-side; PG streams matching rows only.
        # Note: select_columns ('*' or '* EXCLUDE (...)') is interpreted by
        # DuckDB *after* the rows arrive, so it still works.
        source_expr = (
            f"postgres_query('rds', "
            f"'SELECT {select_columns} FROM {table} WHERE {pg_where}')"
        )
    else:
        # No filter — full snapshot via DuckDB's foreign-table read (parallel scan).
        count_sql = f"SELECT COUNT(*) AS n FROM rds.public.{table}"
        source_expr = f"(SELECT {select_columns} FROM rds.public.{table})"

    step(f"{mode}:{table}:count:start")
    count_row = con.execute(count_sql).fetchone()
    row_count = int(count_row[0]) if count_row else 0
    step(f"{mode}:{table}:count:done rows={row_count:,}")

    step(f"{mode}:{table}:copy:start -> {out_path}")
    con.execute(f"""
        COPY (
            SELECT *,
                   '{run_id}'::VARCHAR             AS sync_run_id,
                   CURRENT_TIMESTAMP::TIMESTAMP    AS sync_observed_at
            FROM {source_expr}
        )
        TO '{out_path}' (FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 100000)
    """)
    step(f"{mode}:{table}:copy:done")

    elapsed_s = time.perf_counter() - started_at
    bytes_written = head_object_size(out_path)

    print(f"[snapshot:{table}] {row_count:,} rows -> {bytes_written/1024/1024:.1f} MB in {elapsed_s:.1f}s")

    emit_metric("ArmlsParquetRows",  row_count,    "Count",  {"Table": table, "Mode": "snapshot"})
    emit_metric("ArmlsParquetBytes", bytes_written, "Bytes", {"Table": table, "Mode": "snapshot"})
    emit_metric("ArmlsParquetExportSeconds", elapsed_s, "Seconds", {"Table": table, "Mode": "snapshot"})

    return {
        "table": table,
        "mode": "snapshot",
        "rows": row_count,
        "bytes": bytes_written,
        "elapsed_seconds": round(elapsed_s, 2),
        "s3_path": out_path,
        "status": "success",
    }


def export_incremental(
    con: duckdb.DuckDBPyConnection,
    table: str,
    id_column: str,
    partition_path: str,
    run_id: str,
) -> dict[str, Any]:
    """Watermark-based incremental export. Writes only rows newer than last run.

    First run writes the full table (no WHERE clause). Subsequent runs filter
    by id_column > last_max_id from the state file.
    """
    started_at = time.perf_counter()
    step(f"incremental:{table}:state:start")
    state = get_state(table)
    last_max_id = state.get("last_max_id")  # may be None on first run
    step(f"incremental:{table}:state:done last_max_id={last_max_id}")

    # Find this run's new max(id). If table is empty, skip.
    step(f"incremental:{table}:bounds:start")
    bounds_row = con.execute(
        f"SELECT MIN({id_column}), MAX({id_column}) FROM rds.public.{table}"
    ).fetchone()
    step(f"incremental:{table}:bounds:done")
    if not bounds_row or bounds_row[1] is None:
        print(f"[incremental:{table}] table empty; nothing to export")
        return {"table": table, "mode": "incremental", "rows": 0, "status": "skipped_empty"}

    new_max_id = int(bounds_row[1])
    where_clause = f"WHERE {id_column} > {int(last_max_id)}" if last_max_id is not None else ""

    count_row = con.execute(
        f"SELECT COUNT(*) FROM rds.public.{table} {where_clause}"
    ).fetchone()
    row_count = int(count_row[0]) if count_row else 0

    if row_count == 0:
        print(f"[incremental:{table}] no new rows since last_max_id={last_max_id} (current max={new_max_id})")
        emit_metric("ArmlsParquetRows", 0, "Count", {"Table": table, "Mode": "incremental"})
        return {
            "table": table,
            "mode": "incremental",
            "rows": 0,
            "last_max_id_before": last_max_id,
            "last_max_id_after": new_max_id,
            "status": "no_new_rows",
        }

    out_path = s3_path(table, partition_path, run_id)
    step(f"incremental:{table}:copy:start rows={row_count:,} -> {out_path}")
    con.execute(f"""
        COPY (
            SELECT *,
                   '{run_id}'::VARCHAR             AS sync_run_id,
                   CURRENT_TIMESTAMP::TIMESTAMP    AS sync_observed_at
            FROM rds.public.{table}
            {where_clause}
            ORDER BY {id_column}
        )
        TO '{out_path}' (FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 100000)
    """)
    step(f"incremental:{table}:copy:done")

    elapsed_s = time.perf_counter() - started_at
    bytes_written = head_object_size(out_path)

    # Persist new watermark ONLY after Parquet write succeeds.
    put_state(table, {
        "last_max_id": new_max_id,
        "last_run_id": run_id,
        "last_run_at": datetime.now(timezone.utc).isoformat(),
        "last_rows_exported": row_count,
        "bootstrap_complete": True,
    })

    print(
        f"[incremental:{table}] {row_count:,} new rows "
        f"(id range {(last_max_id or 0)+1}..{new_max_id}) "
        f"-> {bytes_written/1024/1024:.2f} MB in {elapsed_s:.1f}s"
    )

    emit_metric("ArmlsParquetRows",  row_count,    "Count",  {"Table": table, "Mode": "incremental"})
    emit_metric("ArmlsParquetBytes", bytes_written, "Bytes", {"Table": table, "Mode": "incremental"})
    emit_metric("ArmlsParquetExportSeconds", elapsed_s, "Seconds", {"Table": table, "Mode": "incremental"})

    return {
        "table": table,
        "mode": "incremental",
        "rows": row_count,
        "bytes": bytes_written,
        "elapsed_seconds": round(elapsed_s, 2),
        "last_max_id_before": last_max_id,
        "last_max_id_after": new_max_id,
        "s3_path": out_path,
        "status": "success",
    }


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    global _HANDLER_START_PERF
    _HANDLER_START_PERF = time.perf_counter()

    start = datetime.now(timezone.utc)
    run_id = getattr(context, "aws_request_id", str(uuid.uuid4()))

    partition_path = (
        f"sync_year={start.strftime('%Y')}"
        f"/sync_month={start.strftime('%m')}"
        f"/sync_day={start.strftime('%d')}"
    )

    step(f"handler:start run_id={run_id} partition={partition_path} event={json.dumps(event)[:200]}")

    dsn = get_dsn()

    step("duckdb:connect:start")
    con = duckdb.connect(":memory:")
    step("duckdb:connect:done")

    # Lambda runtime has no $HOME; DuckDB extension install needs a writable
    # path. /tmp is the only writable filesystem on Lambda.
    con.execute("SET home_directory='/tmp/duckdb_home'")
    con.execute("SET extension_directory='/tmp/duckdb_extensions'")
    # DuckDB writes spill files (`.tmp/...`) to a temp dir. Lambda's working
    # directory is read-only; /tmp is the only writable filesystem.
    con.execute("SET temp_directory='/tmp/duckdb_temp'")
    con.execute("SET memory_limit = '3000MB'")

    step("duckdb:install:httpfs:start")
    con.execute("INSTALL httpfs; LOAD httpfs;")
    step("duckdb:install:httpfs:done")

    step("duckdb:install:postgres:start")
    con.execute("INSTALL postgres; LOAD postgres;")
    step("duckdb:install:postgres:done")

    con.execute("SET s3_region = 'us-east-1'")

    step("duckdb:attach_rds:start")
    con.execute(f"ATTACH '{dsn}' AS rds (TYPE postgres, READ_ONLY)")
    step("duckdb:attach_rds:done")

    # Allow optional event payload to filter tables (for ad-hoc partial runs).
    requested = event.get("tables") if isinstance(event, dict) else None
    # `full_refresh=True` bypasses any spec-level `where_filter` so the run
    # produces a complete snapshot (used for periodic re-baselining).
    full_refresh = bool(event.get("full_refresh")) if isinstance(event, dict) else False

    results: list[dict[str, Any]] = []

    for spec in SNAPSHOT_TABLES:
        table = spec["table"]
        if requested and table not in requested:
            continue
        try:
            results.append(export_snapshot(
                con, table, partition_path, run_id,
                select_columns=spec.get("select_columns", "*"),
                where_filter=None if full_refresh else spec.get("where_filter"),
            ))
        except Exception as exc:
            err = str(exc)[:300]
            print(f"[snapshot:{table}] FAILED: {err}", file=sys.stderr)
            results.append({"table": table, "mode": "snapshot", "status": "failed", "error": err})
            emit_metric("ArmlsParquetExportFailures", 1, "Count", {"Table": table, "Mode": "snapshot"})

    for spec in INCREMENTAL_TABLES:
        table = spec["table"]
        if requested and table not in requested:
            continue
        try:
            results.append(export_incremental(con, table, spec["id_column"], partition_path, run_id))
        except Exception as exc:
            err = str(exc)[:300]
            print(f"[incremental:{table}] FAILED: {err}", file=sys.stderr)
            results.append({"table": table, "mode": "incremental", "status": "failed", "error": err})
            emit_metric("ArmlsParquetExportFailures", 1, "Count", {"Table": table, "Mode": "incremental"})

    duration_s = (datetime.now(timezone.utc) - start).total_seconds()
    failed = [r for r in results if r.get("status") == "failed"]

    # Update freshness marker — single source of truth for downstream consumers.
    freshness = {
        "last_export_at": start.isoformat(),
        "run_id": run_id,
        "partition": partition_path,
        "duration_seconds": round(duration_s, 2),
        "tables": results,
    }
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=f"{S3_PREFIX}/_freshness.json",
        Body=json.dumps(freshness, default=str).encode(),
        ContentType="application/json",
        CacheControl="no-cache",
    )

    emit_metric("ArmlsParquetExportSecondsTotal", duration_s, "Seconds")

    body = {
        "run_id": run_id,
        "partition": partition_path,
        "tables_exported": len([r for r in results if r.get("status") == "success"]),
        "tables_no_new_rows": len([r for r in results if r.get("status") == "no_new_rows"]),
        "tables_failed": len(failed),
        "duration_seconds": round(duration_s, 2),
        "results": results,
    }
    return {
        "statusCode": 500 if failed else 200,
        "body": json.dumps(body, default=str),
    }
