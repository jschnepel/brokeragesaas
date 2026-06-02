-- real-estate-platform/analytics/models/staging/geo/stg_geo__community_boundaries.sql
{{ config(materialized='table', tags=['staging', 'geo']) }}

-- Curated community boundary polygons — geometry-first attribution source.
--
-- Reads the cleaned community layer (seeds/geo/community_boundaries.geojson),
-- produced by scripts/geo/build_clean_communities.py from the marketing
-- GEOJSON-luxury-communities.geojson with: exact-duplicate polygons removed,
-- parent_slug assigned for contained sub-areas (SafeGraph >=80% rule), and
-- rank (0 top-level / 1 child). One Polygon/MultiPolygon per real community.
--
-- ST_Read parses GeoJSON directly (DuckDB spatial). geometry is EPSG:4326
-- (ARMLS lat/long is WGS84 — same CRS, no reprojection). bbox extents are
-- derived for the cheap prefilter before the ST_Covers test downstream
-- (pip_community.sql).

WITH src AS (
  SELECT
    slug          AS community_slug,
    name          AS community_name,
    region_slug,
    parent_slug,
    rank,
    area_sq_mi,
    geom          AS boundary_geom
  FROM st_read('{{ community_boundaries_path() }}')
)

SELECT
  community_slug,
  community_name,
  region_slug,
  parent_slug,
  rank,
  area_sq_mi,
  boundary_geom,
  ST_XMin(boundary_geom) AS bbox_min_lng,
  ST_XMax(boundary_geom) AS bbox_max_lng,
  ST_YMin(boundary_geom) AS bbox_min_lat,
  ST_YMax(boundary_geom) AS bbox_max_lat
FROM src
