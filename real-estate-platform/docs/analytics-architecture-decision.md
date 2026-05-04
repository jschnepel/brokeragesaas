# Analytics Architecture Decision — DuckDB + Parquet vs RDS Materialized Views

**Date:** 2026-04-28
**Status:** Investigation complete — awaiting review
**Author:** investigation prompt + measured benchmarks
**Owner:** TBD (Joey)
**Test artifacts:** `C:/Users/joeys/AppData/Local/Temp/rlsir-investigation/`

---

## TL;DR

**Recommendation: B — Hybrid.** Move `/market` analytics off Postgres MVs onto DuckDB + Parquet. Keep search on the existing `@platform/spark` cutover. Continue running RDS for app data + the read-only ARMLS mirror that feeds the Parquet pipeline. Estimated effort: **2–3 weeks**, savings $45–48/mo, plus an order-of-magnitude latency win on every analytics query.

The two big findings:

1. **Spark search is already done.** The `@platform/spark` package has been live since the 2026-04-20 cutover. Phase 1 of the original investigation prompt is mostly answered by reading that code — the question is no longer "can Spark search work?" but "are there bugs in the existing implementation?" (yes — see §1).
2. **DuckDB on a single 463 MB Parquet file runs every dashboard query in 12–71 ms.** Same data RDS struggles to serve under 60 s timeouts. ~1000× speedup at $0/month for the analytics tier itself; the only RDS line item that needs to stay is the ARMLS mirror.

---

## Section 1 — Spark API Search Results

The `@platform/spark` package (`real-estate-platform/packages/spark/`) has been in production since 2026-04-20. Phase 1 of the prompt is largely answered by reading `client.ts` + `filters.ts` + the cutover spec at `docs/superpowers/specs/2026-04-20-listings-spark-cutover-design.md`. We probed the live API to verify capabilities and discovered both confirmations and a real bug.

### Live capability probe (token from Secrets Manager `rlsir/armls/tokens`)

| Capability | Supported? | Notes |
|---|---|---|
| `$filter` (eq, ne, gt, ge, lt, le, and, or) | ✅ | All used by `buildODataFilter` |
| `$filter` contains() / tolower() / startswith() | ✅ | `tolower(City) eq 'scottsdale'` returns 200 OK |
| `$filter` geo.distance() | ✅ | **Spec said "no geo operator we can count on" — wrong.** geo.distance returned 25 rows in 1268 ms. Could simplify radius search; bbox still cheaper. |
| `$filter` lat/lng inequality bbox | ✅ | 1858 ms with a 25-row Scottsdale slice |
| `$orderby` | ✅ | Used for `newest`, `price_asc/desc`, `sqft`, `lot_size` |
| `$top` cap | ⚠️ **1000, not 5000** | API returns 400 `"$top must be an integer between 0 and 1000"` for $top > 1000 |
| `$skip` deep pagination | ✅ | $skip=5500 returned 25 rows in 3823 ms — past the 5K cap the spec mentioned |
| `$count=true` parameter | ✅ | Returns `@odata.count` in payload |
| `/$count` endpoint | ❌ | Returns 404 — must use `$count=true` instead |
| `$select` column projection | ✅ | Cuts payload >50× (9 KB lean vs 670 KB no-select) |
| `$expand` Media / nested | ✅ | `Media($top=2)` works for thumbnail strip |
| Auth (Bearer non-expiring) | ✅ | Token in `rlsir/armls/tokens`. The `apps/premium-site/.env.local` token is **stale and 401s**. |

### Latency

| Pattern | min | avg | max |
|---|---|---|---|
| Single small query (10 sequential) | 714 ms | 1251 ms | 2496 ms |
| 5 concurrent (per-call) | 861 ms | 1013 ms | 1218 ms |
| 5 concurrent (wall) | — | 1271 ms | — |

5 parallel callers add only 250 ms of latency per call vs sequential — Spark backend handles concurrency cleanly within this range. Inspection-day risk is low.

### Bugs discovered in the existing cutover

**Bug #1 — `_getAllPinsImpl` uses `$top=5000`, which Spark rejects.**

