# RLSIR Analytics — Comprehensive Plan

**Owner:** Joey Schnepel (joeyschnepel@gmail.com)
**Date:** 2026-04-28
**Status:** Plan locked, scaffold built, ready to begin Phase 1
**Supersedes:** `analytics-architecture-decision.md`, `closed-listings-etl-strategy.md`, `bronze-migration-build-path.md` — those remain as historical records; this is the master plan.

---

## §1 Executive summary

Migrate the RLSIR analytics platform from a single bloated RDS Postgres instance (currently t3.medium, $66/mo, 60s+ query timeouts, hidden 2019 sync hole, 46% dead tuples) to a hybrid lakehouse:

- **Bronze** — append-only NDJSON.gz on S3, populated by the existing sync Lambda (modified to dual-write)
- **Intermediate (silver)** — DuckDB views/incremental tables that clean, validate, and dimensionally enrich
- **Marts (gold)** — pre-aggregated Parquet files on S3, serving the dashboard
- **DuckDB Lambda** for on-demand drill-downs; **CloudFront-cached JSON** for hot KPIs
- **dbt** orchestrates the staging → intermediate → marts DAG with tests, exposures, and dbt-bouncer governance
- **RDS shrunk to t3.micro** for app data + change_log + geographic boundaries only

### Headline numbers

| | Today | After migration |
|---|---|---|
| RDS instance | t3.medium ($66/mo) | t3.micro ($20/mo) |
| Total monthly cost | $66 | $27 |
| Annual savings | — | **$468** |
| Analytics query time | 60 s+ timeouts | **<5ms in-browser** (DuckDB-WASM) |
| Network calls per drill-down | 1 (DB query) | **0** (local query after initial load) |
| First page load data transfer | N/A | ~650KB (SSR + metro Parquet) |
| Hidden data gaps | 22,914 missing 2019 records | 0 (recovered via backfill) |
| Calendar coverage | gappy | 184/184 months guaranteed by spine |
| Time-series confidence band | none | 5 levels per row |
| Land contamination in analytics | yes (Cave Creek median off by $495K) | property_segment dimension, default residential |
| Buyer-side analytics | none | full (BuyerAgent + BuyerOffice) |
| Price-reduction analytics | none | full (via change log + close-to-original ratio) |
| Community-feature premium analytics | none | gated/golf/age-restricted size-controlled |
| Methodology transparency | none | dynamic footer on every page |

### Total effort and timeline

- **~12 engineering days**, **~7 weeks calendar** (parallel-run validation windows + DuckDB-WASM device validation)
- **Risk-managed** — strangler-fig pattern, dual-write, 7-day reconciliation before promoting bronze, 24h soak per page cutover, 14-day soak before dropping legacy
- **Rollback at every gate** — feature flags, snapshot-before-drop, append-only bronze never overwritten

---

## §2 Where we are today

### Current architecture

```
┌─────────────────────────────────────────────────────────────┐
│ ARMLS Spark RESO API                                        │
│   replication.sparkapi.com/Reso/OData/Property              │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼ rate(1h) actives + rate(4h) full walk
┌─────────────────────────────────────────────────────────────┐
│ rlsir-armls-sync Lambda (Node.js 20, 512 MB, 15 min)        │
│   - paginates by $skiptoken                                 │
│   - upserts to Postgres                                     │
│   - logs failures to sync_errors                            │
│   - refreshes 9 materialized views after sync               │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼ INSERT…ON CONFLICT
┌─────────────────────────────────────────────────────────────┐
│ RDS Postgres 16 — t3.medium, 50 GB, $66/mo                  │
│   listing_records          1.85 M rows  (mirror)            │
│   listing_change_log       3.4 M rows   (field events)      │
│   listing_geography        1.58 M rows  (PostGIS classify)  │
│   geographic_boundaries    80 polygons                      │
│   listing_members/offices/openhouses/photos                 │
│   sync_errors              quarantine                       │
│   listing_sync_state       skiptoken cursor                 │
│   + 9 materialized views (dashboard, market_pulse, etc.)    │
│   + app data (intake, agents, audit_log, ...)               │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼ direct queries + MV reads
┌─────────────────────────────────────────────────────────────┐
│ apps/premium-site (Next.js 16 SSR/ISR)                      │
│   /phoenix          dashboard                               │
│   /phoenix/[r]/[c]  community detail                        │
│   /market/*         comparison + zip rankings               │
│   /listings/*       (already on @platform/spark API direct) │
└─────────────────────────────────────────────────────────────┘
```

### Pain points

1. **60-second analytics query timeouts** — RDS struggles with PERCENTILE_CONT across 1.85M rows on t3.medium
2. **46% dead tuples** in listing_records — VACUUM is expensive on a live MV-supporting table
3. **Hidden 2019 sync hole** — 22,914 missing Maricopa Closed records (verified by Spark API probe)
4. **No price-reduction analytics** — `OriginalListPrice` empty in source; needs derivation from `listing_change_log`
5. **No buyer-side analytics** — buyer agent/office not currently captured by sync
6. **No CommunityFeatures** — gated/golf/age-restricted classification not stored
7. **9 materialized views** taking ~3 min to refresh sequentially every sync, contributing to query timeouts
8. **No calendar spine** — months with sparse data appear as gaps in the UI
9. **No confidence band per metric** — a single $20M sale skews medians in 5-sale-per-year communities
10. **No data quality observability** — would have caught the 2019 hole years ago

---

## §3 Where we're going

### Target architecture

```
┌─────────────────────────────────────────────────────────────┐
│ ARMLS Spark RESO API (unchanged)                            │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ rlsir-armls-sync Lambda (modified)                          │
│   - paginates by $skiptoken (unchanged)                     │
│   - DUAL-WRITE: Postgres legacy + S3 bronze NDJSON.gz       │
│   - logs failures (unchanged)                               │
│   - dbt run after sync (replaces MV refreshes)              │
└─────────────────────────────────────────────────────────────┘
                       │
                       ├──────► RDS legacy (deprecated, drop in Phase 6)
                       │
                       ▼ append-only S3 PUT, immutable per page
┌─────────────────────────────────────────────────────────────┐
│ S3 bronze: rlsir-platform-assets-us-east-1                  │
│   bronze/listings/sync_year=YYYY/sync_month=MM/             │
│     sync_day=DD/run_id=<uuid>/page_NNNN.ndjson.gz           │
│   ~50 MB/day, ~1.8 GB historical after backfill            │
│   Each row: full Spark Property record + sync_run_id +      │
│     sync_observed_at (provenance)                           │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼ DuckDB httpfs reads + dedups by listing_key
┌─────────────────────────────────────────────────────────────┐
│ dbt-DuckDB pipeline (analytics/ workspace)                  │
│                                                             │
│ STAGING (views — read bronze, RDS for change_log/geo)       │
│   stg_armls__listing_records                                │
│   stg_armls__listing_change_log                             │
│   stg_armls__listing_geography                              │
│                                                             │
│ INTERMEDIATE (microbatch incremental tables)                │
│   int_calendar                                              │
│   int_listings_closed_cleaned    (silver fact)              │
│   int_listings_price_history     (derives orig_list_price)  │
│   int_listings_geographic_enriched                          │
│                                                             │
│ MARTS (external Parquet on S3)                              │
│   dim_calendar / dim_communities                            │
│   fct_closings (atomic, partitioned by close_year)          │
│   fct_market_pulse / fct_negotiation                        │
│   fct_community_scorecard / fct_community_yoy               │
│   fct_pricereduction / fct_buyer_office                     │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Consumption tier                                            │
│                                                             │
│   SSR (hero KPIs):                                          │
│     Pre-rendered JSON on CloudFront → baked into HTML       │
│     Zero client-side data fetch for first paint             │
│                                                             │
│   In-browser (all drill-downs, tab switches, toggles):      │
│     DuckDB-WASM (~500KB MVP loader)                         │
│     Lazy-loaded Parquet slices from CloudFront:             │
│       metro/*.parquet     (~100KB, loads on page init)      │
│       regions/*.parquet   (~250KB, prefetched after metro)  │
│       communities/{region}/*.parquet (~100KB ea, on click)  │
│     Every interaction after initial load = local query      │
│     Zero network calls for tab switches or filter changes   │
│                                                             │
│   DuckDB Lambda (rare, heavy queries only):                 │
│     fct_closings comp finder (500K rows, too big for browser)│
│     Heatmap H3 aggregation                                  │
│     Custom date range queries spanning full history         │
│                                                             │
│   @platform/spark API (listing detail, search — unchanged)  │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Browser load sequence                                       │
│                                                             │
│   0ms    SSR HTML with hero KPIs (pre-rendered JSON)        │
│   0-1s   DuckDB-WASM MVP bundle loads (500KB, background)   │
│   0-1s   metro/*.parquet fetched (100KB)                    │
│          → Overview tab fully interactive                   │
│   1-3s   regions/scorecards.parquet prefetched (50KB)       │
│          → Region cards populate                            │
│   hover  regions/market_pulse.parquet prefetched (200KB)    │
│          → Ready when user clicks a region                  │
│   click  communities/{region}/*.parquet fetched (100KB)     │
│          → Community drill-down interactive                 │
│                                                             │
│   Total first-view download: ~650KB                         │
│   Total full-drill download: ~950KB (cached after first)    │
│   Every subsequent interaction: 0 bytes, <5ms local query   │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ apps/premium-site reads via analytics-adapter (feature flag)│
│   ANALYTICS_SOURCE=wasm     → DuckDB-WASM (new)             │
│   ANALYTICS_SOURCE=rds      → legacy (rollback)             │
└─────────────────────────────────────────────────────────────┘

Side artifacts that stay on RDS:
  app data (auth, intake_requests, agents, audit_log)
  listing_change_log (3.4 M field events — also bronzed to S3 for analytics)
  listing_geography (1.58 M PostGIS classifications)
  geographic_boundaries (80 polygons)
```

### Why each piece is the way it is

