# Closed Listings ETL Strategy — Bronze Parquet + Staging/Intermediate/Marts

**Date:** 2026-04-28 (updated)
**Status:** Scaffolded — see `real-estate-platform/analytics/`
**Scope:** All closed listings, Phoenix metro (Maricopa), 2011-01 → present
**Companion docs:**
- `analytics-architecture-decision.md` — original investigation
- `real-estate-platform/analytics/README.md` — operator runbook

> **2026-04-28 updates:**
> 1. **Architecture pivot:** raw replication snapshots land in append-only S3 Parquet (bronze) instead of Postgres mirror. `listing_records` table phased out; RDS retains only `listing_change_log` + geography + app data. Enables RDS shrink medium → micro.
> 2. **Naming aligned to dbt canonical:** layer names changed from `silver`/`gold` to `intermediate`/`marts`. Fact name pluralized: `fct_closings`. See dbt industry-standards section in `analytics/README.md`.
> 3. **2019 sync hole discovered:** RDS mirror is missing 22,914 Maricopa Closed records in 2019 Jul–Sep (peak: 63% of records missing in Aug 2019). Bronze rebuild from Spark replication recovers all of them automatically.

---

## Goal

Produce a **gap-free monthly time series** for every metric the dashboard needs, going back to the oldest closing in the data, with quantifiable confidence per data point. Achieve this by owning the cleaned/aggregated layer (the ARMLS mirror stays read-only) and using a Bronze → Silver → Gold pipeline that is idempotent, reproducible, and version-controlled.

Specific output guarantees:
- Every month from **2011-01** through the current month is present (180+ rows in the metro time series)
- Months with zero qualifying closings carry an explicit `closing_count = 0` row, not a missing row
- Every metric carries a `sample_size` and a `confidence` band so the UI can degrade gracefully on thin data
- Re-running the pipeline on the same input produces bit-identical Gold output

---

## Data quality observations driving the design

Measured against the 1.6 M-row Maricopa Parquet export (2026-04-28):

| Issue | Count | % | Strategy |
|---|---|---|---|
| Oldest close_date | 2011-01-02 | — | Calendar spine floor = 2011-01 |
| Newest close_date | 2041-10-15 | — | **Future-dated rows are bad data**; reject anything > today + 30 days |
| Total closed rows | 1,563,534 | 100% | Bronze input |
| NULL close_date | 23 | 0.001% | Drop in silver |
| close_price ≤ 0 or NULL | 0 | 0% | (Source already filters) |
| Future close_date | 40 | 0.003% | Reject in silver |
| close/list ratio > 2.5× | 347 | 0.022% | Reject in silver (impossible non-distressed) |
| close/list ratio < 0.4× | 295 | 0.019% | Reject in silver |
| Duplicate listing_key | 0 | 0% | No dedup pass needed |
| Months with <1000 closings (last 10y) | 0 | — | No smoothing needed for Maricopa metro view; community-level still benefits from rolling windows |
| Garbage `close_year` partitions (2027–2041) | 10 rows | 0.0006% | Caught by future-date rejection above |

**Total expected silver reject rate:** ~705 rows / 1.56 M = **0.045%**. Cheap to filter, no winsorization needed.

---

## Medallion architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BRONZE (raw — read-only ARMLS mirror per IDX license)                       │
│ Source: RDS public.listing_records (1.9 M rows, 156 cols)                   │
│ Owner: ARMLS sync Lambda (rlsir-armls-sync, every 4 h)                      │
│ Constraints: NO UPDATE / DELETE / TRUNCATE — license requires immutability  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │  read-only scan
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SILVER (cleaned, validated, typed)                                          │
│ Output: s3://.../silver/closed_listings/year=YYYY/data.parquet              │
│ Cardinality: ~1.55 M rows after rejects                                     │
│ Schema: 60 strictly-typed columns + provenance columns                      │
│ Build: dbt model `silver.stg_closed_listings`, incremental on close_date    │
│ Cadence: every 4 h (incremental, last 90 days only)                         │
│         + weekly full rebuild (catches late corrections)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ GOLD (calendar-spined, pre-aggregated, dashboard-shaped)                    │
│ Outputs:                                                                    │
│   s3://.../gold/fct_sales_monthly_metro.parquet                             │
│   s3://.../gold/fct_sales_monthly_city.parquet                              │
│   s3://.../gold/fct_sales_monthly_community.parquet                         │
│   s3://.../gold/fct_sales_monthly_pricetier.parquet                         │
│   s3://.../gold/fct_sales_monthly_segmented.parquet                         │
│   s3://.../gold/fct_active_inventory_metro.parquet (active analytics)       │
│   s3://.../gold/manifest.json (atomic pointer)                              │
│ Cardinality: 200 rows (metro) → 50K rows (community × month)                │
│ Build: dbt models `gold.*`                                                  │
│ Cadence: every 4 h (after silver), full rebuild every run (cheap at this scale) │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                       DuckDB queries Gold for SSR/ISR
                       (most pages: pre-computed → cached JSON)