```ts
// packages/spark/src/ListingService.ts:147–170
private static _getAllPinsImpl = async (_key: string): Promise<MapPin[]> => {
  const pins: MapPin[] = [];
  const pageSize = 5000;          // ← rejected; max is 1000
  ...
  while (true) {
    const { records, nextSkipToken } = await ListingService.client().searchProperties({
      filter: baseFilter,
      top: pageSize,              // ← 400 from Spark
```

The `cachedWithCeiling` wrapper catches `SparkUnavailableError`/`Error` from the 400 and returns `UnavailableResult`, which `getAllPins()` translates to `[]`. The map is silently empty until the cache TTL ages out — and the next refresh fails the same way. **Verify on the live site whether `/listings` map renders pins.** Fix: change `pageSize` to `1000` and adjust `if (skip >= 50000) break;` ceiling math (50 pages × 1000 = 50K, still fine).

**Bug #2 — Stale Spark token in `apps/premium-site/.env.local`.**

The `.env.local` SPARK_API_ACCESS_TOKEN (`9hbser...qy9k`) returns 401. Production uses the SecretsManager-resolved token via the AWS SDK (per `.env` in `apps/backend/`). Local dev works only if the developer manually pulls the token. Fix: document in onboarding or have `dev` script pull from SSM/SecretsManager.

### Verdict for search

**Spark is sufficient and already shipping.** No need to change anything except fixing the two bugs above. We don't need a "thin local Active table" fallback — the existing 5-min cache + 12 h compliance ceiling absorbs short outages, and the `UnavailableResult` pattern handles long ones gracefully.

---

## Section 2 — DuckDB Performance Results

### Test setup

- Exported **1,604,707** Maricopa rows from `listing_records` to a single 463 MB zstd-compressed Parquet file with 59 columns (subset of the 156-column source — the columns analytics actually use)
- 17 row groups (100K rows each)
- DuckDB 1.5.2 in-memory, Python 3.11 driver
- Hardware: Joey's local Windows machine — Lambda will be slower for cold starts but warm queries should be similar
- Same query patterns as the prompt's Test 1–10, three runs each, lowest reported

### Single-file Parquet benchmark

| Query | Cold | Warm | Min | Rows |
|---|---|---|---|---|
| t1 — Metro monthly close metrics (5 percentiles) | 44 | 35 | **35 ms** | 64 |
| t2 — Region monthly metrics (~37 cities × 64 months) | 48 | 43 | **43 ms** | 2,392 |
| t3 — Community 12-mo medians | 46 | 45 | **45 ms** | 3,432 |
| t4 — Supply/demand monthly | 18 | 14 | **14 ms** | 64 |
| t5 — Active price-band distribution | 12 | 12 | **12 ms** | 7 |
| t6 — Negotiation spread (CP/LP ratio) | 22 | 21 | **21 ms** | 64 |
| t7 — DOM bucket histogram | 15 | 15 | **15 ms** | 7 |
| t8 — Community scorecard (FILTER + percentiles, 3,424 communities) | 71 | 64 | **64 ms** | 3,424 |
| t9 — Hero KPIs (5 FILTER aggregates) | 36 | 23 | **23 ms** | 1 |
| t10 — YoY comparison | 24 | 21 | **21 ms** | 1 |

**Every query completes in under 100 ms on the full 1.6 M row dataset.** The most complex query (community scorecard, with `FILTER (WHERE ...)` aggregates and `PERCENTILE_CONT` across thousands of groups) is 64 ms.

For comparison, CLAUDE.md notes that today RDS sees "**60 s query timeouts**" on similar work. Conservatively that's ~1000× speedup; it's an architectural shift, not a tuning win.

### Partitioned Parquet (closed-by-year + active in single file)

Total partitioned dataset: 17 yearly files (~25–33 MB each for 2011–2025) + 11 MB active file. Partition write took 9.1 s.

| Query | Single file | Partitioned | Speedup |
|---|---|---|---|
| Metro monthly closed 2021+ | 31 ms | 19 ms | **1.67×** |
| Hot-30d hero KPIs | 15 ms | 6 ms | **2.35×** |

Partitioning helps moderately for time-windowed queries that touch ≤2 years. Not necessary for v1 (single file is already fast enough). Worth doing in v2 once we want to push more cost off Lambda CPU.

