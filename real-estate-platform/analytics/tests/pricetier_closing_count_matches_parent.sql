{{ config(severity='warn') }}
-- Cross-mart consistency: summing closing_count across all price bands in
-- fct_market_pulse_by_pricetier for a given (scope, month) should match the
-- closing_count in the parent fct_market_pulse mart within tolerance.
--
-- Returns rows = test WARNS.
--
-- Why this matters: the two marts derive from the same source
-- (fct_closings) but use different aggregation grains. If banded
-- COUNT(DISTINCT dedup_signature) per price_band sums to something
-- materially different from the all-bands COUNT(DISTINCT dedup_signature),
-- one of the marts has a logic error or the upstream data has duplicates
-- assigned to multiple bands.
--
-- Scope: metro + region only. The community grain in by_pricetier is
-- filtered to >=6 closings/12mo while the parent isn't — comparing them
-- would surface that documented difference, not a real bug. Same reason
-- subdivision/zipcode are excluded.
--
-- Tolerance: 5% drift OR 5 absolute closings, whichever is larger. The
-- by_pricetier mart drops rows with NULL price_band (a small fraction
-- of closings where the upstream macro couldn't derive a band — typically
-- ~0.5%), so a small drift is expected.
--
-- Severity=warn so a legitimate drift (mid-cycle dbt build, upstream
-- band-derivation change) doesn't cascade-skip downstream consumers.

WITH banded_sum AS (
  SELECT
    scope_type,
    scope_key,
    property_segment,
    month,
    SUM(closing_count) AS banded_total
  FROM {{ ref('fct_market_pulse_by_pricetier') }}
  WHERE scope_type IN ('metro', 'region')
  GROUP BY 1, 2, 3, 4
),
parent AS (
  SELECT
    scope_type,
    scope_key,
    property_segment,
    month,
    closing_count AS parent_count
  FROM {{ ref('fct_market_pulse') }}
  WHERE scope_type IN ('metro', 'region')
    AND closing_count > 0
    AND month >= DATE '2012-01-01'  -- skip 2011 ramp-up year, sparse data
)
SELECT
  p.scope_type,
  p.scope_key,
  p.property_segment,
  p.month,
  p.parent_count,
  COALESCE(b.banded_total, 0)                          AS banded_sum,
  p.parent_count - COALESCE(b.banded_total, 0)         AS diff,
  ROUND(
    100.0 * (p.parent_count - COALESCE(b.banded_total, 0))
      / NULLIF(p.parent_count, 0)::DOUBLE,
    2
  )                                                    AS pct_diff
FROM parent p
LEFT JOIN banded_sum b
  ON  b.scope_type       = p.scope_type
  AND b.scope_key        = p.scope_key
  AND b.property_segment = p.property_segment
  AND b.month            = p.month
WHERE ABS(p.parent_count - COALESCE(b.banded_total, 0))
      > GREATEST(p.parent_count * 0.05, 5)
