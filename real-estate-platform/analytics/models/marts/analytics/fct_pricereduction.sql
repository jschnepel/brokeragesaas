{{ config(materialized='table') }}

-- Monthly price-reduction metrics: % w/ reduction, mean reduction $, mean reduction %.
-- Calendar-spined × property_segment × price_band.
-- Only listings WITH reductions contribute to mean_reduction_amount; the rest contribute to the denominator.

WITH cal      AS (SELECT * FROM {{ ref('int_calendar') }}),
     segments AS ({{ property_segments() }}),

base AS (
  SELECT
    cal.month,
    s.property_segment,
    c.price_band,
    c.had_price_reduction,
    c.total_reduction_amount,
    c.net_price_change_pct,
    c.reduction_count
  FROM cal
  CROSS JOIN segments s
  LEFT JOIN {{ ref('fct_closings') }} c
    ON c.close_month = cal.month
    AND (s.property_segment = 'all' OR c.property_segment = s.property_segment)
)

SELECT
  -- Surrogate key (per amendment 2026-04-28 §4.4)
  {{ dbt_utils.generate_surrogate_key([
    "'metro'", "'phoenix_metro'", 'property_segment', 'month',
    "COALESCE(price_band, 'all_bands')"
  ]) }} AS pricereduction_id,
  'metro'         AS scope_type,
  'phoenix_metro' AS scope_key,
  property_segment,
  COALESCE(price_band, 'all_bands') AS price_band,
  month,
  COUNT(*) FILTER (WHERE had_price_reduction IS NOT NULL) AS closing_count,
  COUNT(*) FILTER (WHERE had_price_reduction)             AS reduced_count,
  COUNT(*) FILTER (WHERE had_price_reduction)::DOUBLE
    / NULLIF(COUNT(*) FILTER (WHERE had_price_reduction IS NOT NULL), 0) * 100 AS pct_with_reduction,
  AVG(total_reduction_amount) FILTER (WHERE had_price_reduction) AS mean_reduction_amount,
  AVG(net_price_change_pct)   FILTER (WHERE had_price_reduction) AS mean_net_change_pct,
  AVG(reduction_count::DOUBLE) FILTER (WHERE had_price_reduction) AS mean_reductions_per_listing,
  {{ confidence_band("COUNT(*) FILTER (WHERE had_price_reduction IS NOT NULL)") }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM base
GROUP BY property_segment, price_band, month
ORDER BY property_segment, price_band, month
