{{ config(materialized='table') }}

-- Monthly negotiation metrics. Includes BOTH the legacy close_to_list ratio
-- and the new close_to_original ratio (true negotiation strength).
-- Calendar-spined × property_segment.

WITH cal      AS (SELECT * FROM {{ ref('int_calendar') }}),
     segments AS ({{ property_segments() }}),

base AS (
  SELECT
    cal.month,
    s.property_segment,
    c.close_price,
    c.list_price,
    c.original_list_price,
    c.sale_to_list_ratio,
    c.close_to_original_ratio,
    c.had_price_reduction,
    c.total_reduction_amount,
    c.net_price_change_pct
  FROM cal
  CROSS JOIN segments s
  LEFT JOIN {{ ref('fct_closings') }} c
    ON c.close_month = cal.month
    AND (s.property_segment = 'all' OR c.property_segment = s.property_segment)
)

SELECT
  -- Surrogate key (per amendment 2026-04-28 §4.4)
  {{ dbt_utils.generate_surrogate_key([
    "'metro'", "'phoenix_metro'", 'property_segment', 'month'
  ]) }} AS negotiation_id,
  'metro'         AS scope_type,
  'phoenix_metro' AS scope_key,
  property_segment,
  month,
  COUNT(close_price) AS closing_count,

  -- Close vs final list
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sale_to_list_ratio)  AS median_sale_to_list,
  AVG(sale_to_list_ratio)                                          AS mean_sale_to_list,
  COUNT(*) FILTER (WHERE close_price > list_price)::DOUBLE
    / NULLIF(COUNT(close_price), 0) * 100                          AS pct_above_list,
  COUNT(*) FILTER (WHERE close_price < list_price)::DOUBLE
    / NULLIF(COUNT(close_price), 0) * 100                          AS pct_below_list,

  -- Close vs ORIGINAL list (true negotiation strength — only meaningful for the 11.3% with reductions)
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_to_original_ratio)
    FILTER (WHERE had_price_reduction)                             AS median_close_to_original,
  AVG(close_to_original_ratio)
    FILTER (WHERE had_price_reduction)                             AS mean_close_to_original,

  -- Reduction prevalence
  COUNT(*) FILTER (WHERE had_price_reduction)::DOUBLE
    / NULLIF(COUNT(close_price), 0) * 100                          AS pct_with_reduction,
  AVG(total_reduction_amount) FILTER (WHERE had_price_reduction)   AS mean_reduction_amount,
  AVG(net_price_change_pct)   FILTER (WHERE had_price_reduction)   AS mean_net_change_pct,

  {{ confidence_band('COUNT(close_price)') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at

FROM base
GROUP BY scope_type, scope_key, property_segment, month
ORDER BY property_segment, month
