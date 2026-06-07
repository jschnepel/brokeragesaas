# dbt Project

**Date:** 2026-04-30
**Status:** Spec — `analytics/` directory has the working implementation; this doc captures the conventions.
**Related:** `04-duckdb-runtime.md` (the engine dbt runs against), `05-dagster-orchestration.md` (the orchestrator that schedules runs).

---

## 1. Project layout

```
real-estate-platform/analytics/
├── dbt_project.yml                       # project config, vars, model paths, on-run hooks
├── profiles.yml                          # DuckDB targets (dev: file-based, prod: in-memory writing to S3)
├── packages.yml                          # dbt_utils, dbt_date, dbt_expectations, elementary
├── .dbtbouncer.yml                       # convention-enforcement rules (custom linter)
├── .user.yml
│
├── models/
│   ├── staging/
│   │   ├── armls/
│   │   │   ├── _armls__sources.yml       # bronze NDJSON.gz sources + freshness
│   │   │   ├── stg_armls__listing_records.sql
│   │   │   ├── stg_armls__active_listings.sql
│   │   │   ├── stg_armls__listing_change_log.sql
│   │   │   └── stg_armls__listing_geography.sql
│   │   └── yong2/                        # NEW (Phase 2 of yong2 plan)
│   │       ├── _yong2__sources.yml
│   │       ├── stg_yong2__events.sql
│   │       ├── stg_yong2__leads.sql
│   │       ├── stg_yong2__communications.sql
│   │       └── stg_yong2__status_history.sql
│   │
│   ├── intermediate/
│   │   ├── _calendar/int_calendar.sql
│   │   ├── listings/
│   │   │   ├── int_listings_active_cleaned.sql
│   │   │   ├── int_listings_closed_cleaned.sql
│   │   │   ├── int_listings_geographic_enriched.sql
│   │   │   ├── int_listings_price_history.sql
│   │   │   └── int_listings_status_history.sql
│   │   └── yong2/                        # NEW
│   │       ├── int_yong2_pageviews.sql
│   │       ├── int_yong2_sessions.sql
│   │       ├── int_yong2_visitors.sql
│   │       ├── int_yong2_attribution_touches.sql
│   │       └── int_yong2_lead_journey.sql
│   │
│   └── marts/
│       ├── analytics/                    # MLS marts (existing)
│       │   ├── _analytics__models.yml
│       │   ├── _analytics__exposures.yml
│       │   ├── dim_calendar.sql
│       │   ├── dim_communities.sql
│       │   ├── fct_market_pulse.sql
│       │   ├── fct_negotiation.sql
│       │   ├── fct_community_scorecard.sql
│       │   ├── fct_community_yoy.sql
│       │   ├── fct_closings.sql
│       │   ├── fct_pricereduction.sql
│       │   ├── fct_buyer_office.sql
│       │   ├── fct_active_inventory.sql
│       │   ├── fct_active_by_community.sql
│       │   ├── fct_active_by_pricetier.sql
│       │   ├── fct_active_dom_distribution.sql
│       │   ├── fct_active_heatmap_h3.sql
│       │   ├── fct_listing_pace.sql
│       │   ├── fct_months_of_supply.sql
│       │   └── fct_status_velocity.sql
│       └── yong2/                        # NEW
│           ├── _yong2__models.yml
│           ├── _yong2__exposures.yml
│           ├── fct_yong2_daily_metrics.sql
│           ├── fct_yong2_campaign_roi.sql
│           ├── fct_yong2_lead_attribution.sql
│           ├── fct_yong2_listing_engagement.sql
│           ├── dim_yong2_visitors.sql
│           └── dim_yong2_campaigns.sql
│
├── macros/
│   ├── calendar_spine.sql                # property_segments, confidence_band, dom_band, calendar_spine_monthly
│   ├── check_bronze_freshness.sql        # on-run-start freshness check (custom; standard source freshness doesn't work on globs)
│   └── (more as needed)
│
├── tests/                                # singular tests (per-table assertions)
│   ├── months_of_supply_within_bounds.sql
│   └── active_status_consistency.sql
│
├── seeds/                                # static reference data (community taxonomies, etc.)
└── target/                               # dbt-generated; gitignored
```

## 2. Materialization strategy

| Layer | Materialization | Reason |
|---|---|---|
| Staging | `table` | Bronze NDJSON.gz scan + window-function dedup must execute once per run. As `view`, every downstream reference re-scans. |
| Intermediate | `incremental` with `merge` strategy, watermark on `source_modification_ts` or `occurred_at` | 90-day rebuild window with monthly batches; full refresh via `--full-refresh` is safe and idempotent. |
| Marts | `external` (Parquet on S3 in prod) / `table` (DuckDB file in dev) | Marts ARE the gold artifact; Parquet on S3 is what browsers fetch. |

