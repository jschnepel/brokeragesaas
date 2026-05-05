{{ config(materialized=('external' if target.name == 'prod' else 'table'), enabled=(var('enable_active', false))) }}

-- DOM bucket histogram for current active inventory.
-- "How long has inventory been on the market?"
-- Grain: scope_type × scope_key × property_segment × dom_band.

WITH segments AS ({{ property_segments() }}),

base AS (
  SELECT a.*, s.property_segment AS scope_segment
  FROM {{ ref('int_listings_active_cleaned') }} a
  CROSS JOIN segments s
  WHERE (s.property_segment = 'all' OR a.property_segment = s.property_segment)
    AND a.dom_band IS NOT NULL
),

metro AS (
  SELECT
    'metro'         AS scope_type,
    'phoenix_metro' AS scope_key,
    scope_segment   AS property_segment,
    dom_band,
    COUNT(*)                                        AS active_count,
    AVG(list_price)                                 AS mean_list_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf
  FROM base
  GROUP BY 1, 2, 3, 4
),

region AS (
  SELECT
    'region'      AS scope_type,
    region_slug   AS scope_key,
    scope_segment AS property_segment,
    dom_band,
    COUNT(*)                                        AS active_count,
    AVG(list_price)                                 AS mean_list_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf
  FROM base
  WHERE region_slug IS NOT NULL
  GROUP BY 1, 2, 3, 4
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'dom_band']) }} AS active_dom_id,
  scope_type, scope_key, property_segment, dom_band,
  active_count, mean_list_price, median_ppsf,
  {{ confidence_band('active_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM (SELECT * FROM metro UNION ALL SELECT * FROM region) u
ORDER BY scope_type, scope_key, property_segment, dom_band
