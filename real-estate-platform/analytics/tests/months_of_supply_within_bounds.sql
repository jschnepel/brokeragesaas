{{ config(enabled=(var('enable_active', false))) }}

-- Returns rows = test FAILS.
-- Months-of-supply outside the [0, 60] range is a calculation error
-- (negative supply impossible; >5 years of supply is implausible).

SELECT scope_type, scope_key, property_segment,
       active_count, avg_monthly_closings_12mo, months_of_supply_12mo
FROM {{ ref('fct_months_of_supply') }}
WHERE months_of_supply_12mo IS NOT NULL
  AND (months_of_supply_12mo < 0 OR months_of_supply_12mo > 60)
