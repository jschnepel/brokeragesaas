# Community Attribution & Sales-Count Correctness — Phased Plan

**Date:** 2026-05-29
**Branch (current):** `feature/ci-database-url-fix`
**Status:** Phases 0–2 IMPLEMENTED + BUILT + TESTED 2026-05-29. Phases 3–6 pending.
**Owner:** Joey Schnepel

> **Build evidence (local dev target, real read-only RDS attach via repo-root `.env.local`, python `Python311`):**
>
> - `dbt run` of the 5 changed marts → **5/5 OK created** (ERROR=0).
> - `dbt test` of the 2 new guards → **2/2 PASS** (`assert_metro_closings_match_raw_count`, `assert_community_attribution_coverage`).
> - Rebuilt outputs (all-time, all-segment): `dim_communities` 43→**20,384** rows; `fct_community_scorecard` (seg=all) 43→**3,938**; `fct_market_pulse` distinct community keys ~50→**20,340**.
> - APN-collapse fixed (Defect A): park-central → **323**, viewpoint-golf-resort → **166** all-month closings (COUNT(\*), no longer collapsed by parcel||year).
> - Polygon-missed communities recovered (Defect C): sun-city **23,642**, verrado **5,585**, pebblecreek **3,725** — all previously absent from the marts entirely.
> - Display-name fallback verified (`COALESCE(polygon name, canonical_community, REPLACE(slug,'-',' '))`). NOTE: canonical names arrive UPPERCASE (e.g. `SUN CITY`, `VERRADO`); yong2 title-cases display labels, so cosmetically OK — revisit if a non-title-casing consumer appears.
> - Impl gotcha fixed: DuckDB has no `INITCAP` (Postgres-only) — removed.
>
> **NOT yet committed; NOT on yong2** until a Fargate `rlsir-analytics-dbt` build publishes parquet to S3/CloudFront (yong2 reads S3, not the local DuckDB).
> **Known remaining gap (Phase 3):** non-Maricopa names still NULL — Wales Ranch (46), Arizona City Unit 9 (37), Robson Ranch (31) — because `subdivision_canonical_map` is Maricopa-only. Fixed by Phase 3 (statewide refresh) + Phase 4 (geometry-first).

---

## 1. Problem (evidence-backed)

yong2's per-community closing counts (sourced entirely from dbt parquet marts) read drastically
low. User-reported: a community with ~33 closings in the last 6 months shows 7. Verified against
the locally built warehouse (`analytics/_local_output/rlsir_analytics_dev.duckdb`).

**No source data is missing.** `fct_closings` contains all **51,939** closings for the trailing
6 months. The failure is in **attribution** and **counting** downstream. Three independent defects:

### Defect A — Count collapses distinct sales (the literal 33→7)

`fct_market_pulse` + `fct_market_pulse_by_pricetier` count via
`COUNT(DISTINCT c.dedup_signature)`, where `dedup_signature = parcel_number || '|' || close_year`
(`int_listings_closed_cleaned.sql`). Where many _distinct_ sales share one APN (mobile-home / RV /
golf resorts, manufactured parks, multi-unit), they collapse:

| community (unified slug) | real closings (6mo) | counted in mart |
| ------------------------ | ------------------- | --------------- |
| viewpoint-golf-resort    | 35                  | **7**           |
| park-central             | 28                  | 8               |
| vista-income-estates     | 19                  | 12              |

`COUNT(DISTINCT)` also silently drops NULL signatures (31 rows in 6mo have NULL `dedup_signature`).

### Defect B — ~20% of closings unattributed; cleaning dropped real communities, no lat/long fallback (dominant)

`community_unified_slug = COALESCE(polygon community_slug, canonical-name-map slug)`
(`int_listings_geographic_enriched.sql`).

- Polygon path (PostGIS point-in-polygon, `listing_geography`) covers only ~50 communities = **3%**.
- Name path = `subdivision_canonical_map`, populated **once** by migration `030_silver_side_tables.sql`,
  filtered to `county = 'Maricopa' AND listing_contract_date >= '2021-01-01'`, with
  `canonical_community = normalize_subdivision()` (pure **string** cleaner — **no geometry**).

Result, trailing 6 months: **10,612 of 51,939 (20.4%) have NO community.** Attribution by county:

| county       | total  | attributed | %         |
| ------------ | ------ | ---------- | --------- |
| Maricopa     | 41,385 | 40,200     | 97.1%     |
| **Pinal**    | 6,339  | 849        | **13.4%** |
| **Yavapai**  | 1,618  | 83         | **5.1%**  |
| Cochise      | 1,061  | 105        | 9.9%      |
| (all others) | —      | —          | <14%      |

