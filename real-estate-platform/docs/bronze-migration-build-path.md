# Bronze Migration Build Path — RDS-only → Parquet + DuckDB + dbt → RDS micro

**Date:** 2026-04-28
**Status:** Plan, awaiting kick-off
**Companion docs:**
- `analytics-architecture-decision.md` — original investigation
- `closed-listings-etl-strategy.md` — analytics + ETL strategy
- `real-estate-platform/analytics/README.md` — operator runbook

## Executive summary

Migrate from a single Postgres mirror (~$66/mo, suffering 60s+ query timeouts and a hidden 2019 sync hole) to a hybrid system: **append-only bronze Parquet on S3** as the canonical source, **DuckDB + dbt** for transforms and analytics, with **RDS shrunk to t3.micro** for app data + the listing_change_log + geographic boundaries.

The migration uses the **strangler-fig pattern with parallel-run validation** — build the new pipeline alongside the existing one, dual-write both during a validation window, cut over only after row-count and checksum reconciliation pass, decommission the old path last.

Total calendar time: **~3 weeks**. Total engineering time: **~6 days**. Cost during migration: roughly flat (both paths running). Cost after: **−$45/mo** ($66 medium → $20 micro + ~$1 S3 + Lambda).

## Phase map

```
Phase 0: Current state                          (where we are)
   ↓
Phase 1: Build sync Lambda dual-write           (~2 days)
   ↓
Phase 2: Validate bronze parity                 (~7 days observation window)
   ↓
Phase 3: Backfill historical to bronze          (~1 day work + 30 min run)
   ↓
Phase 4: Build dbt against bronze, A/B vs MVs   (~2 days)
   ↓
Phase 5: Cut premium-site reads to mart Parquet (~1 day per page family, feature-flagged)
   ↓
Phase 6: Decommission listing_records, shrink   (~1 day work + sign-off window)
   ↓
Phase 7: Steady-state ops + observability       (forever)
```

---

## Phase 0 — Current state (where we are)

```
Spark RESO API (replication.sparkapi.com/Reso/OData)
    │
    ▼ rate(1h) actives + rate(4h) full walk
    │
rlsir-armls-sync Lambda (Node.js, 512 MB)
    │
    ▼ INSERT…ON CONFLICT
    │
RDS Postgres listing_records (1.85 M rows, t3.medium $66/mo, 50 GB)
   listing_change_log (3.4 M rows)
   listing_geography (1.58 M rows)
   geographic_boundaries (80 PostGIS polygons)
   + app data (auth, intake, agents, etc.)
    │
    ▼ 9 dashboard MVs + ad hoc queries
    │
premium-site /phoenix /listings /market routes
```

Known issues:
- Hidden 2019 sync hole (22,914 missing Maricopa Closed records)
- 60s+ query timeouts on analytics MVs
- 46% dead tuples on listing_records
- Spark API search already cut over (`@platform/spark` package handles `/listings`); but analytics still on RDS

dbt project scaffolded at `real-estate-platform/analytics/` but not yet running against real data.

---

## Phase 1 — Build sync Lambda dual-write

**Goal:** every Spark API response gets written to BOTH the existing Postgres mirror AND a new S3 Parquet bronze. Zero impact on existing readers.

### What gets built

**Modify `infra/lambda/armls-sync.ts`** (or fork to `armls-sync-v2.ts` if zero-risk pivot is needed):

