# Storage + Schema

**Date:** 2026-04-30
**Status:** Spec — load-bearing for all downstream code paths.
**Related:** `02-bronze-ingest.md` (writers), `03-dbt-project.md` (consumers).

---

## 1. S3 layout — full tree

```
s3://rlsir-platform-assets-us-east-1/
│
├── bronze/                                     # APPEND-ONLY ingest layer
│   │
│   ├── listings/                               # ARMLS Property entity, full mirror
│   │   ├── sync_year=YYYY/sync_month=MM/sync_day=DD/run_id=<uuid>/page_NNNN.ndjson.gz
│   │   └── _freshness.json
│   │
│   ├── change_log/                             # ARMLS field-level change history
│   │   ├── full_export.parquet                 # one-shot 14-year backfill (3.5M events, ~48MB)
│   │   ├── sync_year=YYYY/sync_month=MM/sync_day=DD/run_id=<uuid>/changes.ndjson.gz
│   │   └── _freshness.json
│   │
│   ├── active_snapshot/                        # current-state Maricopa Active+AUC snapshot
│   │   ├── current/page_NNNNNN.ndjson.gz       # ~32 pages × 1000 records, atomic-ish swap
│   │   └── _freshness.json
│   │
│   └── yong2/                                  # behavioral + lead data
│       ├── events/sync_year=YYYY/sync_month=MM/sync_day=DD/page_NNNN.ndjson.gz
│       ├── leads/sync_year=YYYY/sync_month=MM/sync_day=DD/snapshot.parquet
│       ├── communications/sync_year=YYYY/sync_month=MM/sync_day=DD/snapshot.parquet
│       ├── status_history/sync_year=YYYY/sync_month=MM/sync_day=DD/snapshot.parquet
│       └── _freshness.json
│
├── analytics/                                  # GOLD marts — produced by dbt prod runs
│   │
│   ├── armls/                                  # MLS-domain marts
│   │   ├── metro/
│   │   │   ├── market_pulse.parquet
│   │   │   ├── absorption.parquet
│   │   │   ├── negotiation.parquet
│   │   │   └── ...
│   │   ├── regions/
│   │   │   └── {region}/market_pulse.parquet
│   │   └── communities/
│   │       └── {region}/{community}/market_pulse.parquet
│   │
│   ├── yong2/
│   │   ├── daily_metrics.parquet
│   │   ├── campaign_roi.parquet
│   │   ├── lead_attribution.parquet
│   │   └── ...
│   │
│   ├── _manifests/
│   │   └── {YYYY-MM-DD-HH}.json                # mart inventory + sizes per dbt run
│   │
│   └── _run_results/
│       └── {YYYY-MM-DD-HH}/run_results.json    # dbt's run_results sidecar for CW Insights
│
├── analytics-dev/                              # local-dev dbt outputs (mirrors analytics/)
│
└── infrastructure/                             # Lambda zips, IaC artifacts (existing)
```

**Why these conventions:**

- **Hive-partitioning by `sync_year/sync_month/sync_day`**: ingestion-time, not event-time. dbt staging models prune partitions with `sync_year >= ...` predicates. Event-time (close_date, occurred_at) belongs in mart partitioning, not bronze.
- **`run_id=<uuid>` directory inside the day partition**: tracks which ingest run produced each page. Lets us replay a single bad run without re-pulling everything.
- **`page_NNNN.ndjson.gz` ordering**: zero-padded so `aws s3 ls` sorts lexicographically same as numerically. Bronze writers cap at 1000 records or 256KB per page.
- **`_freshness.json` per logical bronze "table"**: a sentinel file written after the writer's last successful page. Custom dbt source-freshness macro reads these (standard `dbt source freshness` doesn't work on globs).
- **`analytics/{domain}/{tier}/...` for marts**: scope-tier split lets the browser fetch only what it needs. Metro mart is one Parquet (~2MB); communities split per-region keeps individual Parquets <1MB.

## 2. Bronze row contracts

### `bronze/listings/...page_NNNN.ndjson.gz`

