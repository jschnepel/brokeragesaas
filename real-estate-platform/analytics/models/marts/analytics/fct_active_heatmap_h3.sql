{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table'), enabled=(var('enable_active', false))) }}

-- Lat/lng bucket aggregation of currently-active listings for map
-- visualization. Grain: hex_lat_anchor × hex_lng_anchor × property_segment.
-- Powers the /phoenix Geographic Intelligence heatmap on yong2 — re-binned
-- to true H3 res 7 hexagons client-side via h3-js.
--
-- Bucket size: 0.005° ≈ 555 m at 33° latitude (close to H3 res 8). DuckDB
-- lacks a native H3 extension on the Fargate image; rebinning to true H3
-- happens in yong2's app/phoenix/lib/heatmap-data.ts, where ~5 km res 7
-- hexes form the prototype + premium-site visual.
--
-- Labels: `dominant_city`, `dominant_region`, `dominant_community` carry
-- the modal value across the listings in each bucket. yong2 uses these in
-- the side-panel rankings table; the prior implementation reverse-derived
-- city via point-in-polygon against a static geojson, which was lossy at
-- bucket boundaries. Modal-from-source is authoritative.

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
  WHERE {{ segment_includes('s.property_segment', 'a.property_segment') }}
    AND a.latitude IS NOT NULL
    AND a.longitude IS NOT NULL
),

-- Modal label per (bucket × segment) for each text dimension. MODE() handles
-- ties by first-encountered, which is fine for label readability — these
-- are display strings, not analytic dimensions.
labels AS (
  SELECT
    hex_lat_anchor,
    hex_lng_anchor,
    scope_segment,
    MODE() WITHIN GROUP (ORDER BY city)            FILTER (WHERE city IS NOT NULL)            AS dominant_city,
    MODE() WITHIN GROUP (ORDER BY region_name)     FILTER (WHERE region_name IS NOT NULL)     AS dominant_region,
    MODE() WITHIN GROUP (ORDER BY community_name)  FILTER (WHERE community_name IS NOT NULL)  AS dominant_community
  FROM base
  GROUP BY hex_lat_anchor, hex_lng_anchor, scope_segment
)

SELECT
  {{ dbt_utils.generate_surrogate_key([
    'b.hex_lat_anchor', 'b.hex_lng_anchor', 'b.scope_segment'
  ]) }} AS heatmap_cell_id,
  b.scope_segment AS property_segment,
  b.hex_lat_anchor,
  b.hex_lng_anchor,
  COUNT(*)                                                  AS listing_count,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b.list_price) AS median_list_price,
  -- list_price_per_sqft is precomputed in int_listings_active_cleaned
  -- (NULL when living_area is missing/0). PERCENTILE_CONT skips NULLs.
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b.list_price_per_sqft)
    FILTER (WHERE b.list_price_per_sqft IS NOT NULL)        AS median_list_price_per_sqft,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b.days_on_market)
    FILTER (WHERE {{ is_valid_for_dom_typical('b.days_on_market') }}) AS median_dom_typical,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b.days_on_market)
    FILTER (WHERE {{ is_valid_for_dom_metric('b.days_on_market') }})  AS median_dom,
  l.dominant_city,
  l.dominant_region,
  l.dominant_community,
  CURRENT_TIMESTAMP AS gold_built_at
FROM base b
LEFT JOIN labels l USING (hex_lat_anchor, hex_lng_anchor, scope_segment)
GROUP BY
  b.hex_lat_anchor, b.hex_lng_anchor, b.scope_segment,
  l.dominant_city, l.dominant_region, l.dominant_community
HAVING COUNT(*) >= 1   -- noise floor; tune if hexes are too sparse
ORDER BY listing_count DESC