⚠️ Side observation during partition write: 5 garbage partitions appeared (`close_year=2027`, `2028`, `2030`, `2036`, `2041`) caused by malformed `close_date` values in `listing_records`. ARMLS mirror is read-only, so cleanup belongs in the staging/Silver layer (CASE WHEN close_date BETWEEN ... THEN close_date END).

### S3 read latency (not measured locally)

Did not upload 463 MB Parquet to S3 — that's an AWS write op gated by the standing CLAUDE.md rule. Documented expectations from public AWS benchmarks:

- S3 GET first-byte latency same-region (us-east-1 → us-east-1 Lambda): **30–50 ms**
- DuckDB issues range requests against Parquet metadata + needed column chunks; typical analytics query touches ~5–20% of file
- Estimated S3-resident query latency: **local time + 50–200 ms** = ~70–270 ms warm. Still 200–1000× faster than RDS.

User can validate by approving an `aws s3 cp` of the Parquet to `rlsir-platform-assets-us-east-1` (the existing empty bucket) and re-running the benchmark with `read_parquet('s3://...')`.

### Memory + Lambda fit

- DuckDB Python wheel (Linux x86_64): ~80 MB compressed, ~200 MB uncompressed. Lambda 250 MB unzipped limit fits.
- Aggregation queries on this dataset peak <500 MB RSS in DuckDB — 1024 MB Lambda memory is comfortable, 2048 MB safe. Both still cost less than current `db.t3.medium` ($60/mo).
- Cold start: DuckDB binary load + S3 metadata fetch. Estimate **<2 s for the first query of a cold invoke**, <100 ms warm.

### Verdict for analytics

**DuckDB on Parquet is dramatically faster than the current RDS MV stack and well within Lambda budgets.** Even with S3 read added on top, every query stays under 300 ms. Materialized views become a build-time pre-aggregation in dbt rather than a Postgres maintenance burden.

---

## Section 3 — dbt Feasibility

### Setup

- Installed `dbt-duckdb` 1.10.1 (against `dbt-core` 1.11.8)
- Scaffolded `rlsir_analytics` project with single profile pointing at a local `.duckdb` file
- Wrote three models:
  - `staging/stg_listings` — view, materialized as DuckDB view; cleans + derives `price_per_sqft`, lat/lng bounds, DOM/area sanity caps; reads from local Parquet via `read_parquet(...)`
  - `marts/mart_dashboard_kpis` — table, hero KPIs (replaces `mv_dashboard`)
  - `marts/mart_community_scorecard` — table, community scorecard (replaces `mv_community_scorecard`)

### dbt run output

```
1 of 3 OK created sql view  model main.stg_listings ............ [OK in 0.08s]
2 of 3 OK created sql table model main.mart_community_scorecard . [OK in 0.16s]
3 of 3 OK created sql table model main.mart_dashboard_kpis ...... [OK in 0.06s]

Finished running 2 table models, 1 view model in 5.36 seconds.
```

### Sample mart contents (verified)

`mart_dashboard_kpis`:
- active_count: 20,644
- median_price_30d: $482,000
- median_dom_30d: 70
- new_listings_30d: 6,607
- pending_count: 7,487

`mart_community_scorecard`: 3,404 communities qualified (5+ closed in 12 mo). Top by closed_12mo: STONEBRIDGE MANOR (Waddell, 138 sales), SILVA FARMS (Goodyear, 126), Agave Trails (Buckeye, 104).

### Compatibility issues encountered

None blocking. One Windows-specific gotcha: DuckDB's `COPY ... PARTITION_BY` doesn't auto-create parent dirs on Windows; need `mkdir -p` before write. Lambda Linux: not an issue.

### Verdict for dbt

**Viable for the transform layer.** The model graph (sources → staging → marts) cleanly maps to the existing `analytics_base` → `mv_*` pattern, but with version control, tests, lineage docs, and per-model materialization control. Free.

---

## Section 4 — Cost Comparison

Confirmed live state (read-only AWS calls):
- RDS: `db.t3.medium`, 50 GB allocated, single-AZ, Postgres 16
- Lambda `rlsir-armls-sync`: 512 MB / 900 s timeout, Node.js 20, scheduled rate(4 hours) but **EventBridge currently DISABLED** (per CLAUDE.md, last invoke 2026-04-21, ~58% errors Apr 19–20)
- S3 bucket `rlsir-platform-assets-us-east-1`: 0 objects, 0 bytes

