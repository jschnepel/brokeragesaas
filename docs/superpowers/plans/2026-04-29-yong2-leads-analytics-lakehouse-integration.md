# Yong2 Leads + Analytics — Lakehouse Integration

**Date:** 2026-04-29
**Owner:** Joey Schnepel
**Status:** Integration spec — bridges `2026-04-29-yong2-leads-analytics-data-architecture.md` (PG-native v1) onto the Bronze/Silver/Gold lakehouse defined in `real-estate-platform/docs/analytics-comprehensive-plan.md`.
**Why:** A single analytics platform (S3 + dbt + DuckDB-WASM) instead of one for listings and another for yong2 leads. Same Parquet marts, same browser-side query engine, same governance, same dashboard scaffold.

---

## 1. Architectural diff vs the v1 plan

| Layer | v1 (PG-native) | This integration (lakehouse) |
|---|---|---|
| Event ingest | `/api/track` → `analytics.events_raw` (PG-partitioned) | `/api/track` → S3 NDJSON.gz under `bronze/yong2/events/` |
| Session/pageview/visitor synthesis | PL/pgSQL `AFTER INSERT` triggers on `events_raw` | dbt incremental models (`int_yong2_sessions`, `int_yong2_visitors`, `int_yong2_pageviews`) |
| Attribution math | Nightly pg_cron recompute over `attribution_touches` | dbt mart `fct_yong2_lead_attribution` rebuilt hourly |
| Daily/campaign aggregates | Hourly `REFRESH MATERIALIZED VIEW CONCURRENTLY` | Hourly dbt run → external Parquet marts on S3 |
| `/admin/metrics` dashboard | Direct SQL against PG MVs | DuckDB-WASM querying Parquet marts (zero round-trips after initial load) |
| Lead store (`leads.*`) | PG (transactional, GDPR-compliant) | **unchanged — stays in PG** |
| Lead → bronze export | (n/a) | Nightly CDC: `leads.leads` snapshot → `bronze/yong2/leads/` Parquet for analytics joins |

The lead **system of record stays in PostgreSQL** — operational data, GDPR right-to-delete, audit trail, real-time CRM sync. Only the **analytical pull-throughs** move to the lakehouse.

## 2. What stays in Postgres

These tables remain exactly as designed in the v1 plan:

- `leads.leads` — central business entity, ON DELETE CASCADE for right-to-delete
- `leads.status_history` — append-only audit
- `leads.communications` — TCPA-defensible paper trail
- `leads.lead_listing_views` — populated transactionally on submission (snapshot of behavior)
- `audit.*` — compliance trail

Why: these are operational, low-volume (hundreds-to-thousands of rows), need ACID transactions, and have hard regulatory requirements that S3 doesn't meet by itself.

## 3. What moves to the lakehouse

### 3.1 Bronze (S3 NDJSON.gz, Hive-partitioned)

```
s3://rlsir-platform-assets-us-east-1/bronze/yong2/
├── events/sync_year=YYYY/sync_month=MM/sync_day=DD/page_NNNN.ndjson.gz   ← /api/track writes
├── leads/sync_year=YYYY/sync_month=MM/sync_day=DD/snapshot.parquet       ← nightly CDC of leads.leads
├── communications/sync_year=YYYY/sync_month=MM/sync_day=DD/snapshot.parquet
├── status_history/sync_year=YYYY/sync_month=MM/sync_day=DD/snapshot.parquet
└── _freshness.json
```

Bronze contract per row (events): the v1 `events_raw` schema with `sync_run_id`, `sync_observed_at`, `bronze_written_at` provenance columns added by the writer. Same pattern as `bronze/listings/`.

### 3.2 Silver (dbt staging + intermediate)

dbt project: `real-estate-platform/analytics/`. New models under `models/staging/yong2/` and `models/intermediate/yong2/`:

```
models/staging/yong2/
├── stg_yong2__events.sql              ← reads bronze/yong2/events with hive_partitioning + union_by_name
├── stg_yong2__leads.sql               ← reads bronze/yong2/leads (latest snapshot per lead_id via SCD2 dedup)
├── stg_yong2__communications.sql
└── stg_yong2__status_history.sql

models/intermediate/yong2/
├── int_yong2_pageviews.sql            ← parses pageview events with promoted page_type/listing_key/community_slug
├── int_yong2_sessions.sql             ← session synthesis (30-min idle timeout, same logic as v1's PL/pgSQL trigger)
├── int_yong2_visitors.sql             ← incremental aggregates per anon_id
├── int_yong2_attribution_touches.sql  ← every utm/click_id arrival as a row
└── int_yong2_lead_journey.sql         ← join leads ↔ visitors ↔ touches at lead grain
```