- **NDJSON.gz over Parquet for v1 bronze** — Node 20 has zlib built-in; no new npm dep; DuckDB reads NDJSON natively via `read_json_auto`; trivially compactable to Parquet later
- **One file per Spark API page (immutable)** — atomic at S3-object level; resumable on Lambda mid-flight death; window-dedup by `listing_key + ModificationTimestamp` at staging-read time
- **Hive partitioning by `sync_year/sync_month/sync_day/run_id`** — bronze partitions reflect ingestion-time (when we observed the record), not event-time (close_date). Event-time partitioning belongs in marts.
- **Microbatch / merge incremental for intermediate** — dbt 1.8+ feature, perfect for our late-arriving-data shape (90-day rebuild window with monthly batches; 4-hourly incremental drops from 1.8M rows to ~500-2000 modified records)
- **External Parquet for marts** — DuckDB writes columnar Parquet directly to S3; readers stream over httpfs with column pruning + predicate pushdown
- **Calendar spine on every monthly mart** — guarantees every month from 2011-01 has a row; "no data" becomes `closing_count=0`, not a chart gap
- **Confidence band per metric** — `none/very_low/low/medium/high` based on sample size; UI hides or annotates thin metrics
- **DuckDB-WASM over DuckDB Lambda for drill-downs** — mart Parquet totals ~1.2MB. Split by scope tier, the initial load is ~650KB (less than a hero image). Every interaction after load is a local in-memory query (<5ms). Eliminates Lambda cold starts (2-3s), API route complexity, connection pool pressure, and $3-20/mo in Lambda costs. DuckDB Lambda is retained only for fct_closings queries (500K rows, too large for browser) used by comp finder and heatmap.
- **Lazy-load by scope tier, not by mart** — users see metro first, then drill into regions, then communities. Load data in the same order. Prefetch the next tier in the background using `<link rel="prefetch">`. Most users never download community data for regions they don't visit.
- **SSR hero KPIs stay server-rendered** — search engines and first paint don't run WASM. Pre-rendered JSON baked into the HTML ensures SEO and instant first contentful paint. DuckDB-WASM hydrates interactivity after.
- **Bronze change_log on S3 (not just RDS)** — eliminates the RDS network dependency from the dbt pipeline entirely. dbt reads bronze listings + bronze change_log, both from S3. RDS is truly app-only during analytics builds.
- **Property segment dimension on every fact mart** — Land, commercial, and lease listings are separated from residential. Default view is residential. Users can toggle. Prevents the "Cave Creek median shifts $495K when you remove land" problem.

---

## §4 Data model

### §4.1 Bronze tables (S3 NDJSON.gz / Parquet)

**Bronze logical "table" #1 — `bronze.listings_observations`:**

| Column | Source | Notes |
|---|---|---|
| All Spark Property entity fields | RESO API response | ~1006 fields available; we capture them all (free with NDJSON) |
| `sync_run_id` | Lambda | UUIDv4 per sync invocation; ties row to a manifest entry |
| `sync_observed_at` | Lambda | ISO timestamp when our Lambda received the row from Spark |

Storage: `s3://rlsir-platform-assets-us-east-1/bronze/listings/sync_year=YYYY/sync_month=MM/sync_day=DD/run_id=<uuid>/page_NNNN.ndjson.gz`. Each line is one JSON object.

**Bronze logical "table" #2 — `bronze.change_log_observations`:**

| Column | Source | Notes |
|---|---|---|
| All `listing_change_log` fields | RDS export + ongoing Lambda appends | Field-level change events |
| `sync_run_id` | Lambda | Provenance |
| `sync_observed_at` | Lambda | When we captured this change |

Storage: `s3://rlsir-platform-assets-us-east-1/bronze/change_log/`

Population:
- One-time export: full `listing_change_log` (3.4M rows) → Parquet (`bronze/change_log/full_export.parquet`, ~200MB compressed)
- Ongoing: sync Lambda appends new change_log entries as NDJSON.gz alongside listing writes at `bronze/change_log/sync_year=YYYY/sync_month=MM/sync_day=DD/run_id=<uuid>/changes.ndjson.gz`

This eliminates the RDS network dependency from the dbt pipeline entirely. dbt reads bronze listings + bronze change_log, both from S3. RDS is truly app-only during analytics builds.

