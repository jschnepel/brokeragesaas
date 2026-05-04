{{ config(materialized='table', enabled=(var('enable_active', false))) }}

-- Weekly pace of new listings going Active.
-- Grain: scope_type × scope_key × property_segment × week.
-- Calendar-spined (zero gaps); rolling 4-week comparison enables
-- "is the market accelerating?" leading-indicator analysis.
--
-- Source: int_listings_status_history.first_active_at (when listing first
-- transitioned to Active). Requires status_history to have data, which
-- requires bronzed change_log.

WITH segments AS ({{ property_segments() }}),

-- Calendar of weeks from 2011-01-03 (first Mon) to today + 1 week
-- Reuses the date spine pattern but at week grain
weeks AS (
  SELECT DATE_TRUNC('week', d::DATE) AS week
  FROM range(
    DATE '2011-01-03',
    DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week',
    INTERVAL '7 days'
  ) t(d)
),

new_listings AS (
  SELECT
    DATE_TRUNC('week', sh.first_active_at::DATE)    AS week,
    a.region_slug,
    a.property_segment,
    COUNT(*) AS n
  FROM {{ ref('int_listings_status_history') }} sh
  JOIN {{ ref('int_listings_active_cleaned') }} a USING (listing_key)
  WHERE sh.first_active_at >= DATE '2011-01-01'
  GROUP BY 1, 2, 3
),

metro AS (
  SELECT
    'metro'         AS scope_type,
    'phoenix_metro' AS scope_key,
    s.property_segment,
    w.week,
    COALESCE(SUM(nl.n) FILTER (
      WHERE s.property_segment = 'all' OR nl.property_segment = s.property_segment
    ), 0) AS new_listings_count
  FROM weeks w
  CROSS JOIN segments s
  LEFT JOIN new_listings nl ON nl.week = w.week
  GROUP BY 1, 2, 3, 4
),

with_smoothing AS (
  SELECT *,
    AVG(new_listings_count) OVER (
      PARTITION BY scope_type, scope_key, property_segment
      ORDER BY week
      ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
    ) AS new_listings_4wk_avg,
    AVG(new_listings_count) OVER (
      PARTITION BY scope_type, scope_key, property_segment
      ORDER BY week
      ROWS BETWEEN 51 PRECEDING AND CURRENT ROW
    ) AS new_listings_52wk_avg
  FROM metro
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'week']) }} AS listing_pace_id,
  scope_type, scope_key, property_segment, week,
  new_listings_count,
  new_listings_4wk_avg,
  new_listings_52wk_avg,
  CASE
    WHEN new_listings_52wk_avg > 0
    THEN (new_listings_4wk_avg - new_listings_52wk_avg) / new_listings_52wk_avg * 100
  END AS pct_change_vs_52wk,
  {{ confidence_band('new_listings_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM with_smoothing
ORDER BY scope_type, scope_key, property_segment, week