```json
{
  "ListingKey": "ARMLS-6712345",
  "ListingId": 12345678,
  "StandardStatus": "Active",
  "MlsStatus": "Active",
  "PropertyType": "Residential",
  "PropertySubType": "Single Family Residence",
  "ListPrice": 1250000,
  "OriginalListPrice": 1295000,
  "ListingContractDate": "2026-04-01",
  "OnMarketDate": "2026-04-02",
  "ModificationTimestamp": "2026-04-29T14:32:11.123Z",
  "City": "Scottsdale",
  "PostalCode": "85262-1234",
  "CountyOrParish": "Maricopa",
  "Latitude": 33.7234,
  "Longitude": -111.9012,
  "...": "...",

  "sync_run_id": "uuid",
  "sync_observed_at": "2026-04-29T14:33:00Z",
  "bronze_written_at": "2026-04-29T14:33:01Z"
}
```

All RESO fields preserved. Provenance columns appended by writer.

### `bronze/yong2/events/...page_NNNN.ndjson.gz`

```json
{
  "occurred_at": "2026-04-29T12:34:56.789Z",
  "anon_id": "uuid",
  "session_id": "uuid",
  "event_name": "listing_view",
  "pathname": "/portfolio/12345-fake-st",
  "step_n": 7,
  "session_age_ms": 124000,

  "page_type": "listing_detail",
  "listing_key": "ARMLS-6712345",
  "community_slug": "desert-mountain",

  "channel": "paid_search",
  "source": "google",
  "medium": "cpc",
  "campaign": "luxury-estates-2026",
  "gclid": "abc123",
  "fbclid": null,

  "device_class": "desktop",
  "browser": "chrome",
  "os": "macos",
  "ip_country": "US",
  "ip_region": "AZ",
  "ip_city": "Scottsdale",

  "props": { "max_scroll_pct": 87, "time_on_page_ms": 124000 },

  "sync_run_id": "uuid",
  "sync_observed_at": "2026-04-29T12:34:57.012Z",
  "bronze_written_at": "2026-04-29T12:34:57.123Z"
}
```

Promoted typed cols (page_type, listing_key, community_slug) for hot-path filters; everything else stays in `props` jsonb.

### `bronze/yong2/leads/snapshot.parquet`

Nightly CDC export of last-7-days `leads.leads` (hashed cols only — no PII):

| Column | Type | Notes |
|---|---|---|
| id | UUID | |
| anon_id | UUID | links to bronze events |
| email_hash | TEXT | sha256(lower(email)) |
| phone_hash | TEXT | sha256(e164(phone)) |
| interest, status, lead_score, score_band | various | |
| first_channel, first_source, first_medium, first_campaign | TEXT | |
| last_channel, last_source, last_medium, last_campaign | TEXT | |
| deal_value, commission, closed_at | various | |
| created_at, updated_at, bronze_written_at | TIMESTAMPTZ | |

PII columns (`email`, `phone`, `name`, `message`) NEVER leave PG.

## 3. Gold mart Parquet specs

All marts:
- **Format:** Parquet, zstd compression, level 3
- **Row group size:** 100k rows (DuckDB-WASM optimal for tile-by-tile scanning)
- **Stats:** min/max + null_count enabled on every column (required for predicate pushdown)
- **Schema evolution:** `union_by_name=true` reads tolerate added columns without breaking
- **Provenance:** every mart has `gold_built_at TIMESTAMPTZ`, `gold_run_id UUID` columns

Per-mart split strategy (§ 4.5 of `analytics-comprehensive-plan.md`):

```
analytics/armls/metro/market_pulse.parquet              ← 1 row × 184 months × 3 segments × statuses ≈ 5K rows
analytics/armls/regions/{region}/market_pulse.parquet   ← per region split, ~13 files
analytics/armls/communities/{r}/{c}/market_pulse.parquet ← per community split, ~150 files
```

Browser fetches only the file matching its current scope. Region drill-down = additional fetch on demand.

## 4. RDS-resident tables

What stays in Postgres:

| Schema | Tables | Why |
|---|---|---|
| `public` (ARMLS mirror) | listing_records, listing_change_log, listing_members, listing_offices, listing_open_houses, listing_geography_links, listing_photos | Read-only per ARMLS license. Sync Lambda is the only writer. |
| `public` (app) | intake_requests, agents, audit_log, etc. | Operational app data, not analytics. |
| `public` (silver side tables) | listing_records_exceptions, listing_records_excluded, subdivision_canonical_map, sync_errors, active_inventory_snapshots | Cleanup/normalization layer over the read-only mirror. |
| `leads` | leads, status_history, communications, lead_listing_views | Lead system of record. Transactional, GDPR-compliant. |
| `marketing` | campaigns, campaign_spend | Campaign master + manual CSV-uploaded spend. |
| `audit` | consent_log, schema_migrations, ... | Compliance trail, append-only. |

