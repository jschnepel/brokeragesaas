{{ config(materialized=('external' if target.name == 'prod' else 'table'), enabled=(var('enable_active', false))) }}

-- Months-of-supply: current active inventory ÷ trailing 12-month avg monthly closings.
-- Grain: scope_type × scope_key × property_segment.
--
-- THE killer active analytic. <2 months = seller's market, 6+ = buyer's market.
-- Joins ACTIVE state to CLOSED history — the cross-mart that makes both pipelines worthwhile.

WITH active_counts AS (
  SELECT
    scope_type,
    scope_key,
    property_segment,
    active_count
  FROM {{ ref('fct_active_inventory') }}
),

closed_pace AS (
  SELECT
    scope_type,
    scope_key,
    property_segment,
    -- Trailing 12-month avg monthly closing count
    SUM(closing_count) FILTER (
      WHERE month BETWEEN DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
                      AND DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
    )::DOUBLE / 12.0 AS avg_monthly_closings_12mo,
    -- Trailing 3-month avg (more responsive)
    SUM(closing_count) FILTER (
      WHERE month BETWEEN DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
                      AND DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
    )::DOUBLE / 3.0 AS avg_monthly_closings_3mo
  FROM {{ ref('fct_market_pulse') }}
  GROUP BY scope_type, scope_key, property_segment
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['a.scope_type', 'a.scope_key', 'a.property_segment']) }} AS months_of_supply_id,
  a.scope_type,
  a.scope_key,
  a.property_segment,
  a.active_count,
  c.avg_monthly_closings_12mo,
  c.avg_monthly_closings_3mo,
  -- Months-of-supply = how long current inventory would last at current pace
  CASE
    WHEN c.avg_monthly_closings_12mo > 0
    THEN a.active_count::DOUBLE / c.avg_monthly_closings_12mo
  END AS months_of_supply_12mo,
  CASE
    WHEN c.avg_monthly_closings_3mo > 0
    THEN a.active_count::DOUBLE / c.avg_monthly_closings_3mo
  END AS months_of_supply_3mo,
  -- Market label
  CASE
    WHEN c.avg_monthly_closings_12mo IS NULL OR c.avg_monthly_closings_12mo = 0 THEN 'unknown'
    WHEN a.active_count::DOUBLE / c.avg_monthly_closings_12mo < 2  THEN 'strong_sellers'
    WHEN a.active_count::DOUBLE / c.avg_monthly_closings_12mo < 4  THEN 'sellers'
    WHEN a.active_count::DOUBLE / c.avg_monthly_closings_12mo < 6  THEN 'balanced'
    WHEN a.active_count::DOUBLE / c.avg_monthly_closings_12mo < 9  THEN 'buyers'
    ELSE 'strong_buyers'
  END AS market_classification,
  {{ confidence_band('a.active_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM active_counts a
LEFT JOIN closed_pace c USING (scope_type, scope_key, property_segment)
ORDER BY a.scope_type, a.scope_key, a.property_segment