Materialization: same convention as listing analytics — staging is `table` (one bronze scan per dbt run), intermediate is `incremental` with `merge` strategy on `source_modification_ts`/`occurred_at` watermark.

### 3.3 Gold (dbt marts → external Parquet)

```
models/marts/yong2/
├── fct_yong2_daily_metrics.sql        ← (day, channel, source, campaign) grain — visitors, sessions, pageviews, conversion rate, engagement
├── fct_yong2_campaign_roi.sql         ← (campaign_id) grain — spend, leads, ROAS, CPL, attributed commission
├── fct_yong2_lead_attribution.sql     ← (lead_id, model, channel, source, campaign) — all 5 models materialized side-by-side
├── fct_yong2_listing_engagement.sql   ← (listing_key, day) — views, unique viewers, time-on-page, gallery opens, inquiries
├── dim_yong2_visitors.sql             ← latest visitor row, joined with first-touch attribution and lead_id when converted
└── dim_yong2_campaigns.sql            ← campaign master + cumulative spend
```

Output: external Parquet on S3 under `s3://rlsir-platform-assets-us-east-1/analytics/yong2/{mart}.parquet` (zstd-compressed). Browser fetches the relevant Parquet on `/admin/metrics` page load.

### 3.4 Browser query path

`/admin/metrics` → DuckDB-WASM. Lazy-load: fetch `fct_yong2_daily_metrics.parquet` first (covers 80% of dashboard tiles); on filter/drill-down, fetch additional marts on demand. Same pattern as the listing analytics dashboard.

## 4. Critical-path data flows

### 4.1 Pageview / event capture (high-volume, append-only)

```
Browser  ──POST /api/track──►  Edge Function (Vercel/Lambda@Edge)
                                       │
                                       ├─► validate + stamp anon_id, occurred_at, sync_run_id
                                       │
                                       └─► append-write to S3 NDJSON.gz buffer
                                                       │
                                                       └─► flush every 30s OR 100 events OR 256KB
                                                                ▼
                                                  s3://.../bronze/yong2/events/sync_year=YYYY/.../page_NNNN.ndjson.gz
```

Single-event latency: write succeeds ≤200ms (event lands in edge buffer, returns 204). Bronze visibility: ≤30s. dbt builds run hourly so silver/gold dashboards lag ≤1h, identical to listing analytics.

### 4.2 Lead submission (transactional + analytical mirror)

```
Browser  ──POST /api/contact──►  Next.js route handler
                                        │
                                        ├─► [1] PG transaction: INSERT INTO leads.leads + status_history + lead_listing_views
                                        │   (this is the system-of-record write; if it fails, the user gets an error)
                                        │
                                        └─► [2] After commit, fire-and-forget: write submission to bronze/yong2/events/
                                            event_name='contact_form_submitted', props={lead_id, score_band, ...}
                                            (analytical mirror; if it fails, log to sync_errors but don't fail the user request)
```

Why split: the lead is a business record (PG, ACID). The submission as an event is a touchpoint (S3, idempotent retry). One can fail without losing the other.

### 4.3 Nightly leads CDC export

A new Lambda `rlsir-yong2-leads-cdc` (rate(1 day) at 02:00 UTC):

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

7-day lookback covers status changes / outcome updates after submission. dbt's `stg_yong2__leads` deduplicates by `lead_id` keeping `MAX(updated_at)` (SCD-type-1 latest). The full PII (email, phone, name, message) **never leaves PG** — only hashes propagate.

### 4.4 Hourly dbt run

Same dbt project as listing analytics. Add a yong2 selector:

```bash
# Listing analytics (existing, hourly)
dbt build --select +tag:listings

# Yong2 analytics (new, hourly — runs in parallel)
dbt build --select +tag:yong2
```

Reuses the same `dbt_project.yml`, the same `profiles.yml` (DuckDB target with S3 IAM), the same dbt-bouncer governance, the same Elementary observability hooks. New tags `yong2` on each new model.

## 5. Attribution math — same model space, different runtime

The v1 plan's nightly pg_cron recompute of all 5 attribution models becomes a single dbt mart:

