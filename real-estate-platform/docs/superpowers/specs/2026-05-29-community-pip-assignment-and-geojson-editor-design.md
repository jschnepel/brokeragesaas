# Community Assignment via Point-in-Polygon + GeoJSON Boundary Editor

**Date:** 2026-05-29
**Status:** Design — pending review
**Scope:** `real-estate-platform/analytics` (dbt) + `real-estate-platform/scripts/geo` (editor)

---

## Problem

Listings are assigned to communities in two layers (`int_listings_geographic_enriched.sql`, `int_listings_active_cleaned.sql`):

1. **Polygon point-in-polygon** — `community_slug` from `stg_armls__listing_geography`, precomputed by an upstream PostGIS classifier against `geo_boundaries`. Covers only ~3% of listings (~48 communities have polygons).
2. **Subdivision-name text matching** — `subdivision_canonical_map` fallback, reaching ~95%.

Agents enter subdivision names inconsistently, so the text path both **drops** listings (junk names filtered to NULL, so they vanish from community pages/analytics) and **mislabels** them (wrong text match). Yong's guidance: assign community by **where the listing physically is** (lat/long inside the community boundary), not by the typed subdivision name.

## Goals

- Make point-in-polygon the **authoritative** community assignment wherever a polygon exists (coverage **and** accuracy).
- Keep subdivision-name matching only as a **gap-filler** where no polygon covers the point.
- Provide a **standalone local tool** to create/edit the community boundary shapes, since PIP is only as good as the polygons and the existing Assessor-derived shapes need manual refinement.

## Non-Goals (YAGNI)

- No auth / multi-user editor (local dev tool, single operator).
- No mismatch-flag overlay in v1 (listings whose text label disagrees with their polygon) — deferred until blind drawing proves error-prone.
- No re-architecture of the upstream PostGIS classifier — PIP moves into dbt instead.
- No change to the generic long-tail: most metro listings legitimately sit in no curated luxury community and will continue to rely on the subdivision/region dimension.

## Research findings (industry best practice)

- **Curated polygons + PIP is the standard.** Zillow's ~7,000 neighborhood boundaries are manually researched, then listings are assigned by point-in-polygon spatial join; Redfin/MLS workflows use parcel shapefiles + PIP. Hand-curated shapes + PIP is the professional pattern, not a workaround.
- **Engine choice does not cost accuracy.** PostGIS's `geography` advantage applies to distance/area, not containment. PIP is topological; at neighborhood scale, planar PIP on WGS84 is correct to sub-meter. DuckDB spatial is GEOS-backed (same JTS lineage as PostGIS), so containment results are equivalent.
- **Predicate = `ST_Covers`** (boundary-inclusive), not `ST_Contains` (which excludes points exactly on a boundary).
- **Enforce EPSG:4326 end-to-end** on both polygons and points — CRS mismatch is the most common silent PIP bug.
- **Overlap → smallest-area polygon wins** (most-specific assignment).
- **Accuracy ceiling is the listing geocode quality** (rooftop/parcel vs ZIP-centroid) — validate, don't block.

Sources: PostGIS `ST_Covers` docs; "Which predicate" (Entin); DuckDB Spatial extension docs + point-in-polygon boundary discussion; Zillow neighborhood boundary release; Esri community thread on cross-checking listings with shapefiles.

## Architecture decision

**Authoritative PIP runs in dbt via the DuckDB `spatial` extension.** Fast iteration loop with the editor, no PostGIS/WKB dependency, no accuracy penalty vs PostGIS for containment.

Critical enabler discovered during design: `geo_boundaries.geometry` is stored as **plain GeoJSON text** (scripts `JSON.stringify` on write / `JSON.parse` on read), **not** PostGIS WKB. So DuckDB reads it directly through the Postgres scanner (dbt already reads `subdivision_canonical_map` from PG) + `ST_GeomFromGeoJSON()` — no export step, no PG-side view. The table also already carries `bbox`, `centroid`, `area_sq_mi`, `vertex_count`, giving us the prefilter and overlap tiebreaker for free.

## Components