**Why staging is `table` not `view`** — see § 4.3 of `analytics-comprehensive-plan.md`. Bronze NDJSON.gz with hive_partitioning is expensive to scan; running once per dbt build saves 3–4× build time.

## 3. Source freshness

`dbt source freshness` doesn't work against S3 NDJSON globs (no metadata). Custom replacement at `dbt_project.yml`:

```yaml
on-run-start:
  - "{{ check_bronze_freshness(warn_hours=6, error_hours=12) }}"
```

Macro reads `_freshness.json` per bronze "table" and raises `compiler error` if past `error_hours`. See `02-bronze-ingest.md § 4`.

For Dagster integration (Phase 2): `_freshness.json` mtime advance is the asset-materialization signal that triggers downstream dbt runs. See `05-dagster-orchestration.md`.

## 4. Tests

Three test layers:

| Layer | Tooling | Examples |
|---|---|---|
| Generic tests | dbt built-ins | `not_null`, `unique`, `relationships` on every PK + FK in mart yml files |
| Generic tests v2 (dbt 1.11) | `arguments:` syntax | values + accepted_range with `config: where:` row-condition guards |
| Singular tests | `tests/*.sql` | `months_of_supply_within_bounds`, `active_status_consistency`. Returns 0 rows = pass; rows = fail. |
| Expectation tests | `dbt_expectations` package | row count not zero, column distinctness, percentile bounds |

All tests run on every `dbt build`. Failed tests block downstream models (default behavior).

## 5. Tagging

Tags drive Dagster's selection and CI's dbt --select arguments.

| Tag | Models | Used by |
|---|---|---|
| `staging` | All `stg_*` | Dagster bronze-update sensor (only re-runs staging on bronze refresh) |
| `intermediate` | All `int_*` | (downstream of staging) |
| `marts` | All `fct_*`, `dim_*` | Production mart-build run |
| `armls` | All MLS-domain models | `dbt build --select +tag:armls` for selective runs |
| `yong2` | All yong2 models | `dbt build --select +tag:yong2` for the yong2 lakehouse integration |
| `active` | Active-side models (gated by `enable_active` var) | Hourly Dagster trigger after active-snapshot lands |
| `closed` | Closed-side models | 4-hourly Dagster trigger after armls-sync lands |

## 6. Variables

```yaml
vars:
  # Calendar spine bounds — adjust if pre-2011 backfill is sourced
  calendar_start: '2011-01-01'
  calendar_end_offset_months: 1

  # Reject thresholds for silver cleaning rules
  min_close_price: 1000
  max_close_price: 1000000000
  min_list_price: 1000
  max_list_price: 500000000
  min_ratio: 0.4
  max_ratio: 2.5
  min_living_area: 100
  max_living_area: 50000

  # AZ bounding box (geographic clip)
  az_lat_min: 31
  az_lat_max: 37
  az_lng_min: -115
  az_lng_max: -108

  # Feature flags
  enable_active: false      # flip to true after active-snapshot Lambda is stable (Phase 1)
  exclude_bronze_runs: []   # for replay/quarantine

  # Reconciliation
  parity_drift_threshold: 0.01    # 1% — used by parity reconcile Lambda
```

## 7. Profiles

`profiles.yml`:

```yaml
rlsir_analytics:
  target: dev
  outputs:
    # Local dev — persistent DuckDB file; reads bronze from S3, attaches RDS via postgres extension
    dev:
      type: duckdb
      path: 'C:/Users/joeys/Desktop/RLSIR Websites/real-estate-platform/analytics/_local_output/rlsir_analytics_dev.duckdb'
      external_root: 'C:/Users/joeys/Desktop/RLSIR Websites/real-estate-platform/analytics/_local_output'
      extensions: [httpfs, parquet, postgres]
      attach:
        - path: 'host={{ env_var("RDS_HOST") }} port=5432 user={{ env_var("RDS_USER") }} password={{ env_var("RDS_PASSWORD") }} dbname={{ env_var("RDS_DATABASE") }} sslmode=require'
          type: postgres
          alias: rlsir_platform
          options:
            read_only: true

    # Production — Lambda runtime; in-memory DuckDB writes Parquet to S3
    prod:
      type: duckdb
      path: ':memory:'
      external_root: 's3://rlsir-platform-assets-us-east-1/analytics'
      extensions: [httpfs, parquet, postgres]
      settings:
        s3_region: us-east-1
        s3_access_key_id: '{{ env_var("AWS_ACCESS_KEY_ID") }}'
        s3_secret_access_key: '{{ env_var("AWS_SECRET_ACCESS_KEY") }}'
        s3_session_token: '{{ env_var("AWS_SESSION_TOKEN") }}'
      attach:
        - path: '{{ env_var("RDS_DSN") }}'
          type: postgres
          alias: rlsir_platform
          options:
            read_only: true
```

