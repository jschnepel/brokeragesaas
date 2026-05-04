# Observability + Reconciliation

**Date:** 2026-04-30
**Status:** Spec covering metrics, alarms, parity reconcile, runbook.
**Related:** `02-bronze-ingest.md` (writers emit metrics), `05-dagster-orchestration.md` (UI is observability surface).

---

## 1. Three observability surfaces

| Surface | What it watches | Audience |
|---|---|---|
| **CloudWatch alarms** (SNS-routed) | Lambda failures, custom metrics, drift thresholds | Email pages — must be acted on |
| **Dagster UI** | Asset freshness, run status, lineage | Joey checking pipeline health |
| **Elementary report** (HTML) | dbt test failures, model performance, data quality trends | Weekly review, audit prep |

## 2. CloudWatch metrics catalog

All custom metrics live under namespace `RLSIR/DataPipeline`.

| Metric | Emitted by | Unit | Used by |
|---|---|---|---|
| `BronzeReconciliationDelta` | bronze-reconcile Lambda | Count | Daily-drift alarm |
| `BronzeReconciliationAbsDelta` | bronze-reconcile | Count | |
| `BronzeRowCount` | bronze-reconcile | Count | Stale-bronze alarm |
| `BronzePageCount` | bronze-reconcile | Count | |
| `PgRowCount` | bronze-reconcile | Count | |
| `ActiveSnapshotPagesFetched` | active-snapshot | Count | Partial-walk alarm (<30 pages) |
| `ActiveSnapshotRecords` | active-snapshot | Count | Stale-snapshot alarm |
| `ActiveSnapshotDurationSeconds` | active-snapshot | Seconds | Duration anomaly alarm |
| `ActiveSnapshotGzippedBytes` | active-snapshot | Bytes | Volume monitoring |
| `ActiveSnapshotBronzeRecords` | bronze-reconcile (active section) | Count | Active-snapshot drift alarm |
| `ActiveSnapshotPgRecords` | bronze-reconcile (active section) | Count | |
| `ActiveSnapshotDeltaPct` | bronze-reconcile (active section) | Percent | Drift alarm (>5%) |
| `ActiveSnapshotStalenessHours` | bronze-reconcile (active section) | Seconds (treated as hours) | Staleness alarm (>2h) |
| `DbtModelsRun` | rlsir-analytics-dbt | Count | Build success monitoring |
| `DbtModelsFailed` | rlsir-analytics-dbt | Count | Build failure alarm |
| `DbtBuildDurationSeconds` | rlsir-analytics-dbt | Seconds | Performance monitoring |
| `ParityDriftPct` | parity-reconcile (Phase 3) | Percent | Per-mart drift alarm |
| `Yong2EventsFlushed` | yong2-events-flush (TBD) | Count | Volume monitoring |

## 3. CloudWatch alarms

All alarms route to SNS topic `rlsir-data-pipeline-alerts` → email `jschnepel@gmail.com`.

