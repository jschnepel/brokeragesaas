# Yong2 Leads + Analytics Data Architecture

**Date:** 2026-04-29
**Owner:** Joey Schnepel
**Status:** Plan locked on lakehouse architecture (see §3). Awaiting decisions on §9 before P1 starts.
**Scope:** A hybrid data platform for yong2 — PostgreSQL on the existing AWS RDS instance for the operational lead store, and the shared S3/dbt/DuckDB-WASM lakehouse for behavioral analytics, attribution, and marketing ROI.
**Related:**
- `docs/superpowers/specs/2026-04-24-yong2-redesign-design.md` — site spec
- `docs/superpowers/plans/2026-04-24-yong2-redesign.md` — frontend implementation plan
- `docs/superpowers/plans/2026-04-29-yong2-leads-analytics-lakehouse-integration.md` — bridge doc explaining the lakehouse mapping
- `real-estate-platform/docs/analytics-comprehensive-plan.md` — master lakehouse architecture (listings analytics)

---

## 1. Summary

A hybrid medallion architecture for yong2:

- **Postgres (RDS) — operational tier**
  - System of record for leads (`leads.*`): leads, lifecycle, communications, listing engagement.
  - Campaign master (`marketing.campaigns`, `marketing.campaign_spend`).
  - Compliance/audit (`audit.*`).
  - GDPR right-to-delete reduces to a single `DELETE … CASCADE`.

- **S3 + dbt + DuckDB-WASM — analytical tier**
  - Browser events, sessions, pageviews, visitors, and attribution touches land in **S3 bronze** (NDJSON.gz, Hive-partitioned).
  - **dbt staging + intermediate models** (DuckDB target) replace the v1 plan's PL/pgSQL triggers — session synthesis, visitor aggregation, attribution-touch derivation.
  - **dbt marts** (external Parquet on S3) replace v1's pg_cron-refreshed PG materialized views: `fct_yong2_daily_metrics`, `fct_yong2_campaign_roi`, `fct_yong2_lead_attribution` (5 attribution models side-by-side).
  - **`/admin/metrics`** dashboard runs DuckDB-WASM in the browser against the Parquet marts — zero round-trips after the initial Parquet fetch.
  - **Same dbt project, same DuckDB target, same governance** as the listings analytics already running on this lakehouse.

For a single-agent luxury site where one closed deal is $50k–$250k commission, the cost of mis-attribution is catastrophic. This architecture makes attribution truthful (5 models), lead quality measurable, and outcomes traceable — without standing up a parallel PG-native analytics stack alongside the lakehouse.

## 2. Goals & non-goals

**Goals**

- Single source of truth for leads (PG), independent of PostHog or the CRM (Follow Up Boss).
- Multi-touch attribution stored as raw touches; 5 models recomputed at query time so adding a new model is purely a dbt change, not a migration.
- Comprehensive metrics catalog covering acquisition → engagement → conversion → quality → lifecycle → ROI.
- Privacy-first: hashed PII outside `leads.leads`, partition-based retention on event bronze, GDPR/CCPA right-to-delete reduces to a single PG `CASCADE` plus an S3 redaction job for `anon_id`.
- Reuse the listings analytics scaffolding — Elementary observability, dbt-bouncer governance, freshness macro, browser DuckDB-WASM bootstrap.

**Non-goals for v1**

- A custom BI tool. The DuckDB-WASM browser dashboard is enough; bring in Metabase/Superset later if needed.
- Sub-minute real-time dashboards. Hourly dbt run is sufficient at solo-agent volume.
- Cross-domain identity stitching beyond `yong2_anon_id` + `email_hash`.
- Predictive ML lead scoring. The deterministic 10-signal rubric is plenty for v1.
- Server-side ad-platform CAPI ingestion. The schema supports it, but the integration is deferred.

## 3. Architecture overview

```
Browser ──POST /api/track──►  Edge Function ──► s3://.../bronze/yong2/events/sync_year=YYYY/...
                                                          │
                                                          ▼
                                          (dbt schedule — hourly)
                                                          │
                              ┌───────────────────────────┼───────────────────────────┐
                              ▼                           ▼                           ▼
              models/staging/yong2/        models/intermediate/yong2/         models/marts/yong2/
              stg_yong2__events            int_yong2_pageviews                fct_yong2_daily_metrics
              stg_yong2__leads             int_yong2_sessions                 fct_yong2_campaign_roi
              stg_yong2__communications    int_yong2_visitors                 fct_yong2_lead_attribution
              stg_yong2__status_history    int_yong2_attribution_touches      fct_yong2_listing_engagement
                                           int_yong2_lead_journey             dim_yong2_visitors
                                                                              dim_yong2_campaigns

Browser ──POST /api/contact──► Next.js handler ─┬─► [1] PG transaction:
                                                 │      INSERT leads.leads, status_history, lead_listing_views
                                                 │
                                                 └─► [2] After commit, fire-and-forget event to bronze
                                                        bronze/yong2/events/ (event_name='contact_form_submitted')

PG (RDS) — operational store:
   leads.{leads, status_history, communications, lead_listing_views}
   marketing.{campaigns, campaign_spend}
   audit.*

Nightly Lambda:
   PG (latest 7 days of leads.leads) ──► s3://.../bronze/yong2/leads/sync_year=YYYY/...snapshot.parquet
   (hashed columns only — full PII never leaves PG)

S3 marts ──► /admin/metrics page (DuckDB-WASM in browser)
```