Lambda runtime supplies `AWS_*` via the IAM role's STS credentials and `RDS_DSN` via Secrets Manager.

## 8. dbt-bouncer rules

`.dbtbouncer.yml` enforces conventions at CI time:

```yaml
manifest_checks:
  - name: check_model_has_description
    include: ^models/marts/
  - name: check_model_has_unique_test
    include: ^models/marts/
  - name: check_model_has_not_null_test
    include: ^models/marts/

source_checks:
  - name: check_source_has_freshness
    include: ^models/staging/

model_checks:
  - name: check_model_directories
    materializations:
      staging:      [table]
      intermediate: [incremental]
      marts:        [external, table]
  - name: check_model_naming
    pattern: '^(stg|int|fct|dim)_[a-z0-9_]+$'
```

Run as a CI step: `dbt-bouncer --config analytics/.dbtbouncer.yml`. Fails the build if rules violated.

## 9. Exposures

`models/marts/analytics/_analytics__exposures.yml` documents which premium-site routes consume which marts. Used by `dbt ls --resource-type exposure` to map blast radius.

```yaml
exposures:
  - name: phoenix_dashboard_metro
    type: dashboard
    maturity: high
    url: https://yongchoi.com/phoenix
    description: Main analytics dashboard — metro view with 5 tabs
    depends_on:
      - ref('fct_market_pulse')
      - ref('fct_negotiation')
      - ref('fct_community_scorecard')
      ...
    owner:
      name: Joey Schnepel
      email: joeyschnepel@gmail.com
```

## 10. Observability hooks

```yaml
on-run-start:
  - "{{ check_bronze_freshness(warn_hours=6, error_hours=12) }}"

on-run-end:
  - "{{ elementary.on_run_end() }}"   # captures dbt run + test results in elementary tables
```

Elementary publishes results to a separate DuckDB schema (`elementary`); a separate Lambda (`armls-elementary-report`) generates the HTML report nightly and uploads to `s3://.../analytics/_elementary/{date}/index.html`.

## 11. Performance baselines

Last clean dev run (Apr 29):
- 19 models built (active branch gated off)
- Total elapsed: 64.4s
- Slowest: `int_listings_status_history` (windowed dedup over 1.85M rows)

Performance budgets:
- staging: <15s each (bronze scan dominated)
- intermediate: <20s each
- marts: <10s each (read intermediate, write Parquet)
- Full prod build (27 models): <300s — fits comfortably in Lambda 900s timeout

If a model exceeds budget, options:
1. Partition the model — `dbt build --select fct_market_pulse --partition-key=2026-01`
2. Materialize as `incremental` if it's currently `table`
3. Rewrite the SQL — DuckDB's EXPLAIN often shows JOIN order issues fixable with hints

## 12. Local dev workflow

```bash
cd real-estate-platform/analytics

# First time
pnpm dlx dbt deps                                  # install packages.yml
export RDS_HOST=...; export RDS_PASSWORD=...       # for postgres extension attach

# Build everything
pnpm dlx dbt build --target dev

# Build a single tab's marts
pnpm dlx dbt build --select +fct_market_pulse

# Active branch (after Phase 1)
pnpm dlx dbt build --vars '{enable_active: true}' --select +tag:active

# Test a hypothesis
pnpm dlx duckdb _local_output/rlsir_analytics_dev.duckdb \
  -c "SELECT scope_type, COUNT(*) FROM main_marts_analytics.fct_market_pulse GROUP BY 1"
```

## 13. CI integration (planned)

`.github/workflows/dbt-ci.yml` runs on every PR touching `analytics/`:

1. Install dbt + DuckDB
2. `dbt deps`
3. `dbt parse` — fast syntactic check (no DB touch)
4. `dbt-bouncer` — convention check
5. `dbt build --target ci` (against a test DuckDB with bronze fixtures)
6. `dbt test`

CI does NOT run against prod bronze. A `target: ci` profile uses static fixtures committed in `analytics/seeds/_test_fixtures/`.