**10,583 of the 10,612 unattributed rows have valid AZ lat/long that is never used.** Dropped
`subdivision_name`s are unmistakably real communities: Wales Ranch, Robson Ranch, Wickenburg Ranch,
Mission Royale, Radiance at Superstition Vistas, Bella Vista Farms, Arizona City units, Magma Ranch.
The map is Maricopa-only, so entire counties fall through to NULL.

### Defect C — Community marts key on the 3%-coverage column

`dim_communities`, `fct_community_scorecard`, `fct_community_yoy` group by `community_slug`
(polygon-only, ~3%) instead of `community_unified_slug` (~80%). `fct_market_pulse` already uses
the unified key, so these three are internally inconsistent with it.

---

## 2. Industry standard (research)

- **Spatial attribution beats text fields.** MLS analytics best practice attributes listings to
  areas by **map geometry (point-in-polygon)**, not subdivision/zip text, because text fields are
  incomplete and communities span jurisdictions. (egymls.com, geocod.io, realmls.com)
- **Fallback hierarchy / coarse reverse-geocode.** Standard reverse-geocode resolves a point to the
  **most granular polygon that contains it**, falling back to coarser polygons (community → region →
  city → zip) so nothing is unlabeled. (Mapzen coarse-reverse, ArcGIS, Esri)
- **APN is the identity key, not the count key.** APN/parcel is the gold standard for _identifying_
  a property, but addresses/units can share a parcel. (batchdata APN guide, Bright MLS)
- **Sales counting = one closed transaction = one sale.** NAR/Realtor.com count **each closed
  transaction once**, on close (title transfer). De-dup targets the _same listing re-reported_, not
  _distinct sales on a shared APN_. Collapsing by APN-year is therefore wrong for a count.
  (NAR Existing-Home Sales methodology)
- **Authoritative AZ boundary data is free:** Maricopa County parcels + subdivisions (AZGeo Data
  Hub, data-maricopa.opendata.arcgis.com, ArcGIS REST), Pinal County GIS (pinal.gov ArcGIS REST).
  These carry subdivision/parcel polygons statewide — the missing layer for geometry-first
  attribution beyond the current ~50 hand-built community polygons.

**Target architecture:** a single, reusable **geometry-first attribution hierarchy** applied once in
the silver layer, with text-name matching demoted to a fallback and a guaranteed coarse fallback so
no closed sale is ever silently dropped from area rollups. Counting standardized to "one closed
transaction = one sale," with re-listing de-dup handled by listing-continuity, not APN collapse.

---

## 3. Phased plan

### Phase 0 — Lock the baseline (regression harness) — _prereq, low risk_

- Add a dbt **singular test** + a standalone reconcile script asserting that, for every scope,
  `SUM(community-level closings) ≈ metro closings` within tolerance, and that
  `attributed / total >= threshold` per county. This is the RED that the later phases turn GREEN.
- Capture current numbers (51,939 total; 20.4% unattributed; the 35→7 cases) as fixtures.
- **Deliverable:** `analytics/tests/` singular tests + `scripts/verify-community-attribution.mjs`.
- **No behavior change.** Establishes evidence before/after.

### Phase 1 — Fix the count (Defect A) — _low risk, immediate accuracy gain_

- Replace `COUNT(DISTINCT c.dedup_signature)` with `COUNT(*)` (one closed listing = one sale, NAR
  standard) in `fct_market_pulse` and `fct_market_pulse_by_pricetier`.
- Handle genuine re-listing inflation correctly (separate concern): de-dup at the silver layer on
  **listing continuity** (same property + overlapping listing lifecycle), not bare APN-year. Where a
  true same-sale duplicate must be removed, dedup on `parcel_number + close_date` (exact close), not
  `parcel_number + year`, and treat NULL APN as "keep" not "drop."
- **Deliverable:** mart edits + updated schema tests. Verified against Phase 0 fixtures
  (viewpoint-golf-resort returns 35, not 7).

### Phase 2 — Unify the attribution key (Defect C) — _low risk_

- Switch `dim_communities`, `fct_community_scorecard`, `fct_community_yoy` from `community_slug` to
  `community_unified_slug`, and surface a display name via
  `COALESCE(community_name, canonical_community)` (requires emitting `canonical_community` from
  `int_listings_geographic_enriched`, which it already computes internally).
