{{ config(materialized=('external' if target.name == 'prod' else 'table'), enabled=(var('enable_active', false))) }}

-- Price-band histogram for current active inventory.
-- Grain: scope_type × scope_key × property_segment × price_band.
-- Powers the /phoenix Inventory tab price-band stacked bar.

WITH segments AS ({{ property_segments() }}),

base AS (
  SELECT a.*, s.property_segment AS scope_segment
  FROM {{ ref('int_listings_active_cleaned') }} a
  CROSS JOIN segments s
  WHERE (s.property_segment = 'all' OR a.property_segment = s.property_segment)
),

metro AS (
  SELECT
    'metro'         AS scope_type,
    'phoenix_metro' AS scope_key,
    scope_segment   AS property_segment,
    price_band,
    COUNT(*)                                        AS active_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)   AS median_dom,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf,
    AVG(list_price)                                 AS mean_list_price
  FROM base
  WHERE price_band IS NOT NULL
  GROUP BY 1, 2, 3, 4
),

region AS (
  SELECT
    'region'      AS scope_type,
    region_slug   AS scope_key,
    scope_segment AS property_segment,
    price_band,
    COUNT(*)                                        AS active_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)   AS median_dom,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf,
    AVG(list_price)                                 AS mean_list_price
  FROM base
  WHERE region_slug IS NOT NULL AND price_band IS NOT NULL
  GROUP BY 1, 2, 3, 4
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'price_band']) }} AS active_pricetier_id,
  scope_type, scope_key, property_segment, price_band,
  active_count, median_dom, median_ppsf, mean_list_price,
  {{ confidence_band('active_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM (SELECT * FROM metro UNION ALL SELECT * FROM region) u
ORDER BY scope_type, scope_key, property_segment, price_band
