# Bronze Ingest

**Date:** 2026-04-30
**Status:** Spec for the four bronze writers + the freshness contract.
**Related:** `01-storage-schema.md` (target paths), `05-dagster-orchestration.md` (sensors that watch these writes).

---

## 1. The four writers

| Writer | Source | Target | Cadence | Status today |
|---|---|---|---|---|
| `rlsir-armls-sync` | Spark RESO API: Property/Member/Office/OpenHouse | `bronze/listings/`, `bronze/change_log/` (+ RDS mirror dual-write) | rate(4 hours) | **DISABLED** — sync schedule paused since 2026-04-26 |
| `rlsir-active-snapshot` | Spark Property `Active+AUC, Maricopa` | `bronze/active_snapshot/current/page_*.ndjson.gz` | rate(1 hour) | **LIVE** — hardened today (deadline fix, $orderby, throttle, reservedConcurrency=1) |
| `rlsir-yong2-events-flush` | Browser `/api/track` edge buffer | `bronze/yong2/events/sync_year=.../...page_NNNN.ndjson.gz` | event-driven (flush every 30s/100 events/256KB) | **NOT BUILT** — Phase P2 of yong2 plan |
| `rlsir-yong2-leads-cdc` | RDS `leads.leads`, `leads.communications`, `leads.status_history` (last 7 days) | `bronze/yong2/leads/` (Parquet) | rate(1 day) at 02:00 UTC | **NOT BUILT** — Phase P6 of yong2 plan |

## 2. Common writer pattern

Every bronze writer follows the same shape — same provenance columns, same freshness marker, same error path.

```
1. Begin run     → captured: run_id (uuid), observed_at (now)
2. Cleanup       → if writer is "atomic-swap" style (active-snapshot), delete prior pages
3. Pull source   → API or PG; iterate pages with throttling
4. Stamp + write → for each row: r.sync_run_id = run_id; r.sync_observed_at = observed_at
                    write NDJSON.gz page (or Parquet for snapshots) to S3
5. Freshness     → update _freshness.json with { last_snapshot_at, run_id, page_count, record_count, duration_seconds }
6. Metrics       → emit ActiveSnapshotPagesFetched / BronzeListingsRecords / etc to RLSIR/DataPipeline
7. End run       → return { statusCode, body: { run_id, ... } } for synchronous invokes
```

**Provenance columns (every bronze row carries):**
- `sync_run_id` — UUID per ingest run; lets us replay or quarantine bad runs
- `sync_observed_at` — when the writer fetched this row from source
- `bronze_written_at` — when the writer flushed to S3 (set by writer, not row source)

## 3. Writer specifics

### 3.1 `rlsir-armls-sync`

**Code:** `infra/lambda/armls-sync.ts` (entry) + `apps/backend/src/lib/spark/sync-engine.ts` (paginator).
**Build:** `node infra/lambda/build.mjs` → `infra/lambda/dist/armls-sync.zip`
**Runtime:** Node.js 20, 512MB, 15min timeout, reservedConcurrency=1.
**Pagination:** $skiptoken (RESO replication standard). Resumable via `listing_sync_state` table on RDS.
**Deduplication:** dbt staging dedups by ListingKey ORDER BY ModificationTimestamp DESC.

**Filter:** PropertyType in (Residential, Residential Lease, Land, Multiple Dwellings, Comm/Industry Sale, Comm/Industry Lease, Business Opportunity).

**Why disabled today:** ~58% error rate Apr 19–20, root cause not yet investigated. Phase 0 of the cutover plan (`07-roadmap.md`) re-enables after diagnosis.

**Dual-write:** writes to RDS (existing) AND to bronze NDJSON.gz (new). Strangler-fig: dbt models read bronze; legacy MVs still read RDS until cutover complete.

### 3.2 `rlsir-active-snapshot`

**Code:** `infra/lambda/active-snapshot.ts`
**Build:** `node infra/lambda/active-snapshot-build.mjs`
**Runtime:** Node.js 20, 2048MB, 600s timeout, reservedConcurrency=1.
**Filter:** `(StandardStatus eq 'Active' or 'Active Under Contract') and CountyOrParish eq 'Maricopa'`
**Pagination:** Spark `$orderby=ModificationTimestamp desc` defeats the long-TTL response cache; follows verbatim `@odata.nextLink` for `$skip`-style pagination.
**Throttle:** 2.5 s between pages → ~24 req/min, under Spark's per-token cap.

**Atomic-ish swap:**
1. List all `bronze/active_snapshot/current/page_*` and DELETE.
2. Walk Spark, write each page as it arrives.
3. After last page, write `_freshness.json`.

