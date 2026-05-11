# yong2 ↔ analytics infrastructure

How Yong's site (`yong2`, deployed on Amplify) reads dbt-built analytics marts
served from S3 via CloudFront. Captures the contract between the data layer
and the consumer so changes on either side don't break the other.

---

## Data flow (end-to-end)

```
ARMLS Spark API
  │
  ├─► Lambda rlsir-armls-sync (every 4 h)        ┐
  ├─► Fargate walker (continuous ~30 min loop)   ├─► RDS listing_records (db.t3.small)
  └─► Lambda rlsir-active-snapshot (every 1 h)   ┘   + listing_change_log

RDS listing_records + listing_change_log
  │
  ├─► Lambda rlsir-armls-parquet-export (every 4 h) ──► s3://…/bronze/parquet/*
  └─► Lambda rlsir-analytics-dbt (every 1 h, container)
        │
        └─► s3://rlsir-platform-assets-us-east-1/analytics/*.parquet
              │
              └─► CloudFront E3JUA9RU5MGWQV (1 h edge cache)
                    │
                    └─► yong2 lib/marts.ts → app/phoenix/lib/*-data.ts → page renders
```

Yong's site has **zero RDS dependency for analytics rendering.** Every Phoenix
KPI is computed by dbt-on-Lambda, written to S3, and served from edge cache.
Cold-start TTFB ~1–2 s; warm hits ~250–500 ms.

---

## What yong2 reads, and from where

### `lib/marts.ts` — the universal reader

```typescript
// yong2/lib/marts.ts
const CDN_BASE = "https://d12v6de1xwcjhk.cloudfront.net";

export async function readMart<T>(martName: string): Promise<T[]> {
  const res = await fetch(`${CDN_BASE}/${martName}.parquet`, {
    next: { revalidate: 3600 }, // Next.js fetch cache, matches dbt cadence
  });
  // hyparquet decodes; rows cached in-process per Lambda lifecycle
}
```

That's the entire data layer. Pure HTTPS fetch. No AWS SDK, no credentials,
no RDS connection. Next.js handles the fetch cache; `lib/marts.ts` adds a
small in-process row cache so repeated reads inside the same Lambda render
don't re-decode the parquet.

### Phoenix tabs and their marts

| Page                 | Reads                                                                                                    | What it shows                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `/phoenix`           | `fct_market_pulse_metro`, `fct_active_inventory`, `fct_market_pulse_region`, `fct_community_scorecard`   | Overview KPIs + region table + community grid        |
| `/phoenix/pricing`   | `fct_market_pulse_metro`, `fct_negotiation_metro`, `fct_pricereduction_metro`, `fct_active_by_pricetier` | Pricing KPIs + 12-mo trend + price-band distribution |
| `/phoenix/inventory` | `fct_active_inventory`, `fct_months_of_supply`, `fct_active_dom_distribution`, `fct_listing_pace`        | Supply snapshot + DOM distribution + listing pace    |
| `/phoenix/activity`  | `fct_market_pulse_metro`, `fct_active_inventory`, `fct_status_velocity`, `fct_buyer_office`              | Closings + buyer-office leaderboard + velocity       |
| `/phoenix/timing`    | `fct_market_pulse_metro`, `fct_status_velocity`                                                          | Seasonal overlay + YoY + velocity trend              |

Composition files: `yong2/app/phoenix/lib/{*-data}.ts` (one per tab).
Pattern: each function calls `readMart`, filters by `scope_type` /
`scope_key` / `property_segment`, reshapes for the page.

---

## Mart contracts (the load-bearing dimensions)

Every fact mart shares this dimensional spine:

| Column                     | Values                                                               | Meaning                                       |
| -------------------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| `scope_type`               | `metro` / `region` / `community` / `subdivision` / `zipcode`         | What scale the row aggregates                 |
| `scope_key`                | e.g. `phoenix_metro`, `north-scottsdale`, `desert-mountain`, `85262` | Which entity in that scale                    |
| `property_segment`         | `all` / `residential` / `land`                                       | Property-type filter applied to the aggregate |
| `month` (where applicable) | `2026-05-01` etc.                                                    | Calendar month bucket (first of month)        |

The 5 per-scope splits exist because the community/subdivision parquet
files are 40–127 MB each — too big for Amplify's 30 s SSR window. Per-scope
splits keep each file ≤ 10 MB. yong2 fetches the scope it needs.

### Mart files yong2 currently uses

Listed in `analytics/` prefix of `rlsir-platform-assets-us-east-1`:

- `fct_market_pulse_metro` (45 KB) — monthly closings + medians at metro scope
- `fct_market_pulse_region` (474 KB) — per-region equivalent
- `fct_active_inventory` (1.8 MB) — current Active+AUC+Pending+Coming Soon counts
- `fct_active_dom_distribution` (2.1 MB) — active rows bucketed into 7 DOM bands
- `fct_active_by_pricetier` (2.0 MB) — active rows by price band
- `fct_active_by_community` (13 KB) — community-level active rollup
- `fct_negotiation_metro` (42 KB) — list-to-sale, % above/below, % with cut
- `fct_pricereduction_metro` (140 KB) — reduction stats per month
- `fct_status_velocity` (1.5 MB) — list → pending → closed timing per cohort
- `fct_months_of_supply` (1.4 MB) — 3-mo + 12-mo MoS by scope
- `fct_listing_pace` (1.1 MB) — weekly new-listing pace
- `fct_community_scorecard` (11 KB) — community rollup for cards
- `fct_community_yoy` (7 KB) — community-level YoY comparisons
- `fct_buyer_office` (1.3 MB) — per-office buyer-side deals by year
- `dim_calendar` (4 KB), `dim_communities` (5 KB) — small dimension tables

