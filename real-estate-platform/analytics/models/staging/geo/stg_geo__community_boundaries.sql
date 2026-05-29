-- real-estate-platform/analytics/models/staging/geo/stg_geo__community_boundaries.sql
{{ config(materialized='table', tags=['staging', 'geo']) }}

-- Community boundary polygons, read live from the RDS geo_boundaries table
-- (attached as the read-only `rlsir_platform` postgres catalog). geometry is
-- stored as plain GeoJSON text, so ST_GeomFromGeoJSON parses it directly — no
-- PostGIS WKB involved. bbox extents are derived from the parsed geometry for a
-- cheap prefilter before the ST_Covers test downstream.

WITH src AS (
  SELECT
    slug          AS community_slug,
    name          AS community_name,
    properties->>'regionSlug' AS region_slug,
    area_sq_mi,
    geometry      AS geometry_text
  FROM rlsir_platform.public.geo_boundaries
  WHERE type = 'community'
    AND geometry IS NOT NULL
)

SELECT
  community_slug,
  community_name,
  region_slug,
  area_sq_mi,
  ST_GeomFromGeoJSON(geometry_text) AS boundary_geom,
  ST_XMin(ST_GeomFromGeoJSON(geometry_text)) AS bbox_min_lng,
  ST_XMax(ST_GeomFromGeoJSON(geometry_text)) AS bbox_max_lng,
  ST_YMin(ST_GeomFromGeoJSON(geometry_text)) AS bbox_min_lat,
  ST_YMax(ST_GeomFromGeoJSON(geometry_text)) AS bbox_max_lat
FROM src
