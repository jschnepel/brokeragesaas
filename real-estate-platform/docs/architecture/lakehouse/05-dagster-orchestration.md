# Dagster Orchestration

**Date:** 2026-04-30
**Status:** Spec — replaces ad-hoc EventBridge cron + manual run sequencing.
**Related:** `02-bronze-ingest.md` (events Dagster watches), `03-dbt-project.md` (the asset graph Dagster materializes).

---

## 1. Why Dagster

The system is moving from "Lambda + EventBridge cron" to a real data orchestrator because:

1. **Asset-aware scheduling**: Dagster knows that `fct_market_pulse` depends on `int_listings_closed_cleaned` depends on `stg_armls__listing_records` depends on `bronze/listings/_freshness.json`. It won't rebuild downstream marts until upstream is fresh.
2. **Sensor pattern**: when `bronze/listings/_freshness.json` advances, the asset sensor fires and the dbt run kicks off. No cron timing assumptions.
3. **Lineage UI**: a single page shows which marts are stale, why, and what blocks them. Replaces "grep CloudWatch logs."
4. **Surgical backfills**: re-materialize a single asset for a single time partition. Replaces "re-run the whole dbt build."
5. **Dagster's dbt integration is first-class**: `dagster-dbt` registers each dbt model as a Dagster asset automatically.

## 2. Deployment topology

**Recommendation:** Dagster Cloud Hobby tier (free, 30k step-runs/mo) for v1. Self-hosted on ECS Fargate as a fallback if scale grows.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Dagster Cloud Hobby (managed)                                           │
│   - UI: https://rlsir.dagster.cloud                                       │
│   - Daemon: schedules + sensors + run launcher                            │
│   - Run storage: managed Postgres                                         │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼ (deploys via Dagster Cloud Agent or Dagster+ Hybrid)
┌──────────────────────────────────────────────────────────────────────────┐
│  Code location — `rlsir-orchestration/` repo or directory                │
│   - dagster.yaml                                                          │
│   - assets/                                                               │
│   ├── bronze.py            (asset definitions for bronze sensors)        │
│   ├── armls_dbt.py         (load_assets_from_dbt_project for armls)      │
│   └── yong2_dbt.py         (load_assets_from_dbt_project for yong2)      │
│   - sensors/                                                              │
│   ├── bronze_landed.py     (S3 sensor → triggers downstream dbt)         │
│   - schedules/                                                            │
│   ├── nightly_full_refresh.py                                            │
│   ├── hourly_active.py                                                   │
│   └── four_hourly_closed.py                                              │
│   - resources/                                                            │
│   ├── dbt_lambda.py        (DbtCliResource pointing at the dbt Lambda)   │
│   └── s3.py                (S3Resource for sensor reads)                 │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼ (run launches invoke this Lambda)
┌──────────────────────────────────────────────────────────────────────────┐
│  rlsir-analytics-dbt Lambda (the actual dbt runtime)                     │
│   - container image, 1024MB, 900s timeout                                │
│   - reads bronze, writes analytics/{domain}/{mart}.parquet               │
└──────────────────────────────────────────────────────────────────────────┘
```

**Runtime separation:** Dagster orchestrates; the dbt Lambda executes. Dagster never runs dbt itself — it tells the Lambda what `--select` to run and reads back `run_results.json` to update its asset materialization status.

## 3. Asset graph

Dagster represents every bronze "table" + every dbt model as a node.

```python
# assets/bronze.py
from dagster import asset, AssetKey, FreshnessPolicy

@asset(
    key=AssetKey(["bronze", "listings"]),
    freshness_policy=FreshnessPolicy(maximum_lag_minutes=240),  # 4h
    compute_kind="lambda",
    description="ARMLS Property bronze NDJSON.gz, dual-written by rlsir-armls-sync Lambda.",
)
def bronze_listings(context, s3: S3Resource):
    """Materialized externally — this asset's metadata is read from _freshness.json."""
    fresh = s3.get_object("rlsir-platform-assets-us-east-1", "bronze/listings/_freshness.json")
    metadata = json.loads(fresh["Body"].read())
    context.add_output_metadata({
        "last_snapshot_at": metadata["last_snapshot_at"],
        "record_count": metadata["record_count"],
    })

