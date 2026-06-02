{{ config(materialized='test') }}

-- Phase-D gate: the curated community set must stay in a sane size band.
--
-- Geometry-first attribution (PIP against the curated GeoJSON polygons) should
-- yield ~50-200 distinct communities. Two regressions this catches:
--   - too few (<40): the polygon layer failed to load / staging is empty
--     (e.g. ST_Read path wrong, geo_boundaries empty) -> communities vanish.
--   - too many (>300): someone reverted community attribution to the raw
--     subdivision-name universe (~20K keys, the "16 roeser place" junk that
--     flooded the /phoenix drilldown).
--
-- Counts distinct PIP-assigned communities in the silver model. A singular
-- test passes when it returns ZERO rows.

WITH community_count AS (
  SELECT COUNT(DISTINCT community_pip_slug) AS n
  FROM {{ ref('int_listings_geographic_enriched') }}
  WHERE community_pip_slug IS NOT NULL
)
SELECT n
FROM community_count
WHERE n < 40 OR n > 300