```sql
-- models/marts/yong2/fct_yong2_lead_attribution.sql
{{ config(materialized='external', location="s3://.../analytics/yong2/lead_attribution.parquet") }}

WITH journey AS (
  SELECT lead_id, ARRAY_AGG(touch ORDER BY occurred_at) AS touches
  FROM {{ ref('int_yong2_lead_journey') }}
  GROUP BY 1
),
first_touch AS (
  SELECT lead_id, 'first_touch' AS model, touches[1].channel, touches[1].source, touches[1].campaign,
         1.0::NUMERIC(5,4) AS weight
  FROM journey
),
last_touch AS (
  SELECT lead_id, 'last_touch' AS model, touches[ARRAY_LENGTH(touches,1)].channel, ..., 1.0::NUMERIC(5,4)
  FROM journey
),
linear AS (
  SELECT lead_id, 'linear' AS model, t.channel, t.source, t.campaign,
         (1.0 / ARRAY_LENGTH(touches,1))::NUMERIC(5,4) AS weight
  FROM journey, UNNEST(touches) AS t
),
time_decay AS ( ... half-life=7d weights ... ),
position_based AS ( ... 40/40/20 over (first, middle, last) ... )

SELECT * FROM first_touch
UNION ALL SELECT * FROM last_touch
UNION ALL SELECT * FROM linear
UNION ALL SELECT * FROM time_decay
UNION ALL SELECT * FROM position_based
```

Adding a new model = new CTE + UNION ALL. No backfill, no migration. Identical guarantees to v1 plan §4.9.

## 6. Privacy / retention — equivalent

| v1 plan retention | Lakehouse equivalent |
|---|---|
| `events_raw` 25-month rolling, partition pruning | S3 lifecycle policy on `bronze/yong2/events/` — expire after 25 months |
| `leads.*` indefinite | Unchanged (PG) |
| GDPR delete cascades | `DELETE FROM leads.leads WHERE email_hash=$1` (PG cascade); plus a one-shot S3 redaction job that strips `anon_id` rows from `bronze/yong2/events/` (rare-enough for a lambda invocation) |

PII never leaves Postgres. `email_hash` and `phone_hash` are the only identity tokens that propagate to bronze.

## 7. Phasing — adjusted from v1

| v1 phase | Lakehouse equivalent | Effort |
|---|---|---|
| **P1: Operational core** (`leads.*` PG schema, `/api/contact` writes) | **Unchanged** — leads stay in PG | ~6 hrs |
| **P2: Event ingestion** (`events_raw` PG-partitioned table + triggers) | **Replaced** — `/api/track` writes to S3 bronze; dbt staging+intermediate models replace the triggers | ~8 hrs (more code, but reuses the listings bronze writer pattern) |
| **P3: Marketing layer** (PG schemas + nightly pg_cron attribution) | **Replaced** — `marketing.campaigns` stays in PG (manual CSV upload UI); `fct_yong2_lead_attribution` mart replaces the pg_cron job | ~6 hrs |
| **P4: Materialized views + dashboard** (PG MVs + `/admin/metrics`) | **Replaced** — `fct_yong2_daily_metrics`, `fct_yong2_campaign_roi` marts; `/admin/metrics` queries Parquet via DuckDB-WASM | ~8 hrs (browser bundle setup is one-time) |
| **P5: CRM sync (Follow Up Boss)** | **Unchanged** — PG ↔ FUB | ~5 hrs |
| **P6: Geo + device enrichment** | **Moved earlier** — done at `/api/track` time before bronze write (geo is part of the event row, not enriched after) | ~3 hrs |

Total ~36 hrs (vs ~31 hrs for v1 PG-native). The +5 hr delta is the bronze writer + dbt model authoring; offset by reusing the listing-analytics dbt scaffolding (Elementary, bouncer, freshness macro, browser DuckDB-WASM bootstrapping).

## 8. Decisions still open

The three v1-plan questions remain, with adjusted answers:

1. **Same RDS instance, or new one?** Still recommend same RDS — but for a smaller surface (just `leads.*`, `audit.*`, `marketing.campaigns`, `marketing.campaign_spend`). Analytics pressure is offloaded to S3+DuckDB.
2. **`/api/track` server-side proxy?** Now writes to S3 bronze, not PG. Edge function batches events to keep per-call latency low. PostHog still optional alongside.
3. **events_raw partitioning?** No longer relevant — Hive-partitioning by `sync_year/sync_month/sync_day` on S3 replaces it.

New question:

4. **dbt schedule cadence for yong2 models?** Hourly to match listing analytics (single dbt run with `--select +tag:listings,+tag:yong2`), or independent yong2 cadence (e.g. every 15 min for fresher dashboards)? Recommend hourly aligned with listings — operationally simpler, sufficient for solo-agent volume.

## 9. Out of scope for this integration

- Predictive ML lead scoring (still v2)
- Real-time / sub-minute dashboards (Parquet+DuckDB-WASM is hourly-fresh by design)
- Cross-domain identity stitching beyond `email_hash`
- Server-side ad-platform CAPI ingestion
- Multi-tenant support (yong2 is single-agent)

Same exclusions as v1 plan §11.

---

**Net result:** one analytics platform, two domains (listings, yong2), shared dbt project, shared browser query engine, shared governance. The yong2 leads stay in PG where they belong; everything analytical lives in the same lakehouse as the listing analytics.
