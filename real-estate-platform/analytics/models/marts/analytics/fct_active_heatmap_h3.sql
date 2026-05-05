{{ config(materialized=('external' if target.name == 'prod' else 'table'), enabled=(var('enable_active', false))) }}

-- H3 hex aggregation of currently-active listings for map visualization.
-- Grain: h3_cell_8 × property_segment.
-- Powers the /phoenix Geography tab heatmap.
--
-- H3 resolution 8: ~530 m hex (good for metro-scale heatmap; ~13K hexes for
-- the entire Phoenix metro). DuckDB has spatial extension OR we precompute
-- H3 cells in the active-snapshot Lambda — for now, approximate with lat/lng
-- buckets (0.005° ≈ 555 m at 33° latitude, close enough to H3 res 8).

WITH segments AS ({{ property_segments() }}),

base AS (
  SELECT
    a.*,
    s.property_segment AS scope_segment,
    -- Bucketed lat/lng standing in for H3 resolution 8
    ROUND(a.latitude  / 0.005) * 0.005 AS hex_lat_anchor,
    ROUND(a.longitude / 0.005) * 0.005 AS hex_lng_anchor
  FROM {{ ref('int_listings_active_cleaned') }} a
  CROSS JOIN segments s
  WHERE (s.property_segment = 'all' OR a.property_segment = s.property_segment)
    AND a.latitude IS NOT NULL
    AND a.longitude IS NOT NULL
)

SELECT
  {{ dbt_utils.generate_surrogate_key([
    'hex_lat_anchor', 'hex_lng_anchor', 'scope_segment'
  ]) }} AS heatmap_cell_id,
  scope_segment AS property_segment,
  hex_lat_anchor,
  hex_lng_anchor,
  COUNT(*)                                                 AS listing_count,
  AVG(list_price)                                          AS mean_list_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)  AS median_list_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) AS median_dom,
  CURRENT_TIMESTAMP AS gold_built_at
FROM base
GROUP BY hex_lat_anchor, hex_lng_anchor, scope_segment
HAVING COUNT(*) >= 1   -- noise floor; tune if hexes are too sparse
ORDER BY listing_count DESC
