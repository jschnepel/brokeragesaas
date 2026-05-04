-- Returns rows = test FAILS.
-- Catches sync holes like the 2019 dip: no month should drop >40% vs trailing-12mo average,
-- except for the current (incomplete) month.

WITH metro_residential AS (
  SELECT month, closing_count
  FROM {{ ref('fct_market_pulse') }}
  WHERE scope_type = 'metro' AND property_segment = 'residential'
    AND month < DATE_TRUNC('month', CURRENT_DATE)  -- exclude current incomplete month
),
with_baseline AS (
  SELECT
    month,
    closing_count,
    AVG(closing_count) OVER (
      ORDER BY month
      ROWS BETWEEN 12 PRECEDING AND 1 PRECEDING
    ) AS trailing_12mo_avg
  FROM metro_residential
)
SELECT month, closing_count, trailing_12mo_avg,
       ROUND(100.0 * closing_count / NULLIF(trailing_12mo_avg, 0), 1) AS pct_of_baseline
FROM with_baseline
WHERE trailing_12mo_avg > 0
  AND closing_count < trailing_12mo_avg * 0.6   -- >40% below trailing average
  AND month >= DATE '2012-01-01'                 -- skip ramp-up year