Total served at edge: **~85 MB** across 21 files. CloudFront serves each
with 1 h TTL.

---

## How the cache layers stack

When yong2 renders `/phoenix`, here's where each value comes from:

1. **In-process row cache** (`Map` in `lib/marts.ts`) — 1 h TTL per
   Lambda-render lifecycle. Avoids re-decoding the same parquet inside the
   same SSR invocation.
2. **Next.js fetch cache** — `revalidate: 3600`. Dedupes the actual fetch
   call for an hour within a single Lambda lifecycle.
3. **CloudFront edge cache** — 1 h TTL. Cache-hit serves at ~50 ms TTFB.
4. **S3 origin** — parquet sitting in `analytics/`. Rebuilt hourly by the
   dbt Lambda.

When a value updates: dbt writes new parquet → CloudFront cache expires
after ≤1 h → next SSR fetch grabs fresh → ISR re-renders within the next
hour. End-to-end staleness: **up to 2 h worst-case**, usually 30–60 min.

---

## Auth & access

- **S3 origin policy:** `PublicReadAnalyticsMartsOnly` — public GET on the
  `analytics/*` prefix only. Other prefixes (`bronze/`, sync state, etc.)
  stay private.
- **CloudFront:** public distribution, no signed URLs. Aggregate market
  stats (counts, medians, $/sqft) are publishable per ARMLS IDX rules —
  they don't expose individual listings.
- **yong2 SSR:** no AWS credentials needed. Pure HTTPS fetch.

This is why the CI nightly verifier
(`.github/workflows/verify-phoenix-nightly.yml`) needs no AWS keys.

---

## Operational triggers — what to do when

| Symptom                          | Investigation                                                                                                                              | Likely fix                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| yong2 page returns stale numbers | Check CloudFront cache age + `analytics/*.parquet` `LastModified`                                                                          | If parquet old: re-trigger dbt Lambda. If parquet fresh + page stale: redeploy Amplify (ISR not re-firing) |
| yong2 returns 500                | Amplify build logs at app `d2tuygdje4mmy3`. Likely a parquet schema change broke a downstream filter                                       | Roll back yong2 commit or patch `app/phoenix/lib/*-data.ts`                                                |
| dbt mart values look wrong       | `scripts/verify-phoenix-exhaustive.mjs` against current state                                                                              | If real fail: trace mart back through dbt models in `analytics/models/`                                    |
| Walker compliance slips          | `CloudWatch` `ActivesStaleOver12h` metric                                                                                                  | See `memory/project_armls_walker_fargate.md`                                                               |
| New mart needed                  | Add SQL to `analytics/models/marts/analytics/` + register exposure → `dbt run --target prod` → wire into yong2 `app/phoenix/lib/*-data.ts` | Standard dbt workflow                                                                                      |

---

## Adding a new analytical surface to yong2

1. **Model in dbt** — add `analytics/models/marts/analytics/fct_my_new.sql`.
   Materialize as `external` for prod (writes to S3) or `table` for dev (DuckDB local).
2. **Schedule rebuild** — already covered. The `rlsir-analytics-dbt` Lambda
   runs `dbt run --target prod --full-refresh` every hour. Your new model
   joins the schedule automatically once the SQL lands and the Lambda
   image is rebuilt.
3. **Pre-warm CloudFront** in the Amplify build hook — add the new mart
   filename to the curl loop in `amplify.yml` (yong2 worktree).
4. **Compose data fn** — `yong2/app/phoenix/lib/my-new-data.ts` calls
   `readMart('fct_my_new')`, filters by scope, returns shaped objects.
5. **Render** — new `yong2/app/phoenix/<route>/page.tsx`. ISR via
   `export const revalidate = 3600`. Mirror the existing tabs' design.
6. **Verify** — add assertions to `scripts/verify-phoenix-exhaustive.mjs`
   so the nightly catches drift.

---

## What NOT to do

- ❌ **Don't add yong2 RDS imports.** The whole architecture's design is
  to decouple yong2 from RDS. If you need real-time data, that's a separate
  conversation about pushing the sync window faster, not about adding
  direct RDS reads.
- ❌ **Don't re-enable `rlsir-mv-refresh-schedule`** EventBridge rule —
  the MVs it refreshed were dropped 2026-05-10. Re-enabling would just
  spam the Lambda log with "function does not exist" errors.
- ❌ **Don't bypass `lib/marts.ts`** by fetching parquet directly from
  app code. The caching layers are what make the dashboard fast.
- ❌ **Don't drop the per-scope splits** for community/subdivision —
  the monolithic files exceed Amplify's 30 s SSR timeout. The split
  pattern is load-bearing.
- ❌ **Don't widen the S3 public-read policy** beyond `analytics/*`.
  Bronze/raw data is non-public for license reasons.

---

## Related docs / memory

- `memory/project_dbt_cutover_complete.md` — full architecture history and
  cost ledger
- `memory/project_armls_walker_fargate.md` — the always-on walker that
  feeds RDS continuously
- `docs/superpowers/plans/2026-04-30-dbt-duckdb-production-cutover.md` —
  the 7-phase plan (stamped COMPLETE 2026-05-10)
- `scripts/verify-phoenix-exhaustive.mjs` — the nightly numerics verifier
- `scripts/verify-comprehensive-3way.mjs` — the deep 3-way verifier

---

_Last updated: 2026-05-10._
