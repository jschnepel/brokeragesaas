{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table')) }}

-- Buyer-side BRAND leaderboard (canonicalized across franchise offices).
--
-- fct_buyer_office is keyed on (year, buyer_office_key) — each physical
-- franchise office is its own row. Large brokerage chains (eXp, Realty
-- ONE Group, My Home Group, Compass) have dozens of office_keys, so the
-- raw mart shows the same brand multiple times in any top-N leaderboard
-- (verified in /phoenix/activity: eXp Realty at ranks 2 + 7, Realty ONE
-- Group at 6 + 9, My Home Group at 5 + 10).
--
-- This mart collapses on canonical brand name. The live data shows the
-- duplicate rows in fct_buyer_office have IDENTICAL buyer_office_name
-- (case- and whitespace-equal) — so UPPER+TRIM is sufficient. No fuzzy
-- regex needed for the franchise-collapse problem; a future cleanup can
-- normalize common suffixes ("Real Estate", "LLC") if needed.

SELECT
  {{ dbt_utils.generate_surrogate_key([
    'EXTRACT(YEAR FROM close_date)::TEXT',
    "UPPER(TRIM(buyer_office_name))"
  ]) }} AS buyer_brand_id,
  EXTRACT(YEAR FROM close_date)::INT       AS year,
  -- Display name: pick the most-frequent variant of capitalization for
  -- this brand using MODE() so the leaderboard renders the brokerage's
  -- own preferred casing rather than ALL-CAPS.
  MODE() WITHIN GROUP (ORDER BY buyer_office_name) AS buyer_brand_name,
  UPPER(TRIM(buyer_office_name))           AS buyer_brand_key,
  COUNT(DISTINCT buyer_office_key)         AS office_count,
  COUNT(*)                                 AS deals,
  SUM(close_price)                         AS total_volume,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price) AS median_close,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)
    FILTER (WHERE {{ is_valid_for_dom_metric('days_on_market') }}) AS median_dom,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sale_to_list_ratio)
    FILTER (WHERE {{ is_valid_for_ratio_metric('close_price', 'list_price') }}) AS median_sale_to_list,
  COUNT(*) FILTER (WHERE is_dual_representation) AS dual_rep_deals,
  COUNT(*) FILTER (WHERE is_dual_representation)::DOUBLE / COUNT(*) * 100 AS pct_dual_rep,
  CURRENT_TIMESTAMP AS gold_built_at
FROM {{ ref('fct_closings') }}
WHERE buyer_office_name IS NOT NULL
  AND TRIM(buyer_office_name) <> ''
  AND property_segment = 'residential'
GROUP BY EXTRACT(YEAR FROM close_date), UPPER(TRIM(buyer_office_name))
HAVING COUNT(*) >= 5  -- noise floor
ORDER BY year DESC, deals DESC