```ts
// After existing Postgres INSERT…ON CONFLICT block, add:

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { writeParquet } from '@parquet-wasm/parquet-wasm';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({ region: 'us-east-1' });
const BRONZE_BUCKET = 'rlsir-platform-assets-us-east-1';

async function writeBronzePage(records: SparkRecord[], runId: string, pageNum: number) {
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');

  // Add provenance columns to every row
  const enriched = records.map(r => ({
    ...r,
    sync_run_id: runId,
    sync_observed_at: new Date().toISOString(),
  }));

  // Convert to Arrow → Parquet. parquet-wasm runs in Node Lambda without native deps.
  const parquetBuffer = await writeParquet(enriched, {
    compression: 'ZSTD',
    rowGroupSize: 1000,  // one row group per file (small files, simple)
  });

  const key = `bronze/listings/sync_year=${yyyy}/sync_month=${mm}/sync_day=${dd}/run_id=${runId}/page_${String(pageNum).padStart(4, '0')}.parquet`;
  await s3.send(new PutObjectCommand({
    Bucket: BRONZE_BUCKET,
    Key: key,
    Body: parquetBuffer,
    ContentType: 'application/x-parquet',
  }));
}

// In the main sync loop:
const runId = uuidv4();
let pageNum = 0;
for await (const page of sparkClient.paginateEntity('Property', startSkipToken)) {
  await upsertToPostgres(page.records);          // existing path
  await writeBronzePage(page.records, runId, pageNum);  // NEW
  pageNum++;
}
```

### Justifications

**Why parquet-wasm over native pyarrow.** Lambda Node.js runtime can't easily ship pyarrow (would need separate Python Lambda). `@parquet-wasm/parquet-wasm` runs in pure Node, ~2 MB layer, no native deps. Industry consensus per [PyArrow + Lambda research](https://www.rhosignal.com/posts/polars-aws-lambda-pyarrow/) — pyarrow is the gold standard but only when you're already in Python; no point switching runtimes for Parquet writes.

**Why ZSTD compression.** Best Parquet compression ratio for analytical data (~2× better than snappy on real-estate-shaped data), fast enough on decode that DuckDB scan times match snappy. Standard for bronze layers since 2024.

**Why partition by `sync_year/sync_month/sync_day/run_id`.** Per [Microsoft data lake zones guidance](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/scenarios/cloud-scale-analytics/best-practices/data-lake-zones), bronze partitions reflect **ingestion time, not event time** — the bronze layer is observation-time append-only. Event-time partitioning (by close_date) belongs in silver/marts where it's already determined. Day-level partitioning balances directory count (~1 partition/day = 365/year) against file count.

**Why one Parquet file per Spark API page (not batched bigger).** Atomic per-page write maps directly to Spark's pagination boundary. If a Lambda invocation dies mid-walk, only the current page is lost; resumable via skiptoken. Per [Bronze Layer Best Practices on Medium](https://medium.com/@kishanraj41/bronze-layer-data-modeling-best-practices-8acebd540754), small immutable files at ingestion + periodic compaction beats large-file streaming writes.

**Why dual-write to BOTH Postgres AND S3 (not S3 only).** This is the strangler-fig pattern's "parallel run." Per [AWS Prescriptive Guidance — Strangler Fig](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html), the new system runs alongside the legacy one, not as a replacement, until parity is proven. The known dual-write anti-pattern (failure on one side leaving systems out of sync) is mitigated here because:
- Postgres write is the **source of truth** during Phase 1
- S3 write is **fire-and-forget for validation only**
- If the S3 write fails, sync continues; failed writes are logged for manual replay
- Existing readers see no difference

**Why a fresh `run_id` UUID per Lambda invocation.** Lets us trace any row in bronze back to a specific sync run. Also makes idempotency simple — a re-invoked Lambda after a failure writes a new run_id; window dedup in staging keeps the latest.

**Why Lambda state stays where it is.** Existing skiptoken storage in `listing_sync_state` table works fine. Don't change two things at once. After Phase 6 (RDS shrink), migrate skiptoken to DynamoDB.

### Validation in this phase

- After every sync run, log: page_count, records_in_postgres_this_run, records_in_s3_this_run
- Alarm if `s3_records ≠ postgres_records` for the same run

### Rollback

- Comment out the `writeBronzePage()` call. Postgres path is unchanged. Zero downtime.

### Duration

**~2 days of work** to write + test the Lambda change. Deploys to production in a regular release cycle.

### Cost during this phase

- Lambda: same (writes are ~50 ms extra per invocation)
- S3: ~$0.05/mo storage + $0.03/mo PUT requests (~25K/mo)
- RDS: unchanged

---

## Phase 2 — Validate bronze parity

**Goal:** prove that bronze captures everything Postgres captures, before we trust it for reads.