- **Deliverable:** 3 mart edits + `int_listings_geographic_enriched` exposes a unified name column.

### Phase 3 — Statewide name-map refresh (Defect B, interim) — _medium risk, big coverage jump_

- Rebuild `subdivision_canonical_map` (new migration, additive): drop the `county='Maricopa'` and
  `listing_contract_date>='2021-01-01'` filters; populate statewide. Match on
  `normalize_subdivision()` applied to **both** sides so existing curated canonicals catch variant
  raw names across counties.
- Tighten the garbage filter so only true junk (`None`, `NA`, `Metes & Bounds`, numeric-only) is
  excluded; keep real names like "Arizona City Unit 9".
- This is the quick lift that recovers most of the 10,612 (esp. Pinal/Yavapai) without waiting on
  new polygons.
- **Deliverable:** `packages/database/migrations/rds/0NN_canonical_map_statewide.sql` +
  refresh runbook. Re-verify county attribution rates climb toward Maricopa's 97%.

### Phase 4 — Geometry-first attribution (Defect B, durable) — _higher effort, the real fix_

- Expand the authoritative boundary layer beyond the ~50 hand-built community polygons by ingesting
  **county subdivision/parcel polygons** into the `geo_boundaries` RDS table (DDL:
  `packages/database/src/migrations/006_geo_boundaries.sql`; PostGIS classification writes slugs
  into `listing_geography`, mirrored to bronze parquet → `stg_armls__listing_geography`).
  Leverage the EXISTING pipeline: `scripts/geo/assessor-client.ts` already calls the Maricopa
  ArcGIS REST API (`gis.mcassessor.maricopa.gov/arcgis/rest/services/Subdivisions/MapServer/0`) for
  subdivision polygons; add a Pinal County ArcGIS REST source (pinal.gov GIS) and the free
  Maricopa AZGeo open-data subdivision layer for statewide coverage. This re-uses
  `scripts/geo/pipeline.ts`, `geometry-utils.ts`, and the 5-mile outlier filter rather than
  building new tooling.
- Reorder the attribution hierarchy in the silver layer to **geometry-first**:
  1. parcel/subdivision polygon PIP on lat/long (most granular),
  2. community polygon PIP,
  3. region polygon PIP,
  4. name-map (`canonical_community`) fallback,
  5. coarse fallback (city/zip) so **nothing is ever NULL** in area rollups (NAR/coarse-reverse
     principle).
- Keep PostGIS PIP server-side (RDS `listing_geography` already does this); extend its boundary
  inputs rather than reinventing in DuckDB.
- **Deliverable:** boundary ingest scripts + reworked `listing_geography`/silver attribution +
  the hierarchy documented in `docs/`.

### Phase 5 — Data-quality gates so this can't regress — _low risk, durable_

- Promote Phase 0 reconcile checks to enforced dbt tests in CI / the Fargate dbt run:
  per-county attribution floor, metro-vs-sum consistency, "no scope drops >X% of rows," and a
  monotonic "total closings ≈ raw fct_closings" guard.
- Wire failures to the existing `rlsir-dbt-failures` SNS topic.
- **Deliverable:** enforced tests + alerting; documented in `docs/`.

### Phase 6 — Publish & verify end-to-end

- Trigger a Fargate `rlsir-analytics-dbt` rebuild (marts only reach yong2 via parquet → CloudFront).
- Verify on yong2 (`/phoenix`, community pages) that the reported community matches `fct_closings`
  ground truth. Update `docs/` + project memory; close the /phoenix-heatmap backlog dependency.

---

## 4. Sequencing & risk

- **Phases 1–2** are isolated SQL changes, immediately shippable, large accuracy gain, no infra.
- **Phase 3** is a data migration (additive, mirror-safe — derived layer only per ARMLS rule).
- **Phase 4** is the durable correctness investment; depends on boundary-data ingest (ties to the
  GeoJSON pipeline backlog).
- **Phases 0 + 5** bracket the work with regression evidence so accuracy is provable and protected.
- Every phase ends with a Fargate dbt rebuild to land on yong2; batch where possible.

## 5. ARMLS / repo guardrails honored

- All cleanup stays in derived layers; `listing_records`/`listing_geography` mirror tables are never
  mutated (CLAUDE.md §ARMLS, migration 030 precedent).
- New migrations are additive and numbered; no edits to applied migrations.
- Work routes through the Gideon pipeline (Atlas implement → Sentinel review) per platform CLAUDE.md.