@asset(
    key=AssetKey(["bronze", "active_snapshot"]),
    freshness_policy=FreshnessPolicy(maximum_lag_minutes=60),  # 1h
    compute_kind="lambda",
)
def bronze_active_snapshot(context, s3: S3Resource):
    fresh = s3.get_object("rlsir-platform-assets-us-east-1", "bronze/active_snapshot/_freshness.json")
    metadata = json.loads(fresh["Body"].read())
    context.add_output_metadata(metadata)

# ... similar for change_log, yong2_events, yong2_leads


# assets/armls_dbt.py
from dagster_dbt import dbt_assets, DbtCliResource

@dbt_assets(
    manifest=Path("../analytics/target/manifest.json"),
    select="tag:armls",
)
def armls_dbt_assets(context, dbt: DbtCliResource):
    yield from dbt.cli(["build", "--select", "tag:armls"], context=context).stream()


# assets/yong2_dbt.py
@dbt_assets(
    manifest=Path("../analytics/target/manifest.json"),
    select="tag:yong2",
)
def yong2_dbt_assets(context, dbt: DbtCliResource):
    yield from dbt.cli(["build", "--select", "tag:yong2"], context=context).stream()
```

`dagster-dbt` reads the dbt `manifest.json` and creates one Dagster asset per dbt model. Asset deps mirror the dbt DAG. The lineage view shows everything from `bronze/listings` through `stg_armls__listing_records` → `int_listings_closed_cleaned` → `fct_market_pulse`.

## 4. Sensors — the reactive layer

A sensor is a Python function that runs every N seconds and decides whether to launch a run.

```python
# sensors/bronze_landed.py
from dagster import asset_sensor, RunRequest, AssetKey

@asset_sensor(
    asset_key=AssetKey(["bronze", "active_snapshot"]),
    job_name="active_marts_job",
    minimum_interval_seconds=300,
)
def active_snapshot_landed(context, asset_event):
    """Fires when bronze/active_snapshot/_freshness.json advances. Triggers active-mart dbt build."""
    return RunRequest(
        run_key=str(asset_event.dagster_event.event_specific_data.materialization.metadata.get("run_id")),
        tags={"trigger": "active_snapshot_landed"},
    )

@asset_sensor(asset_key=AssetKey(["bronze", "listings"]), job_name="closed_marts_job")
def listings_landed(context, asset_event):
    """Fires when bronze/listings/_freshness.json advances. Triggers closed-mart dbt build."""
    return RunRequest(run_key=str(asset_event.dagster_event.event_specific_data.materialization.metadata.get("run_id")))
```

**The contract:** bronze writers update `_freshness.json` last. A separate "freshness poller" sensor reads `_freshness.json` mtime every 5 minutes and emits an asset materialization event when it advances. That event fires the asset_sensor, which launches the downstream dbt run.

```python
# sensors/freshness_poller.py
from dagster import sensor, SensorEvaluationContext, AssetMaterialization, RunRequest

@sensor(minimum_interval_seconds=300, job_name="bronze_observe_job")
def freshness_poller(context: SensorEvaluationContext, s3: S3Resource):
    state = json.loads(context.cursor or "{}")
    for prefix in ["listings", "active_snapshot", "change_log", "yong2/events"]:
        head = s3.head_object("rlsir-platform-assets-us-east-1", f"bronze/{prefix}/_freshness.json")
        last_modified = head["LastModified"].isoformat()
        if last_modified != state.get(prefix):
            state[prefix] = last_modified
            yield AssetMaterialization(asset_key=["bronze", prefix.replace("/", "_")],
                                       metadata={"last_modified": last_modified})
    context.update_cursor(json.dumps(state))
