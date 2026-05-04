{{ config(materialized='table') }}

-- Monthly time series: closings, medians, ppsf, DOM, volume.
-- Calendar-spined (zero-gap) × scope_type × property_segment.
-- scope_type ∈ ('metro','region','community','city','zip','price_band').

WITH segments AS (
  {{ property_segments() }}
),

cal AS (
  SELECT * FROM {{ ref('int_calendar') }}
),

metro AS (
  SELECT
    'metro'         AS scope_type,
    'phoenix_metro' AS scope_key,
    s.property_segment,
    cal.month,
    COUNT(c.listing_key) FILTER (
      WHERE (s.property_segment = 'all' OR c.property_segment = s.property_segment)
    ) AS closing_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price)
      FILTER (WHERE (s.property_segment = 'all' OR c.property_segment = s.property_segment)) AS median_close,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price_per_sqft)
      FILTER (WHERE (s.property_segment = 'all' OR c.property_segment = s.property_segment)) AS median_ppsf,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.days_on_market)
      FILTER (WHERE (s.property_segment = 'all' OR c.property_segment = s.property_segment)) AS median_dom,
    PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY c.close_price)
      FILTER (WHERE (s.property_segment = 'all' OR c.property_segment = s.property_segment)) AS p10_close,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY c.close_price)
      FILTER (WHERE (s.property_segment = 'all' OR c.property_segment = s.property_segment)) AS p90_close,
    SUM(c.close_price)
      FILTER (WHERE (s.property_segment = 'all' OR c.property_segment = s.property_segment)) AS total_volume
  FROM cal
  CROSS JOIN segments s
  LEFT JOIN {{ ref('fct_closings') }} c ON c.close_month = cal.month
  GROUP BY 1, 2, 3, 4
),

with_smoothing AS (
  SELECT
    *,
    AVG(median_close) OVER (
      PARTITION BY scope_type, scope_key, property_segment
      ORDER BY month
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS median_close_3mo,
    SUM(closing_count) OVER (
      PARTITION BY scope_type, scope_key, property_segment
      ORDER BY month
      ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
    ) AS sample_12mo
  FROM metro
)

SELECT
  -- Surrogate key (per amendment 2026-04-28 §4.4)
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'month']) }} AS market_pulse_id,
  *,
  {{ confidence_band('closing_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM with_smoothing
ORDER BY scope_type, scope_key, property_segment, month
