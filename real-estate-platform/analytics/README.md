# RLSIR Analytics — dbt-DuckDB Pipeline

Closed-listing analytics pipeline for the RLSIR/Yong Choi platform. Reads from the
RDS ARMLS mirror via the DuckDB postgres extension, writes Parquet to S3 via the
DuckDB external materialization, serves the Phoenix metro analytics dashboard.

## Architecture

```
RDS bronze (read-only ARMLS mirror)
       │
       ▼  postgres extension scan
┌──────────────────────────────────────┐
│ models/staging/armls/                │   stg_*  views
│   stg_armls__listing_records         │   1:1 cleanup, type cast
│   stg_armls__listing_change_log      │
│   stg_armls__listing_geography       │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ models/intermediate/                 │   int_*  tables (microbatch incremental)
│   int_calendar                       │   date spine 2011 → today
│   int_listings_closed_cleaned        │   silver fact: validated, dedup, derived
│   int_listings_price_history         │   joins change_log, derives original_list_price
│   int_listings_geographic_enriched   │   joins listing_geography for region/community
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ models/marts/                        │   fct_/dim_  external Parquet on S3
│  analytics/                          │   public-facing, powers /phoenix dashboard
│    fct_closings                      │     atomic fact, one row per closed sale
│    fct_market_pulse                  │     monthly time series, calendar-spined
│    fct_negotiation                   │     close-to-list + close-to-original ratios
│    fct_community_scorecard           │     current per-community snapshot
│    fct_community_yoy                 │     YoY median ppsf change per community
│    fct_pricereduction                │     % of listings with reductions
│    fct_buyer_office                  │     buyer-side office leaderboard
│    dim_calendar                      │     date dimension (joined by every fct_*)
│    dim_communities                   │     region/community lookup
│  internal/                           │   broker-only, gated routes
│    fct_buyer_agent                   │
└──────────────────────────────────────┘
       │
       ▼
   Next.js SSR/ISR reads Parquet via DuckDB Lambda or pre-rendered JSON
```

## Setup

```bash
# 1. Install dbt-duckdb + deps
pip install dbt-duckdb==1.10.1 dbt-bouncer

# 2. Configure profile
cp profiles.yml.example ~/.dbt/profiles.yml   # or DBT_PROFILES_DIR=. locally

# 3. Set env vars (see real-estate-platform/apps/premium-site/.env.local for values)
export RDS_HOST=...
export RDS_USER=rlsir_admin
export RDS_PASSWORD=...
export RDS_DATABASE=rlsir_platform

# 4. Install packages
dbt deps

# 5. Build everything
dbt build --target dev    # ~30s for full pipeline
```

## Daily commands

```bash
dbt run --target dev                                # build only, no tests
dbt test --target dev                               # tests only, no build
dbt build --target dev                              # both, in DAG order
dbt run --select tag:analytics --target dev         # only analytics marts
dbt source freshness --target dev                   # check ARMLS sync staleness
dbt build --select state:modified+ --defer \         # CI mode: only changed + dependents
  --state ./prod-manifest --target ci
dbt-bouncer --dbt-artifacts-dir target              # convention checks
```

## Documentation + lineage (HTML)

dbt's built-in docs generator produces a clickable lineage graph + column documentation
for every model. Wired into the build pipeline; published to S3+CloudFront after every prod run.

```bash
# Generate locally
dbt docs generate --target dev
dbt docs serve --port 8081     # opens browser at http://localhost:8081

# In production, the rlsir-dbt-run Lambda runs `dbt docs generate` after a
# successful build and uploads target/* to:
aws s3 sync target/ s3://rlsir-platform-assets-us-east-1/analytics/_docs/dbt/ \
  --cache-control "max-age=600" --acl bucket-owner-full-control
```

CloudFront serves it at `https://cdn.echelonpoint.com/analytics/_docs/dbt/index.html`
(internal — gated by IP allowlist). Anyone modifying the project can check blast radius
via the lineage graph before merging.

## Elementary Data — observability

Persists test result history + anomaly detection. See `macros/elementary_setup.md`.

```bash
edr report --target prod                            # generate HTML report
edr monitor --aws-sns-topic <topic-arn>             # send alerts on failures + anomalies
dbt run-operation elementary.run_anomaly_tests \    # anomaly check on flagged metrics
  --target prod
```

## Layer responsibilities

| Layer | Materialization | What goes here | What does NOT go here |
|---|---|---|---|
| staging | view | 1:1 type casts, snake_case rename, NULLIF '' | business logic, joins, aggregations |
| intermediate | table (microbatch incremental) | cleaning rules, joins between sources, derived columns | calendar spines, dashboard formatting |
| marts/analytics | external Parquet | calendar-spined facts, dashboard-ready aggregates | raw transactional data |
| marts/internal | external Parquet | broker-only / gated reports | anything appearing on public pages |

## Conventions

- `stg_<source>__<table>` — staging
- `int_<entity>_<verb>_<context>` — intermediate
- `fct_<entity>` (plural) / `dim_<entity>` — marts
- Time grain in `meta:` not in filename when unambiguous
- Calendar spine + sample-size + confidence band on every monthly mart
- Source freshness: 6 h warn / 24 h error on `armls.listing_records`
- All silver rejects routed to `int_listings_quarantine` with `reject_reason`
- All marts carry `gold_built_at` provenance column

## Tests

Three tiers:

1. **Generic** — `unique`, `not_null`, `accepted_values`, `relationships`, `dbt_expectations.*`
   defined inline in `_<group>__models.yml` files
2. **Singular** — business-rule SQL files in `tests/`:
   - `no_calendar_gaps.sql` — every month from 2011-01 to current_month exists
   - `sum_by_city_matches_metro.sql` — cross-mart consistency within 1%
   - `percentile_ordering.sql` — p10 ≤ median ≤ p90
3. **Unit** — fixture-based logic tests in `models/**/_*.yml` `unit_tests:` blocks (dbt 1.8+)

## Conventions enforcement

`.dbtbouncer.yml` runs in CI to block PRs that violate naming, materialization,
or test-coverage rules. See [dbt-bouncer docs](https://godatadriven.github.io/dbt-bouncer/).

## Source-of-truth doc

Architectural rationale and analytics catalog live in
[`docs/closed-listings-etl-strategy.md`](../docs/closed-listings-etl-strategy.md).