**Source freshness mechanism (custom, since standard `dbt source freshness` doesn't work against S3 NDJSON):**

The sync Lambda writes a `_freshness.json` marker after each successful bronze write:

```json
// s3://rlsir-platform-assets-us-east-1/bronze/listings/_freshness.json
{
  "last_sync_at": "2026-04-28T12:00:00Z",
  "records_written": 1247,
  "run_id": "abc-123"
}
```

A custom dbt macro `check_bronze_freshness(warn_hours=6, error_hours=12)` runs as `on-run-start` hook. Raises compiler error if bronze is past the error threshold; logs warning if past the warn threshold.

### §4.2 RDS-resident tables (kept on micro)

| Table | Purpose | Rows | Disposition |
|---|---|---|---|
| `listing_change_log` | Field-level change history (back to 2011) | 3.4 M | Stays on RDS for app use; ALSO bronzed to S3 for analytics. dbt reads from bronze, not RDS. |
| `listing_geography` | Per-listing region/community classification | 1.58 M | Stays — PostGIS-dependent |
| `geographic_boundaries` | 80 PostGIS polygons | 80 | Stays — static reference |
| `listing_sync_state` | Skiptoken cursor | <10 | Stays Phase 1; migrate to DynamoDB Phase 6 |
| `sync_errors` | Per-row sync failures (quarantine) | <1000/yr | Stays |
| `listing_records` | Mirror | 1.85 M | **Drop in Phase 6** |
| `listing_members/offices/openhouses/photos` | Other RESO entities | ~ | Stays Phase 1; revisit if not used by app |
| `analytics_base` + 9 dashboard MVs | Pre-aggregations | varies | **Drop in Phase 6** (replaced by Parquet marts) |
| App tables (auth, intake, agents, audit_log, etc.) | Application data | ~ | Stays |

### §4.3 Intermediate (silver) — DuckDB tables

`int_calendar` — date dimension, every month 2011-01 → today + 1.

`int_listings_closed_cleaned` — one row per closed listing, validated. **Materialized as `incremental` with `unique_key='listing_key'` and `incremental_strategy='merge'`.** 4-hourly runs only process the ~500-2000 records modified since last build, not the full 1.8M.

Cleaning rules (rejected to `_quarantine` log with reason):
- close_date in [1990-01-01, today + 30 days]
- close_price in [$1000, $1B]
- list_price in [$1000, $500M]
- close_price/list_price in [0.4, 2.5]
- living_area in [100, 50000] sqft (or NULL)
- days_on_market in [0, 5000] (or NULL)
- **association_fee ≤ $50,000** (11 records: includes $10,850/mo on $825K property)
- **tax_annual_amount ≤ $1,000,000** (23 records: $185K tax on $275K property)
- **price_per_sqft in [5, 10000]** (18 records: $6,226/sqft Queen Creek)
- **lot_size_acres < 10,000** (1 record: 6,947-acre "Residential" at $290K)
- **NOT (list_price ≤ $99 AND status = 'Active')** (21 placeholder $1 listings)

Soft fixes:
- TRIM city, subdivision_name; placeholder names (Metes and Bounds, etc.) → NULL
- ZIP+4 → 5-digit
- Derived: price_per_sqft, year_built_decade, sqft_band, age_at_close, contract_to_close_days
- **Derived `property_segment` enum** based on property_type + property_sub_type:
  - `'residential'` — Residential (not lease) with residential sub_types
  - `'land'` — Land
  - `'commercial'` — Comm/Industry Sale, Business Opportunity, Multiple Dwellings
  - `'lease'` — Residential Lease, Comm/Industry Lease
  - `'other'` — anything else
- **Derived `is_dual_representation`** BOOLEAN (list_office_key = buyer_office_key)
- **Flag (do not reject):** duplicate active addresses (691 addresses with multiple actives)

**Confidence band thresholds** (per scope/segment/month):
- `none` — 0 closings in the period
- `very_low` — 1–4 closings
- `low` — 5–14 closings
- `medium` — 15–49 closings
- `high` — 50+ closings

Every metric row carries `sample_size` (integer) and `confidence` (enum). UI renders confidence visually:
- high/medium: normal display
- low: dimmed text, asterisk footnote "Based on limited data"
- very_low: hidden by default, expandable with warning
- none: shows "—" or "Insufficient data"

Provenance columns: `silver_built_at`, `silver_run_id`, `source_modification_ts`, `data_quality_flags`.

`int_listings_price_history` — derives original_list_price + reduction stats from `listing_change_log`:

Per closed listing:
- `original_list_price` (or NULL → defaults to final_list_price with `source='final_list_assumed'`)
- `had_price_reduction`, `reduction_count`, `total_reduction_amount`
- `net_price_change_pct`, `close_to_original_ratio`
- `days_to_first_change`

Coverage: 11.3% of closed listings have at least one recorded price change; the rest legitimately closed without reductions.

`int_listings_geographic_enriched` — joins to `listing_geography` for region/community/section slugs + computes `price_band` dimension (7 bands: 200K–400K through 5M+).

**Staging materialization is `table`, not `view`** — `stg_armls__listing_records` reads from S3 NDJSON.gz across hundreds of Hive-partitioned directories and deduplicates with a window function. As a view, this re-executes every time any downstream model references it (3-4 times per run = 3-4 full bronze scans). As a table, the scan runs once per dbt run.

**All intermediate models materialized as `incremental`** with `unique_key`, `incremental_strategy='merge'`, `on_schema_change='append_new_columns'`. Watermark on `source_modification_ts`. Full refresh via `dbt build --full-refresh` is safe and idempotent (~5–10 min).

### §4.4 Marts (gold) — external Parquet on S3

| Mart | Question answered | Refresh |
|---|---|---|
| `dim_calendar` | Date dimension | weekly (changes only at month rollover) |
| `dim_communities` | Region/community lookup + 12-mo baseline | every 4 h |
| `fct_closings` | Atomic — one row per closed listing (every dim joined) | every 4 h |
| `fct_market_pulse` | Monthly time series: closings, medians, ppsf, DOM, volume | every 4 h |
| `fct_negotiation` | Monthly close-to-list AND close-to-original (true negotiation strength) | every 4 h |
| `fct_community_scorecard` | Per-community 12-mo snapshot | every 4 h |
| `fct_community_yoy` | Community YoY median ppsf change | every 4 h |
| `fct_pricereduction` | Monthly % with reductions, mean amount, by price band | every 4 h |
| `fct_buyer_office` | Buyer-side office leaderboard by year | every 4 h |

All facts:
- Calendar-spined where temporal (zero gaps)
- Carry **`scope_type`** ('metro', 'region', 'community')
- Carry **`scope_key`** ('phoenix_metro', 'north-scottsdale', 'desert-mountain', etc.)
- Carry **`property_segment`** ('residential', 'land', 'all') — default dashboard view is residential; user can toggle
- Carry **`sample_size`** (integer)
- Carry **`confidence`** band: `none/very_low/low/medium/high`
- Carry **surrogate key** as the first column (via `dbt_utils.generate_surrogate_key([grain_columns])`); column name is `<mart>_id` (e.g. `market_pulse_id`); tested with `unique` + `not_null`
- Carry `gold_built_at` provenance
- Partitioned by `close_year` where appropriate
- Materialized as `external` Parquet via DuckDB COPY to S3

**Surrogate key columns per mart:**

| Mart | Surrogate Key Column | Grain Columns |
|---|---|---|
| `fct_market_pulse` | `market_pulse_id` | scope_type, scope_key, property_segment, month |
| `fct_negotiation` | `negotiation_id` | scope_type, scope_key, property_segment, month |
| `fct_community_scorecard` | `scorecard_id` | scope_type, scope_key, property_segment |
| `fct_community_yoy` | `yoy_id` | scope_type, scope_key, property_segment, year |
| `fct_pricereduction` | `pricereduction_id` | scope_type, scope_key, property_segment, month, price_band |
| `fct_buyer_office` | `buyer_office_id` | buyer_office_key, year |
| `fct_closings` | `closing_id` | listing_key |

### §4.5 Mart Parquet split strategy for browser consumption

The dbt pipeline produces logical mart tables. A post-run script (Lambda `armls-analytics-split`) splits them into scope-tier Parquet files optimized for lazy browser loading.

```
s3://rlsir-platform-assets-us-east-1/analytics/
├── manifest.json                          # version + schema_version + build timestamp
├── prerendered/
│   └── hero_kpis.json                     # SSR-ready, CloudFront cached 5min
├── metro/
│   ├── market_pulse.parquet               # ~30KB — 180+ months × 3 segments
│   ├── supply_demand.parquet              # ~20KB
│   ├── negotiation.parquet                # ~15KB
│   ├── price_bands.parquet                # ~10KB
│   ├── inventory_age.parquet              # ~5KB
│   └── absorption.parquet                 # ~15KB
├── regions/
│   ├── scorecards.parquet                 # ~50KB — 13 regions × 3 segments
│   ├── market_pulse.parquet               # ~200KB — 13 regions × 60 months × 3 segments
│   └── community_yoy.parquet              # ~30KB
├── communities/
│   ├── north-scottsdale/
│   │   ├── scorecards.parquet             # ~20KB
│   │   └── market_pulse.parquet           # ~80KB
│   ├── paradise-valley/
│   │   ├── scorecards.parquet
│   │   └── market_pulse.parquet
│   └── ... (one folder per region)
├── fct/
│   └── fct_closings/                      # NOT for browser — too large
│       └── close_year=YYYY/data.parquet   # DuckDB Lambda reads these
├── dim/
│   ├── dim_calendar.parquet
│   └── dim_communities.parquet
└── _quarantine/
    └── reject_log/...                     # silver rejects, with reject_reason
```

**Split implementation** (runs as dbt post-hook or separate Lambda step):

```sql
-- Metro slice
COPY (SELECT * FROM fct_market_pulse WHERE scope_type = 'metro')
TO 's3://.../analytics/metro/market_pulse.parquet' (FORMAT 'parquet', COMPRESSION 'zstd');

-- Region slice
COPY (SELECT * FROM fct_market_pulse WHERE scope_type = 'region')
TO 's3://.../analytics/regions/market_pulse.parquet' (FORMAT 'parquet', COMPRESSION 'zstd');

-- Per-region community slices (loop over 13 regions)
FOR region IN (SELECT DISTINCT region_slug FROM dim_communities):
  COPY (SELECT * FROM fct_market_pulse WHERE scope_type = 'community' AND region_slug = region)
  TO 's3://.../analytics/communities/{region}/market_pulse.parquet' (FORMAT 'parquet', COMPRESSION 'zstd');
```

**Bronze layout (unchanged from §4.1):**

```
s3://rlsir-platform-assets-us-east-1/bronze/
├── listings/
│   ├── _freshness.json                    # source freshness marker
│   ├── _backfill/run_id=BACKFILL_<date>/  # one-time historical
│   ├── compacted/                         # monthly compacted Parquet (Amendment 30)
│   │   ├── 2026-01.parquet
│   │   └── 2026-02.parquet
│   └── sync_year=YYYY/sync_month=MM/sync_day=DD/run_id=<uuid>/page_NNNN.ndjson.gz
└── change_log/
    ├── full_export.parquet                # one-time export
    └── sync_year=YYYY/sync_month=MM/sync_day=DD/run_id=<uuid>/changes.ndjson.gz
```

### §4.6 Manifest format

```json
// s3://rlsir-platform-assets-us-east-1/analytics/manifest.json
{
  "version": "2026-04-28T12:05:00Z",
  "schema_version": 1,
  "built_at": "2026-04-28T12:05:00Z",
  "dbt_invocation_id": "abc-123",
  "marts": {
    "metro/market_pulse":    { "rows": 180,  "bytes": 30000 },
    "metro/supply_demand":   { "rows": 120,  "bytes": 20000 },
    "metro/negotiation":     { "rows": 60,   "bytes": 15000 },
    "metro/price_bands":     { "rows": 420,  "bytes": 10000 },
    "metro/inventory_age":   { "rows": 42,   "bytes": 5000  },
    "metro/absorption":      { "rows": 60,   "bytes": 15000 },
    "regions/scorecards":    { "rows": 39,   "bytes": 50000 },
    "regions/market_pulse":  { "rows": 2340, "bytes": 200000 },
    "regions/community_yoy": { "rows": 117,  "bytes": 30000 }
  }
}
```

Browser logic checks `schema_version` against `localStorage`-cached value; if changed, invalidate all cached Parquet and re-fetch. The split/prerender Lambda increments `schema_version` whenever a mart adds/removes/renames a column (automated by hashing the Parquet schema and comparing to the previous manifest).

### §4.8 Active analytics pipeline (Spark API direct, NOT bronze-mediated)

Active listings have fundamentally different data shape than closed:
- **Closed** = historical events, time-series, immutable per row, ~1.6 M rows total
- **Active** = current snapshot, point-in-time, mutable until status change, ~50 K rows

Different shape ⇒ different pipeline. Active marts are built **directly from Spark API** every hour, not through bronze→silver→gold like closed.

```
ARMLS Spark API
       │
       ▼ rate(1 h) — rlsir-analytics-active-snapshot Lambda
       │
       │ Calls @platform/spark.searchProperties() with status filter:
       │   StandardStatus IN ('Active','Active Under Contract','Pending','Coming Soon')
       │ Paginates 50 calls × $top=1000 = ~30 s wall time
       │ Writes single Parquet snapshot (overwritten each run)
       │
       ▼
s3://rlsir-platform-assets-us-east-1/bronze/active_snapshot.parquet
       │ ~5 MB, ~50 K rows, all RESO Property fields
       │
       ▼
dbt active pipeline (also rate(1 h))
   ├─ stg_armls__active_listings        (table view of snapshot)
   ├─ int_listings_active_cleaned       (validated + dimensionally enriched)
   ├─ int_listings_status_history       (derives transition timing from change_log;
   │                                     used by both active and closed marts)
   └─ marts/analytics/active/
       ├─ fct_active_inventory          (current snapshot KPIs)
       ├─ fct_active_by_pricetier       (price-band histogram)
       ├─ fct_active_dom_distribution   (DOM bucket histogram)
       ├─ fct_active_by_community       (per-community counts)
       ├─ fct_active_heatmap_h3         (H3 hex aggregation for map)
       ├─ fct_listing_pace              (new actives per week, calendar-spined)
       ├─ fct_months_of_supply          (active ÷ trailing-12mo monthly closes)
       └─ fct_status_velocity           (median Active→Pending→Closed days)
```

**Why direct from Spark, not from bronze:**
- Bronze captures actives too (B2 status filter), but it's a 4-h cadence sync
- Active analytics demand <1-h freshness ("how many actives are there RIGHT NOW")
- Spark API gives <30 s freshness; no point routing through bronze for actives
- Bronze still captures the historical observation stream (useful for status transition history; consumed by `int_listings_status_history`)

**Why a single overwritten snapshot Parquet instead of append-only:**
- Active is current-state, not event history
- ~50 K rows fits in 5 MB; overwrite every hour is cheap
- Eliminates dedup-window-function complexity of the bronze listings pattern

**Why the snapshot uses `bronze/` prefix despite being current-state:**
- One bucket / one root for all data, simplifying IAM + lifecycle policies
- DuckDB views over `bronze/active_snapshot.parquet` and `bronze/listings/**/*` work the same way

**Snapshot freshness marker:** Lambda writes `bronze/active_snapshot._freshness.json` with `last_snapshot_at, record_count, run_id`. dbt source freshness checks: warn after 90 min, error after 4 h.

### §4.7 Browser asset cache strategy

| Asset | Cache-Control | CDN TTL | Browser TTL | Invalidation |
|---|---|---|---|---|
| `hero_kpis.json` | `max-age=300` | 5 min | 5 min | CloudFront invalidation after dbt build |
| `metro/*.parquet` | `max-age=14400` | 4 h | 4 h | CloudFront invalidation after split |
| `regions/*.parquet` | `max-age=14400` | 4 h | 4 h | CloudFront invalidation after split |
| `communities/*.parquet` | `max-age=14400` | 4 h | 4 h | CloudFront invalidation after split |
| `manifest.json` | `max-age=60, must-revalidate` | 1 min | 1 min | Always fresh-ish |
| `duckdb-mvp.wasm` | `max-age=31536000, immutable` | 1 year | 1 year | Filename-hashed versioning |
| `duckdb-worker.js` | `max-age=31536000, immutable` | 1 year | 1 year | Filename-hashed versioning |

DuckDB-WASM binaries are **self-hosted on our CloudFront**, not loaded from jsDelivr/unpkg. Ensures version consistency, availability, and cache control. Pin in `package.json`: `"@duckdb/duckdb-wasm": "1.28.0"` (or latest stable at implementation).

---

## §5 Analytics catalog

### §5.1 What public-facing pages get

| Insight | Where | Powered by |
|---|---|---|
| Hero KPI bar (active count, median 30d, median DOM, new listings, pending count, pct above list) | `/phoenix` | Pre-rendered JSON from `fct_market_pulse` + `fct_community_scorecard`. Active count computed in the mart from bronze Active listings, **not a runtime Spark API call**. Removes Spark API as a runtime dependency — if ARMLS is down, dashboard still works. |
| 14-year median price trend | `/phoenix` Pricing tab | `fct_market_pulse` (180+ months) |
| Price band distribution | `/phoenix` Pricing tab | `fct_market_pulse` filtered by `price_band` scope |
| DOM histogram | `/phoenix` Inventory tab | `fct_market_pulse` filtered by DOM bucket |
| Months of supply trend | `/phoenix` Inventory tab | `fct_market_pulse` + Spark API active count |
| Negotiation spread (close-to-list AND close-to-original) | `/phoenix` Pricing tab | `fct_negotiation` |
| % closing above asking | `/phoenix` Pricing tab | `fct_negotiation` |
| Seasonal pattern | `/phoenix` Activity tab | derived from `fct_market_pulse` (12 month-of-year averages) |
| Heatmap of closes | `/phoenix` Geography tab | `fct_closings` filtered + H3 hex aggregation |
| Top 10 hot communities | `/market` | `fct_community_yoy` ORDER BY ppsf_pct_change DESC |
| Community detail (median, $/sqft, DOM, % reduction) | `/phoenix/[region]/[community]` | `fct_community_scorecard` |
| Community 14-year trend | `/phoenix/[region]/[community]` | `fct_market_pulse` filtered to community scope |
| ZIP comparison | `/market/zip/[code]` | `fct_market_pulse` filtered to ZIP scope |
| Recent comps panel | `/listings/[slug]` | `fct_closings` filtered to community + price band |
| Local market sidebar | `/listings/[slug]` | `fct_community_scorecard` |

### §5.2 New analytics this unlocks

1. **`close_to_original_ratio`** — true negotiation strength. Today's "% above asking" can mask a 12.5% original-to-close haircut as +5%. New metric exposes this.
2. **`fct_buyer_office`** — buyer-side office leaderboard. Currently impossible because buyer fields not captured.
3. **`fct_pricereduction`** — % of closings with reductions, mean reduction amount, by price band. Currently impossible because OriginalListPrice empty in source.
4. **`is_dual_representation`** flag on `fct_closings` — when list_office == buyer_office.
5. **Community amenity premiums** — gated, golf, age-restricted (if CommunityFeatures population validates at scale).
6. **Confidence-banded medians** — UI degrades gracefully on thin data instead of misleading the user.
7. **Calendar-spined time series** — every month present, even zero-sale months.

### §5.3 Internal-only (broker-gated) analytics

| Mart | Use |
|---|---|
| `fct_buyer_agent_yearly` (future) | Internal agent leaderboard |
| Comp-finder (silver direct query, not a mart) | Per-property comp generation |

These live behind auth on `/platform/*` routes. Public site never sees them.

### §5.4 Methodology footer

Every analytics page shows a collapsible "ⓘ Methodology" disclosure at the bottom. Content updates dynamically when the user switches `property_segment`.

When `property_segment = 'residential'` (default):
> ⓘ Methodology
> - Residential properties only
> - Maricopa County
> - Minimum list price $200,000
> - Excludes: Land, Commercial, Leases, Business Opportunities

When `property_segment = 'land'`:
> ⓘ Methodology
> - Land properties only
> - Maricopa County
> - Minimum list price $200,000
> - Excludes: Residential, Commercial, Leases, Business Opportunities

When `property_segment = 'all'`:
> ⓘ Methodology
> - All property types
> - Maricopa County
> - Minimum list price $200,000
> - Excludes: Leases, Business Opportunities

Small text, muted color, collapsed by default. Builds trust and preempts methodology questions.

### §5.6 Active analytics catalog

Active marts answer different questions than closed marts (current state vs historical trend).

| Insight | Where | Powered by |
|---|---|---|
| "How many actives are there now?" — count by segment + scope | `/phoenix` hero KPI bar | `fct_active_inventory` |
| "Median active list price" | `/phoenix` hero KPI bar | `fct_active_inventory` |
| "Mean DOM for current actives" | `/phoenix` hero KPI bar | `fct_active_inventory` |
| Active inventory by price band | `/phoenix` Inventory tab | `fct_active_by_pricetier` |
| Active inventory age histogram | `/phoenix` Inventory tab | `fct_active_dom_distribution` |
| "Which communities have the most active listings right now?" | `/market` rankings | `fct_active_by_community` |
| Heatmap of current listings | `/phoenix` Geography tab + map dot density | `fct_active_heatmap_h3` |
| "New listings this week vs trailing 4-week avg" | `/phoenix` Activity tab | `fct_listing_pace` |
| **"Months of supply"** (active ÷ trailing 12-mo monthly close avg) | `/phoenix` Inventory tab — most important active metric | `fct_months_of_supply` |
| "How fast are listings moving through the pipeline?" — Active→Pending→Closed days | `/phoenix` Timing tab | `fct_status_velocity` |

**The headline new analytic: months-of-supply.** Joins current active count to trailing 12-month closed velocity — answers "how long would it take to clear current inventory at the current pace?" <2 months = seller's market, 6+ months = buyer's market. The metric works at metro / region / community / price-band scopes.

**Active data caveats** baked into the methodology footer:
- "Active inventory current as of [last snapshot — usually <1 h ago]"
- "Closed metrics through [last full-day close]"
- "Months-of-supply combines current actives with last 12 months of closes"

### §5.5 Search page Buy/Rent/Land tabs

Search page gets a top-level tab row: `[ Buy ]  [ Rent ]  [ Land ]`

| Tab | property_segment | UX adaptations |
|---|---|---|
| Buy (default) | `residential` | Standard search filters: price, beds, baths, sqft, year built |
| Rent | `lease` | Price shows as monthly rent; hide sqft and year-built filters |
| Land | `land` | Show lot size and zoning; hide beds/baths/sqft |

Powered by `@platform/spark` API (unchanged search infrastructure).

---

## §6 Implementation plan

The migration uses the **strangler-fig pattern with parallel-run validation**. New system runs alongside legacy; cutover happens piece-by-piece with feature flags; legacy is decommissioned only after a long soak.

### §6.1 Phase 0 — Where we are

- ✅ dbt project scaffolded at `real-estate-platform/analytics/`
- ✅ Strategy docs written
- ✅ 2019 sync hole identified (22,914 missing records)
- ✅ Spark API capabilities verified (1.88 M closed available, geo.distance works, max $top=1000)
- ✅ `@platform/spark` cutover already done for /listings, /api/search, etc.

### §6.2 Phase 1 — Sync Lambda dual-write (~2 days work, ~3 days calendar)

**Goal:** every Spark API response writes to BOTH Postgres (legacy) AND S3 bronze (new).

**Build:**
- ✅ `infra/lambda/bronze-writer.ts` — NDJSON.gz writer with provenance stamping
- ✅ Modified `infra/lambda/armls-sync-bundle.ts` — call `writeBronzePage()` after each `fetchPage()` in `syncProperty()` and `syncActive()`
- ✅ `build.mjs` externalizes `@aws-sdk/client-s3` (Lambda runtime ships it)
- IAM: add `s3:PutObject` on `arn:aws:s3:::rlsir-platform-assets-us-east-1/bronze/listings/*` and `bronze/change_log/*` to the Lambda execution role
- **NEW:** After each successful bronze page write, update `_freshness.json` markers at `s3://.../bronze/listings/_freshness.json` and `bronze/change_log/_freshness.json`. Content: `{ "last_sync_at": ISO, "records_written": count, "run_id": uuid }`. Enables the dbt source freshness check.
- **NEW:** One-time export script `scripts/export-change-log.ts` — exports the full `listing_change_log` (3.4M rows) to `s3://.../bronze/change_log/full_export.parquet`. Run once before Phase 2.
- **NEW:** Modify sync Lambda to also append new change_log entries as NDJSON.gz to `bronze/change_log/sync_year=YYYY/sync_month=MM/sync_day=DD/run_id=<uuid>/changes.ndjson.gz` alongside listing writes. Eliminates the RDS network dependency from the dbt pipeline.
- Deploy modified Lambda

**Validation:**
- Per-run log includes `pages_written, bronze_bytes, bronze_records`
- After 1 sync run, confirm S3 prefix has expected files
- Sample one file via DuckDB locally: `read_json_auto('s3://...')` — verify schema and row count
- Verify `_freshness.json` updates after each write
- Verify change_log Parquet row count matches RDS: `SELECT COUNT(*) FROM listing_change_log` should match Parquet count
- DuckDB can read change_log Parquet: `SELECT COUNT(*) FROM read_parquet('s3://.../bronze/change_log/full_export.parquet')`

**Phase 1 DONE when:**
- [ ] Bronze writes are happening on every sync
- [ ] `_freshness.json` updates after each write
- [ ] Change_log exported to Parquet on S3
- [ ] Change_log incremental appends working
- [ ] 3 consecutive sync cycles with zero bronze write errors
- [ ] DuckDB can `read_json_auto` from bronze and return correct row count

**Rollback:** comment out the `writeBronzePage()` call. Postgres path untouched.

### §6.3 Phase 2 — Validate bronze parity (~7 days, ~half-day work)

**Goal:** prove bronze captures everything Postgres captures.

**Build:**
- New Lambda `rlsir-bronze-reconcile` — runs daily at 04:00 PHX
  - DuckDB query comparing yesterday's bronze rows (count + summed-row hash) to yesterday's listing_records modifications
  - Logs to CloudWatch + alerts via SNS if `row_delta > 5` OR `checksum_mismatch` for 3 consecutive days
- CloudWatch dashboard for daily reconciliation outcome

**Validation gates (must all pass before Phase 3):**
- 7 consecutive days `row_delta = 0`
- 7 consecutive days `checksum_match = true`
- No bronze write errors
- S3 storage trajectory matches projection (~$0.05/mo)

**Rollback:** disable bronze writer if it's affecting Lambda runtime budget.

### §6.4 Phase 3 — Backfill historical to bronze (~1 day work + 30-min run)

**Goal:** bronze contains the full ARMLS history (1.88 M Closed back to 2011 + 50 K Active+Pending), including the 22,914 missing 2019 records.

**Build:**
- Step Functions chain `rlsir-bronze-backfill`:
  - Reads cursor from DynamoDB (start at NULL = walk from beginning)
  - Each Lambda invocation pages Spark for ~10 minutes, writes pages to `bronze/listings/_backfill/run_id=BACKFILL_2026-04-28/...`
  - Saves new cursor; chain advances to next invocation
  - ~190 invocations cover ~1.88 M records, ~30-60 min wall time

**Validation:**
- Bronze closed count ≥ Spark API closed count probe (`SELECT $count FROM /Property?$filter=StandardStatus eq 'Closed'`)
- All 22,914 expected 2019 records present (re-run year-by-year gap probe → expect 0 gaps)
- Random sample of 100 listings: bronze content matches a fresh Spark API GET
- Year-by-year closed count from bronze vs. Spark API `$count` probe — every year delta = 0:
  | Year | Spark $count | Bronze count | Delta |
  |------|---|---|---|
  | 2011 | ? | ? | 0 expected |
  | ... | ... | ... | ... |
  | 2019 | 108,906 | 108,906 | **0** (was 22,914 missing) |
  | ... | ... | ... | ... |

**Rollback:** delete the `_backfill/` prefix; reverts cleanly. Cost ~$0.20.

### §6.5 Phase 4 — Build dbt against bronze, A/B vs MVs (~2 days)

**Goal:** new dbt marts produce outputs that match (or correctly diverge from) the existing 9 RDS materialized views.

**Build:**
- `dbt deps` — install dbt_utils, dbt_expectations
- `dbt build --target dev` — first full pipeline run against bronze + RDS attach
- **Ground truth validation via ARMLS InfoSparks** (NOT MV A/B — see below)
- dbt-bouncer convention check: `dbt-bouncer --dbt-artifacts-dir target`
- All tests green: `dbt test` (~80–100 generic tests + 5 singular tests)

#### Ground truth validation via InfoSparks

The existing 9 RDS materialized views produce incorrect results (verified: DOM=3, 140% YoY, 96% shifts — caused by thin data from incomplete sync + formatter bugs). They are **NOT valid ground truth** for A/B comparison.

Instead, validate dbt marts against ARMLS InfoSparks. Pull 7 metrics for 3 geographies × 2 time periods:

| Metric | Scottsdale | Paradise Valley | Metro (Maricopa) |
|---|---|---|---|
| Median closed price (T12mo) | InfoSparks | InfoSparks | InfoSparks |
| Active inventory (current) | | | |
| Average DOM (T12mo) | | | |
| Months of supply (current) | | | |
| Closed count (T12mo) | | | |
| New listings (T12mo) | | | |
| List-to-sale ratio (T12mo) | | | |

Run the same 7 metrics from dbt marts. Compare:
- **<3% variance on counts:** PASS (filtering differences expected — our $200K floor, property_segment filter)
- **<5% variance on medians:** PASS (methodology differences)
- **>5% variance on any metric:** INVESTIGATE — document explanation or fix

InfoSparks data pulled manually by the engineer (weekend task — requires Flexmls portal access). One-time validation, not recurring.

**Phase 4 DONE when:**
- [ ] All dbt models build without error
- [ ] All generic tests pass (~80+ tests)
- [ ] All singular tests pass (5 tests)
- [ ] dbt-bouncer passes
- [ ] InfoSparks comparison: all 21 data points within 5% variance
- [ ] Confidence bands correctly classify thin-data communities
- [ ] Property segment produces different residential vs all numbers
- [ ] Calendar spine shows 184/184 months with zero gaps

**Rollback:** local artifacts only; nothing deployed. Iterate.

### §6.5.5 Phase 4.5 — Build active analytics layer (~3 days)

**Goal:** Active inventory analytics live alongside closed analytics in the new mart Parquet layer. Pulled directly from Spark API every hour, not bronze-mediated.

**Build:**
- `infra/lambda/active-snapshot.ts` — Lambda that runs every 1 h:
  - Uses `@platform/spark` package (already battle-tested for /listings)
  - Calls `searchProperties()` with status filter B2 (Active + AUC + Pending + Coming Soon)
  - Paginates ~50 calls × $top=1000 = ~30 s wall time
  - Loads into DuckDB in-memory, writes single Parquet snapshot to `s3://.../bronze/active_snapshot.parquet`
  - Writes `_freshness.json` marker
- EventBridge `rlsir-active-snapshot-schedule` — `rate(1 hour)`
- IAM: read SecretsManager (Spark token) + write S3
- New dbt models (see §4.8 + §5.6):
  - `stg_armls__active_listings.sql` — reads snapshot
  - `int_listings_active_cleaned.sql` — validated + dimensionally enriched
  - `int_listings_status_history.sql` — derives transition timing from change_log
  - 8 mart files in `models/marts/analytics/`
- Source freshness: warn after 90 min, error after 4 h on the snapshot
- Tests: ~50 generic + 2 singular (no_active_listings_with_no_status, status_velocity_within_bounds)
- Update `_analytics__exposures.yml` so active marts are referenced by phoenix_dashboard exposures
- Methodology footer copy: dynamic note about active freshness vs closed freshness

**Validation:**
- Active count from `fct_active_inventory` matches Spark API live count within 1%
- Months-of-supply ÷ same calculation done from closed-side mart agrees
- Status-velocity median Active→Closed for last-quarter cohort agrees with `fct_market_pulse.median_dom_30d`

**Rollback:** disable EventBridge schedule. Active marts stop refreshing; mart Parquet stays at last-known-good. Browser keeps reading the stale snapshot until manual cleanup.

### §6.6 Phase 5 — Cut premium-site reads to DuckDB-WASM (~1.5 weeks)

**Goal:** premium-site pages load mart Parquet in the browser via DuckDB-WASM. All drill-downs, tab switches, filter changes, and property segment toggles execute locally. Zero network calls after initial data load.

**Build:**

1. `packages/shared/src/analytics-wasm.ts` — DuckDB-WASM wrapper:
   - Initializes DuckDB-WASM (MVP bundle, ~500KB)
   - Registers Parquet files by scope tier
   - Exposes typed query functions: `getMarketPulse(scope, segment, timeRange)`
   - Handles loading states, errors, retry
   - Schema-version check against `manifest.json` + `localStorage`-cached version; invalidate cache on version bump

2. `apps/premium-site/hooks/useAnalytics.ts` — React hook:
   - On mount: load DuckDB-WASM + fetch metro Parquet (~100KB)
   - On region view: fetch regions Parquet (~250KB, prefetched)
   - On community drill: fetch community Parquet (~100KB per region)
   - Exposes `{ data, isLoading, scope, setScope, segment, setSegment }`
   - Caches loaded Parquet in DuckDB-WASM (no re-download on back-navigation)

3. `packages/database/src/queries/analytics-adapter.ts` — feature-flagged:
   - `ANALYTICS_SOURCE=wasm` → DuckDB-WASM path (new)
   - `ANALYTICS_SOURCE=rds`  → legacy Postgres path (rollback)

4. `apps/premium-site/components/analytics/ParquetLoader.tsx`:
   - Visual loading indicator per scope tier
   - "Loading metro data..." → "Loading North Scottsdale..."
   - Skeleton states matching the chart layouts

5. `apps/premium-site/components/analytics/MethodologyFooter.tsx` — collapsible ⓘ footer (see §5.4)

6. `apps/premium-site/components/analytics/PropertySegmentToggle.tsx` — `[ Residential ]  [ Land ]  [ All ]` segmented control. Default Residential. URL state: `?segment=residential` (default omittable)

7. `apps/premium-site/components/search/SearchModeTabs.tsx` — `[ Buy ]  [ Rent ]  [ Land ]` tabs (see §5.5)

8. Browser prefetch strategy:
   - After metro loads: `<link rel="prefetch">` for `regions/scorecards.parquet`
   - After user hovers on a region card: prefetch that region's community Parquet
   - Use `requestIdleCallback` for non-critical prefetches

9. `infra/lambda/armls-analytics-prerender.ts` — pre-renders hero KPI JSON:
   - Reads from `fct_market_pulse` + `fct_community_scorecard`
   - Writes `hero_kpis.json` to `s3://.../analytics/prerendered/`
   - CloudFront caches with 5-min TTL
   - Next.js SSR reads this JSON for first paint + SEO
   - Runs after every dbt build

10. `infra/lambda/armls-analytics-split.ts` — splits mart Parquet by scope tier:
    - Reads full mart Parquet files
    - Splits into `metro/`, `regions/`, `communities/{region}/` structure
    - Writes to S3 with Cache-Control headers (per §4.7 table)
    - Computes new `manifest.json` with `schema_version` (incremented if columns changed)
    - Invalidates CloudFront cache on `analytics/*` prefix
    - Runs after every dbt build, before pre-render

11. `infra/lambda/armls-analytics-query.ts` — DuckDB Lambda (RETAINED but reduced scope):
    - Only serves queries too large for browser:
      - `fct_closings` comp finder (500K rows)
      - Heatmap H3 aggregation
      - Full-history custom date range queries
    - NOT used for standard drill-downs, tab switches, or filter changes

12. **DuckDB-WASM self-hosting** — copy `duckdb-mvp.wasm` and `duckdb-worker.js` to S3 analytics bucket. Serve via CloudFront. Browser loads WASM from our CDN, not jsDelivr/unpkg. **Pin to a release that wraps DuckDB ≥1.3** in `package.json`: `"@duckdb/duckdb-wasm": "^1.28.0"` (which wraps DuckDB 1.3+, providing 3–10× faster reads on queries with `LIMIT` via lazy column fetching). Validate at install: `node -e "require('@duckdb/duckdb-wasm/package.json').version"` should print ≥1.28.

13. **`parquet_metadata()` preview pattern** — before downloading a Parquet, peek at its schema + row counts via `parquet_metadata()`. Saves bandwidth on mobile when the user only views the metro hero (regions Parquet stays unfetched). Pattern in `analytics-wasm.ts`:
    ```ts
    // Don't download communities/{region}/market_pulse.parquet until we know it's worth it
    const meta = await db.query(`SELECT row_count, num_columns FROM parquet_metadata('${url}')`);
    if (meta[0].row_count > 0) {
      // OK, fetch the actual data
      await db.registerFile(url);
    }
    ```

13. CloudFront distribution config (per §4.7 cache table):
    - CORS headers for DuckDB-WASM cross-origin Parquet reads
    - Versioned hashed filenames for WASM binaries (immutable, 1-year cache)

**Page-by-page rollout (24h soak each):**
1. `/phoenix` (highest traffic — flip flag, monitor)
2. `/phoenix/[region]/[community]`
3. `/market`, `/market/community/[slug]`, `/market/zip/[code]`
4. `/listings/[slug]` "Local market" sidebar
5. Internal `/platform/reports`

**Validation per page:**
- Lighthouse score unchanged or better (total download <700KB for metro view)
- p95 SSR latency unchanged (Vercel Analytics)
- Manual visual diff vs RDS-backed page
- Zero console errors for 24 h
- DuckDB-WASM initialization <2s on 3G throttled connection
- Tab switch latency <10ms (local query, no network)
- Region drill-down latency <50ms (Parquet fetch if not prefetched + local query)

**Rollback:** flip `ANALYTICS_SOURCE=rds`; Vercel hot-reloads; instant.

### §6.7 Phase 6 — Decommission listing_records, shrink RDS (~1 day work, 14-day soak)

**Goal:** RDS holds only what it must. Mirror gone, instance is t3.micro.

**Build:**
- Sync Lambda single-write mode (stop writing to listing_records; keep change_log + geography)
- Migration `033_drop_listing_records.sql` — drops table after 14-day verification
- AWS RDS modify: `aws rds modify-db-instance --db-instance-class db.t3.micro --apply-immediately`
- Migrate skiptoken state from RDS `listing_sync_state` to DynamoDB
- Update CLAUDE.md to reflect new architecture

**Validation gates:**
- `grep -r listing_records` across the repo returns 0 matches
- CloudWatch RDS Performance Insights: 0 queries on listing_records for 14 days
- Bronze pipeline running cleanly for 14 days
- 0 reconciliation alarms in 14 days

**Rollback:** RDS snapshot taken pre-drop; 30-day retention. Restore if needed.

### §6.8 Phase 7 — Steady-state ops (forever)

**Goal:** the new system is boring and reliable.

**Build:**
- CloudWatch alarms wired to SNS `rlsir-data-pipeline-alerts`
- Yearly compaction job — rolls per-page NDJSON.gz into per-month Parquet (optional, when bronze grows >5 GB)
- Quarterly dbt-bouncer audit
- Annual cost review

---

## §7 Cost analysis

### §7.1 Itemized monthly cost

| Component | Today | During migration | After Phase 6 | Notes |
|---|---|---|---|---|
| RDS db.t3.medium 50 GB | $66 | $66 | — | Phased out |
| RDS db.t3.micro 50 GB | — | — | **$20** | $15 instance + $5 storage |
| Lambda (sync, modified) | $0 | $0.50 | $1 | Reconcile + bronze write |
| Lambda (dbt run + split + prerender) | — | — | $2 | Every 4 h |
| Lambda (DuckDB analytics — reduced) | — | — | $0.50 | Rare: comp finder, heatmap only |
| Lambda (bronze backfill) | — | $1 (one-time) | — | One-shot |
| S3 storage | $0 | $0.20 | $1.50 | Bronze + marts + split Parquet |
| S3 GETs (browser Parquet reads) | $0 | $0 | $0.50 | Via CloudFront, cached |
| CloudFront | $0 | $0 | $1 | Parquet + JSON + cache invalidation |
| CloudWatch | $0.30 | $0.50 | $0.50 | 30-day log retention |
| DynamoDB | — | — | $0 | PAY_PER_REQUEST |
| DuckDB Lambda provisioned concurrency | — | — | $0 | Not needed — browser handles 95%+ |
| **Total** | **$66.30** | **$67.50** | **$27.00** | |

**Annual savings: $474** ($66.30 × 12 = $796 → $26.80 × 12 = $322).

### §7.2 What we trade for

- One-time engineering: ~9 days @ market rate
- Operational complexity (slightly higher — bronze + dbt + DuckDB Lambdas are new components)
- New observability needs (covered by §11)

### §7.3 Break-even

At a $150/hour engineering rate, ~9 days = $10,800 one-time. Annual savings $474. Pure dollar break-even: **~23 years**.

But the real ROI isn't dollars — it's:
- 1000× faster analytics queries
- Recovered 22,914 historical records
- 3 entirely new analytic categories (price reduction, buyer-side, community amenity)
- Foundation for any future analytic at micro-cost
- Eliminated RDS-bloat operational burden

---

## §8 Best practices applied (with sources)

### §8.1 Architecture

| Practice | Source | How we apply |
|---|---|---|
| Strangler-fig pattern with parallel run | [AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html) | Dual-write through Phase 5; legacy stays as-is until 14-day soak in Phase 6 |
| Bronze/Silver/Gold (Medallion) | [Microsoft Fabric Lakehouse Architecture](https://learn.microsoft.com/en-us/fabric/onelake/onelake-medallion-lakehouse-architecture) | Bronze append-only, silver validates, gold business-shaped |
| Append-only immutable bronze | [Bronze Layer Best Practices](https://medium.com/@kishanraj41/bronze-layer-data-modeling-best-practices-8acebd540754) | Each Spark response is one immutable file |
| Ingestion-time partitioning for bronze | [Microsoft Data Lake Zones](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/scenarios/cloud-scale-analytics/best-practices/data-lake-zones) | Hive partition by `sync_year/sync_month/sync_day/run_id` |
| Event-time partitioning for marts | Same | `fct_closings` partitioned by `close_year` |
| Big-bang vs. progressive | [AppsTek Progressive Modernization](https://appstekcorp.com/blog/progressive-modernization-enterprise-transformation/) | Phase-by-phase with explicit gates |

### §8.4 Statistics and segmentation (added)

| Practice | Source | How we apply |
|---|---|---|
| Confidence-banded metrics | Statistical reporting standards | Every mart row carries `sample_size` + `confidence` enum; UI degrades gracefully (dim/asterisk/hide) for very_low/none. Prevents misleading statistics from thin data. |
| Property type segmentation | MLS analytics industry standard | Land, commercial, lease listings separated from residential. Default residential. Prevents "Cave Creek median shifts $495K when removing land." |

### §8.2 dbt

| Practice | Source | How we apply |
|---|---|---|
| Three-layer staging/intermediate/marts | [dbt Developer Hub — Project Structure](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview) | Exactly mapped in `analytics/models/` |
| Naming: `stg_<source>__<table>`, `int_<entity>_<verb>`, `fct_/dim_` | [dbt Style Guide](https://docs.getdbt.com/best-practices/how-we-style/6-how-we-style-conclusion) | All models follow |
| View staging, table intermediate, external Parquet marts | [DuckDB configurations dbt docs](https://docs.getdbt.com/reference/resource-configs/duckdb-configs) | `dbt_project.yml` defaults |
| Plural noun facts (`fct_closings` not `fct_closing`) | dbt convention | `fct_closings` |
| Source freshness checks | [dbt Sources doc](https://docs.getdbt.com/docs/build/sources) | 2 h warn / 8 h error on bronze |
| Generic + singular tests + unit tests | [dbt Test best practices](https://docs.getdbt.com/docs/build/data-tests) | All three tiers in `tests/` and yml files |
| Exposures document downstream consumers | [dbt Exposures](https://docs.getdbt.com/docs/build/exposures) | `_analytics__exposures.yml` lists every page |
| Slim CI with `--defer --state` | [dbt CI Docs](https://docs.getdbt.com/docs/deploy/ci-jobs) | Phase 5+ for fast PR builds |
| dbt-bouncer convention enforcement | [dbt-bouncer GitHub](https://github.com/godatadriven/dbt-bouncer) | `.dbtbouncer.yml` checks naming, materialization, test coverage. Explicit rules: staging materialization must be `table` (not view); intermediate must be `incremental` or `table`; marts must be `external` or `table`; every model has description; every model has ≥2 tests; every source has freshness; mart columns documented. Run after every `dbt build`; quarterly manual audit. |
| Microbatch incremental for time-partitioned tables | [dbt Incremental Microbatch](https://docs.getdbt.com/docs/build/incremental-microbatch) | `int_listings_closed_cleaned` 90-day rebuild window |

### §8.3 Migration

| Practice | Source | How we apply |
|---|---|---|
| Parallel run testing | [Quinnox Migration Validation](https://www.quinnox.com/blogs/data-migration-validation-best-practices/) | Phase 2 parallel run for 7 days |
| Row-count + content-checksum reconciliation | [Datagaps Reconciliation Practices](https://www.datagaps.com/blog/data-reconciliation-best-practices/) | DuckDB `HASH()` summed-over-rows for 64-bit checksum |
| Feature-flag cutover | [AppsTek Progressive Modernization](https://appstekcorp.com/blog/progressive-modernization-enterprise-transformation/) | `ANALYTICS_SOURCE` env var per page |
| Snapshot-before-drop | Standard | RDS final snapshot, 30-day retention |

---

## §9 Risk register

| Risk | Phase | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Bronze write fails silently | 1 | low | high | Reconciliation Lambda alerts on `row_delta > 5` for 3 days |
| Lambda timeout from extra S3 PUTs | 1 | low | medium | Bronze write is ~50ms; budget margin still 60s |
| Bundle size grows past Lambda 250 MB | 1 | low | medium | NDJSON.gz needs no new deps; stays under |
| Dual-write anti-pattern (Postgres or S3 fails alone) | 1 | medium | low | S3 is fire-and-forget; failures logged but don't break Postgres path |
| 7-day window misses a corner case | 2 | low | medium | Extend observation if any anomaly. No deadline pressure. |
| Backfill chain breaks midway | 3 | medium | low | Each Step Function node idempotent on run_id; failed nodes retried |
| dbt model output diverges from MV | 4 | medium | medium | A/B reconciliation catches it; expected drift documented |
| Premium-site page regression after cutover | 5 | medium | medium | Feature flag → instant rollback; 24-h soak; visual diff |
| RDS shrink causes connection blip | 6 | low | medium | Run in maintenance window; ~60s of dropped connections |
| Hidden code path still hits listing_records | 6 | medium | high | Grep audit + 14-day soak before drop |
| Spark API rate limit during backfill | 3 | low | medium | Throttle to ~20 calls/min |
| ARMLS adds new RESO field mid-migration | any | low | low | Bronze captures everything (NDJSON schema-flexible); silver gets explicit add |
| S3 bucket accidentally deleted | any | very low | catastrophic | S3 versioning + bucket policy denying delete; cross-region replication for bronze |
| AWS account compromise | any | very low | catastrophic | MFA, IAM least-privilege, CloudTrail, separate environments |
| DuckDB-WASM initialization >3s on slow connections | 5 | medium | low | MVP bundle is 500KB; SSR provides hero KPIs immediately; WASM loads in background. User sees content before WASM initializes. Degrade gracefully: show static SSR content until WASM ready. |
| Browser doesn't support WASM (very old devices) | 5 | very low | medium | Feature-detect WASM support. Fallback: DuckDB Lambda serves the same queries via API route. ~0.5% of browsers. |
| Parquet file cached at CDN but data is stale after dbt rebuild | 5 | medium | low | CloudFront invalidation runs after every split. Browser also checks `manifest.json` version; if stale, re-fetches. |
| InfoSparks ground truth unavailable (no Flexmls access) | 4 | low | medium | Cromford Report or Redfin public data as secondary benchmarks. Less precise but directionally valid. |
| Browser memory pressure from DuckDB-WASM + Parquet on low-end devices | 5 | low | low | Total in-memory footprint ~5-10MB. Modern phones have 4GB+. Monitor via Performance API; if memory warning, disable prefetch and load on-demand only. |

---

## §10 Gaps I previously missed

The earlier strategy docs covered architecture and migration. These are the operational and governance items that didn't get explicit coverage:

### §10.1 Security and compliance

- **S3 bucket policy** — explicitly deny `s3:DeleteObject` on `bronze/*` to anyone except a break-glass IAM role; deny public reads
- **S3 server-side encryption** — SSE-S3 (free) or SSE-KMS (~$1/mo for the key)
- **S3 versioning + MFA delete** on the bronze prefix — protect against accidental deletion
- **Cross-region replication** for bronze (us-east-1 → us-west-2) — disaster recovery; ~$0.50/mo for 1.8 GB at $0.02/GB transfer + $0.04/GB storage
- **VPC endpoints** for S3 + Secrets Manager — Lambda traffic stays in the AWS network, doesn't egress to public internet
- **IDX compliance** — bronze contains `PrivateRemarks`, `ShowingInstructions` — must be filtered out at silver before any public-facing surface reads. Already in compliance middleware in `@platform/spark`; replicate the strip in `int_listings_closed_cleaned`.
- **PII in `public_remarks`** — agents sometimes put homeowner names in remarks. Should we add a regex-redact pass? **Decision needed.**
- **ARMLS license review** — bronze stores raw API responses indefinitely. License likely permits this for internal analytics; verify with the brokerage's IDX agreement.

### §10.2 Disaster recovery

- **Point-in-time recovery** — for the RDS micro instance, enable RDS automated backups (default 7 days, free)
- **Bronze recovery** — append-only + S3 versioning means the only catastrophic loss is an entire bucket delete. Cross-region replication mitigates this.
- **Mart recovery** — marts are derived; rebuilding from bronze + change_log takes ~30 s (full dbt run). No backup needed.
- **Restore drill** — quarterly: simulate RDS restore from snapshot to ensure the runbook works
- **Rollback drills** — test the Phase 5 `ANALYTICS_SOURCE=rds` flip in a maintenance window before production cutover

### §10.3 Observability beyond CloudWatch alarms

- **Custom dashboard** at `/platform/admin/data-health` (broker-only) — shows last sync time, last dbt run, bronze size, gold size, reconciliation status. Self-service for the team.
- **Per-mart freshness** — every mart shows "Data through {timestamp}, N closings analyzed" in the dashboard footer
- **Dead-letter logging** — failed bronze writes go to `s3://.../bronze/_dead_letter/` for manual review
- **Cost dashboard** — AWS Cost Explorer tagged by `Project=rlsir-analytics`; weekly Slack/email digest

### §10.4 Testing strategy gaps

- **Unit tests for the sync Lambda** — currently relies on smoke tests. Add Vitest tests with mocked Spark responses for the bronze writer + paginator + UPSERT logic.
- **Unit tests for dbt models** — dbt 1.8+ unit tests with seed fixtures. Add for: `int_listings_closed_cleaned` (cleaning rules), `int_listings_price_history` (change-log derivation), `fct_negotiation` (close_to_original calculation).
- **End-to-end test** — Playwright test that hits `/phoenix` with `ANALYTICS_SOURCE=parquet`, verifies hero KPIs render and match a known fixture.
- **Load test** — 100 concurrent dbt Lambda invocations, confirm cost stays under projection.

### §10.5 CI/CD gaps

- **GitHub Actions workflow for the analytics workspace** — separate `ci-analytics.yml` that runs on PRs touching `analytics/**`:
  - `dbt deps`
  - `dbt parse` (validate without running)
  - `dbt-bouncer` for convention check
  - `dbt build --target ci --select state:modified+ --defer --state ./prod-manifest`
  - Slack notification on failure
- **Production manifest publishing** — after every successful prod dbt run, upload `target/manifest.json` to `s3://.../dbt-state/prod/manifest.json`. CI pulls this for `--defer`.
- **Migration deployment gate** — `033_drop_listing_records.sql` requires manual approval in CI before applying

### §10.6 Documentation gaps

- **Runbook** for common ops scenarios (covered partially in `analytics/README.md`):
  - Sync Lambda is failing — how to debug
  - Bronze reconciliation alarm fires — what to check
  - dbt run fails — rollback to previous manifest
  - Page is showing wrong numbers — feature-flag rollback
- **ADR document** — `docs/DECISIONS.md` ADR for "Why bronze NDJSON.gz over Parquet for v1"
- **Onboarding guide** for new engineers — 1-page "everything you need to know about this stack"

### §10.7 Multi-tenant readiness

The `template-site` app is intended for multi-tenant white-label deployments. Today's analytics is single-tenant (Yong Choi). Future requirements:

- **Tenant scoping** — every mart row should carry a `tenant_id` (defaults to `'00000000-0000-0000-0000-000000000001'`/Russ Lyon)
- **Bronze partitioning by tenant** when multiple are active — for cost attribution
- **Dashboard branding** — tenant-specific color/logo per agent (already supported by CSS custom property pattern)

Decision: **defer to a separate epic** when the second tenant onboards. Not blocking.

### §10.8 Schema evolution

- ARMLS occasionally adds new RESO fields; bronze captures them automatically (NDJSON is schema-flexible)
- Silver has explicit typed schema in `stg_armls__listing_records.sql` — adding a column requires a code change + dbt rebuild
- Process: monthly review of `bronze.listings_observations` columns vs. silver columns; new fields with >50% population get added to silver in the next sprint
- **Schema registry** — not needed at our scale; revisit if we hit >10 sources

### §10.9 Photo backfill pipeline

`syncPhotos()` in the existing Lambda pulls listing photos via `Property('key')/Media` per listing. This stays as-is on RDS for v1. Photos aren't analytics data; don't try to bronze them.

Future: if photo URLs need analytics (e.g., "do listings with >20 photos sell faster?"), a separate `bronze/photos/` prefix can be added; out of scope for this plan.

### §10.10 Geographic boundaries upkeep

`geographic_boundaries` (80 PostGIS polygons) is currently static. If new communities are added or boundaries change:

- Manual SQL update on RDS by an engineer
- Trigger re-run of the geography classification Lambda to update `listing_geography`
- Trigger dbt rebuild to refresh `dim_communities` + community-scoped marts

This is fine at our cadence (~once per year). Document in `analytics/README.md`.

### §10.11 The /lex project (separate)

`/lex` is a standalone tool for a Russ Lyon colleague (per CLAUDE.md). Shares no infrastructure with this analytics stack. **Out of scope.**

### §10.12 Time zone handling

- Bronze sync timestamps in UTC
- Silver: `close_date` stays as-is (DATE type, no TZ)
- Gold: monthly aggregations use UTC month boundaries
- Dashboard displays use Phoenix time (`America/Phoenix`, `MST` no-DST)
- Edge case: a Spark API record at 11:50 PM MST closes on day N PHX but day N+1 UTC. Silver uses Spark's `CloseDate` (a date, not timestamp), so this is fine — but worth a unit test.

### §10.15 Geographic enrichment after Phase 6

After `listing_records` is dropped, new listings arriving via bronze need geographic classification (`community_slug`, `region_slug`). Currently this uses PostGIS `ST_Contains` against `geographic_boundaries` on RDS.

Options:
- **A. Keep geocoding as a lightweight RDS function** — PostGIS stays on micro, receives lat/long pairs from the dbt pipeline, returns community/region slug. ~5 ms per listing. dbt staging model calls a Postgres function via the postgres extension.
- **B. Pre-compute an H3 hex → community lookup table** — each H3 hex (resolution 9, ~175 m) maps to exactly one community. DuckDB does a simple JOIN instead of PostGIS `ST_Contains`. Lookup table ~50 KB Parquet.
- **C. DuckDB spatial extension** — experimental, less mature than PostGIS.

**Decision: Option A for v1** (proven, minimal effort). Option B as an optimization if geocoding becomes a bottleneck. Option C is premature.

### §10.16 Photos after listing_records drops

Listing detail pages display `photo_urls`. After Phase 6, `listing_records` is gone. Bronze stores the full Spark response including `MediaURL` fields, but scanning bronze NDJSON for a single listing's photos is expensive.

**Decision:** `listing_photos` table stays on RDS (157K rows, ~20 MB). It's populated by the existing `syncPhotos()` Lambda function and is independent of `listing_records`. No change needed. If `photo_urls` are needed in analytics (e.g., "do listings with >20 photos sell faster?"), add `photos_count` to silver from bronze.

### §10.17 Status transition history

Bronze captures observations at random intervals. For analytics requiring status transition history (days to pending, back-on-market count), the observation stream needs replay logic.

**Decision:** `listing_change_log` already tracks status transitions with timestamps. Since change_log is bronzed (§4.1), `int_listings_price_history` can be extended to an `int_listings_status_history` model that derives `days_to_first_pending`, `went_back_on_market`, `back_on_market_count`, `total_days_pending`. Add as a Phase 4 stretch goal, not blocking.

### §10.18 Historical active inventory for absorption

Computing "how many listings were Active on March 31, 2025" requires replaying the observation stream.

**Decision:** Approximate. Monthly active inventory ≈ prior-month inventory + new_listings − closed − expired − withdrawn. The calendar-spined `fct_market_pulse` already has monthly new_listings and closed_count. Cumulative sum gives a reasonable active inventory estimate. Not perfect but sufficient for months-of-supply.

For *current-month* active inventory, count from the latest bronze snapshot directly (exact, not estimated).

### §10.19 Methodology footer

See §5.4. Required UI element on every analytics page.

### §10.20 Search page Buy/Rent/Land tabs

See §5.5. Powered by `@platform/spark` API (unchanged search infrastructure).

### §10.13 Data retention

- **Bronze**: indefinite (cheap, append-only, the source of truth)
- **Silver / gold**: rebuilt every cycle, no retention concern
- **Quarantine**: 90-day retention via S3 lifecycle policy
- **CloudWatch logs**: 30-day retention (already configured)
- **RDS automated backups**: 7-day default

### §10.14 Performance regression detection

- **Lighthouse CI** on premium-site PR builds — detect regression in page load times
- **dbt run timing** — log per-model build time; alert if any model takes >2× its rolling p95
- **DuckDB query timing** — log query duration in the analytics Lambda; alert on p99 > 2 s

---

## §11 Operational runbook

### §11.0 Alarms

CloudWatch alarms wired to SNS `rlsir-data-pipeline-alerts`:

| Alarm | Metric | Threshold | Action |
|---|---|---|---|
| sync-stale | `bronze/listings/_freshness.json` age | >6 h warn, >12 h critical | SNS → email |
| dbt-build-failed | dbt Lambda exit code | ≠ 0 | SNS → email |
| dbt-build-slow | dbt Lambda duration | >10 min | SNS → email |
| query-lambda-slow | DuckDB Lambda p99 latency | >5 s | CloudWatch dashboard |
| query-lambda-errors | DuckDB Lambda error rate | >1% | SNS → email |
| s3-cost-spike | S3 daily cost | >$1/day | SNS → email (budget alert) |
| rds-cpu | RDS CPU utilization | >80% sustained 15 min | SNS → email |
| rds-connections | RDS active connections | >4 of 5 pool | SNS → email |
| reconciliation-drift | Daily row delta | >5 for 3 consecutive days | SNS → email |

### §11.1 Daily ops

**Automated (no human action):**
- 4-hourly sync Lambda invocation → bronze write + Postgres dual-write + dbt build
- Daily reconciliation Lambda at 04:00 PHX
- Source freshness checks
- Dashboard pre-render to JSON

**Weekly:**
- Review CloudWatch alarms history (5 min)
- Check `/platform/admin/data-health` page (5 min)
- Review S3 cost in AWS Cost Explorer (5 min)

**Monthly:**
- dbt-bouncer audit (10 min)
- Schema diff: bronze columns vs. silver columns (15 min)
- Cost review against projection (5 min)

**Quarterly:**
- Restore drill (RDS snapshot restore to staging) (1 h)
- Rollback drill (`ANALYTICS_SOURCE=rds` flip in maintenance window) (15 min)

**Annually:**
- Full review: this comprehensive plan (1 day)
- Bronze compaction job if storage > 5 GB
- ARMLS license review

### §11.2 Incident response

| Symptom | Triage | Likely cause | Fix |
|---|---|---|---|
| `/phoenix` showing wrong numbers | Check `gold_built_at` in mart; check dbt run log | dbt run failed; manifest.json points at stale build | Roll back manifest; rerun dbt |
| `/phoenix` 500 errors | Check DuckDB Lambda CloudWatch | S3 read error or query timeout | Flip `ANALYTICS_SOURCE=rds` to fall back; investigate |
| Source freshness alarm | Check sync Lambda CloudWatch | EventBridge disabled, Spark API down, or Lambda crash | Re-enable EventBridge; check Spark API status |
| Reconciliation alarm | Check daily reconcile Lambda log | Schema drift between bronze and Postgres | Investigate the offending field; usually new RESO field |
| Calendar gap test fails | Check most recent dbt run + silver reject log | Source data quality issue | Diagnose silver rejects; may be a transient ARMLS issue |
| Dashboard shows skeleton indefinitely | Browser console for WASM errors | DuckDB-WASM failed to load or Parquet fetch failed | Check CloudFront distribution; verify S3 objects exist; check CORS headers |
| Tab switch takes >1 s | Check if Parquet is loading instead of querying local | Parquet not prefetched, or WASM not initialized | Check prefetch logic; may need to increase prefetch aggressiveness |
| "Insufficient data" showing on known-active community | Check confidence band calculation | Community below 5-closing threshold or property_segment filter too narrow | Verify `fct_community_scorecard` has rows; check threshold |

### §11.4 Full refresh

`dbt build --full-refresh` reprocesses all data from scratch, ignoring incremental high-water marks. Safe, idempotent, ~5–10 min.

**When to run:**
- After any schema change (new column added to silver or mart)
- After bronze compaction (underlying files changed)
- After fixing a bug in cleaning rules (need to reprocess historical data)
- Monthly as a hygiene step
- Whenever you're unsure if incremental state is correct

**How to run:**
```bash
# Local
cd real-estate-platform/analytics
DBT_PROFILES_DIR=. dbt build --full-refresh --target dev

# Production
aws lambda invoke --function-name rlsir-dbt-run \
  --payload '{"full_refresh": true}' /tmp/out.json
```

**What it does:**
- Drops and recreates all intermediate tables
- Re-reads all bronze files (full scan)
- Rebuilds all marts from scratch
- Re-splits Parquet by scope tier
- Re-generates pre-rendered JSON
- Invalidates CloudFront cache

**What it does NOT do:**
- Does not affect bronze (append-only, never modified)
- Does not affect RDS app data
- Does not require downtime — old Parquet serves until new is written

### §11.5 Bronze compaction

**Cadence:** Monthly, automated via EventBridge cron (the 2nd of each month).

**What:** Merges the previous month's per-page NDJSON.gz files into a single deduplicated Parquet file per month. Old NDJSON.gz files are retained (append-only) but the Parquet is what staging reads.

```
s3://rlsir-platform-assets-us-east-1/bronze/listings/
├── compacted/
│   ├── 2026-01.parquet   # deduped, one row per listing_key
│   ├── 2026-02.parquet
│   └── 2026-03.parquet
├── sync_year=2026/sync_month=04/   # current month, not yet compacted
│   └── ... (NDJSON.gz files, ~6 per day)
└── _backfill/...
```

**Implementation:** Lambda triggered by EventBridge on the 2nd of each month. Reads prior month's NDJSON.gz, deduplicates by `listing_key + ModificationTimestamp`, writes single Parquet. ~30 s for a month of data.

Staging SQL reads compacted + current month, then dedups across both with the same window function.

### §11.3 Common manual operations

```bash
# Run dbt locally against dev (reads RDS for change_log, S3 for bronze)
cd real-estate-platform/analytics
DBT_PROFILES_DIR=. dbt build --target dev

# Inspect a specific bronze run
aws s3 ls s3://rlsir-platform-assets-us-east-1/bronze/listings/sync_year=2026/sync_month=04/sync_day=28/

# Trigger a manual dbt build in production
aws lambda invoke --function-name rlsir-dbt-run --payload '{}' /tmp/out.json

# Force a feature-flag rollback for /phoenix
vercel env update ANALYTICS_SOURCE rds production
vercel deploy --prod  # or wait for hot reload

# Check source freshness
DBT_PROFILES_DIR=. dbt source freshness --target prod
```

---

## §12 Appendix — Scaffolding inventory

### §12.1 Files already created

```
real-estate-platform/
├── analytics/                                          (NEW dbt project)
│   ├── dbt_project.yml
│   ├── profiles.yml.example
│   ├── packages.yml
│   ├── .dbtbouncer.yml
│   ├── .gitignore
│   ├── README.md
│   ├── macros/
│   │   └── calendar_spine.sql
│   ├── models/
│   │   ├── staging/armls/
│   │   │   ├── _armls__sources.yml
│   │   │   ├── _armls__models.yml
│   │   │   ├── stg_armls__listing_records.sql
│   │   │   ├── stg_armls__listing_change_log.sql
│   │   │   └── stg_armls__listing_geography.sql
│   │   ├── intermediate/_calendar/
│   │   │   ├── int_calendar.sql
│   │   │   └── _calendar__models.yml
│   │   ├── intermediate/listings/
│   │   │   ├── int_listings_closed_cleaned.sql
│   │   │   ├── int_listings_price_history.sql
│   │   │   ├── int_listings_geographic_enriched.sql
│   │   │   └── _int_listings__models.yml
│   │   └── marts/analytics/
│   │       ├── dim_calendar.sql
│   │       ├── dim_communities.sql
│   │       ├── fct_closings.sql
│   │       ├── fct_market_pulse.sql
│   │       ├── fct_negotiation.sql
│   │       ├── fct_community_scorecard.sql
│   │       ├── fct_community_yoy.sql
│   │       ├── fct_pricereduction.sql
│   │       ├── fct_buyer_office.sql
│   │       ├── _analytics__models.yml
│   │       └── _analytics__exposures.yml
│   └── tests/
│       ├── no_calendar_gaps.sql
│       ├── percentile_ordering.sql
│       ├── sale_to_list_within_bounds.sql
│       ├── reject_rate_below_1pct.sql
│       └── monthly_volume_sanity.sql
├── infra/lambda/
│   └── bronze-writer.ts                                (NEW — bronze NDJSON.gz writer)
└── docs/
    ├── analytics-architecture-decision.md              (historical)
    ├── closed-listings-etl-strategy.md                 (historical)
    ├── bronze-migration-build-path.md                  (historical)
    └── analytics-comprehensive-plan.md                 (THIS DOC — master)
```

### §12.2 Files still to create

**Phase 1:**
- ✅ Modifications to `infra/lambda/armls-sync-bundle.ts` — add `writeBronzePage()` + `writeBronzeChanges()` calls (listings done; change_log to add)
- One-time script: `scripts/export-change-log.ts` — exports `listing_change_log` to Parquet on S3

**Phase 2:**
- `infra/lambda/bronze-reconcile.ts` — daily reconciliation Lambda

**Phase 3:**
- `scripts/backfill-bronze.ts` + Step Functions definition

**Phase 5:**
- `packages/shared/src/analytics-wasm.ts` — DuckDB-WASM wrapper + typed query functions
- `apps/premium-site/hooks/useAnalytics.ts` — React hook for lazy Parquet loading
- `apps/premium-site/components/analytics/ParquetLoader.tsx` — loading states per scope tier
- `apps/premium-site/components/analytics/MethodologyFooter.tsx` — collapsible ⓘ footer
- `apps/premium-site/components/analytics/PropertySegmentToggle.tsx` — Residential / Land / All
- `apps/premium-site/components/search/SearchModeTabs.tsx` — Buy / Rent / Land tabs
- `packages/database/src/queries/analytics-adapter.ts` — feature-flagged read path
- `infra/lambda/armls-analytics-query.ts` — DuckDB Lambda (reduced scope: comp finder + heatmap only)
- `infra/lambda/armls-analytics-prerender.ts` — pre-renders hero KPIs to JSON
- `infra/lambda/armls-analytics-split.ts` — splits mart Parquet by scope tier

**Phase 6:**
- `packages/database/migrations/rds/033_drop_listing_records.sql`

### §12.3 IAM additions needed

- Sync Lambda execution role: add `s3:PutObject` on `arn:aws:s3:::rlsir-platform-assets-us-east-1/bronze/listings/*`
- New `rlsir-bronze-reconcile` Lambda role: add `s3:GetObject`, `s3:ListBucket`
- New `rlsir-bronze-backfill` Lambda role: same as sync Lambda + DynamoDB read/write on cursor table
- New `rlsir-dbt-run` Lambda role: `s3:PutObject` on `analytics/*`, `s3:GetObject` on `bronze/*`, RDS connect
- New `rlsir-analytics-query` Lambda role: `s3:GetObject` on `analytics/*`

### §12.4a Engineering effort summary (revised)

| Phase | Original | With amendments | Delta | Reason |
|---|---|---|---|---|
| Phase 1 | 2 days | 2.5 days | +0.5 | Bronze change_log + `_freshness.json` |
| Phase 2 | 0.5 days | 0.5 days | 0 | Unchanged |
| Phase 3 | 1 day | 1 day | 0 | Unchanged |
| Phase 4 | 2 days | 3 days | +1 | InfoSparks validation + property_segment + confidence bands + ~80 generic tests + surrogate keys + grain docs + compaction |
| Phase 5 | 1 week | 1.5 weeks | +0.5 wk | DuckDB-WASM + lazy loading + split pipeline + schema versioning + version pinning + methodology footer + exposures |
| Phase 6 | 1 day | 1 day | 0 | Unchanged |
| **Total** | **~9 days** | **~12 days** | **+3 days** | |

Calendar timeline: ~5 weeks → **~7 weeks** due to additional Phase 4 test writing and Phase 5 DuckDB-WASM validation across device types.

### §12.4 EventBridge schedules to add or modify

| Schedule | Cadence | Target | Status |
|---|---|---|---|
| `rlsir-armls-sync-schedule` | rate(4 h) | sync Lambda (modified) | exists, modify |
| `rlsir-sync-active-schedule` | rate(1 h) | sync Lambda actives | exists, modify |
| `rlsir-bronze-reconcile-schedule` | cron(0 11 * * ? *) (04:00 PHX) | reconcile Lambda | NEW |
| `rlsir-dbt-run-schedule` | rate(4 h) | dbt run Lambda | NEW (replaces MV refresh) |
| `rlsir-mv-refresh-schedule` | (any) | MV refresh | DEPRECATED — remove in Phase 6 |
| `rlsir-bronze-compact-schedule` | cron(0 7 2 * ? *) (2nd of month, 00:00 PHX) | bronze compaction Lambda | NEW |
| `rlsir-analytics-split-schedule` | (post-dbt-run trigger, not EventBridge) | split mart Parquet by scope | NEW |

### §12.5 Source-of-truth document hierarchy

When information conflicts between docs, this is the order of precedence:

1. `analytics-comprehensive-plan.md` (THIS DOC) — master
2. `analytics/README.md` — operator runbook (always current)
3. `analytics/dbt_project.yml` — config truth
4. `analytics/models/**/_*.yml` — schema and test truth
5. Earlier strategy docs — historical, do not edit

---

*End of plan.*