**Schema separation:**

| Schema / S3 prefix | Purpose | Update cadence | Read pattern |
|---|---|---|---|
| `bronze/yong2/events/` (S3) | Append-only NDJSON.gz event store. Every interaction the site captures. | Streaming (per-event edge write) | dbt staging via `read_json_auto` + `hive_partitioning` |
| `bronze/yong2/leads/` (S3) | Nightly snapshot of `leads.leads` for analytics joins (hashed cols only). | Nightly (CDC Lambda) | dbt staging via `read_parquet` |
| `analytics/yong2/` (S3 marts) | Gold Parquet — daily metrics, campaign ROI, attribution, listing engagement. | Hourly dbt run | Browser DuckDB-WASM, /admin/metrics |
| `leads.*` (PG) | Lead entity + lifecycle + communications. System of record. | Transactional (per submission, per status change) | Operational dashboards, CRM sync |
| `marketing.{campaigns, campaign_spend}` (PG) | Campaign master + manual CSV spend ingest. | Transactional (admin upload) | Joined to mart in dbt |
| `audit.*` (PG) | Compliance trail — consent, status changes, schema migrations | Append-only | Subpoena, never deleted |

## 4. Schema design

### 4.1 `bronze/yong2/events/` — append-only event store on S3

`/api/track` (server-side proxy) writes a row per event to bronze. Each row carries promoted props for hot-path filtering (`listing_key`, `community_slug`, `page_type`) and a free-form `props` jsonb for everything else.

