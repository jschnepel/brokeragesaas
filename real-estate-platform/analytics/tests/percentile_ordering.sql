-- Returns rows = test FAILS.
-- p10 ≤ median ≤ p90 must hold for every gold row that has all three.

SELECT scope_type, scope_key, property_segment, month,
       p10_close, median_close, p90_close
FROM {{ ref('fct_market_pulse') }}
WHERE p10_close IS NOT NULL
  AND median_close IS NOT NULL
  AND p90_close IS NOT NULL
  AND NOT (p10_close <= median_close AND median_close <= p90_close)