### 1. GeoJSON boundary editor — `scripts/geo/editor.ts` (standalone local dev tool)

- Run via `npx tsx scripts/geo/editor.ts`, opens `localhost:<port>`.
- **Map:** MapLibre GL (existing dep) + **Terra Draw** (maplibre-native draw/edit/delete vertices). Turf.js for measures.
- **Loads:** region + community shapes from `geo_boundaries`; active listings as dots (queried from RDS by lat/long within the metro bbox).
- **While drawing:** live **inside-count** via turf `booleanPointInPolygon` (boundary-inclusive, matching the pipeline's `ST_Covers`), plus area and vertex count.
- **Save:** upsert one community by `slug` into `geo_boundaries` — writes `geometry` (GeoJSON text), recomputes `bbox`, `centroid`, `area_sq_mi`, `vertex_count`. Asserts EPSG:4326 + valid ring winding; warns on overlap with sibling communities.
- Reuses the existing `@platform/database` pool and the `geometry-utils.ts` helpers where possible.

### 2. Pipeline PIP assignment (dbt + DuckDB spatial)

- **`stg_geo__community_boundaries`** — reads `geo_boundaries` from PG, `ST_GeomFromGeoJSON(geometry)`, carries `bbox` + `area_sq_mi`; `INSTALL spatial; LOAD spatial;`.
- **`int_listings_community_pip`** (shared by active + closed) — for each listing with valid lat/long: bbox prefilter, then `ST_Covers(boundary, ST_Point(longitude, latitude))`; on multiple covers, **smallest `area_sq_mi` wins**. Emits `community_pip_slug`, `region_pip_slug`.
- **Rewire** `community_unified_slug = COALESCE(community_pip_slug, subdivision_text_fallback)` in both `int_listings_active_cleaned` and `int_listings_geographic_enriched`. Region assignment gets the same treatment.
- **Refactor (in scope):** the duplicated `canonical_map` CTE currently lives in both int models — extract canonical + PIP resolution into a shared macro so active/closed cannot drift.

### Data flow

```
geo_boundaries (RDS; geometry = GeoJSON text; editor upserts)
  -> stg_geo__community_boundaries (DuckDB: ST_GeomFromGeoJSON + bbox)
  -> int_listings_community_pip (ST_Covers, bbox prefilter, smallest-area wins)
  -> COALESCE(pip, subdivision fallback) -> community_unified_slug
  -> existing marts (fct_active_by_pricetier, dim_communities, etc.)
```

## Accuracy rules (enforced)

1. Predicate `ST_Covers` (boundary-inclusive).
2. EPSG:4326 asserted on polygons and points; reject/flag anything else.
3. Overlap resolved by smallest `area_sq_mi`.
4. bbox prefilter before the covers test (perf; ~48–130 polygons × listings).
5. Listings without valid lat/long are excluded from PIP and fall to the subdivision/region path.

## Testing & success metric

- **dbt tests:** listing inside a known community polygon → that community; boundary point → covered; two overlapping fixtures → smaller wins; null/invalid lat/long ⇒ not PIP-assigned.
- **Coverage metric:** % of listings PIP-assigned, before vs after, reported per community — proves the lift and surfaces bad polygons.
- **Editor parity test:** turf `booleanPointInPolygon` inside-count must match the dbt `ST_Covers` result on a shared fixture.

## Build order

1. Editor first (so shapes can be drawn/fixed).
2. Pipeline PIP in parallel against the current 48 polygons.
3. Converge: re-run dbt after editing; validate via the coverage metric.

## Risks / open questions

- **DuckDB cross-join PIP cost** on closed (~1.8M rows). Mitigation: bbox prefilter + metro bbox restriction; measure on the Fargate dbt run.
- **Geocode quality** of ARMLS lat/long sets the accuracy ceiling near boundaries — add a sanity check (e.g., distance from polygon centroid distribution) rather than blocking.
- **dbt-duckdb spatial availability** on the `fargate-prod` target — confirm `INSTALL/LOAD spatial` works in that image during planning.
- **Coverage target:** v1 operates on the existing 48 communities + any drawn; broader expansion is a follow-on.
