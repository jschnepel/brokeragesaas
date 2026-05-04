-- Returns rows = test FAILS.
-- Asserts that fct_market_pulse has a row for every month from 2011-01 to last
-- complete month, for property_segment='all' at scope_type='metro'.

WITH expected AS (
  SELECT month FROM {{ ref('int_calendar') }}
  WHERE month BETWEEN DATE '2011-01-01' AND DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
),
present AS (
  SELECT DISTINCT month FROM {{ ref('fct_market_pulse') }}
  WHERE scope_type = 'metro' AND property_segment = 'all'
)
SELECT e.month
FROM expected e
LEFT JOIN present p USING (month)
WHERE p.month IS NULL