If the run dies between (1) and (3), the next run cleans up. dbt staging globs `current/page_*.ndjson.gz`; partial reads are safe because dbt only reads on a Dagster-coordinated trigger (after `_freshness.json` advances).

**Why per-page (not single blob):** in-memory accumulation OOMs at 1024MB and even 2048MB on 46K records. Per-page bounds memory to ~5MB.

### 3.3 `rlsir-yong2-events-flush` (planned)

**Code:** `infra/lambda/yong2-events-flush.ts` (TBD) — Vercel edge function or Lambda@Edge.
**Trigger:** `/api/track` POST from browser. Edge function buffers in memory (or Redis) and flushes on 30s / 100 events / 256KB.
**Format:** NDJSON.gz, page-numbered within day partition.
**Latency contract:** POST returns 204 in ≤200ms; bronze visibility ≤30s.
**Schema:** see `01-storage-schema.md § 2`.

### 3.4 `rlsir-yong2-leads-cdc` (planned)

**Code:** `infra/lambda/yong2-leads-cdc.ts` (TBD)
**Schedule:** EventBridge `cron(0 9 * * ? *)` (02:00 PHX = 09:00 UTC).
**Logic:**

```sql
COPY (
  SELECT id, anon_id, email_hash, phone_hash, interest, status, lead_score, score_band,
         first_channel, first_source, first_medium, first_campaign,
         last_channel, last_source, last_medium, last_campaign,
         deal_value, commission, closed_at,
         created_at, updated_at,
         CURRENT_TIMESTAMP AS bronze_written_at
  FROM leads.leads
  WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'
)
TO 's3://.../bronze/yong2/leads/sync_year=YYYY/sync_month=MM/sync_day=DD/snapshot.parquet'
WITH (FORMAT PARQUET, COMPRESSION zstd);
```

Same query for `leads.communications`, `leads.status_history` to their respective bronze prefixes.

**SCD-1 in dbt staging:** `stg_yong2__leads` deduplicates by `lead_id` keeping `MAX(updated_at)` from the union of all daily snapshots.

**PII guarantee:** the SELECT explicitly excludes `email`, `phone`, `name`, `message`. Add a dbt-bouncer rule to enforce: any select against `leads.leads` in this Lambda must include `email_hash`/`phone_hash` and exclude the raw PII columns.

## 4. Freshness contract

The `_freshness.json` sentinel is the canonical signal for "data is ready downstream."

```json
{
  "last_snapshot_at": "2026-04-30T14:32:11.123Z",
  "run_id": "uuid",
  "record_count": 31668,
  "pages_fetched": 32,
  "gzipped_bytes": 79836182,
  "duration_seconds": 142.3,
  "writer_version": "active-snapshot@2026-04-30"
}
```

**Read path (dbt source freshness):**

```jinja
{% macro check_bronze_freshness(prefix, warn_hours=6, error_hours=12) %}
  {% set query %}
    SELECT
      last_snapshot_at::timestamp AS last_sync_at,
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_snapshot_at::timestamp)) / 3600.0 AS staleness_hours
    FROM read_json_auto('s3://.../bronze/{{ prefix }}/_freshness.json')
  {% endset %}
  ...
{% endmacro %}
```

Used as `on-run-start` hook in `dbt_project.yml`. Errors out the dbt run if bronze is past the error threshold.

**Read path (Dagster sensor):**

```python
@asset_sensor(asset_key=AssetKey(["bronze", "active_snapshot"]))
def active_snapshot_landed(context, asset_event):
    # fires when _freshness.json advances; triggers active-marts dbt run
    yield RunRequest(run_key=asset_event.dagster_event.event_specific_data.materialization.tags.get("run_id"))
```

See `05-dagster-orchestration.md` for the full sensor catalog.

## 5. Error handling