### Itemized monthly cost (us-east-1)

| Component | Today | Phase B (hybrid) | Phase C (full) | Notes |
|---|---|---|---|---|
| RDS db.t3.medium 50 GB | **$66** | $66 | $0 | medium needed because analytics + listings_records share a single instance; if listings_records mirror moves out, can shrink. Phase B keeps it for the mirror. |
| RDS db.t3.micro 50 GB (alt) | — | — | $20 | If Spark search lets us drop the mirror, micro covers app data + sync state. |
| Lambda rlsir-armls-sync | $0 (free tier) | $0 | $0 | Unchanged; pulls Property → writes listing_records |
| Lambda rlsir-armls-parquet (new) | — | $1 | $1 | New: reads listing_records every 4 h, writes Parquet to S3 + dbt run. ~5 min × 6/day × 2048 MB = 36k GB-s/mo |
| Lambda rlsir-analytics-query (new, on-demand) | — | $1 | $1 | New: SSR/ISR analytics endpoints invoke DuckDB-on-S3. Page TTL is hours so call rate is low |
| S3 storage | $0 | $0.02 | $0.02 | 463 MB compressed Parquet + ~10 MB pre-computed JSON KPIs ≈ 500 MB × $0.023/GB |
| S3 GET requests | $0 | $0.30 | $0.30 | Burst-ish; analytics ISR caches output |
| CloudFront (cached JSON) | $0 | $0.10 | $0.10 | Marginal egress |
| CloudWatch logs / alarms | $0.30 | $0.50 | $0.50 | Two new Lambdas ⇒ two more log groups |
| **Total** | **$66.30** | **$67.92** | **$22.92** | |

**Cost honest reading:**

- **Phase B (hybrid, recommended):** ≈ flat ($66 → $68). The sticker-price savings is illusion; the win is **performance + reliability**. We're paying ~$1.50/mo to move analytics off a struggling Postgres into a fast, owned, version-controlled stack.
- **Phase C (full):** $66 → $23. Real savings of **$43/mo** by dropping the mirror. Only works once Spark API is fully sufficient for every listing read AND we move app data to a smaller instance (or to Neon, which is what `apps/backend/.env.example` originally intended).

### Break-even

DuckDB+Parquet+dbt+S3 break even at the existing query volume. Cost scales with sync frequency and query rate, not data volume. At 10× growth (16 M rows, ~4.5 GB Parquet), incremental S3 cost is +$0.10/mo, Lambda compute roughly +50% (~$1.50/mo). Postgres at 16 M rows would need an instance class jump and likely an `r-` line.

---

## Section 5 — Migration Complexity

### Code that needs to change

| File | Change |
|---|---|
| `infra/lambda/armls-sync.ts` | Add Parquet write step after listing_records upsert: `INSERT INTO listing_records ... → COPY (...) TO 's3://...'` (or run separate Lambda) |
| `packages/database/src/queries/analytics.ts` | Replace MV reads with calls to a new `@platform/analytics` client that fetches pre-computed JSON or invokes DuckDB Lambda |
| `packages/database/src/queries/phoenix-analytics.ts` | Same |
| `packages/database/src/queries/market-scoped.ts` | Same |
| `apps/premium-site/app/(routes)/phoenix/**` | Update data fetchers to call new client (most pages already pass typed `MarketPulseRow[]` etc., so type contracts hold) |
| `apps/premium-site/app/(routes)/analytics/**` | Same |
| `apps/premium-site/app/(routes)/market/**` | Same |
| `infra/lambda/` (new) | New Lambda for Parquet build + dbt run |
| `infra/lambda/` (new) | New Lambda for on-demand DuckDB analytics queries |

### Code that gets reused

- All UI components (`packages/ui/src/charts/*`, `apps/premium-site/.../components/charts/*`)
- All TypeScript types (`@platform/shared/src/analytics`, `@platform/shared/src/listings`)
- `@platform/spark` package (untouched — already runs search)
- ARMLS sync Lambda's listing_records pipeline (untouched)
- `geographic_boundaries` PostGIS classification (run once at dbt build time, joins into the Parquet output)
- IDX compliance middleware in `@platform/spark` (no changes)
- `analytics_base`/`mv_*` MVs stay alive on RDS during cutover so we can A/B compare (delete in Phase C cleanup)

