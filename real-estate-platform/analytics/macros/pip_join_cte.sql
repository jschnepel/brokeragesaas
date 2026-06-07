{% macro pip_join_cte(points_cte, kind) %}
  {#- Emit a CTE named `<kind>_pip` that assigns each row of `points_cte`
      (which must expose listing_key, latitude, longitude) to exactly one
      boundary polygon via a SET-BASED spatial join, so DuckDB uses the
      SPATIAL_JOIN operator (R-tree) instead of a per-row correlated subquery.

      kind = 'community' -> returns COALESCE(parent_slug, community_slug)
                            (child polygons roll up to the top-level community)
      kind = 'region'    -> returns region_slug

      Smallest covering polygon wins (most specific) via QUALIFY ROW_NUMBER.
      ST_Covers is boundary-inclusive (a point on an edge still matches),
      bbox BETWEEN is the cheap prefilter. Output column: pip_slug. -#}
  {%- if kind == 'community' -%}
    {%- set out_expr = 'COALESCE(b.parent_slug, b.community_slug)' -%}
  {%- else -%}
    {%- set out_expr = 'b.region_slug' -%}
  {%- endif -%}
{{ kind }}_pip AS (
  SELECT
    p.listing_key,
    {{ out_expr }} AS pip_slug
  FROM {{ points_cte }} p
  JOIN {{ ref('stg_geo__community_boundaries') }} b
    ON p.longitude BETWEEN b.bbox_min_lng AND b.bbox_max_lng
   AND p.latitude  BETWEEN b.bbox_min_lat AND b.bbox_max_lat
   AND ST_Covers(b.boundary_geom, ST_Point(p.longitude, p.latitude))
  WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    {%- if kind == 'region' %}
    AND b.region_slug IS NOT NULL
    {%- endif %}
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY p.listing_key
    ORDER BY b.area_sq_mi ASC NULLS LAST
  ) = 1
)
{% endmacro %}