```

This pattern decouples bronze writers from Dagster — they never need to call Dagster's API. They just write `_freshness.json`.

## 5. Schedules — the time-driven backbone

Schedules are belt-and-suspenders for sensor failures and for periodic full refreshes.

```python
# schedules/hourly_active.py
from dagster import ScheduleDefinition

hourly_active_schedule = ScheduleDefinition(
    name="hourly_active",
    cron_schedule="5 * * * *",                # :05 every hour
    job_name="active_marts_job",
    execution_timezone="America/Phoenix",
)

# schedules/four_hourly_closed.py
four_hourly_closed_schedule = ScheduleDefinition(
    name="four_hourly_closed",
    cron_schedule="15 */4 * * *",             # :15 every 4 hours
    job_name="closed_marts_job",
)

# schedules/nightly_full_refresh.py
nightly_full_refresh = ScheduleDefinition(
    name="nightly_full_refresh",
    cron_schedule="0 8 * * *",                # 01:00 PHX
    job_name="full_refresh_job",
)
```

**Three jobs:**

```python
# jobs/active.py
active_marts_job = define_asset_job(
    name="active_marts_job",
    selection=AssetSelection.tag("active") | AssetSelection.tag("active") + ["bronze.active_snapshot"],
)

# jobs/closed.py
closed_marts_job = define_asset_job(
    name="closed_marts_job",
    selection=AssetSelection.tag("closed") | AssetSelection.tag("closed") + ["bronze.listings"],
)

# jobs/full_refresh.py
full_refresh_job = define_asset_job(
    name="full_refresh_job",
    selection=AssetSelection.all(),
    config={"ops": {"armls_dbt_assets": {"config": {"vars": "{full_refresh: true}"}}}},
)
```

## 6. Partitions

For incremental dbt models, Dagster's time-window partitions align with dbt's `unique_key` watermark.

```python
from dagster import MonthlyPartitionsDefinition

closed_partitions = MonthlyPartitionsDefinition(start_date="2011-01-01")

@dbt_assets(
    manifest=Path("../analytics/target/manifest.json"),
    select="tag:closed",
    partitions_def=closed_partitions,
)
def closed_dbt_assets(context, dbt: DbtCliResource):
    partition_key = context.partition_key  # e.g. "2026-04-01"
    yield from dbt.cli([
        "build", "--select", "tag:closed",
        "--vars", f'{{partition_month: "{partition_key}"}}',
    ], context=context).stream()
```

The dbt model uses the var:

```sql
-- models/intermediate/listings/int_listings_closed_cleaned.sql
WHERE close_month = '{{ var("partition_month") }}'::DATE
```

Backfilling a single bad month becomes:

```python
# Via UI: select fct_market_pulse, partition 2024-12, click "Materialize"
# Via CLI:
dagster asset materialize --select fct_market_pulse --partition 2024-12
```

For yong2 events (high cardinality, daily volume): `DailyPartitionsDefinition(start_date="2026-04-01")`.

## 7. Cost model — Dagster Cloud

Dagster Cloud Hobby (free tier):
- **30k step runs/mo included**
- A "step run" = one asset materialization or sensor evaluation

Estimated usage:
- 27 dbt assets × 24 (hourly) = 648 daily for active branch
- 27 × 6 (4-hourly) = 162 daily for closed
- Sensor evaluations: 12 sensors × 288 (5-min interval × 24h) = 3,456 daily
- Total: ~4,200 daily × 30 = **126,000/mo step runs**

That's 4× over the Hobby limit. Two options:
1. **Reduce sensor frequency** to 15 min — drops to ~30k/mo, fits Hobby
2. **Upgrade to Pro** ($30/mo, 100k credits) or self-host

**Recommendation:** start on Hobby with 15-min sensor interval. Upgrade to Pro at $30/mo if needed (still way under the $46/mo RDS savings).

**Self-hosted fallback:**
- ECS Fargate Dagster (webserver + daemon): ~$25/mo
- Postgres for run/asset metadata: existing RDS (`dagster` schema, ~$0)
- S3 for run logs: ~$1/mo

## 8. Hybrid agent pattern (Dagster Cloud + AWS)

The Dagster Cloud daemon is hosted by Elementl. To run our code in our AWS account, we use the **Hybrid agent**:

```yaml
# rlsir-orchestration/dagster_cloud.yaml
locations:
  - location_name: rlsir-prod
    code_source:
      package_name: rlsir_orchestration
    image: 828301486081.dkr.ecr.us-east-1.amazonaws.com/rlsir-dagster-code:latest