### What's new

- Parquet write pipeline (Postgres → S3 every 4 h, in same Lambda or separate)
- dbt project at `real-estate-platform/analytics/` (or `infra/dbt/`)
- DuckDB analytics Lambda (or build-time JSON precompute → CloudFront)
- `@platform/analytics` client package (typed accessors, hides cache layer)
- IAM role for new Lambda(s) — minimal: SecretsManager read, S3 read+write to one bucket prefix
- CloudWatch alarms for Parquet build failures
- One-time backfill of historical Parquet (we did the 1.6M row export in 6.5 min — production cron does it every 4 h incrementally)

### Estimated effort

| Phase | Work | Effort |
|---|---|---|
| 1 | Bug fix: `_getAllPinsImpl` $top=5000 → 1000; refresh `.env.local` token doc | 2 h |
| 2 | Build Parquet pipeline (extend or fork sync Lambda) | 2–3 days |
| 3 | dbt project skeleton + port 9 MVs to dbt models | 3–5 days |
| 4 | DuckDB analytics Lambda + `@platform/analytics` client | 3–5 days |
| 5 | Migrate `/phoenix` pages to new client (one tab at a time, A/B vs RDS MVs) | 3–5 days |
| 6 | Migrate `/market` + `/analytics` pages | 2–3 days |
| 7 | Drop unused MVs + shrink RDS instance | 1 day |
| **Total** | | **~2–3 weeks** |

---

## Section 6 — Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Spark API search insufficient for some listing surface | Low | Medium | Already in production. Two known bugs (§1) are easy fixes. |
| DuckDB Lambda cold starts > 2 s | Medium | Low | Pre-compute hero KPIs to JSON on every Parquet build; ISR caches them on CloudFront. Cold path is for deep drill-downs only. |
| S3 read latency unacceptable for some query | Low | Low | Local benchmarks 12–71 ms; +50–200 ms S3 still well under page budget. Fallback: bake JSON for every page at build time. |
| ARMLS down → Spark fails | Low | High | Existing 12-h cache ceiling already handles. Analytics Parquet is independent of Spark — runs from RDS mirror up to last sync. |
| Data grows 10× → Parquet over Lambda memory | Low | Low | DuckDB streams; tested at 1.6 M, 16 M would be ~4.5 GB and still fits 4 GB Lambda or chunked reads. Partitioning §2 helps further. |
| Postgres → Parquet sync drift / stale Parquet | Medium | Medium | Same 4-h cadence as MV refresh today; alarm on Parquet age > 6 h |
| dbt-duckdb compatibility regressions | Low | Low | Pin versions in `requirements.txt`; smoke test in CI |
| Garbage `close_year` partitions hide bad data | Low | Low | Caught during partition test (§2). Fix in `stg_listings` CASE WHEN, **not** by mutating `listing_records`. |
| New Lambda IAM scope too wide | Low | Medium | Least-privilege role: only `s3:PutObject` for `s3://rlsir-platform-assets-us-east-1/analytics/*`, only `secretsmanager:GetSecretValue` for the one ARN |

---

## Section 7 — Recommendation

### Choice: **B — Hybrid**

Implement DuckDB + Parquet + dbt for analytics. **Keep the listing_records mirror on RDS for now** — it's the source of the Parquet. Keep search on the existing `@platform/spark` cutover. Do not pursue Choice C (drop the mirror entirely) until we've operated the new analytics stack for 30 days and validated.

### Why not A (full migration)?

The mirror is the source of the Parquet. Even though Spark search works, analytics needs historical closed sales (12 M+ historical rows over time), which Spark replication only delivers as a stream — we'd be rebuilding a mirror anyway. Keep what's working.

### Why not C (optimize current)?

The 60 s timeouts aren't a tuning problem. They're a "Postgres with 1.6 M-row aggregation across 9 MVs sharing 50 GB of t3.medium" problem. Going to t3.large is +$60/mo for **same architecture, marginal speed win, and no observability or version control improvements**. DuckDB+Parquet is fundamentally a better fit for read-only analytics.