### What gets built

**A reconciliation Lambda** (`rlsir-bronze-reconcile`) that runs daily at 04:00 PHX:

```sql
-- Per-day reconciliation query, run via DuckDB Lambda
WITH bronze AS (
  SELECT COUNT(*) AS bronze_rows,
         SUM(HASH(ListingKey || COALESCE(StandardStatus, '') ||
                  COALESCE(ListPrice::TEXT, '') || COALESCE(ClosePrice::TEXT, '')))::BIGINT AS bronze_checksum
  FROM read_parquet('s3://rlsir-platform-assets-us-east-1/bronze/listings/**/*.parquet')
  WHERE sync_observed_at >= CURRENT_DATE - 1
),
postgres AS (
  SELECT COUNT(*) AS pg_rows,
         SUM(HASH(listing_key || COALESCE(standard_status, '') ||
                  COALESCE(list_price::TEXT, '') || COALESCE(close_price::TEXT, '')))::BIGINT AS pg_checksum
  FROM pg.public.listing_records
  WHERE modification_timestamp >= CURRENT_DATE - 1
)
SELECT bronze.*, postgres.*,
       (bronze.bronze_rows - postgres.pg_rows) AS row_delta,
       (bronze.bronze_checksum = postgres.pg_checksum) AS checksum_match
FROM bronze, postgres;
```

Logs to CloudWatch + alerts via SNS if row_delta > 5 OR checksum_match = false for 3 consecutive days.

### Justifications