What is REMOVED from Postgres after Phase 6:

- `mv_dashboard`, `mv_market_pulse`, `mv_negotiation`, `mv_absorption`, `mv_supply_demand`, `mv_inventory_age`, `mv_price_bands`, `mv_community_scorecard`, `mv_community_yoy` — replaced by dbt Parquet marts.

## 5. Naming conventions

| Convention | Example | Rule |
|---|---|---|
| Bronze logical "table" | `bronze.listings_observations` | dbt source name = directory name in S3 |
| dbt source name | `armls_listings`, `yong2_events` | `{domain}_{table}` lowercase snake_case |
| dbt staging | `stg_armls__listing_records` | `stg_{domain}__{table}` (double-underscore separator) |
| dbt intermediate | `int_listings_status_history` | `int_{topic}` |
| dbt fact mart | `fct_market_pulse`, `fct_yong2_daily_metrics` | `fct_{topic}` |
| dbt dim mart | `dim_communities`, `dim_yong2_visitors` | `dim_{topic}` |
| Surrogate key | `market_pulse_id` | `<mart>_id` from `dbt_utils.generate_surrogate_key([grain_columns])` |
| Provenance col | `gold_built_at`, `gold_run_id` | every mart |
| Watermark col | `source_modification_ts` | every incremental intermediate |

## 6. Partitioning + retention

| Layer | Partition by | Retention |
|---|---|---|
| `bronze/listings/` | sync_year/month/day | 36 months (S3 lifecycle expires) |
| `bronze/change_log/` | sync_year/month/day | 36 months |
| `bronze/active_snapshot/current/` | none — atomic swap | latest only |
| `bronze/yong2/events/` | sync_year/month/day | 25 months |
| `bronze/yong2/leads/` (snapshots) | sync_year/month/day | 25 months |
| `analytics/` (marts) | none — overwritten each dbt run | latest only |
| `analytics/_manifests/`, `_run_results/` | by run timestamp | 90 days |
| `leads.*` (PG) | none | indefinite (business records) |
| `marketing.campaigns`, `campaign_spend` (PG) | none | indefinite |
| `active_inventory_snapshots` (PG side table) | snapshot_date | 18 months |

## 7. IAM model summary

Two roles, scoped by least privilege:

**`rlsir-bronze-write`** (used by all sync Lambdas):
- s3:PutObject, s3:DeleteObject on `bronze/{listings,active_snapshot,change_log,yong2}/*`
- s3:ListBucket scoped to those prefixes
- secretsmanager:GetSecretValue on `rlsir/armls/tokens` and `rlsir/db/url`
- cloudwatch:PutMetricData scoped to namespace `RLSIR/DataPipeline`

**`rlsir-analytics-dbt`** (used by the dbt Lambda):
- s3:GetObject on `bronze/*` (for staging models)
- s3:PutObject, s3:DeleteObject on `analytics/*` (for mart writes)
- s3:GetObject, s3:PutObject on `analytics-dev/*` (preview envs)
- secretsmanager:GetSecretValue on `rlsir/db/url` (for the postgres extension)
- cloudwatch:PutMetricData scoped to namespace `RLSIR/DataPipeline`
- cloudwatch:DescribeAlarms (read-only) for `analytics_dbt_*` alarms

Browser does NOT have AWS credentials. Parquet files are served via CloudFront (`cdn.echelonpoint.com/analytics/...`) with public-read on `analytics/` only.

## 8. Schema evolution policy

| Change | Allowed? | Procedure |
|---|---|---|
| Add column to bronze row | Yes | Writer ships new field; dbt staging picks up via `union_by_name=true`. No migration. |
| Rename column in bronze | Avoid | If unavoidable, write under new name and keep old name for 30 days. |
| Drop column from bronze | After 90 days | Coordinate with dbt staging — drop reference, then stop writing the field. |
| Add column to a mart | Yes | dbt model edit; on next run the new column appears. Browser side handles via `union_by_name`. |
| Drop column from a mart | After 30-day deprecation | Mark in dbt model docs, ship browser update, then remove. |
| Change a mart's grain | NEVER without a new mart name | Grain change is a breaking change; introduce `fct_xxx_v2`, sunset old. |