| Failure mode | Detection | Action |
|---|---|---|
| Source API 429 / 503 | HTTP status in fetchPage | 3 retries with 15s/30s/45s backoff; if still failing, throw → Lambda returns 500 |
| Source API auth expired | HTTP 401/403 | Return 500; CloudWatch alarm `LambdaErrors > 0` fires; manual token refresh (Spark token is non-expiring per memory, so this is rare) |
| S3 PutObject denied | HTTP 403 | Return 500; alarm fires; check IAM policy |
| S3 DeleteObjects denied (active-snapshot cleanup) | HTTP 403 | Return 500; alarm fires |
| Lambda timeout (deadline reached mid-walk) | `deadlineMs - Date.now() < 60_000` guard | Stop early, write `_freshness.json` with partial count, log warning. Bronze-reconcile alarm catches partial walks (`PagesFetched < 30`). |
| OOM (Runtime.OutOfMemory) | Lambda runtime kill | Lambda Errors metric fires alarm. Per-page writer pattern bounds memory; if it OOMs, source data shape changed. |
| Empty source response | records.length === 0 on first page | Allow — write empty page, `_freshness.json` reflects record_count=0. Bronze-reconcile alerts on `BronzeRowCount = 0` for >1 day. |
| Schema drift in source (new field) | None (silent — bronze accepts arbitrary fields) | dbt staging `union_by_name=true` accommodates; dbt-bouncer rule flags new columns for review. |

## 6. Quarantine pattern

Bronze writes nothing to PG mirror tables (per ARMLS license). Bad rows go to side tables in derived layers:

| Issue | Side table | dbt LEFT ANTI JOIN |
|---|---|---|
| Rows that fail validation in `int_listings_closed_cleaned` | `listing_records_exceptions` (PG) | LEFT ANTI JOIN excludes them with `severity='error'` |
| Rows that should not display per business rule (e.g., closed pre-2011) | `listing_records_excluded` (PG) | LEFT ANTI JOIN |
| Subdivision name normalization | `subdivision_canonical_map` (PG) | LEFT JOIN to canonical name |
| Bronze write failures | `sync_errors` (PG) | not joined; alarm only |

**Why side tables, not bronze rewriting:** ARMLS license is read-only on the mirror. Side tables are the only ARMLS-compliant cleanup layer.

## 7. Replay procedure

If a run produces bad data:

```bash
# 1. Identify the bad run_id from _freshness.json or sync_errors
# 2. Add the run_id to the dbt's exclusion var:
dbt build --vars '{exclude_bronze_runs: ["uuid-of-bad-run"]}'

# 3. The exclusion is applied in stg_armls__listing_records:
#    WHERE sync_run_id NOT IN UNNEST({{ var('exclude_bronze_runs', []) }})

# 4. If the bad run wrote pages we want to physically remove:
aws s3 rm s3://.../bronze/listings/sync_year=YYYY/.../run_id=<uuid>/ --recursive
```

Bronze itself is append-only — never overwritten. Replay = re-run the sync Lambda, which writes a NEW run_id under a NEW partition.

## 8. Cost

Per-Lambda monthly cost at planned cadence:

| Lambda | Invocations/mo | Avg duration | Memory | Cost/mo |
|---|---:|---:|---:|---:|
| `rlsir-armls-sync` | 180 | 8 min | 512MB | $0.30 |
| `rlsir-active-snapshot` | 720 | 2.5 min | 2048MB | $1.40 |
| `rlsir-yong2-events-flush` (edge) | continuous | <1s/event | edge runtime | varies — bundled in Vercel pricing |
| `rlsir-yong2-leads-cdc` | 30 | 30s | 256MB | $0.02 |

Bronze S3 storage:

| Prefix | Size today | Growth/mo | Annual |
|---|---:|---:|---:|
| `bronze/listings/` | ~50MB | ~5MB | ~$1 |
| `bronze/change_log/` | 48MB (full export) + ~5MB/mo | ~5MB | ~$1 |
| `bronze/active_snapshot/` | 80MB (latest only — overwritten) | 0 | <$1 |
| `bronze/yong2/events/` | (TBD) | est. ~50MB at solo-agent volume | ~$5 |
| **Total bronze** | | | **~$8/yr** |

S3 PUT costs are higher than storage at this volume but still tiny: ~$0.02 per 1000 PUTs. Total ~$2/mo.

## 9. Why bronze isn't Parquet

You'd save space and get column pruning if bronze were Parquet. We chose NDJSON.gz because:

1. Append-only — Parquet is row-group-immutable; appending requires creating a new file every page (fine, but adds complexity to the writer).
2. Schema evolution — NDJSON tolerates new fields silently; Parquet schema must be declared upfront.
3. DuckDB reads NDJSON natively via `read_json_auto` with `union_by_name=true`.
4. Bronze CDC exports (`leads/`, `communications/`, `status_history/`) ARE Parquet because they're snapshot exports with stable schemas — no append-pattern issues.
5. Marts are Parquet (gold layer). Bronze NDJSON → silver tables (DuckDB internal) → gold Parquet.

If bronze volume grows past ~10GB, revisit: a periodic Parquet compactor Lambda could rewrite older partitions in-place. Marked as a v2 enhancement.
