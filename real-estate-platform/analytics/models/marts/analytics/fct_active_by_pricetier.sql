{{ config(materialized=('external' if target.name == 'prod' else 'table'), enabled=(var('enable_active', false))) }}

-- Price-band histogram for current active inventory.
-- Grain: scope_type × scope_key × property_segment × price_band.

WITH segments AS (
  SELECT 'residential' AS property_segment UNION ALL
  SELECT 'land'        AS property_segment UNION ALL
  SELECT 'all'         AS property_segment
),

base AS (
  SELECT a.*, seg.property_segment AS scope_segment
  FROM {{ ref('int_listings_active_cleaned') }} a
  CROSS JOIN segments seg
  WHERE (seg.property_segment = 'all' OR a.property_segment = seg.property_segment)
    AND a.price_band IS NOT NULL
),

metro_agg AS (
  SELECT 'metro' AS scope_type, 'phoenix_metro' AS scope_key, scope_segment AS property_segment, price_band,
    COUNT(*) AS active_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) AS median_dom,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf,
    AVG(list_price) AS mean_list_price
  FROM base GROUP BY 1, 2, 3, 4
),
region_agg AS (
  SELECT 'region' AS scope_type, region_slug AS scope_key, scope_segment AS property_segment, price_band,
    COUNT(*) AS active_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) AS median_dom,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf,
    AVG(list_price) AS mean_list_price
  FROM base WHERE region_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
community_agg AS (
  SELECT 'community' AS scope_type, community_unified_slug AS scope_key, scope_segment AS property_segment, price_band,
    COUNT(*) AS active_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) AS median_dom,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf,
    AVG(list_price) AS mean_list_price
  FROM base WHERE community_unified_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
subdivision_agg AS (
  SELECT 'subdivision' AS scope_type, subdivision_slug AS scope_key, scope_segment AS property_segment, price_band,
    COUNT(*) AS active_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) AS median_dom,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf,
    AVG(list_price) AS mean_list_price
  FROM base WHERE subdivision_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
zipcode_agg AS (
  SELECT 'zipcode' AS scope_type, postal_code AS scope_key, scope_segment AS property_segment, price_band,
    COUNT(*) AS active_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) AS median_dom,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf,
    AVG(list_price) AS mean_list_price
  FROM base WHERE postal_code IS NOT NULL GROUP BY 1, 2, 3, 4
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'price_band']) }} AS active_pricetier_id,
  scope_type, scope_key, property_segment, price_band,
  active_count, median_dom, median_ppsf, mean_list_price,
  {{ confidence_band('active_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM (
  SELECT * FROM metro_agg
  UNION ALL SELECT * FROM region_agg
  UNION ALL SELECT * FROM community_agg
  UNION ALL SELECT * FROM subdivision_agg
  UNION ALL SELECT * FROM zipcode_agg
) u
ORDER BY scope_type, scope_key, property_segment, price_band