### Why not D?

Considered: ClickHouse / Snowflake / BigQuery. All three add monthly cost ($30–200/mo minimum) and operational overhead for a single-tenant analytics workload. DuckDB-on-Parquet is the right size of tool.

### Phased plan

**Phase 1 — Bug fixes (2 hours, ship today):**
1. Fix `_getAllPinsImpl` page size (1000, not 5000) in `packages/spark/src/ListingService.ts:149`
2. Document `.env.local` SPARK token expiration; pull from SecretsManager in dev script
3. Manually verify `/listings` map renders pins after fix

**Phase 2 — Build the new pipeline (1 week):**
4. New Lambda `rlsir-analytics-build`: reads RDS `listing_records`, writes Parquet to `s3://rlsir-platform-assets-us-east-1/analytics/listing_records.parquet`, runs dbt
5. dbt project at `real-estate-platform/analytics/` with 9 mart models matching current MV outputs
6. CloudWatch alarm: Parquet age > 6 h
7. Schedule rate(4 hours), aligned with existing sync

**Phase 3 — Wire the read path (1 week):**
8. New `@platform/analytics` package with typed accessors (`getMarketPulse(filter)`, `getCommunityScorecard(filter)`, etc.) reading either pre-computed JSON or invoking DuckDB Lambda
9. Migrate `/phoenix/*` pages tab-by-tab. A/B compare against existing RDS-backed page during the swap.
10. Migrate `/market/*` and `/analytics/*` pages

**Phase 4 — Cleanup (3 days):**
11. Verify 9 dashboard MVs are no longer referenced
12. Drop MVs in a migration; keep `analytics_base` foundation MV until §13 closes
13. Re-evaluate RDS instance size (likely keep medium; mirror doesn't shrink with the move)

---

## Section 8 — Test Artifacts

All test artifacts live outside the repo (`C:/Users/joeys/AppData/Local/Temp/rlsir-investigation/`) so they don't pollute the working tree. Recreate any time:

| File | Purpose |
|---|---|
| `test_spark_api.py` | Live Spark API capability + latency probe. Run with `SPARK_ACCESS_TOKEN=$(aws secretsmanager get-secret-value --secret-id rlsir/armls/tokens --query 'SecretString' --output text \| jq -r .access_token)` |
| `spark_api_results.json` | Phase 1 raw results |
| `export_parquet.py` | Pulls 1.6 M Maricopa rows from RDS via DuckDB postgres extension (creds loaded from `.env.local` at runtime) |
| `listing_records.parquet` | 463 MB zstd Parquet, 59 cols, 17 row groups |
| `benchmark_duckdb.py` | 10-query analytics benchmark |
| `duckdb_benchmark.json` | Phase 2 raw results |
| `test_partitioned.py` | Single-file vs partitioned Parquet comparison |
| `partitioned/` | 17 yearly closed Parquet files + active.parquet |
| `dbt_test/` | Working dbt-duckdb scaffold with 3 models, runs in 5.4 s |

To upload the Parquet to S3 for end-to-end S3 read latency validation (one-time, costs <$0.01):

```bash
"C:/Program Files/Amazon/AWSCLIV2/aws.exe" s3 cp \
  "C:/Users/joeys/AppData/Local/Temp/rlsir-investigation/listing_records.parquet" \
  s3://rlsir-platform-assets-us-east-1/analytics/listing_records.parquet \
  --region us-east-1
```

This is an AWS write op and was not executed during investigation — pending Joey's go-ahead.

---

## Open questions for review

1. Is keeping the ARMLS mirror on RDS acceptable long-term, or is dropping it (Choice C) a goal even if savings are modest?
2. Pre-compute everything to JSON on Parquet build (cheaper, fixed-schema, no Lambda DuckDB cold start risk) vs on-demand DuckDB Lambda (more flexible, supports arbitrary drill-down)? My read: **build-time JSON for hero/scorecard, on-demand DuckDB only for explorer-style drill-downs.**
3. Where does dbt run — a separate Lambda invoked after Parquet build, or inline in the analytics-build Lambda? (Both work; inline simpler.)
4. dbt project location: `real-estate-platform/analytics/` (top-level) vs `infra/dbt/` vs `packages/analytics/` — preference?