```

---

## Silver — cleaning rules

Enforced in `silver/stg_closed_listings.sql`. Every reject is routed to a `silver/_quarantine/` Parquet with a `reject_reason` column for inspection.

### Hard rejects (drop row entirely)

| Rule | SQL |
|---|---|
| Status must be Closed | `standard_status = 'Closed'` |
| Not soft-deleted | `is_deleted = FALSE` |
| Has a close_date | `close_date IS NOT NULL` |
| close_date in valid range | `close_date BETWEEN DATE '1990-01-01' AND CURRENT_DATE + INTERVAL '30 days'` |
| Has a close_price | `close_price > 0` |
| Has a list_price | `list_price > 0` |
| Plausible close/list ratio | `close_price::DOUBLE / list_price BETWEEN 0.4 AND 2.5` |
| Plausible living_area | `living_area BETWEEN 100 AND 50000 OR living_area IS NULL` |
| Plausible DOM | `days_on_market BETWEEN 0 AND 5000 OR days_on_market IS NULL` |
| Plausible coords (AZ) | `latitude BETWEEN 31 AND 37 AND longitude BETWEEN -115 AND -108 OR (lat IS NULL AND lng IS NULL)` |

### Soft fixes (keep row, derive cleaned column)

| Field | Cleaning |
|---|---|
| `subdivision_name` | TRIM, NULLIF '', NULLIF placeholder strings ('Metes and Bounds', 'No Subdivision', 'NONE', 'N/A') |
| `city` | TRIM, NULLIF '' (some rows have leading/trailing spaces) |
| `postal_code` | LEFT(postal_code, 5) — strip ZIP+4 |
| `price_per_sqft` | `ROUND(close_price::DOUBLE / NULLIF(living_area, 0), 2)` — derived, not from source |
| `close_month` | `DATE_TRUNC('month', close_date)` — pre-cut for joins |
| `close_year` | `EXTRACT(YEAR FROM close_date)` — partition key |
| `effective_dom` | `GREATEST(days_on_market, 0)` if non-null, else `(close_date - listing_contract_date)` |

### Provenance columns (added in silver)

```sql
-- Added by stg_closed_listings.sql, present in silver.* and gold.*
silver_built_at         TIMESTAMP        -- When this silver row was last refreshed
silver_run_id           UUID             -- ETL run identifier; ties row to a manifest entry
source_modification_ts  TIMESTAMP        -- modification_timestamp from bronze (for late-data detection)
data_quality_flags      VARCHAR[]        -- ['imputed_dom', 'imputed_subdivision', etc.]
```

---

## Gold — calendar spine ensures gap-free time series

The core pattern: **generate the calendar separately, LEFT JOIN sales to it.** A month with zero qualifying closings becomes a row with `closing_count = 0`, not a missing row.

### `fct_sales_monthly_metro.sql`

```sql
{{ config(materialized='table') }}

