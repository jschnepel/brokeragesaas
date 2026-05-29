-- real-estate-platform/analytics/macros/pip_community.sql

{# Smallest covering community for a point. bbox prefilter (BETWEEN) narrows to
   the 1-2 candidate polygons before the boundary-inclusive ST_Covers test;
   smallest area_sq_mi wins on overlap. NULL when no polygon covers the point
   (or lat/long is NULL). EPSG:4326 — ST_Point(lng, lat). #}
{% macro pip_community_slug(lat_col, lng_col) %}
(
  SELECT b.community_slug
  FROM {{ ref('stg_geo__community_boundaries') }} b
  WHERE {{ lng_col }} BETWEEN b.bbox_min_lng AND b.bbox_max_lng
    AND {{ lat_col }} BETWEEN b.bbox_min_lat AND b.bbox_max_lat
    AND ST_Covers(b.boundary_geom, ST_Point({{ lng_col }}, {{ lat_col }}))
  ORDER BY b.area_sq_mi ASC NULLS LAST
  LIMIT 1
)
{% endmacro %}

{% macro pip_region_slug(lat_col, lng_col) %}
(
  SELECT b.region_slug
  FROM {{ ref('stg_geo__community_boundaries') }} b
  WHERE {{ lng_col }} BETWEEN b.bbox_min_lng AND b.bbox_max_lng
    AND {{ lat_col }} BETWEEN b.bbox_min_lat AND b.bbox_max_lat
    AND ST_Covers(b.boundary_geom, ST_Point({{ lng_col }}, {{ lat_col }}))
  ORDER BY b.area_sq_mi ASC NULLS LAST
  LIMIT 1
)
{% endmacro %}

{# Unified community: PIP authoritative, canonical-map subdivision slug as the
   gap-filler where no polygon covers the point. Junk slugs filtered to NULL. #}
{% macro community_unified_slug(pip_slug_col, canonical_slug_col) %}
  CASE
    WHEN {{ pip_slug_col }} IS NOT NULL THEN {{ pip_slug_col }}
    WHEN {{ canonical_slug_col }} IS NULL OR {{ canonical_slug_col }} = '' THEN NULL
    WHEN {{ canonical_slug_col }} IN (
      'none', 'na', 'n-a', 'unknown', 'metes-bounds', 'metes-and-bounds',
      'no-subdivision', 'no-subdivisions', 'no-sub', 'tbd', 'see-remarks',
      'rural', 'farm', 'subdivision'
    ) THEN NULL
    ELSE {{ canonical_slug_col }}
  END
{% endmacro %}