Row contract:

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
  "term": "scottsdale luxury",
  "content": null,
  "referrer": "https://www.google.com/",
  "landing_path": "/communities/desert-mountain",
  "gclid": "abc123",
  "fbclid": null,
  "msclkid": null,
  "ttclid": null,

  "device_class": "desktop",
  "browser": "chrome",
  "os": "macos",
  "user_agent": "Mozilla/5.0 ...",
  "ip_country": "US",
  "ip_region": "AZ",
  "ip_city": "Scottsdale",

  "props": { "max_scroll_pct": 87, "time_on_page_ms": 124000, "gallery_opens": 3 },

  "sync_run_id": "uuid",
  "sync_observed_at": "2026-04-29T12:34:57.012Z",
  "bronze_written_at": "2026-04-29T12:34:57.123Z"
}
```

Storage layout:

```
s3://rlsir-platform-assets-us-east-1/bronze/yong2/events/
├── sync_year=2026/sync_month=04/sync_day=29/page_000001.ndjson.gz
├── sync_year=2026/sync_month=04/sync_day=29/page_000002.ndjson.gz
└── _freshness.json
```

The edge function buffers up to 100 events / 30 s / 256 KB and flushes as one NDJSON.gz file. Per-event latency ≤ 200 ms (returns 204 once buffered). Bronze visibility ≤ 30 s.

### 4.2 `bronze/yong2/leads/` — nightly snapshot of leads.leads

A new Lambda `rlsir-yong2-leads-cdc` runs daily at 02:00 UTC and exports the last 7 days of `leads.leads` (hashed columns only) to Parquet:

```sql
COPY (
  SELECT id, anon_id, email_hash, phone_hash,
         interest, status, lead_score, score_band,
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

Full PII (email, phone, name, message) **never leaves PG**. The 7-day lookback covers status changes / outcome updates after submission. dbt's `stg_yong2__leads` deduplicates by `lead_id` keeping `MAX(updated_at)` (SCD-type-1 latest).

`leads.communications` and `leads.status_history` are exported via the same nightly job into `bronze/yong2/communications/` and `bronze/yong2/status_history/` for funnel analytics.

### 4.3 dbt staging — `models/staging/yong2/`

Reads bronze, deduplicates, enforces types. All staging models materialize as `table` (not view) so the bronze scan runs once per dbt run, not per downstream reference.

| Model | Source | Notes |
|---|---|---|
| `stg_yong2__events.sql` | `bronze/yong2/events/` (NDJSON.gz, hive_partitioning) | Promoted typed cols; `props` stays jsonb |
| `stg_yong2__leads.sql` | `bronze/yong2/leads/` (Parquet snapshot) | `MAX(updated_at)` per `lead_id` for SCD-1 latest |
| `stg_yong2__communications.sql` | `bronze/yong2/communications/` | Append-only, dedup by `id` |
| `stg_yong2__status_history.sql` | `bronze/yong2/status_history/` | Append-only, dedup by `id` |

### 4.4 dbt intermediate — `models/intermediate/yong2/`

Replaces the v1 plan's PL/pgSQL triggers and `analytics.{sessions, pageviews, visitors, attribution_touches}` PG tables. All intermediate models are `incremental` with `merge` strategy on a watermark column.

| Model | Watermark | Logic |
|---|---|---|
| `int_yong2_pageviews.sql` | `occurred_at` | Filter `event_name = '$pageview'`; promote page_type, listing_key, community_slug; carry session_id, anon_id, time_on_page_ms, max_scroll_pct |
| `int_yong2_sessions.sql` | `started_at` | Synthesize sessions: 30-min idle gap closes a session. Aggregates: pageviews, active_ms, max_scroll_pct, listings_viewed, communities_viewed, contact_form_*, exit_path |
| `int_yong2_visitors.sql` | `last_seen_at` | One row per anon_id. Lifecycle aggregates + first-touch attribution (immutable after first set), latest device/geo |
| `int_yong2_attribution_touches.sql` | `occurred_at` | Every utm/click_id arrival is a row. Channel + source + medium + campaign + click IDs |
| `int_yong2_lead_journey.sql` | `lead_id` change | Joins leads ↔ visitors ↔ touches at lead grain. Powers attribution mart |

Same dbt patterns as the listings analytics intermediate models — `unique_key`, `merge` strategy, `on_schema_change='append_new_columns'`.

### 4.5 dbt marts — `models/marts/yong2/` (gold)

External Parquet on S3 under `s3://rlsir-platform-assets-us-east-1/analytics/yong2/{mart}.parquet`, zstd-compressed. Browser fetches the relevant Parquet on `/admin/metrics` page load.

| Mart | Grain | Replaces (v1) |
|---|---|---|
| `fct_yong2_daily_metrics.sql` | (day, channel, source, campaign) | `marketing.daily_metrics` MV |
| `fct_yong2_campaign_roi.sql` | (campaign_id) | `marketing.campaign_roi` MV |
| `fct_yong2_lead_attribution.sql` | (lead_id, model, channel, source, campaign) — 5 models | `marketing.lead_attribution` table |
| `fct_yong2_listing_engagement.sql` | (listing_key, day) | new — listing-level inquiry funnel |
| `dim_yong2_visitors.sql` | latest visitor row, joined to lead when converted | `analytics.visitors` (latest snapshot for dashboard) |
| `dim_yong2_campaigns.sql` | campaign master + cumulative spend | `marketing.campaigns` joined |

### 4.6 `leads.leads` — central business entity (PG)

One row per submission. **Unchanged from the operational design** — full PII columns + lifecycle + scoring + compliance audit fields all live in PG.

```sql
CREATE TABLE leads.leads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Anonymous → known stitching
  anon_id              uuid NOT NULL,
  posthog_distinct_id  text,                -- sha256(email)

  -- Identity (PII — never leaves PG)
  name                 text  NOT NULL,
  email                citext NOT NULL,
  email_hash           text  NOT NULL,      -- sha256(lower(trim(email)))
  phone                text  NOT NULL,
  phone_e164           text,                -- normalized via libphonenumber-js
  phone_hash           text,                -- sha256(e164 sans +)

  -- Submission
  interest             text NOT NULL CHECK (interest IN ('Buying','Selling','Both','Info')),
  message              text NOT NULL,
  submitted_via        text NOT NULL DEFAULT 'contact_form'
                          CHECK (submitted_via IN ('contact_form','email','phone','referral','manual')),
  listing_mls_id       text,
  listing_slug         text,

  -- First-touch attribution (immutable after creation, snapshot from analytics.visitors at submit time)
  first_channel        text,
  first_source         text,
  first_medium         text,
  first_campaign       text,
  first_term           text,
  first_content        text,
  first_referrer       text,
  first_landing_path   text,
  first_gclid          text,
  first_fbclid         text,
  first_msclkid        text,
  first_ttclid         text,
  first_seen_at        timestamptz,

  -- Last-touch attribution (immutable after creation)
  last_channel         text,
  last_source          text,
  last_medium          text,
  last_campaign        text,
  last_referrer        text,
  last_landing_path    text,
  last_gclid           text,
  last_fbclid          text,
  last_msclkid         text,
  last_ttclid          text,
  last_seen_at         timestamptz,

  -- Behavioral snapshot at submission (pulled from current dim_yong2_visitors at insert time)
  session_count        integer,
  span_days            numeric(8,2),
  page_count           integer,
  listing_views        integer,
  unique_listings_viewed integer,
  max_listing_price    numeric(14,2),
  min_price_filter     numeric(14,2),
  favorited_count      integer,
  total_active_ms      bigint,

  -- Scoring
  lead_score           smallint NOT NULL CHECK (lead_score BETWEEN 0 AND 100),
  score_band           text     NOT NULL CHECK (score_band IN ('hot','warm','cool','cold')),
  score_breakdown      jsonb    NOT NULL,
  score_version        integer  NOT NULL DEFAULT 1,

  -- Compliance audit trail
  consent_disclosure_text text NOT NULL,
  consent_sms_opt_in      boolean NOT NULL DEFAULT FALSE,
  consent_captured_at     timestamptz NOT NULL,
  consent_ip              inet,
  consent_user_agent      text,

  -- Anti-bot signals
  honeypot_clean       boolean NOT NULL DEFAULT TRUE,
  turnstile_ok         boolean,

  -- Email-domain meta
  email_domain         text,
  email_disposable     boolean NOT NULL DEFAULT FALSE,
  email_free_provider  boolean NOT NULL DEFAULT FALSE,

  -- Lifecycle
  status               text NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new','contacted','qualified','nurture','opportunity','won','lost','cold','spam','duplicate')),
  status_changed_at    timestamptz NOT NULL DEFAULT now(),

  -- Outcome (set when won/lost)
  closed_at            timestamptz,
  deal_value           numeric(14,2),
  commission           numeric(12,2),

  -- CRM sync state
  fub_person_id        bigint,
  fub_synced_at        timestamptz,

  -- Cadence
  last_contact_at      timestamptz,
  next_followup_at     timestamptz,
  goes_cold_at         timestamptz,

  notes                text,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_leads_email_active ON leads.leads(email_hash)
  WHERE status NOT IN ('spam','duplicate');
CREATE INDEX idx_leads_anon          ON leads.leads(anon_id);
CREATE INDEX idx_leads_phone_hash    ON leads.leads(phone_hash);
CREATE INDEX idx_leads_status        ON leads.leads(status, lead_score DESC);
CREATE INDEX idx_leads_band          ON leads.leads(score_band, created_at DESC);
CREATE INDEX idx_leads_first_channel ON leads.leads(first_channel, created_at DESC);
CREATE INDEX idx_leads_first_camp    ON leads.leads(first_campaign);
CREATE INDEX idx_leads_created       ON leads.leads(created_at DESC);
CREATE INDEX idx_leads_goes_cold     ON leads.leads(goes_cold_at)
  WHERE status NOT IN ('won','lost','spam','duplicate');
CREATE INDEX idx_leads_followup      ON leads.leads(next_followup_at)
  WHERE next_followup_at IS NOT NULL;
CREATE INDEX idx_leads_listing       ON leads.leads(listing_mls_id) WHERE listing_mls_id IS NOT NULL;
CREATE INDEX idx_leads_breakdown     ON leads.leads USING GIN (score_breakdown);
```

### 4.7 Supporting `leads.*` tables (PG)

Unchanged — these are operational, transactional, audit-required.

```sql
-- Status transition log (append-only)
CREATE TABLE leads.status_history (
  id            bigserial PRIMARY KEY,
  lead_id       uuid NOT NULL REFERENCES leads.leads(id) ON DELETE CASCADE,
  from_status   text,
  to_status     text NOT NULL,
  changed_at    timestamptz NOT NULL DEFAULT now(),
  changed_by    text,
  note          text
);
CREATE INDEX idx_status_history_lead ON leads.status_history(lead_id, changed_at DESC);

-- Communications log
CREATE TABLE leads.communications (
  id           bigserial PRIMARY KEY,
  lead_id      uuid NOT NULL REFERENCES leads.leads(id) ON DELETE CASCADE,
  channel      text NOT NULL CHECK (channel IN ('email','sms','call','in_person','meeting','note')),
  direction    text NOT NULL CHECK (direction IN ('inbound','outbound')),
  occurred_at  timestamptz NOT NULL,
  subject      text,
  body         text,
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_comm_lead ON leads.communications(lead_id, occurred_at DESC);

-- Lead-to-listing engagement (snapshot from bronze events at submission time)
CREATE TABLE leads.lead_listing_views (
  lead_id          uuid NOT NULL REFERENCES leads.leads(id) ON DELETE CASCADE,
  listing_key      text NOT NULL,
  first_viewed_at  timestamptz NOT NULL,
  last_viewed_at   timestamptz NOT NULL,
  view_count       integer NOT NULL DEFAULT 1,
  total_ms         bigint  NOT NULL DEFAULT 0,
  favorited        boolean NOT NULL DEFAULT FALSE,
  PRIMARY KEY (lead_id, listing_key)
);
CREATE INDEX idx_lead_listings_listing ON leads.lead_listing_views(listing_key);
```

### 4.8 `marketing.campaigns` + `marketing.campaign_spend` (PG)

Campaign master + daily-grain spend stay in PG. Manual CSV upload UI inserts into `campaign_spend`. Google/Meta Ads API sync deferred to v2. dbt staging `stg_yong2__campaigns` reads these into the marts via the standard `dbt_utils.connection` Postgres source.

```sql
CREATE TABLE marketing.campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        text NOT NULL CHECK (platform IN
                  ('google_ads','meta_ads','bing_ads','tiktok_ads','linkedin_ads','email','organic_seo','direct','other')),
  external_id     text,
  name            text NOT NULL,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,

  started_at      timestamptz,
  ended_at        timestamptz,
  objective       text,           -- lead_gen|awareness|retargeting
  target_audience text,

  daily_budget    numeric(10,2),
  total_budget    numeric(12,2),

  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_campaigns_external ON marketing.campaigns(platform, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_campaigns_utm ON marketing.campaigns(utm_source, utm_medium, utm_campaign);

CREATE TABLE marketing.campaign_spend (
  id           bigserial PRIMARY KEY,
  campaign_id  uuid NOT NULL REFERENCES marketing.campaigns(id) ON DELETE CASCADE,
  spend_date   date NOT NULL,
  impressions  bigint,
  clicks       bigint,
  spend        numeric(10,2) NOT NULL,
  currency     text NOT NULL DEFAULT 'USD',
  UNIQUE (campaign_id, spend_date)
);
```

### 4.9 `fct_yong2_lead_attribution` — multi-touch model results (dbt mart)

One row per (lead_id, model, channel, source, campaign) tuple. Recomputed every dbt run — adding a new model is a CTE + UNION ALL change, not a migration.

Implementation sketch (full SQL in `models/marts/yong2/fct_yong2_lead_attribution.sql`):

```sql
{{ config(materialized='external', location="s3://.../analytics/yong2/lead_attribution.parquet") }}

WITH journey AS (
  SELECT lead_id, ARRAY_AGG(touch ORDER BY occurred_at) AS touches
  FROM {{ ref('int_yong2_lead_journey') }}
  GROUP BY 1
),
first_touch AS (
  SELECT lead_id, 'first_touch' AS model,
         touches[1].channel, touches[1].source, touches[1].campaign,
         1.0::NUMERIC(5,4) AS weight
  FROM journey
),
last_touch AS (
  SELECT lead_id, 'last_touch' AS model,
         touches[ARRAY_LENGTH(touches,1)].channel,
         touches[ARRAY_LENGTH(touches,1)].source,
         touches[ARRAY_LENGTH(touches,1)].campaign,
         1.0::NUMERIC(5,4)
  FROM journey
),
linear AS (
  SELECT lead_id, 'linear' AS model, t.channel, t.source, t.campaign,
         (1.0 / ARRAY_LENGTH(touches,1))::NUMERIC(5,4)
  FROM journey, UNNEST(touches) AS t
),
time_decay AS ( /* half-life=7d weights */ ),
position_based AS ( /* 40/40/20 over (first, middle, last) */ )

SELECT * FROM first_touch
UNION ALL SELECT * FROM last_touch
UNION ALL SELECT * FROM linear
UNION ALL SELECT * FROM time_decay
UNION ALL SELECT * FROM position_based
```

`attributed_value` and `attributed_commission` are computed by joining to `leads.leads.deal_value` / `commission` (via `stg_yong2__leads`).

### 4.10 dbt marts — `fct_yong2_daily_metrics` + `fct_yong2_campaign_roi`

These two power 90% of dashboards. Refreshed each hourly dbt run. Materialized as external Parquet on S3.

`fct_yong2_daily_metrics` grain: (day, channel, source, campaign). Derived from `int_yong2_sessions` joined to `int_yong2_visitors`. Columns include visitors, new_visitors, sessions, pageviews, avg_pages_per_session, avg_active_seconds, avg_max_scroll_pct, bounce_rate, listing_views, contact_views, form_submissions, conversion_rate.

`fct_yong2_campaign_roi` grain: (campaign_id). Joins `dim_yong2_campaigns` (PG-sourced) with `int_yong2_sessions`, `stg_yong2__leads`, `fct_yong2_lead_attribution`. Columns include total_spend, total_impressions, total_clicks, visitors, leads, quality_leads (hot/warm score band), closed_deals, attributed_revenue (per model), net_commission, ROAS, cost_per_lead.

## 5. Comprehensive metrics catalog

Every metric is queryable from §4 without ETL changes. Sources moved to dbt models (was PG tables/views in v1) but the metric definitions are unchanged.

### 5.1 Acquisition (top of funnel)

| Metric | Source | Cut by |
|---|---|---|
| Unique visitors | `dim_yong2_visitors` | day / week / month |
| New vs returning | `dim_yong2_visitors.session_count` | day, channel |
| Sessions per visitor | `int_yong2_sessions / dim_yong2_visitors` | channel, geo |
| Channel mix | `int_yong2_sessions.channel` | day, week, month |
| Source mix | `int_yong2_sessions.source` | channel-bucketed |
| Top campaigns | `int_yong2_sessions.campaign` | by sessions, by leads |
| Geographic distribution | `int_yong2_sessions.ip_country/region/city` | choropleth, top-N |
| Device class | `int_yong2_sessions.device_class` | mobile vs desktop conversion |
| Browser / OS | `int_yong2_sessions.browser/os` | for compatibility QA |
| Landing page distribution | `int_yong2_sessions.landing_path` | which pages catch traffic |

### 5.2 Engagement (mid-funnel)

| Metric | Source | Cut by |
|---|---|---|
| Pages per session | `int_yong2_sessions.page_count` | avg / median / p90 |
| Active time per session | `int_yong2_sessions.active_ms` | avg / median / p90 |
| Scroll-depth distribution | `int_yong2_sessions.max_scroll_pct` | histogram by `page_type` |
| Bounce rate | `int_yong2_sessions.page_count = 1` | by channel/landing |
| Listing views per session | `int_yong2_sessions.listings_viewed` | avg, distribution |
| Unique listings viewed per visitor | `dim_yong2_visitors.unique_listings_viewed` | percentile |
| Communities viewed | `int_yong2_sessions.communities_viewed` | engagement signal |
| Market reports read | `int_yong2_sessions.market_reports_viewed` | content-quality signal |
| Search query volume | `stg_yong2__events WHERE event_name='search_query'` | per session, per day |
| Filter applications | `int_yong2_sessions.filter_changes` | which filters move the needle |
| Map polygon draws | `stg_yong2__events WHERE event_name='map_polygon_draw_complete'` | high-intent signal |
| Gallery opens per listing | `stg_yong2__events WHERE event_name='gallery_open' AND listing_key IS NOT NULL` | listing engagement quality |
| Return-visitor rate (7/14/30/60/90d) | `dim_yong2_visitors.session_count` over time spreads | cohort retention |

### 5.3 Listing performance (catalog-side)

| Metric | Source | Action |
|---|---|---|
| Views per listing | `fct_yong2_listing_engagement` | identify dormant listings |
| Unique viewers per listing | distinct `(anon_id, listing_key)` from staging | demand pulse |
| Avg time on listing | `int_yong2_pageviews.time_on_page_ms` per listing | content quality |
| Gallery engagement per listing | `stg_yong2__events WHERE event_name='gallery_open'` | photo-set quality |
| Inquiries per listing | `stg_yong2__leads WHERE listing_mls_id=...` | which listings drive contacts |
| Days from listing → first inquiry | `MIN(stg_yong2__leads.created_at) - listing.list_date` | velocity |
| Listings → closed deals | `leads.lead_listing_views ⋈ stg_yong2__leads WHERE status='won'` | which exposures convert |

### 5.4 Conversion (bottom of funnel)

| Metric | Source |
|---|---|
| Contact form views | `int_yong2_sessions.contact_form_viewed = true` |
| Form starts (focus_first) | `stg_yong2__events WHERE event_name='contact_form_focus_first'` |
| Field completion rate per field | `stg_yong2__events WHERE event_name='contact_form_field_complete'` group by field |
| Field abandonment per field | `_field_drop` vs `_field_complete` deltas |
| Submission rate overall | `int_yong2_sessions.contact_form_submitted / .contact_form_viewed` |
| Submission rate by channel/campaign/source | `int_yong2_sessions ⋈ stg_yong2__leads.first_*` |
| Time-to-conversion | `stg_yong2__leads.created_at - dim_yong2_visitors.first_seen_at` distribution |
| Sessions-to-conversion | `stg_yong2__leads.session_count` distribution |
| Conversion by score band | `stg_yong2__leads.score_band × .status` |

### 5.5 Lead quality

| Metric | Source |
|---|---|
| Lead score distribution | `stg_yong2__leads.lead_score` histogram |
| Score by channel | `stg_yong2__leads.lead_score` group by `first_channel` |
| Hot-lead rate | `% leads WHERE score_band='hot'` per channel |
| Lead-to-opportunity rate | `% leads.status='opportunity' / leads.created` |
| Lead-to-close rate | `% leads.status='won'` |
| Avg deal value by channel | `AVG(stg_yong2__leads.deal_value)` |
| Avg commission by channel | `AVG(stg_yong2__leads.commission)` |
| CPL (cost per lead) by campaign | `marketing.campaign_spend.spend / count(leads.first_campaign=...)` |
| CAC (customer acquisition cost) | `marketing.campaign_spend.spend / count(leads.status='won' AND first_campaign=...)` |
| Time-to-call (response SLA) | `MIN(stg_yong2__communications.occurred_at WHERE direction='outbound') - leads.created_at` |

### 5.6 Attribution

| Metric | Source |
|---|---|
| First-touch revenue/leads by channel | `fct_yong2_lead_attribution WHERE model='first_touch'` |
| Last-touch revenue/leads by channel | `fct_yong2_lead_attribution WHERE model='last_touch'` |
| Linear-attributed | `model='linear'` |
| Time-decay-attributed | `model='time_decay'` |
| Position-based (40/40/20) | `model='position_based'` |
| Path length distribution | `COUNT(int_yong2_attribution_touches) GROUP BY anon_id` |
| Days from first touch to conversion | `stg_yong2__leads.created_at - .first_seen_at` |
| Touches before conversion | `COUNT(int_yong2_attribution_touches WHERE anon_id IN converters)` |
| Cross-model comparison | full pivot of all 5 models per channel |

### 5.7 Lifecycle / cohort

| Metric | Source |
|---|---|
| Lead → MQL time | `stg_yong2__status_history WHERE to_status='qualified'` |
| MQL → SQL time | consecutive `status_history` transitions |
| SQL → opportunity | same |
| Opportunity → close | same |
| Stage conversion rates | drop-off per status transition |
| Cohort retention (anon visitors) | `dim_yong2_visitors GROUP BY DATE_TRUNC('week', first_seen_at)`, count returning |
| Acquisition-channel cohort LTV | cohort × `stg_yong2__leads.commission` |

### 5.8 Marketing campaign performance

| Metric | Source |
|---|---|
| Campaign spend (daily) | `marketing.campaign_spend.spend` |
| Impressions / clicks / CTR | `marketing.campaign_spend` |
| Visitors per campaign | `int_yong2_sessions.campaign` |
| Engaged visitors (>2min, >2 pages) | `int_yong2_sessions WHERE active_ms > 120000 AND page_count >= 2` |
| Leads per campaign | `stg_yong2__leads.first_campaign` |
| Hot leads per campaign | `stg_yong2__leads.first_campaign WHERE score_band='hot'` |
| Closed deals per campaign | `stg_yong2__leads.first_campaign WHERE status='won'` |
| Revenue per campaign | `fct_yong2_lead_attribution model='first_touch'` |
| ROAS | `attributed_commission / campaign_spend.spend` |
| Net commission | `commission - spend` |

## 6. ETL strategy

Two pipelines — operational (PG) and analytical (S3 + dbt + DuckDB-WASM).

| Pipeline | Trigger | Implementation |
|---|---|---|
| Browser event → bronze | Every event (`/api/track` POST) | Edge function buffers (100 events / 30s / 256KB) and flushes one NDJSON.gz file to `bronze/yong2/events/` |
| Form submission → `leads.leads` | `/api/contact` route | PG transaction: INSERT leads.leads + status_history + lead_listing_views (snapshot from bronze events at submit time) |
| Form submission → bronze event | After PG commit | Fire-and-forget event to bronze (`event_name='contact_form_submitted'`); non-blocking, logs to `sync_errors` if it fails |
| `leads.leads` → bronze CDC | Daily 02:00 UTC | Lambda `rlsir-yong2-leads-cdc`: `COPY (SELECT … updated_at >= CURRENT_DATE - 7) TO s3://.../bronze/yong2/leads/` (hashed cols only) |
| `leads.communications` → bronze | Daily 02:00 UTC | Same Lambda, separate prefix |
| `leads.status_history` → bronze | Daily 02:00 UTC | Same Lambda, separate prefix |
| dbt staging+intermediate+marts | Hourly (`@:05`) | `dbt build --select +tag:yong2` runs in shared analytics scheduler alongside listing analytics |
| Bronze partition lifecycle | S3 lifecycle policy | Expire `bronze/yong2/events/sync_year=*/sync_month=*/sync_day=*/` after 25 months |
| Campaign spend ingest | Manual CSV upload (v1); Ads API sync (v2) | `/admin/upload-spend` page parses CSV → `marketing.campaign_spend` |

No PostgreSQL triggers, no pg_cron jobs for analytics. The dbt scheduler is the single coordination point.

## 7. Privacy & retention

| Layer | Retention | Reason |
|---|---|---|
| `bronze/yong2/events/` (S3) | 25 months | rolling — dropped via S3 lifecycle policy on the date prefix |
| `bronze/yong2/leads/`, `communications/`, `status_history/` (S3) | 25 months | aligned with events; nightly snapshots |
| `analytics/yong2/*.parquet` marts (S3) | indefinite (small footprint) | overwritten each dbt run |
| `dim_yong2_visitors` (mart) | 25 months | aligned with events |
| `leads.leads` (PG) | indefinite | business records — required for tax/legal |
| `leads.communications` (PG) | indefinite | TCPA defensible-paper-trail |
| `leads.status_history` (PG) | indefinite | audit |
| `marketing.*` (PG) | indefinite | small, business-critical |

PII columns (`email`, `phone`, `name`, `message`) live in `leads.leads` only. Hashes (`email_hash`, `phone_hash`) propagate to bronze.

GDPR/CCPA right-to-delete:

```sql
-- 1. PG cascade
DELETE FROM leads.leads WHERE email_hash = $1;   -- ON DELETE CASCADE removes communications, status_history, lead_listing_views

-- 2. S3 redaction (one-shot Lambda — rare-enough)
-- Walks bronze/yong2/events/ for the email_hash's anon_id and rewrites NDJSON.gz files
-- to omit those rows. dbt full-refresh propagates to silver+gold on next run.
```

`dim_yong2_visitors` keeps the anon shell for analytics continuity but holds nothing identifying once `email_hash` and `lead_id` are nulled in the bronze rewrite.

## 8. Implementation phasing

| Phase | What | Effort |
|---|---|---|
| **P1: Operational core** | `leads.*` PG schema (leads, status_history, communications, lead_listing_views). Wire `/api/contact` to write `leads.leads` + supporting rows in one PG transaction. Score computation. CRM sync hooks (no FUB integration yet). | ~6 hrs |
| **P2: Bronze event ingest** | `/api/track` edge function with batched NDJSON.gz writes to `bronze/yong2/events/`. Same writer pattern as existing listing-bronze writer (`infra/lambda/bronze-writer.ts`). `_freshness.json` marker. Add yong2 source to `analytics/models/staging/yong2/_yong2__sources.yml`. | ~8 hrs |
| **P3: dbt staging + intermediate** | `stg_yong2__*` (4 models), `int_yong2_*` (5 models). Reuse incremental + merge patterns from listing analytics. Add `tag: yong2` for selective runs. dbt-bouncer rules for new models. | ~7 hrs |
| **P4: dbt marts + dashboard** | `fct_yong2_*`, `dim_yong2_*` (6 marts). `/admin/metrics` page reads Parquet via DuckDB-WASM (reuses listing-analytics scaffold). Add yong2 mart selectors + parquet split if needed. | ~7 hrs |
| **P5: Marketing layer** | `marketing.{campaigns, campaign_spend}` PG schemas + `/admin/upload-spend` CSV uploader. dbt `dim_yong2_campaigns` + `fct_yong2_campaign_roi`. | ~4 hrs |
| **P6: Leads CDC + nightly export** | Lambda `rlsir-yong2-leads-cdc` (rate(1 day) at 02:00 UTC) — `COPY` to `bronze/yong2/leads/`, `communications/`, `status_history/`. Adds yong2 to dbt source freshness checks. | ~3 hrs |
| **P7: CRM sync (Follow Up Boss)** | Bidirectional — `leads.leads` → FUB on insert/status change; FUB webhook → `leads.communications` + `leads.status_history`. | ~5 hrs |
| **P8: Geo + device enrichment** | IP → country/region/city via MaxMind GeoLite2 in `/api/track` edge function. UA parsing into `device_class`/`browser`/`os`. Both done at write time so bronze rows ship enriched. | ~3 hrs |

Total ~43 hours. P1–P4 (~28 hrs) is the minimum viable path — operational lead store + browser event ingest + analytical pipeline + dashboard. P5–P8 are progressive enhancements.

Versus v1 PG-native (~31 hrs), the lakehouse adds ~12 hrs of net effort but **avoids standing up a parallel analytics platform alongside the listing-analytics lakehouse**. Operationally the system is simpler: one dbt project, one DuckDB-WASM browser scaffold, one freshness-monitoring story.

## 9. Decisions to lock in before P1 starts

1. **Same RDS instance, or new one?** Same RDS — but for a smaller surface (just `leads.*`, `audit.*`, `marketing.{campaigns, campaign_spend}`). Analytics pressure is offloaded to S3+DuckDB. Existing pool config (`max: 5`, SSL, etc.) is already proven.

2. **`/api/track` server-side proxy now, or batch later?** Edge function with batched buffered writes to bronze (100 events / 30s / 256KB). Direct PostHog → bronze via webhook is possible as a follow-up but introduces a dependency on PostHog's webhook reliability. Server-side proxy is the right answer for solo-agent volume — no bottleneck concerns.

3. **dbt cadence for yong2 models?** Hourly aligned with the listings analytics dbt schedule. Operationally simpler; sufficient for solo-agent volume. Independent yong2 cadence (e.g. every 15 min) is a future option if dashboard freshness becomes a complaint.

4. **PostHog still in the loop?** Recommended yes for v1 — it's free at solo-agent volume, gives a fallback dashboard if `/admin/metrics` breaks, and provides session replay which the lakehouse doesn't. PostHog is **complementary**, not the system of record. Bronze events are the source of truth.

5. **Bronze events partitioning beyond date?** Hive partitioning by `sync_year/sync_month/sync_day` is sufficient. `event_name` partitioning would help certain queries but adds writer complexity; defer until needed.

## 10. Open questions

- **Geo enrichment vendor** — MaxMind GeoLite2 (free, requires monthly download refresh) vs ipapi.co paid API (~$1/day at peak). Pick before P8.
- **Device parsing library** — `ua-parser-js` (BSD, 80KB, mature) vs `bowser` (MIT, 30KB, smaller surface). Default to `ua-parser-js`.
- **Score breakdown schema versioning** — when the rubric changes (e.g. add an 11th signal), `score_version` bumps but old leads keep their original breakdown. Decide whether to backfill historical scores under the new rubric (probably not — would distort time-series).
- **Time-decay half-life** — research brief recommended 7 days. Confirm before P3.
- **CRM choice** — research brief recommends Follow Up Boss Grow ($69/mo). Confirm before P7.
- **DuckDB-WASM bundle size for `/admin/metrics`** — current listings dashboard ships ~5MB of WASM + per-mart Parquet. yong2 admin is gated, so bundle size is less sensitive than public listings, but worth measuring.

## 11. Out of scope (future work)

- Predictive ML lead scoring (replaces or augments the deterministic rubric).
- Sub-minute real-time dashboards.
- Cross-domain identity stitching beyond `email_hash`.
- Server-side ad-platform CAPI ingestion (Meta CAPI, Google Enhanced Conversions).
- A custom BI tool (Metabase/Superset) on top of the marts.
- Multi-agent / multi-site support — schema would need a `tenant_id` column on every table.
- Anonymous → known stitching for visitors who used a different device pre-conversion.
- Dynamic ad-spend pacing or budget reallocation based on `campaign_roi`.

---

**End of plan.**
