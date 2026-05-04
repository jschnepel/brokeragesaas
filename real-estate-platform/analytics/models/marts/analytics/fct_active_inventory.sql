{{ config(materialized='table', enabled=(var('enable_active', false))) }}

-- Current snapshot KPIs for active inventory.
-- Grain: scope_type × scope_key × property_segment.
-- Powers the /phoenix hero KPI bar (active count, median list, mean DOM).

WITH segments AS ({{ property_segments() }}),

base AS (
  SELECT
    a.*,
    -- Cross-join trick to expand 'all' segment alongside specific ones
    s.property_segment AS scope_segment
  FROM {{ ref('int_listings_active_cleaned') }} a
  CROSS JOIN segments s
  WHERE (s.property_segment = 'all' OR a.property_segment = s.property_segment)
),

metro AS (
  SELECT
    'metro'         AS scope_type,
    'phoenix_metro' AS scope_key,
    scope_segment   AS property_segment,
    COUNT(*)                                        AS active_count,
    COUNT(*) FILTER (WHERE is_active)               AS strict_active_count,
    COUNT(*) FILTER (WHERE is_pending OR is_aux)    AS pending_count,
    COUNT(*) FILTER (WHERE is_coming_soon)          AS coming_soon_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)        AS median_list_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf,
    AVG(list_price)                                 AS mean_list_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)    AS median_dom,
    AVG(days_on_market)                             AS mean_dom,
    SUM(list_price)                                 AS total_list_volume
  FROM base
  GROUP BY 1, 2, 3
),

region AS (
  SELECT
    'region'        AS scope_type,
    region_slug     AS scope_key,
    scope_segment   AS property_segment,
    COUNT(*)                                        AS active_count,
    COUNT(*) FILTER (WHERE is_active)               AS strict_active_count,
    COUNT(*) FILTER (WHERE is_pending OR is_aux)    AS pending_count,
    COUNT(*) FILTER (WHERE is_coming_soon)          AS coming_soon_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)        AS median_list_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf,
    AVG(list_price)                                 AS mean_list_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)    AS median_dom,
    AVG(days_on_market)                             AS mean_dom,
    SUM(list_price)                                 AS total_list_volume
  FROM base
  WHERE region_slug IS NOT NULL
  GROUP BY 1, 2, 3
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment']) }} AS active_inventory_id,
  scope_type, scope_key, property_segment,
  active_count, strict_active_count, pending_count, coming_soon_count,
  median_list_price, median_ppsf, mean_list_price,
  median_dom, mean_dom, total_list_volume,
  {{ confidence_band('active_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM (
  SELECT * FROM metro
  UNION ALL
  SELECT * FROM region
) u
ORDER BY scope_type, scope_key, property_segment
