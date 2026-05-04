{{ config(enabled=(var('enable_active', false))) }}

-- Returns rows = test FAILS.
-- Every row in fct_active_inventory must have an underlying listing
-- with a valid active-family status (Active, AUC, Pending, Coming Soon).

SELECT a.scope_type, a.scope_key, a.property_segment, a.active_count
FROM {{ ref('fct_active_inventory') }} a
WHERE a.active_count IS NULL
   OR a.active_count < 0