**Why row count + content checksum, not full SHA-256.** Per [Quinnox migration validation best practices](https://www.quinnox.com/blogs/data-migration-validation-best-practices/), bulk SHA per-row is too expensive at our scale (~50K rows/day). DuckDB's `HASH()` is a 64-bit non-cryptographic hash that's fast (~100ms for 50K rows), and summed-over-rows gives an order-independent group checksum. Same approach used in [DataOps Suite reconciliation patterns](https://www.datagaps.com/blog/data-reconciliation-best-practices/).

**Why daily, not realtime.** Real-time validation would require dual-write transactionality which is the dual-write anti-pattern. Daily reconciliation catches drift on a useful cadence and stays simple.

**Why a 7-day observation window before promoting bronze.** [Strangler-fig parallel-run guidance](https://www.cloudopsnow.in/strangler-pattern/) recommends running both systems through ≥1 full business cycle. For us, 7 days covers a weekend, a Monday market open, and a Friday market close — every load profile a sync experiences.

### Validation gates (must all pass before Phase 3)

- [ ] 7 consecutive days of `row_delta = 0`
- [ ] 7 consecutive days of `checksum_match = true`
- [ ] No Lambda errors on the bronze write path
- [ ] S3 storage cost trajectory matches projection (~$0.05/mo)
- [ ] No 4xx errors on bronze writes

### Rollback

- Bronze stays in S3 (it's append-only, no harm)
- Disable bronze write path if it's affecting Lambda runtime budget
- Postgres mirror is still authoritative

### Duration

**7 days observation**. Engineering time during this phase: ~half day to set up reconciliation, then monitoring.

### Cost during this phase

- Lambda: +$0.50 for nightly reconciliation
- S3: ~$0.50 cumulative
- Total incremental: <$1/mo

---

## Phase 3 — Backfill historical data to bronze

**Goal:** bronze contains the **full** ARMLS history including the 22,914 missing 2019 records and any other ~5,000 records the existing mirror is short. After this, bronze ≥ Postgres in coverage.

### What gets built

A one-shot script `scripts/backfill_bronze.ts` (or run as one-off Lambda):

```ts
// Walk the entire Spark replication from skiptoken=null
// One Lambda invocation per ~10K records (Lambda timeout protection)
// Step Functions orchestrates ~190 invocations to cover ~1.88M records
// Each invocation:
//   - Reads its assigned skiptoken
//   - Pages through Spark until time budget hits 12 minutes
//   - Writes Parquet pages to a separate prefix:
//     bronze/listings/backfill/run_id=BACKFILL_2026-04-28/page_NNNN.parquet
//   - Records its final skiptoken in DynamoDB
//   - Step Functions invokes the next chain node with the saved skiptoken
```

After backfill completes, validate:

```sql
-- Total bronze count vs Spark API count
WITH bronze AS (SELECT COUNT(DISTINCT ListingKey) AS n
                FROM read_parquet('s3://.../bronze/listings/**/*.parquet')
                WHERE StandardStatus = 'Closed'),
     spark AS (SELECT 1875361 AS n)  -- per Spark $count probe earlier
SELECT bronze.n AS bronze_closed,
       spark.n  AS spark_closed,
       spark.n - bronze.n AS gap
FROM bronze, spark;
```

Expected gap: ≤ 0 (bronze should be ≥ Spark's count due to inclusion of newly modified records during the backfill window).

### Justifications

**Why a separate `/backfill/` prefix, not mixed with daily syncs.** Per [bronze partitioning best practices](https://medium.com/@kishanraj41/bronze-layer-data-modeling-best-practices-8acebd540754), backfills should be isolated so they can be invalidated/rerun cleanly without affecting production data. Staging dedup window function handles the merge.

**Why Step Functions, not a single long Lambda.** Lambda's 15-min hard timeout. ~190 chained invocations × 12 min each = 38 hours wall time, but our actual work is sequential (each cursor depends on the prior result). Step Functions handles the chaining + retry on failure cleanly.

**Why backfill into bronze and NOT also into Postgres.** Don't pollute the legacy path during cutover. Bronze is the new truth; Postgres stays as-is and gets decommissioned in Phase 6.

### Validation gates

- [ ] Bronze closed count ≥ Spark API closed count (~1.88M)
- [ ] Bronze active+pending count matches a fresh Spark count probe
- [ ] All 22,914 expected 2019 records present (re-run the year-by-year gap probe; expect 0 gaps)
- [ ] No corruption: random sample of 100 listings from bronze matches a fresh Spark API GET on each

### Rollback

- Backfill prefix is isolated; deleting it via S3 lifecycle reverts cleanly. Costs ~$0.20.

### Duration

- Backfill walk: ~30–60 min wall time (Step Functions chain)
- Validation queries: ~30 min
- Engineering: ~1 day to write + run

### Cost during this phase

- Lambda invocations: ~$1 one-time
- S3 PUT requests: ~$0.10 for ~1900 PUTs
- S3 storage incremental: ~$0.04/mo for the historical 1.8 GB

---

## Phase 4 — Build dbt against bronze, A/B vs current MVs

**Goal:** the canonical dbt project at `real-estate-platform/analytics/` produces marts that match (or correctly diverge from) the existing 9 RDS materialized views. Before any premium-site page reads Parquet, we know our outputs are correct.

### What gets built

The dbt project is already scaffolded. Phase 4 work:

1. `dbt deps` (install dbt_utils, dbt_expectations)
2. `dbt build --target dev` against bronze + RDS attach for change_log/geography
3. **A/B reconciliation queries** comparing each new mart to its current MV equivalent:

```sql
-- A/B: fct_market_pulse vs mv_market_pulse
WITH new AS (SELECT month, closing_count, median_close
             FROM read_parquet('s3://.../analytics/fct/fct_market_pulse.parquet')
             WHERE scope_type='metro' AND property_segment='residential'),
     old AS (SELECT month, listing_count AS closing_count, median_close_price AS median_close
             FROM pg.public.mv_market_pulse
             WHERE city IS NULL AND postal_code IS NULL AND subdivision_name IS NULL)
SELECT m.month,
       n.closing_count - o.closing_count AS count_delta,
       n.median_close  - o.median_close  AS median_delta,
       ABS(n.closing_count - o.closing_count) > 50 OR
       ABS(n.median_close  - o.median_close)  > 5000 AS is_significant_drift
FROM (SELECT DISTINCT month FROM new UNION SELECT DISTINCT month FROM old) m
LEFT JOIN new USING (month)
LEFT JOIN old USING (month)
ORDER BY month;
```

A/B for each of the 9 MVs. **Expected drift:** new mart will be ~1–2% higher in count and slightly different in medians because it includes the 22,914 recovered 2019 records and the small ongoing sync gap.

### Justifications

**Why A/B before cutover.** Per [Quinnox parallel run testing](https://www.quinnox.com/blogs/data-migration-validation-best-practices/), the parallel-run validation period is the highest-leverage moment to catch logic errors. Catches anything from a typo in a SQL filter to a misunderstood RESO field semantic.

**Why expected drift is OK as long as it's predictable.** A small expected drift (recovered records) is correct behavior; an unexpected drift (a query bug) is not. The reconciliation report classifies each delta into expected/unexpected.

**Why use `--target dev` for this validation, not prod.** dev writes to local Parquet (`./_local_output`), can be rerun freely. Prod cutover happens only after dev validates.

### Validation gates

- [ ] Every dbt model builds without errors
- [ ] Every dbt test passes (generic + singular)
- [ ] dbt-bouncer convention checks pass
- [ ] Every A/B reconciliation shows expected drift only — no unexplained discrepancies > 1% on count or > 0.5% on median
- [ ] Source freshness alarms green
- [ ] Calendar gap test passes (every month present in `fct_market_pulse`)

### Rollback

- Don't ship anything. dbt artifacts are local-only at this stage.

### Duration

- dbt setup + first run: ~half day
- A/B reconciliation script: ~half day
- Iterating on mismatches: ~1 day expected

### Cost during this phase

- Local dev: $0
- Lambda DuckDB testing: ~$1 if running prod target

---

## Phase 5 — Cut premium-site reads to mart Parquet

**Goal:** premium-site `/phoenix`, `/market`, community pages read from mart Parquet instead of RDS MVs. Done page-by-page with feature flag, instant rollback per page.

### What gets built

**One feature flag per page family** in `apps/premium-site/.env.local`:

```bash
ANALYTICS_SOURCE=rds       # default — current behavior
ANALYTICS_SOURCE=parquet   # new — reads from mart Parquet via DuckDB Lambda
```

Read-path adapter at `packages/database/src/queries/analytics-adapter.ts`:

```ts
export async function getMarketPulse(filter: GeoFilter, months = 24): Promise<MarketPulseRow[]> {
  if (process.env.ANALYTICS_SOURCE === 'parquet') {
    return await analyticsLambda.getMarketPulse(filter, months);  // DuckDB Lambda
  }
  return await getMarketPulseRds(filter, months);  // existing
}
```

DuckDB analytics Lambda at `infra/lambda/armls-analytics-query.ts` — invoked by Next.js SSR for non-cached routes:

```ts
export const handler = async (event: { query: string; params: any[] }) => {
  const con = duckdb.connect(':memory:');
  con.execute(`SET s3_region='us-east-1'`);
  const rows = await con.all(event.query, event.params);
  return { statusCode: 200, body: JSON.stringify(rows) };
};
```

For frequently-read aggregates (hero KPIs, community scorecards), pre-render to JSON at the end of every dbt run and cache via CloudFront — avoids hitting Lambda on most page renders.

Page-by-page rollout:
1. `/phoenix` (most traffic) — flip flag, monitor for 24 h
2. `/phoenix/[region]/[community]` (next biggest)
3. `/market`, `/market/community/[slug]`, `/market/zip/[code]`
4. `/listings/[slug]` "Local market" sidebar
5. Internal `/platform/reports`

### Justifications

**Why feature flag per page family.** Per [Strangler-fig progressive-modernization guidance](https://appstekcorp.com/blog/progressive-modernization-enterprise-transformation/), atomic per-component cutover with instant rollback is the pattern. Flag flip is reversible in seconds; full rebuild rollback is hours.

**Why DuckDB Lambda + CloudFront-cached JSON, not direct DuckDB-from-Next.js.** Next.js SSR Vercel functions can't reasonably hold a DuckDB instance — cold starts would be brutal. DuckDB Lambda has its own warm-instance pool. CloudFront-cached JSON for hero KPIs avoids the round-trip entirely on cached pages.

**Why pre-render hero KPIs to JSON, but query DuckDB on-demand for drill-downs.** Per [bronze/silver/gold layer guidance](https://medium.com/@kishanraj41/bronze-layer-data-modeling-best-practices-8acebd540754), gold marts ARE the dashboard data — but Phoenix metro KPIs change every 4 hours, while a community detail page might only get 5 visits/week. Caching the high-frequency reads to JSON, on-demand-querying the long-tail community pages = right-sizing for traffic.

**Why /listings/[slug] stays on Spark API (not migrated to Parquet).** That cutover already happened in 2026-04-20. The "Local market" sidebar on listing pages is the only piece that uses analytics; it reads `fct_community_scorecard` which becomes a Parquet read.

### Validation gates per page

- [ ] Page renders correctly with new flag
- [ ] Lighthouse score unchanged or better
- [ ] No errors in CloudWatch for 24 h
- [ ] Manual visual diff vs RDS-backed page
- [ ] Vercel Analytics shows no regression in p95 SSR time

### Rollback

- Flip the env var. Vercel hot-reloads. Page falls back to RDS path. Zero downtime.

### Duration

- Adapter pattern: ~1 day
- DuckDB Lambda + CloudFront-cached JSON: ~1 day
- Page-by-page rollout: ~1 day per page family × ~5 families = 1 week of incremental rollouts (24h soak each)

### Cost during this phase

- Lambda DuckDB: ~$3/mo at projected load
- CloudFront: ~$1/mo
- RDS: still running, still serving (unchanged)

---

## Phase 6 — Decommission listing_records, shrink RDS

**Goal:** RDS holds only what it must — change_log, geography, app data. Mirror is gone, instance is t3.micro.

### What gets built

1. **Sync Lambda single-write only**: stop writing to `listing_records` (keep change_log + geography writes)
2. **Migration `033_drop_listing_records.sql`** — drops the table after 14-day verification window
3. **AWS RDS modify**: `aws rds modify-db-instance --db-instance-class db.t3.micro --apply-immediately`
4. **Move skiptoken state from `listing_sync_state` table to DynamoDB** (so RDS doesn't have any sync-pipeline dependency)
5. **Update CLAUDE.md** to reflect the new architecture; remove references to listing_records as a source

### Justifications

**Why wait 14 days after Phase 5 before dropping.** Per [Quinnox migration validation](https://www.quinnox.com/blogs/data-migration-validation-best-practices/), keep the legacy system running through one full reporting cycle (here: weekly market reports + monthly close-out) after cutover before destruction.

**Why DynamoDB for skiptoken state.** $0/mo at our scale (PAY_PER_REQUEST), no schema overhead, no shared-instance contention, one-line code change in the sync Lambda. Could also stay on RDS but DynamoDB removes the last sync-pipeline coupling to our app database.

**Why t3.micro is enough.** App data (auth, intake_requests, agents, audit_log, listing_change_log, listing_geography, geographic_boundaries) totals ~6 GB and ~50K writes/day. t3.micro: 1 vCPU, 1 GB RAM, 50 GB storage, ~$15/mo. Burst credits handle the change_log inserts comfortably.

### Validation gates

- [ ] No code in the repo still references `listing_records` (grep audit)
- [ ] No active queries on listing_records in CloudWatch RDS Performance Insights for 14 days
- [ ] Bronze → silver → marts pipeline running cleanly for 14 days
- [ ] No reconciliation alarms in 14 days

### Rollback

- The drop migration is the irreversible step. Take a final RDS snapshot before running it. Snapshot retention: 30 days. If anything breaks within 30 days, restore from snapshot.

### Duration

- Sync Lambda single-write: ~half day
- Skiptoken to DynamoDB: ~half day
- Drop migration + RDS shrink: ~1 day calendar (most is the sign-off window)

### Cost after this phase

- RDS: $66 → **$20/mo** ($15 instance + $5 storage)
- S3: $1/mo
- Lambda (sync + reconcile + analytics + dbt): $5/mo
- CloudFront: $1/mo
- **Total: $27/mo, vs $66 today. Savings: $39/mo, $468/year.**

---

## Phase 7 — Steady-state ops + observability

**Goal:** the new system is boring and reliable.

### What gets built

CloudWatch alarms wired to SNS `rlsir-data-pipeline-alerts`:

| Alarm | Threshold | Severity |
|---|---|---|
| Bronze sync Lambda errors | > 1 in 5 min | warning |
| Bronze write failures | any | critical |
| Source freshness on listing_change_log > 6 h stale | true | warning |
| Source freshness on bronze > 2 h stale (actives) | true | warning |
| dbt run failure | any | critical |
| dbt source freshness errors | any | critical |
| Calendar gap test fails | any | critical |
| Reject-rate ceiling test fails (>1%) | any | warning |
| RDS CPU > 80% sustained 10 min | true | warning |
| Bronze growth rate anomaly | > 2× rolling 7-day avg | warning |

### Compaction job (optional, future)

Bronze grows ~50 MB/day. After 1 year (~18 GB), small-page Parquet files become a query overhead. Add a yearly compaction job that takes all `sync_year=2026` pages and rolls them into one Parquet per `sync_year=2026/sync_month=MM/listings.parquet`. Original pages preserved at `bronze/listings/_archive/...` for audit. Compaction runs annually; cost: a single Lambda DuckDB invocation.

### Schema evolution policy

ARMLS occasionally adds RESO fields. Bronze accepts everything (Parquet schema is per-file; DuckDB handles UNION BY NAME). Silver has the explicit typed schema; new fields require a dbt migration. dbt-bouncer enforces that no `int_*` model regenerates without column docs.

### Documentation upkeep

After Phase 6:
- `CLAUDE.md` updated — reference the new architecture, remove listing_records mentions
- `docs/PROJECT.md` — close out the migration as done
- `docs/CHANGELOG.md` — one-line entry per phase
- `docs/DECISIONS.md` — ADR documenting why we chose bronze Parquet over alternatives

---

## Risk table

| Risk | Phase | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Bronze write fails silently, undetected | 1 | low | high | Reconciliation Lambda in Phase 2; alarm on row_delta > 5 |
| parquet-wasm bug at scale | 1 | low | medium | Tested in dev with 1000-record pages before prod; fallback is to disable bronze write while keeping Postgres path |
| 7-day window misses a corner case | 2 | low | medium | Extend observation if any anomaly. No deadline pressure. |
| Backfill Step Functions chain breaks midway | 3 | medium | low | Each invocation idempotent on the run_id; failed nodes can be retried |
| dbt model output diverges from MV | 4 | medium | medium | A/B reconciliation catches it; expected for the recovered records, fix any unexpected variance |
| Premium-site page regression after cutover | 5 | medium | medium | Feature flag → instant rollback; 24-h soak per page; visual diff |
| RDS shrink causes connection drops | 6 | low | medium | Run in maintenance window; `--apply-immediately` is non-blocking but does cause a 60s connection blip |
| Hidden code path still hits listing_records | 6 | medium | high | Grep audit + 14-day observation window before drop |
| Spark API rate limit during backfill | 3 | low | medium | Throttle to ~20 calls/min; backfill takes 60 min instead of 30 |

---

## Cost summary

| | Today | During migration | After Phase 6 |
|---|---|---|---|
| RDS | $66 | $66 (unchanged) | **$20** |
| Lambda (sync) | $0 (free tier) | +$0.50 reconcile | $1 (dual-purpose) |
| Lambda (DuckDB analytics) | $0 | $0 | $3 |
| Lambda (dbt run) | $0 | $0 | $1 |
| S3 (bronze + marts) | $0 | $0.20 | $1 |
| CloudFront | $0 | $0 | $1 |
| **Total** | **$66** | **~$67** | **$27** |

**Migration is roughly cost-neutral; steady-state saves $39/mo.** Cumulative net savings break-even ≈ 6 months including engineering time.

---

## Engineering effort summary

| Phase | Engineering days | Calendar days | Notes |
|---|---|---|---|
| 1 — Lambda dual-write | 2 | 3 | 2 work + 1 deploy |
| 2 — Validate parity | 0.5 | 7 | half-day setup, 7-day observation |
| 3 — Backfill | 1 | 1 | half-day script + 30-min run + half-day verify |
| 4 — dbt against bronze | 2 | 2 | scaffold exists; this is the validation work |
| 5 — Page cutovers | 2 | 7 | 1 day adapter, 1 day Lambda, then per-page soaks |
| 6 — Decommission | 1 | 14 | half-day code + half-day drop, 14-day soak |
| 7 — Ops/observability | 0.5 | ongoing | alarms + docs |
| **Total** | **~9 days** | **~5 weeks calendar** | |

(I overstated earlier as 6 days — that was just steps 1+3+4. Adding cutover + decommission brings total to ~9.)

---

## Why this path over alternatives

| Alternative | Why we rejected |
|---|---|
| Big-bang cutover (no dual-write) | High risk of breakage; no rollback. Per [Big-Bang vs Progressive Modernization](https://appstekcorp.com/blog/progressive-modernization-enterprise-transformation/), big-bang is 5× more likely to cause production incidents. |
| Event streaming (Kafka/Kinesis) for the migration | Overkill for our data volumes (~50K rows/day). Operational overhead exceeds value. Strangler-fig with dual-write is the right shape for our scale per [Conduktor's Strangler-Fig + Event Streaming guidance](https://www.conduktor.io/glossary/strangler-fig-pattern-with-event-streaming) — they recommend event streaming **only for high-volume transactional workloads**. |
| Direct read from Postgres into DuckDB without bronze | No history beyond current state; recovers nothing of the 2019 hole; doesn't solve the RDS bloat problem; doesn't enable shrink to micro |
| Parquet-bronze without a validation window | Couples speed to risk. The 7-day reconciliation costs us 7 days of real-time but eliminates the failure modes that take weeks to clean up |
| Iceberg / Delta Lake instead of plain Parquet | Operational complexity not justified at our scale. Plain Parquet + Hive partitioning + dbt is industry-standard for this size; Iceberg/Delta become valuable beyond ~1 TB or with multi-writer concurrency, neither of which we have |

---

## Sources

- [AWS Prescriptive Guidance — Strangler Fig Pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html)
- [Microsoft Azure Architecture — Strangler Fig](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig)
- [Replacing Legacy Systems with Data Streaming — Kai Waehner](https://www.kai-waehner.de/blog/2025/03/27/replacing-legacy-systems-one-step-at-a-time-with-data-streaming-the-strangler-fig-approach/)
- [Microsoft Data Lake Zones and Containers](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/scenarios/cloud-scale-analytics/best-practices/data-lake-zones)
- [Microsoft Fabric Medallion Lakehouse Architecture](https://learn.microsoft.com/en-us/fabric/onelake/onelake-medallion-lakehouse-architecture)
- [Bronze Layer Data Modeling Best Practices — Kishan Raj, Medium](https://medium.com/@kishanraj41/bronze-layer-data-modeling-best-practices-8acebd540754)
- [AWS Lambda with Polars II: PyArrow — Rho Signal](https://www.rhosignal.com/posts/polars-aws-lambda-pyarrow/)
- [awswrangler.s3.to_parquet Documentation](https://aws-sdk-pandas.readthedocs.io/en/stable/stubs/awswrangler.s3.to_parquet.html)
- [Data Migration Validation Best Practices — Quinnox](https://www.quinnox.com/blogs/data-migration-validation-best-practices/)
- [Data Reconciliation Best Practices with DataOps Suite — Datagaps](https://www.datagaps.com/blog/data-reconciliation-best-practices/)
- [Big Bang vs. Progressive Modernization — AppsTek](https://appstekcorp.com/blog/progressive-modernization-enterprise-transformation/)
- [Strangler Fig + Event Streaming — Conduktor](https://www.conduktor.io/glossary/strangler-fig-pattern-with-event-streaming)
- [How to Validate Data Integrity After Migration — Airbyte](https://airbyte.com/data-engineering-resources/validate-data-integrity-after-migration)