WITH calendar AS (
  -- Spine from oldest close_date in silver to current month
  SELECT DATE_TRUNC('month', d::DATE) AS month
  FROM range(
    (SELECT DATE_TRUNC('month', MIN(close_date)) FROM {{ ref('stg_closed_listings') }}),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
    INTERVAL '1 month'
  ) t(d)
),
property_segments AS (
  SELECT 'residential' AS property_segment UNION ALL
  SELECT 'land'                            UNION ALL
  SELECT 'all'
),
spine AS (
  SELECT c.month, p.property_segment
  FROM calendar c CROSS JOIN property_segments p
),
sales AS (
  SELECT
    close_month AS month,
    CASE
      WHEN property_type = 'Residential' THEN 'residential'
      WHEN property_type = 'Land'        THEN 'land'
    END AS property_segment_specific,
    close_price, list_price, days_on_market, living_area, price_per_sqft
  FROM {{ ref('stg_closed_listings') }}
  WHERE close_date >= DATE '2011-01-01'
),
-- Aggregate per (month, segment) — including the synthetic 'all' segment
agg AS (
  SELECT
    month,
    'residential' AS property_segment,
    COUNT(*) AS closing_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price) AS median_close,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_per_sqft) AS median_ppsf,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) AS median_dom,
    PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY close_price) AS p10_close,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY close_price) AS p90_close,
    AVG(close_price::DOUBLE / list_price) AS avg_sale_to_list,
    SUM(close_price) AS total_volume
  FROM sales WHERE property_segment_specific = 'residential'
  GROUP BY 1
  -- Repeat blocks for 'land' and 'all' (UNION ALL) — abbreviated
)
SELECT
  s.month,
  s.property_segment,
  COALESCE(a.closing_count, 0) AS closing_count,
  a.median_close,
  a.median_ppsf,
  a.median_dom,
  a.p10_close,
  a.p90_close,
  a.avg_sale_to_list,
  COALESCE(a.total_volume, 0) AS total_volume,

  -- Rolling smoothed metrics for thin data
  AVG(a.median_close) OVER (
    PARTITION BY s.property_segment
    ORDER BY s.month
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS median_close_3mo,

  -- 12-month rolling sample size for confidence rating
  SUM(COALESCE(a.closing_count, 0)) OVER (
    PARTITION BY s.property_segment
    ORDER BY s.month
    ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
  ) AS sample_12mo,

  -- Confidence band — UI hides the metric below 'low'
  CASE
    WHEN a.closing_count IS NULL OR a.closing_count = 0 THEN 'none'
    WHEN a.closing_count < 10  THEN 'very_low'
    WHEN a.closing_count < 30  THEN 'low'
    WHEN a.closing_count < 100 THEN 'medium'
    ELSE 'high'
  END AS confidence,

  CURRENT_TIMESTAMP AS gold_built_at
FROM spine s
LEFT JOIN agg a USING (month, property_segment)
ORDER BY s.month, s.property_segment
```

### Variants

| Mart | Spine | Aggregations |
|---|---|---|
| `fct_sales_monthly_metro` | month × segment | metro-wide |
| `fct_sales_monthly_city` | month × segment × city | per-city; cities below 5/month flagged `confidence='low'` |
| `fct_sales_monthly_community` | month × segment × community_slug | rolling 3-mo and 12-mo always populated to handle thin communities |
| `fct_sales_monthly_pricetier` | month × segment × price_band | 7 price bands |
| `fct_seasonal_patterns` | month_of_year × segment | folds 14 years into 12 month-of-year averages |
| `fct_yoy_change` | month × segment | self-join 12 months prior, computes pct change with NULL handling |

---

## Late-arriving / incremental strategy

Closed listings sometimes report 1–14 days after close (slow brokers, late documentation). True data lock-in happens after ~90 days. Strategy:

### Incremental window: 90 days

Every 4 h, dbt runs:

```sql
{{ config(
    materialized='incremental',
    incremental_strategy='delete+insert',
    unique_key='listing_key',
    on_schema_change='append_new_columns'
) }}

SELECT * FROM bronze.listing_records
WHERE standard_status = 'Closed'
  AND close_date >= CURRENT_DATE - INTERVAL '90 days'
  {% if is_incremental() %}
    OR source_modification_ts > (SELECT MAX(silver_built_at) - INTERVAL '1 hour' FROM {{ this }})
  {% endif %}
```

Anything older than 90 days is locked unless touched by the weekly full rebuild.

### Weekly full rebuild

Sundays at 02:00 MST: full silver rebuild from bronze. Catches:
- ARMLS retroactive corrections (rare)
- Schema fixes
- Reject-rule changes

Stored Gold is replaced atomically via the manifest pointer (same pattern as active.parquet swap).

### Detecting unhealthy gaps

A scheduled check (Lambda + CloudWatch alarm) runs after every Gold build:

```sql
-- Sanity check: every month from 2011-01 to last full month must have a row
SELECT month FROM {{ ref('fct_sales_monthly_metro') }}
WHERE property_segment = 'all'
  AND month BETWEEN DATE '2011-01-01' AND DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
GROUP BY month HAVING COUNT(*) = 0
-- Returns rows = ALARM
```

If this query returns any rows, fire `rlsir-analytics-gap-alarm` SNS → email.

---

## Idempotency, reproducibility, observability

Every Silver row carries `silver_run_id` (UUID) and `silver_built_at` (timestamp). The ETL run log is a small DuckDB table on RDS:

```sql
CREATE TABLE etl_runs (
  run_id           UUID PRIMARY KEY,
  pipeline         TEXT,             -- 'silver' | 'gold' | 'full_rebuild'
  started_at       TIMESTAMPTZ,
  finished_at      TIMESTAMPTZ,
  bronze_rows_in   BIGINT,
  silver_rows_out  BIGINT,
  rows_rejected    BIGINT,
  reject_breakdown JSONB,            -- { 'future_close_date': 40, 'bad_ratio': 642, ... }
  status           TEXT,              -- 'success' | 'failed'
  error_message    TEXT
);
```

Reader UI footer pulls the latest run for any displayed mart:
```
"Data through 2026-04-28 06:00 UTC. 1,562,884 closings analyzed. Source: ARMLS"
```

---

## Backfill plan

Run **once** before going live:

1. Snapshot bronze: `pg_dump --table=listing_records` → restore as `bronze_2026_04_28.parquet`. Reproducible source.
2. Run silver against snapshot: ~5 minutes for 1.56 M rows.
3. Run all gold marts against silver: ~30 seconds.
4. Sanity-check: row counts vs. existing MVs (`mv_market_pulse`, `mv_supply_demand`, etc.) within 1 %. Differences > 1 % go to a reconciliation log.
5. Switch reader URLs to point at the new Gold via manifest.
6. Keep old MVs alive for 30 days as A/B sanity.

Total backfill window: < 1 hour.

---

## dbt project layout

```
real-estate-platform/analytics/
├── dbt_project.yml
├── profiles.yml                  # DuckDB target, S3 paths from env
├── models/
│   ├── _sources.yml              # bronze.listing_records source definition
│   ├── silver/
│   │   ├── stg_closed_listings.sql            # cleaning + validation
│   │   ├── stg_closed_listings_quarantine.sql # rejected rows for inspection
│   │   ├── stg_calendar.sql                   # date spine 2011 → today
│   │   ├── stg_property_segments.sql          # residential / land / all
│   │   └── stg_geography.sql                  # joined PostGIS region/community classification
│   ├── gold/
│   │   ├── fct_sales_monthly_metro.sql
│   │   ├── fct_sales_monthly_city.sql
│   │   ├── fct_sales_monthly_community.sql
│   │   ├── fct_sales_monthly_pricetier.sql
│   │   ├── fct_seasonal_patterns.sql
│   │   ├── fct_yoy_change.sql
│   │   ├── fct_community_scorecard.sql
│   │   ├── fct_dom_buckets.sql
│   │   ├── fct_negotiation_spread.sql
│   │   └── fct_inventory_age.sql              # uses active-parquet for current-state
│   └── exposures/
│       └── dashboard.yml                      # documents which mart powers which page
├── tests/
│   ├── generic/
│   │   ├── no_calendar_gaps.sql
│   │   ├── nonneg_count.sql
│   │   └── confidence_in_enum.sql
│   └── singular/
│       └── reject_rate_below_1pct.sql
├── seeds/
│   ├── geographic_boundaries.csv              # 80 polygons (regions + communities)
│   └── price_bands.csv                        # band cutoffs
├── snapshots/                                 # if we ever need SCD2 on listings
└── macros/
    └── calendar_spine.sql                     # reusable across marts
```

---

## Tests (dbt generic + singular)

| Layer | Test | Purpose |
|---|---|---|
| silver | `unique(listing_key)` | No dupes leak through |
| silver | `not_null(close_date, close_price, list_price)` | Hard rules enforced |
| silver | `accepted_range(close_date, '1990-01-01', current_date+30d)` | Catches future-dated leaks |
| silver | reject_rate < 1% | Singular test: row count vs. bronze, alarm if > 1% rejected |
| gold | `no_calendar_gaps` | Generic test: every month from min to current_month exists |
| gold | `confidence in ('none','very_low','low','medium','high')` | Enum integrity |
| gold | `closing_count >= 0` | Anti-negative |
| gold | `median_close > p10_close AND median_close < p90_close` | Percentile ordering |
| gold | `sum_by_city ≈ metro_total` | Cross-mart consistency, ±1% tolerance |
| gold | volume_yoy < 50% absolute change | Catches catastrophic data drops |

Test runs are part of the ETL pipeline. Failed tests block the manifest swap — readers keep using the previous good Gold.

---

## Schema evolution policy

ARMLS occasionally adds RESO fields. Bronze accepts everything (no schema enforcement on the read-only mirror). Silver has a fixed Pydantic-style schema:

- New required column? Add to silver schema, write migration, rebuild silver.
- New optional column? Add to silver schema with default, no rebuild needed.
- Removed column? Mark deprecated, keep reading for one quarter, then drop.

Schema is defined in `analytics/schemas/closed_listings.yaml` (used by both dbt and TypeScript types). Single source of truth.

---

## Cost & runtime estimate (us-east-1 Lambda)

| Step | Wall time | Lambda cost/run | Per month (every 4 h) |
|---|---|---|---|
| Silver incremental (90 d window) | ~30 s | $0.001 | $0.18 |
| Gold full rebuild (all marts) | ~10 s | $0.0003 | $0.05 |
| Weekly full silver rebuild | ~5 min | $0.01 | $0.04 |
| **Total ETL** | | | **~$0.30/month** |

Effectively free. Compare to current: refreshing 9 RDS materialized views serially takes ~3 minutes and contributes substantially to the 60 s query timeouts during refresh.

---

## Rollout sequence

1. **Day 1**: Land this strategy doc + schemas + tests in repo. PR review.
2. **Day 2–4**: Build silver layer + tests. Validate against bronze.
3. **Day 5–7**: Build all gold marts + calendar spine + tests. Validate row counts vs. existing MVs.
4. **Day 8**: Backfill against bronze snapshot. A/B compare /phoenix metrics page to current vs. new.
5. **Day 9–11**: Wire `/phoenix` page to read Gold. Keep MV path as feature flag for instant rollback.
6. **Day 12**: Wire `/market` and `/analytics` pages.
7. **Day 13**: Drop the 9 dashboard MVs. Keep `analytics_base` foundation.
8. **Day 14**: Monitor CloudWatch ETL alarms for 7 days. Tune reject thresholds if needed.
9. **Day 21**: Decommission old refresh-views Lambda paths.

---

## Open questions

1. **Pre-2011 data?** ARMLS Spark replication may carry data back to 2001. Worth a one-time backfill if available — otherwise dashboard time-series starts at 2011. Decide before the spine starts.
2. **Land/lots time series?** Currently stubbed as `property_segment='land'` but volumes are very thin (~5K closings/year metro-wide). Maybe collapse into 'all' until v2.
3. **Imputation policy?** Some metrics (e.g., DOM) are NULL in source. Should silver impute from `(close_date - listing_contract_date)`, or leave NULL and let UI show "—"? Default: impute, flag in `data_quality_flags`.
4. **Outlier strategy on per-community medians?** With 50 closings/year in a small community, a single $20M sale skews the median. Recommend per-community winsorization at 1st/99th percentile in the community-level mart only.
5. **Schema yaml as source of truth or generated from dbt YAML?** I lean toward a single hand-maintained `closed_listings.yaml` that both dbt and TypeScript consume, but happy to defer.

---

## Addendum — 2026-04-28: Approved field additions and price-history derivation

Two field families are added to silver, plus a derived price-history layer built from `listing_change_log`.

### A. Buyer-side fields → `int_listings_closed_cleaned (silver fact)`

Both 100% populated in Spark API sample:

| Spark field | Silver column | Purpose |
|---|---|---|
| `BuyerAgentFullName` | `buyer_agent_full_name` | Buyer agent leaderboards |
| `BuyerAgentKey` | `buyer_agent_key` | Stable join key for agent dimension |
| `BuyerOfficeName` | `buyer_office_name` | Buyer office market share |
| `BuyerOfficeKey` | `buyer_office_key` | Stable join key for office dimension |

**Source-data caveat:** ARMLS sometimes records placeholder values like `'Non-MLS Agent'` / `'Non-MLS Office'` when the buyer side is external. Silver normalizes these to `NULL` so downstream marts don't double-count them as a single mega-agent.

**Sync change required:** `listing_records` does not currently mirror buyer-side columns. We extend the sync Lambda's field-mapper to capture them. ARMLS has these in the Property entity, so no new endpoint is needed.

### B. CommunityFeatures → `int_listings_closed_cleaned (silver fact).community_features` (text array)

Spark sample population: 54% (sample of 50 — needs validation at scale before locking the mart). Sample value: `['Gated']`. Other typical RESO values: `['Gated', 'Golf Course', 'Pickleball', 'Pool', 'Tennis']`.

**Derived dimensions for analytics:**

| Derived column | Logic |
|---|---|
| `is_gated` | `'Gated' = ANY(community_features)` |
| `is_golf_community` | `'Golf Course' = ANY(community_features)` |
| `is_age_restricted` | `'Adult Living' = ANY(community_features) OR 'Age Rest' = ANY(community_features)` |
| `has_community_pool` | `'Community Pool' = ANY(community_features) OR 'Pool' = ANY(community_features)` |
| `community_amenity_count` | `cardinality(community_features)` |

**Sync change required:** Same as above — extend the mapper to capture `CommunityFeatures` from the Spark Property entity into a new `community_features text[]` column on `listing_records`.

**Coverage caveat:** With ~54% population, gold marts that depend on these flags ship with `confidence='subset'` and a UI disclosure: "Of homes with community-feature data, X% are gated."

### C. Price-history derivation — uses existing `listing_change_log`

We do **not** build new price-tracking infrastructure. ARMLS sync already populates `listing_change_log` with one row per field-change, including `list_price`. 213,342 list-price events recorded; source_timestamps go back to 2011-10-01.

**New silver model: `int_listings_price_history`**

One row per closed listing, deriving every price-trajectory metric we need.

```sql
{{ config(materialized='table') }}

WITH list_price_events AS (
  SELECT
    listing_key,
    source_timestamp,
    NULLIF(old_value, '')::NUMERIC AS old_price,
    NULLIF(new_value, '')::NUMERIC AS new_price
  FROM {{ source('rds','listing_change_log') }}
  WHERE field_name = 'list_price'
    AND old_value IS NOT NULL AND new_value IS NOT NULL
),
first_event AS (
  SELECT DISTINCT ON (listing_key)
    listing_key,
    old_price AS original_list_price,   -- the price BEFORE the first recorded change = original
    source_timestamp AS first_change_at
  FROM list_price_events
  ORDER BY listing_key, source_timestamp ASC
),
agg_events AS (
  SELECT
    listing_key,
    COUNT(*) AS price_change_count,
    COUNT(*) FILTER (WHERE new_price < old_price) AS reduction_count,
    COUNT(*) FILTER (WHERE new_price > old_price) AS increase_count,
    SUM(GREATEST(old_price - new_price, 0)) AS total_reduction_amount,
    SUM(GREATEST(new_price - old_price, 0)) AS total_increase_amount,
    MIN(source_timestamp) AS first_change_at,
    MAX(source_timestamp) AS last_change_at
  FROM list_price_events
  GROUP BY listing_key
),
listing_anchor AS (
  SELECT
    listing_key,
    list_price        AS final_list_price,    -- price at close
    close_price,
    listing_contract_date,
    on_market_date,
    close_date
  FROM {{ ref('stg_closed_listings') }}
)
SELECT
  l.listing_key,
  COALESCE(fe.original_list_price, l.final_list_price) AS original_list_price,
  l.final_list_price,
  l.close_price,

  -- Did the listing have any price reduction?
  COALESCE(ae.reduction_count, 0) > 0 AS had_price_reduction,

  -- How many?
  COALESCE(ae.price_change_count, 0) AS price_change_count,
  COALESCE(ae.reduction_count, 0)    AS reduction_count,
  COALESCE(ae.increase_count, 0)     AS increase_count,

  -- How much (always positive numbers)
  COALESCE(ae.total_reduction_amount, 0) AS total_reduction_amount,
  COALESCE(ae.total_increase_amount, 0)  AS total_increase_amount,

  -- Net change from original to final (negative = reduced)
  l.final_list_price - COALESCE(fe.original_list_price, l.final_list_price) AS net_price_change,
  CASE
    WHEN COALESCE(fe.original_list_price, 0) > 0
    THEN (l.final_list_price - fe.original_list_price) / fe.original_list_price * 100
  END AS net_price_change_pct,

  -- Velocity-of-change signals
  fe.first_change_at,
  ae.last_change_at,
  CASE
    WHEN fe.first_change_at IS NOT NULL AND l.on_market_date IS NOT NULL
    THEN (fe.first_change_at::DATE - l.on_market_date)
  END AS days_to_first_change,

  -- Sale price relative to original (true negotiation strength)
  CASE
    WHEN COALESCE(fe.original_list_price, 0) > 0
    THEN l.close_price::DOUBLE / fe.original_list_price
  END AS close_to_original_ratio,

  CURRENT_TIMESTAMP AS silver_built_at
FROM listing_anchor l
LEFT JOIN first_event fe USING (listing_key)
LEFT JOIN agg_events  ae USING (listing_key)
```

**One row per closed listing. 12 derived metrics. Drives every price-reduction analytic.**

**New gold marts that drop out:**

| Mart | Question answered | Build query (sketch) |
|---|---|---|
| `fct_pricereduction_monthly` | "What % of closed listings had price reductions, by month?" | calendar × segment × `AVG(had_price_reduction::INT)`, `AVG(net_price_change_pct)` |
| `fct_pricereduction_community` | "Which communities have the most reduction-prone sellers?" | community × `% had_reduction`, `median total_reduction_amount` |
| `fct_pricereduction_pricetier` | "Are luxury sellers more or less likely to reduce?" | price_band × `% had_reduction`, `mean reduction_pct` |
| `fct_negotiation_v2_monthly` | True negotiation: close vs **original** list, not just final list | month × segment × `median(close_to_original_ratio)` — **a dramatically more honest signal than the current sale-to-list metric** |
| `fct_buyer_office_yearly` | Buyer-side office leaderboard | year × `buyer_office_name` × volume, $ volume, median DOM |
| `fct_buyer_agent_yearly` | Buyer-side agent leaderboard (internal-only) | year × `buyer_agent_full_name` × volume |
| `fct_dual_representation_yearly` | % of deals where list_office == buyer_office (single-side commission) | year × `% same_office` |
| `fct_community_amenity_premium` | "Do gated communities close at a $/sqft premium?" | size-quartile-controlled `median ppsf with vs without is_gated` |
| `fct_golf_premium` | Same for golf communities | same as above for `is_golf_community` |
| `fct_age_restricted_premium` | Same for 55+ communities | same for `is_age_restricted` |

**The killer new analytic:** `close_to_original_ratio`. Today's "% above asking" uses `close_price / list_price` — but if a $1 M home was originally $1.2 M and reduced to $1 M then closed at $1.05 M, the existing metric reports +5%, masking that the seller took a 12.5% haircut overall. `close_to_original_ratio = 1.05 / 1.20 = 0.875` is the true picture. Yong's clients will care about this.

### D. Updated mart catalog (delta from main strategy)

Adds to Group C (Negotiation):
- `fct_pricereduction_monthly` (new)
- `fct_pricereduction_community` (new)
- `fct_pricereduction_pricetier` (new)
- `fct_negotiation_v2_monthly` (new — close-to-original)

Adds to Group G (Office/Agent):
- `fct_buyer_office_yearly` (new)
- `fct_buyer_agent_yearly` (new — gated)
- `fct_dual_representation_yearly` (new)

Adds to Group E (Property characteristics) — gated on CommunityFeatures population validation:
- `fct_community_amenity_premium` (new)
- `fct_golf_premium` (new)
- `fct_age_restricted_premium` (new)

### E. Coverage and confidence policy for derived price history

| Metric | Universe | Coverage | Confidence |
|---|---|---|---|
| had_price_reduction | All closed listings | 100% (default false when no event) | High — absence of event = no reduction is a safe inference |
| original_list_price | Closed listings with any list_price event | 11.3% direct; 88.7% defaults to final_list_price | Mark provenance: `original_list_price_source = 'change_log' \| 'final_list_assumed'` |
| reduction_count, total_reduction_amount | Closed listings with reduction event | 11.3% | High when present |
| close_to_original_ratio | Closed listings with reduction event | 11.3% | High; the other 88.7% trivially equal close_to_list ratio |
| days_to_first_change | Same as above | 11.3% | High |

**Honest disclosure on the dashboard:** "11.3% of closed listings recorded a price change before closing; for the rest, original list = final list." Hides nothing.

### F. Sync Lambda changes

Three small edits to `infra/lambda/armls-sync.ts`:

1. Add `BuyerAgentFullName, BuyerAgentKey, BuyerOfficeName, BuyerOfficeKey, CommunityFeatures` to the field-mapper output
2. Add corresponding columns to `listing_records` schema (one migration: `032_buyer_side_and_community_features.sql`)
3. No change to `listing_change_log` — it already captures everything we need.

### G. Backfill plan

Buyer-side fields, CommunityFeatures, and the 2019 sync-hole records are all recovered via the **one-time bronze backfill** described in §H. Walking the full Spark replication once captures every field for every listing — no separate backfill script needed.

Price history is already there in `listing_change_log` — no backfill needed.

---

## H. Bronze Parquet replication pipeline (canonical staging source)

The bronze layer is **append-only S3 Parquet** populated by a sync Lambda that pages through the Spark RESO replication endpoint. Replaces the `listing_records` Postgres mirror as the source of truth for staging models.

### Layout

```
s3://rlsir-platform-assets-us-east-1/bronze/listings/
  sync_year=YYYY/sync_month=MM/sync_day=DD/run_id=<uuid>/
    page_0000.parquet    (1 page = up to 1000 records, ~1 MB)
    page_0001.parquet
    …
```

Each file is **immutable**. Same Spark response captured forever. Bronze is never updated, never overwritten, never compacted destructively (an optional yearly compaction job can fold pages into bigger Parquets, but originals are preserved).

### Sync Lambda (replaces existing `rlsir-armls-sync` write path)

Two scheduled invocations of the same Lambda:

| Schedule | Purpose | Filter | Expected size |
|---|---|---|---|
| `rate(1 hour)` — actives | Keep current state fresh | `StandardStatus eq 'Active' or 'Active Under Contract' or 'Pending' or 'Coming Soon'` | ~50 K records, ~50 MB Parquet/day |
| `rate(4 hours)` — full walk | Keep cursor moving across modified records | resume from skiptoken | ~5–20 K modified records per cycle |

Lambda flow:
1. Fetch Spark token from Secrets Manager `rlsir/armls/tokens`
2. Resume from the `skiptoken` recorded in DynamoDB (or S3 metadata file)
3. Issue `GET /Reso/OData/Property?$top=1000&$skiptoken=...` (or `$filter=...` for the actives variant)
4. Convert each response to Parquet via `pyarrow` (in Python runtime) or `parquet-go` (in Go runtime)
5. Write to S3 at the partitioned path with a fresh `run_id` UUID
6. Advance skiptoken; repeat until empty or time budget exhausted (15-min Lambda max)
7. Save state for next invocation

### One-time backfill

Walks the **full** Spark replication from skiptoken=null:
- ~1.59 M Maricopa records + ~285 K other counties = ~1.88 M total
- At $top=1000 → 1,880 paginated calls × ~1 s each → **~30 minutes wall time**
- Write target: ~1.88 M records × ~1 KB each → **~1.8 GB compressed Parquet**
- Single Lambda invocation can cover ~10K records before timeout; orchestrate via Step Functions or chunk by ModificationTimestamp ranges

Backfill recovers automatically:
- The 22,914 Maricopa records the existing mirror is missing from Jul–Dec 2019
- Buyer-side fields (BuyerAgentName/Key, BuyerOfficeName/Key)
- CommunityFeatures
- Plus any other ~850 RESO fields we choose to capture (versus the 156 columns the legacy mirror stored)

### Reading from bronze

dbt staging model `stg_armls__listing_records` (in `real-estate-platform/analytics/models/staging/armls/`) reads via:

```sql
WITH dedup AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY ListingKey
                       ORDER BY ModificationTimestamp DESC, sync_observed_at DESC) AS rn
  FROM {{ source('armls_bronze', 'listings_observations') }}
)
SELECT * FROM dedup WHERE rn = 1
```

The `source()` resolves to `read_parquet('s3://rlsir-platform-assets-us-east-1/bronze/listings/**/*.parquet')` via the `meta.external_location` convention configured in `_armls__sources.yml`.

### Status filter (decided B2: closed + active + pending)

Bronze captures:
- All Closed listings (~1.88 M historically, +~10–15 K/month)
- All currently Active / Active Under Contract / Pending / Coming Soon (~50 K)
- NOT capturing Cancelled (~1.93 M) for v1 — easy to add later by relaxing the sync filter; bronze is append-only

### Source freshness check

Configured on the bronze source in `_armls__sources.yml`:
- `loaded_at_field: modification_timestamp`
- `warn_after: 2 hours` — actives sync should land every 1 h
- `error_after: 8 hours` — anything past 2× the full-walk cadence is broken

### Trade-off vs the prior Postgres-mirror plan

| | Bronze on S3 (current) | Postgres mirror (prior) |
|---|---|---|
| RDS instance | t3.micro (app data only) | t3.medium (mirror + app data) |
| Sync write path | S3 PutObject (no DB lock) | INSERT…ON CONFLICT to listing_records |
| Read path for staging | DuckDB httpfs over S3 | DuckDB postgres extension over network |
| Storage cost | $0.04/mo (~1.8 GB at $0.023/GB) | inside RDS $66/mo |
| Complete history | Every observation we've ever pulled | Latest snapshot only |
| 2019 sync hole | Recovered automatically by backfill | Required manual repair |

### Status of legacy `listing_records` table

After bronze cuts over and is verified for 1 week:
1. dbt staging models point at bronze (already done in scaffold)
2. Listing detail pages (`/listings/[slug]`) — keep on `@platform/spark` Spark API direct; no change
3. Drop `listing_records` from RDS via migration `033_drop_listing_records.sql`
4. RDS instance shrink: `aws rds modify-db-instance --db-instance-class db.t3.micro --apply-immediately` after sign-off

`listing_change_log` and `listing_geography` stay on RDS — both join cleanly into staging via the `armls` source (RDS-backed) defined alongside `armls_bronze` in `_armls__sources.yml`.

---

## I. Cross-reference to the dbt project

The complete project tree at `real-estate-platform/analytics/`:

```
analytics/
├── dbt_project.yml                            ← project config + vars (reject thresholds, AZ bbox)
├── profiles.yml.example                       ← DuckDB target with attached RDS + S3 external_root
├── packages.yml                               ← dbt_utils, dbt_expectations
├── .dbtbouncer.yml                            ← convention enforcement in CI
├── README.md                                  ← operator runbook
├── macros/
│   └── calendar_spine.sql                     ← calendar_spine_monthly, property_segments,
│                                                confidence_band, clean_subdivision, is_valid_close
├── models/
│   ├── staging/armls/
│   │   ├── _armls__sources.yml                ← bronze + RDS sources, freshness, source tests
│   │   ├── _armls__models.yml
│   │   ├── stg_armls__listing_records.sql    ← reads bronze Parquet, dedups by listing_key
│   │   ├── stg_armls__listing_change_log.sql
│   │   └── stg_armls__listing_geography.sql
│   ├── intermediate/
│   │   ├── _calendar/
│   │   │   ├── int_calendar.sql               ← date spine 2011→today
│   │   │   └── _calendar__models.yml
│   │   └── listings/
│   │       ├── int_listings_closed_cleaned.sql       ← silver fact, microbatch incremental
│   │       ├── int_listings_price_history.sql       ← derives original_list_price from change_log
│   │       ├── int_listings_geographic_enriched.sql ← joins region/community + price_band
│   │       └── _int_listings__models.yml
│   └── marts/analytics/
│       ├── dim_calendar.sql                   ← external Parquet
│       ├── dim_communities.sql                ← external Parquet
│       ├── fct_closings.sql                   ← atomic fact, partitioned by close_year
│       ├── fct_market_pulse.sql               ← monthly time series
│       ├── fct_negotiation.sql                ← close-to-list AND close-to-original ratios
│       ├── fct_community_scorecard.sql
│       ├── fct_community_yoy.sql
│       ├── fct_pricereduction.sql
│       ├── fct_buyer_office.sql               ← new buyer-side leaderboard
│       ├── _analytics__models.yml             ← model docs + tests
│       └── _analytics__exposures.yml          ← documents which page consumes which mart
└── tests/
    ├── no_calendar_gaps.sql                   ← every month from 2011 present in fct_market_pulse
    ├── percentile_ordering.sql                ← p10 ≤ median ≤ p90
    ├── sale_to_list_within_bounds.sql         ← every fct_closings row in 0.4–2.5
    ├── reject_rate_below_1pct.sql             ← bronze→silver reject rate <1%
    └── monthly_volume_sanity.sql              ← catches sync holes (2019-style anomalies)
```

### Daily commands

```bash
# Local development (reads from RDS for change_log, S3 for bronze)
dbt build --target dev

# Production Lambda (every 4 h)
dbt build --target prod --select tag:analytics

# CI on PR
dbt build --select state:modified+ --defer --state ./prod-manifest --target ci

# Convention enforcement
dbt-bouncer --dbt-artifacts-dir target

# Source freshness alarm
dbt source freshness --target prod
```
