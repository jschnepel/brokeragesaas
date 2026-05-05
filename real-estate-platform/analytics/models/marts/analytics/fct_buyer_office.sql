{{ config(materialized=('external' if target.name == 'prod' else 'table')) }}

-- Buyer-side office leaderboard, by year.
-- Excludes Non-MLS placeholders (already nulled in intermediate).

SELECT
  -- Surrogate key (per amendment 2026-04-28 §4.4)
  {{ dbt_utils.generate_surrogate_key([
    'EXTRACT(YEAR FROM close_date)::TEXT', 'buyer_office_key'
  ]) }} AS buyer_office_id,
  EXTRACT(YEAR FROM close_date)::INT AS year,
  buyer_office_name,
  buyer_office_key,
  COUNT(*)                                         AS deals,
  SUM(close_price)                                 AS total_volume,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price) AS median_close,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) AS median_dom,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sale_to_list_ratio) AS median_sale_to_list,
  COUNT(*) FILTER (WHERE is_dual_representation) AS dual_rep_deals,
  COUNT(*) FILTER (WHERE is_dual_representation)::DOUBLE / COUNT(*) * 100 AS pct_dual_rep,
  CURRENT_TIMESTAMP AS gold_built_at
FROM {{ ref('fct_closings') }}
WHERE buyer_office_name IS NOT NULL
  AND property_segment = 'residential'
GROUP BY buyer_office_id, year, buyer_office_name, buyer_office_key
HAVING COUNT(*) >= 5  -- noise floor
ORDER BY year DESC, deals DESC