```

Deployment:
```bash
docker buildx build -t rlsir-dagster-code:latest -f Dockerfile .
docker tag ... ; docker push ...
dagster-cloud deployment add-location ...
```

Code runs in our ECR-hosted container; Dagster Cloud orchestrates. AWS credentials are passed via env vars or IAM role attached to the Fargate task that pulls the image.

## 9. Migration path from current state

| What we have today | Migration step |
|---|---|
| EventBridge `rate(4 hours)` for armls-sync | Keep — bronze writers stay on EventBridge |
| EventBridge `rate(1 hour)` for active-snapshot | Keep — bronze writers stay on EventBridge |
| EventBridge `rate(1 day)` for bronze-reconcile | Keep — orthogonal to dbt |
| (No analytics dbt schedule yet) | Replace with Dagster sensors + schedules from Day 0 |

Dagster does NOT replace bronze ingestion. Bronze writers keep their EventBridge cron because they're simple periodic pulls from external APIs. Dagster orchestrates downstream of bronze.

## 10. Failure modes

| Failure | Detection | Recovery |
|---|---|---|
| Sensor tick fails (S3 read error) | Dagster UI marks sensor evaluation FAILED | Sensor retries on next tick (5 min); alarm if fails 3x |
| Asset materialization fails (dbt error) | Dagster UI marks run FAILED, posts error | Re-launch from UI or wait for next sensor/schedule fire |
| Dagster Cloud outage | Sensors don't fire | Schedules + bronze writers keep running; analytics goes stale until Dagster recovers; alarm on `ActiveSnapshotStalenessHours > 2` |
| Dagster credit limit hit | Dagster UI surfaces; new runs blocked | Reduce sensor cadence OR upgrade plan |
| dbt Lambda OOM during a run | dbt asset marked FAILED with OOM | Bump Lambda memory; backfill the failed partition |
| Partition mismatch (Dagster says partition 2026-04 didn't materialize, dbt says it did) | Lineage UI inspection | Re-emit `AssetMaterialization` event manually via Dagster Python API |

## 11. UI access

- `https://rlsir.dagster.cloud/locations/rlsir-prod/asset-graph` — full lineage
- `https://rlsir.dagster.cloud/locations/rlsir-prod/assets/bronze/active_snapshot` — single asset history
- `https://rlsir.dagster.cloud/locations/rlsir-prod/runs` — run history
- `https://rlsir.dagster.cloud/locations/rlsir-prod/sensors` — sensor activity

Internal users (Joey, future engineers) authenticate via Google SSO tied to the Dagster Cloud workspace.

## 12. Why not Airflow or Prefect

| Option | Why rejected |
|---|---|
| Airflow | Heavyweight (MWAA = $400+/mo); task-based not asset-based; weak dbt integration without OSS plugins |
| Prefect | Asset-aware but less mature dbt integration than Dagster; UI is less data-engineer-focused |
| GitHub Actions | Cron + scripts; no asset graph, no sensor pattern, no lineage UI; fine for one-off jobs but not the right tool here |
| Just Lambda+EventBridge (status quo) | What we're moving away from — no lineage, no asset awareness, "is the data fresh?" requires writing the answer ourselves |

Dagster's combination of asset-first model, native dbt integration, sensor pattern, and a free hosted tier for our scale makes it the clearest choice.
