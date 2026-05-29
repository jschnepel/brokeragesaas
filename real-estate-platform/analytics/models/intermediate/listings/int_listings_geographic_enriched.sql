{# Was incremental — switched to table to avoid dbt-duckdb correlated-UNNEST codegen #}
{{ config(materialized='table', tags=['intermediate']) }}

-- Joins int_listings_closed_cleaned to listing_geography (canonical
-- region/community/section from PostGIS classification) AND to the
-- subdivision_canonical_map side table (name-based normalization).
--
-- Three layers of geographic identification:
--
--   region_slug         : polygon point-in-polygon — 13 regions, ~14% coverage
--   community_slug      : polygon point-in-polygon — ~50 communities, ~3% coverage
--   community_unified_slug
--                       : COALESCE(community_slug, slug(canonical_community))
--                         — fills in for the 80+ communities without polygons
--                         using the curated subdivision_canonical_map.
--                         All "real" communities (Encanterra, Wales Ranch,
--                         Estrella Crossing, etc.) reachable here.
--   subdivision_slug    : finest-grained dimension — slug(canonical_community)
--                         OR slug(clean_subdivision_name) when canonical absent.
--                         Captures every named subdivision the MLS recognizes.
--
-- yong2 pickers should default to community_unified_slug for "community"
-- selection and subdivision_slug for sub-community drill-down.

WITH canonical_map AS (
  -- Pre-aggregate: pick the highest-confidence canonical per raw name.
  -- The map can have multiple rows per raw_subdivision_name (different
  -- mapping methods), so de-dupe to one canonical per raw value.
  SELECT
    UPPER(TRIM(raw_subdivision_name)) AS raw_key,
    canonical_community,
    confidence,
    ROW_NUMBER() OVER (
      PARTITION BY UPPER(TRIM(raw_subdivision_name))
      ORDER BY confidence DESC NULLS LAST, mapping_method
    ) AS rn
  FROM rlsir_platform.public.subdivision_canonical_map
  WHERE NOT COALESCE(is_garbage, FALSE)
    AND canonical_community IS NOT NULL
    AND TRIM(canonical_community) NOT IN ('', 'NONE', 'N/A', 'METES AND BOUNDS')
),

dedup_canonical AS (
  SELECT raw_key, canonical_community
  FROM canonical_map
  WHERE rn = 1
),

slug_helpers AS (
  SELECT
    c.*,
    lg.region_slug,
    lg.region_name,
    lg.community_slug,
    lg.community_name,
    lg.section_slug,
    lg.section_name,
    COALESCE(lg.is_in_region, FALSE) AS is_in_region,
    dc.canonical_community,
    -- Slugify helper: lowercase, replace any non-alphanum with '-', collapse runs.
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(dc.canonical_community), '[^A-Za-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) AS canonical_slug,
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(c.subdivision_name),    '[^A-Za-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) AS subdivision_raw_slug
  FROM {{ ref('int_listings_closed_cleaned') }} c
  LEFT JOIN {{ ref('stg_armls__listing_geography') }} lg USING (listing_key)
  LEFT JOIN dedup_canonical dc ON UPPER(TRIM(c.subdivision_name)) = dc.raw_key
)

SELECT
  *,
  -- Community via fresh point-in-polygon (authoritative), canonical-map slug as
  -- the gap-filler. Mirrors int_listings_active_cleaned via shared macros.
  {{ pip_community_slug('latitude', 'longitude') }} AS community_pip_slug,
  {{ pip_region_slug('latitude', 'longitude') }}    AS region_pip_slug,
  {{ community_unified_slug(
       pip_community_slug('latitude', 'longitude'),
       'canonical_slug'
  ) }} AS community_unified_slug,
  -- Subdivision (finest-grain): canonical-map preferred for naming consistency,
  -- else cleaned subdivision_name slug. Same junk-slug filter applied to both.
  CASE
    WHEN canonical_slug IS NOT NULL AND canonical_slug NOT IN (
      'none', 'na', 'n-a', 'unknown', 'metes-bounds', 'metes-and-bounds',
      'no-subdivision', 'no-subdivisions', 'no-sub', 'tbd', 'see-remarks',
      'rural', 'farm', 'subdivision'
    ) AND canonical_slug != '' THEN canonical_slug
    WHEN subdivision_raw_slug IS NOT NULL AND subdivision_raw_slug NOT IN (
      'none', 'na', 'n-a', 'unknown', 'metes-bounds', 'metes-and-bounds',
      'no-subdivision', 'no-subdivisions', 'no-sub', 'tbd', 'see-remarks'
    ) AND subdivision_raw_slug != '' THEN subdivision_raw_slug
    ELSE NULL
  END AS subdivision_slug,

  -- Price band as a derived dimension. Brackets per yong2 chart spec:
  -- 200-400K, 400-600K, 600-800K, 800K-1M, 1M-2M, 2M-5M, 5M-10M, 10M+.
  CASE
    WHEN close_price <   400000 THEN '200K-400K'
    WHEN close_price <   600000 THEN '400K-600K'
    WHEN close_price <   800000 THEN '600K-800K'
    WHEN close_price <  1000000 THEN '800K-1M'
    WHEN close_price <  2000000 THEN '1M-2M'
    WHEN close_price <  5000000 THEN '2M-5M'
    WHEN close_price < 10000000 THEN '5M-10M'
    ELSE '10M+'
  END AS price_band

FROM slug_helpers