| Alarm | Threshold | Period | Action |
|---|---|---|---|
| `rlsir-armls-sync-errors` | Errors > 0 | 5min, 1 evaluation | Page |
| `rlsir-active-snapshot-errors` | Errors > 0 | 5min, 1 evaluation | Page |
| `rlsir-active-snapshot-partial-walk` | `ActiveSnapshotPagesFetched < 30` | 1h, 2 evaluations | Page (probably partial walk or rate-limit) |
| `rlsir-active-snapshot-staleness` | `ActiveSnapshotStalenessHours > 2` | 24h, 1 evaluation | Page |
| `rlsir-bronze-reconcile-drift-listings` | `BronzeReconciliationAbsDelta > 50000` for 3 days | 24h, 3 evaluations | Page |
| `rlsir-bronze-reconcile-drift-active` | `ActiveSnapshotDeltaPct > 5` for 3 days | 24h, 3 evaluations | Page |
| `rlsir-analytics-dbt-errors` | Errors > 0 | 1h, 1 evaluation | Page |
| `rlsir-analytics-dbt-models-failed` | `DbtModelsFailed > 0` | 1h, 1 evaluation | Page (test failure or model error) |
| `rlsir-analytics-dbt-duration-anomaly` | `DbtBuildDurationSeconds > 300` (50% over baseline) | 1h, 2 evaluations | Investigate (don't necessarily page) |
| `rlsir-parity-drift` (Phase 3) | `ParityDriftPct > 1` per pair, 3 days | 24h, 3 evaluations | Page (dbt vs MV diverging) |
| `rlsir-billing-5` | EstimatedCharges > $5/day | 6h, 1 evaluation | Email warn |
| `rlsir-billing-20` | EstimatedCharges > $20/day | 6h, 1 evaluation | Page |

**Treat-missing-data:** all alarms set `notBreaching` so a paused EventBridge schedule doesn't false-alarm.

## 4. Dagster UI as observability

Dagster's UI is the main observability surface for "is the analytics pipeline running and fresh?"

| Question | Where to look |
|---|---|
| Is `fct_market_pulse` fresh? | Asset graph → `fct_market_pulse` node → freshness indicator (green / yellow / red) |
| Why is `fct_market_pulse` stale? | Click node → upstream lineage → first stale asset is the root cause |
| Did the latest dbt run pass? | Runs → Latest run → status |
| What did `int_listings_status_history` produce in 2026-03? | Asset → partition → materialization metadata |
| Why is the sensor for active-snapshot not firing? | Sensors → `freshness_poller` → recent ticks |

Dagster's freshness policy (`FreshnessPolicy(maximum_lag_minutes=N)`) drives the green/yellow/red status. If we never want any asset to be more than N minutes old, set the policy and Dagster surfaces violations.

## 5. Elementary integration

[Elementary](https://elementary-data.com/) is dbt's test-results layer. Wired via `packages.yml`:

```yaml
packages:
  - package: dbt-labs/dbt_utils
    version: [">=1.1.1", "<2.0.0"]
  - package: calogica/dbt_date
    version: [">=0.10.0", "<1.0.0"]
  - package: calogica/dbt_expectations
    version: [">=0.10.0", "<1.0.0"]
  - package: elementary-data/elementary
    version: [">=0.16.0", "<0.17.0"]
```

`on-run-end` hook captures every dbt run + test result into `elementary` schema (DuckDB). Nightly Lambda generates report:

```bash
edr report --target prod \
          --output-html /tmp/report.html \
          --aws-profile default \
          --s3-bucket rlsir-platform-assets-us-east-1 \
          --s3-prefix analytics/_elementary/$(date +%Y-%m-%d)/
```

Report URL: `https://cdn.echelonpoint.com/analytics/_elementary/{date}/index.html`. Bookmarked for weekly review.

## 6. Parity reconciliation (Phase 3 of the cutover)

**Purpose:** during dual-run window (dbt marts + RDS MVs both alive), prove they agree.

**Mechanism:** new Lambda `rlsir-parity-reconcile` runs daily via EventBridge.

```python
# infra/lambda/parity-reconcile.py
def handler(event, context):
    pairs = [
      ("fct_market_pulse",        "mv_market_pulse"),
      ("fct_negotiation",         "mv_negotiation"),
      ("fct_community_scorecard", "mv_community_scorecard"),
      ("fct_community_yoy",       "mv_community_yoy"),
      ("fct_active_inventory",    "mv_active_listings"),  # if both exist
      ...
    ]

    results = []
    for mart, mv in pairs:
        mart_count, mart_checksum = query_parquet(f"s3://.../analytics/armls/metro/{mart}.parquet")
        mv_count,   mv_checksum   = query_pg(f"SELECT COUNT(*), SUM(HASH(...)) FROM {mv}")
        delta_pct = abs(mart_count - mv_count) / max(mv_count, 1) * 100
        results.append({"mart": mart, "mv": mv, "mart_count": mart_count, "mv_count": mv_count,
                        "delta_pct": delta_pct, "checksum_match": mart_checksum == mv_checksum})
        emit_metric("ParityDriftPct", delta_pct, dimensions={"Mart": mart})

    return {"statusCode": 200, "results": results}
```

**Alarm:** for each pair, if `delta_pct > 1` for 3 consecutive days, page.

**Audit step before parity goes live (Phase 3 prep):**

The dbt marts and the migration-033-fixed PG MVs may compute slightly different things. Before running parity:

1. Read each `fct_*` model's SQL, compare to corresponding `mv_*` definition.
2. Flag any divergent grain or filter (e.g., `fct_market_pulse` uses `close_month` for Closed; verify post-033 `mv_market_pulse` does the same).
3. Fix the dbt model (or fix the MV) so both compute the same thing.
4. THEN start parity reconcile.

Without this audit, the alarm fires on every run and gets ignored.

## 7. Runbook

### 7.1 Active-snapshot Lambda erroring

```bash
# Check most recent invocation
aws logs filter-log-events \
  --log-group-name /aws/lambda/rlsir-active-snapshot \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --filter-pattern '"FAILED"' \
  --max-items 5

# Common errors:
# - Spark 429: rate limited; check $orderby is in URL, throttle is 2.5s
# - S3 access denied: re-run `aws iam get-role-policy --role-name rlsir-token-refresh-role --policy-name rlsir-bronze-write`
# - OOM: bump memory to 2048MB if not already
# - Empty page: Spark returned 0 records; check filter, possibly upstream issue

# Manual re-run after fix:
aws lambda invoke --function-name rlsir-active-snapshot --payload '{}' \
  --cli-read-timeout 600 /tmp/out.json
```

### 7.2 dbt build failed

```bash
# Pull run_results from S3
aws s3 cp s3://.../analytics/_run_results/$(date +%Y-%m-%d)-*/run_results.json /tmp/

# Inspect failed models
jq '.results[] | select(.status != "success")' /tmp/run_results.json

# Re-run specific failed model
aws lambda invoke --function-name rlsir-analytics-dbt \
  --payload '{"selector": "fct_market_pulse", "target": "prod"}' /tmp/out.json
```

### 7.3 Bronze went stale (no recent _freshness.json update)

1. Check writer Lambda: did it run? Is EventBridge schedule enabled?
2. Check Lambda errors: `aws logs filter-log-events` on `/aws/lambda/rlsir-armls-sync`
3. If schedule disabled, re-enable: `aws events enable-rule --name rlsir-armls-sync-schedule`
4. Manual invoke to confirm: `aws lambda invoke --function-name rlsir-armls-sync /tmp/out.json`
5. Watch `_freshness.json` mtime advance: `aws s3api head-object --bucket ... --key bronze/listings/_freshness.json`

### 7.4 Parity drift alert (Phase 3+)

1. Get the per-pair `ParityDriftPct` from CloudWatch metrics
2. Pull both sources: `dbt build --select <mart>` (rebuild fresh) and `SELECT * FROM <mv>` (check current MV)
3. Diff at the row level: `WHERE` clauses, GROUP BY columns, aggregate functions
4. Common causes:
   - Migration to MV changed but dbt model didn't (or vice versa)
   - Different month-bucket (`contract_month` vs `close_month`)
   - Different status filter
5. Fix by aligning the lagging side; re-run parity Lambda manually to confirm

### 7.5 Dagster sensor stuck

1. UI → Sensors → click the affected sensor → Recent ticks tab
2. If consistently failing: check the sensor's S3 read permissions
3. If never firing: verify `_freshness.json` is actually being written (mtime not advancing means upstream Lambda is broken, not Dagster)
4. Reset cursor if needed: UI → Sensors → click sensor → "Reset cursor" button

### 7.6 RDS instance under load (post-shrink, pre-shrink)

1. Check `RDSCPUUtilization` in CloudWatch
2. Check active connections: `SELECT count(*) FROM pg_stat_activity`
3. Check slowest current queries: `SELECT query, state, query_start FROM pg_stat_activity WHERE state='active' ORDER BY query_start LIMIT 10`
4. If during a dbt build that uses the postgres extension, kill the dbt run and let RDS recover before retry

## 8. Logs retention

| Log group | Retention | Reason |
|---|---|---|
| `/aws/lambda/rlsir-armls-sync` | 30 days | Sync recovery, audit trail |
| `/aws/lambda/rlsir-active-snapshot` | 30 days | Same |
| `/aws/lambda/rlsir-bronze-reconcile` | 90 days | Drift history |
| `/aws/lambda/rlsir-analytics-dbt` | 30 days | dbt error debugging |
| `/aws/lambda/rlsir-parity-reconcile` | 90 days | Drift history |
| `/aws/lambda/rlsir-yong2-leads-cdc` | 90 days | Compliance: lead-snapshot lineage |

S3 logs (separate from Lambda): bronze writes have ContentMetadata which includes `sync-run-id`; CloudTrail logs API calls; both retained per AWS Account default (90 days CloudTrail, 0 by default for S3 server access logs which we don't enable).

## 9. Privacy guardrails (yong2 domain)

- Lambda `rlsir-yong2-leads-cdc` SQL must NOT include `email`, `phone`, `name`, `message` columns. Add a unit test in `infra/lambda/__tests__/yong2-leads-cdc.test.ts` that asserts the SQL never references these columns.
- Bronze yong2 events strip raw IP after geo enrichment (only `ip_country`, `ip_region`, `ip_city` survive to bronze).
- GDPR delete script (`scripts/gdpr-delete.mjs`):
  ```bash
  node scripts/gdpr-delete.mjs --email-hash <sha256>
  # 1. DELETE FROM leads.leads WHERE email_hash=$1 (cascades to communications, status_history)
  # 2. UPDATE active_inventory_snapshots... (no PII to nullify)
  # 3. Trigger S3 redaction Lambda to strip rows from bronze events for matching anon_id
  # 4. Force dbt full-refresh so silver+gold reflect the deletion
  ```

## 10. Audit trail for compliance

Every privacy-sensitive change is logged in `audit.consent_log`:

```sql
INSERT INTO audit.consent_log (event_type, lead_id, email_hash, payload, occurred_at)
VALUES ('gdpr_delete_requested', null, '<hash>', $1::jsonb, NOW());
```

Subpoena response: query `audit.consent_log` + `leads.status_history` + `leads.communications` for a given `email_hash`. Returns the full lifecycle of the lead.

## 11. Cost-of-observability

| Component | Monthly |
|---|---|
| CloudWatch metrics (custom) | ~$1 |
| CloudWatch logs ingestion | ~$2 |
| CloudWatch alarms (10–15 of them) | $0.10/alarm/mo = ~$1.50 |
| SNS notifications | ~$0.10 |
| Elementary report Lambda | <$0.10/mo |
| Dagster Cloud Hobby | $0 |
| **Total** | **~$5/mo** |
