{# In prod, materialize as table — the per-scope split files write
   separate parquets so yong2 only cold-fetches the community grain
   when a community filter is active. See fct_market_pulse_by_pricetier
   header for the cardinality rationale. #}
{{ config(materialized='table') }}

-- Monthly negotiation metrics with `price_band` added to the grain.
-- Sibling of `fct_negotiation` — same metrics (median sale-to-list,
-- % above/below list, % with reduction, etc.), but one additional
-- dimension (price band) so /phoenix pricing/timing KPIs can filter
-- to a band selection without per-request silver-layer aggregation.
--
-- Grain: scope_type × scope_key × property_segment × price_band × month
-- Scope ladder: metro + region + community (subdivision/zipcode excluded
-- per the same cardinality budget as fct_market_pulse_by_pricetier).

WITH cal AS (
  SELECT * FROM {{ ref('int_calendar') }}
),

segments AS ({{ property_segments() }}),

bands AS (
  SELECT DISTINCT price_band
  FROM {{ ref('fct_closings') }}
  WHERE price_band IS NOT NULL
),

active_communities AS (
  -- See fct_market_pulse_by_pricetier for the rationale on this filter.
  SELECT community_unified_slug
  FROM {{ ref('fct_closings') }}
  WHERE community_unified_slug IS NOT NULL
    AND close_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
    AND close_date <  DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY 1
  HAVING COUNT(*) >= 6
),

{% set base_metrics %}
  COUNT(close_price) AS closing_count,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sale_to_list_ratio)
    FILTER (WHERE {{ is_valid_for_ratio_metric('close_price', 'list_price') }}) AS median_sale_to_list,
  COUNT(*) FILTER (WHERE close_price > list_price)::DOUBLE
    / NULLIF(COUNT(close_price), 0) * 100                          AS pct_above_list,
  COUNT(*) FILTER (WHERE close_price < list_price)::DOUBLE
    / NULLIF(COUNT(close_price), 0) * 100                          AS pct_below_list,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_to_original_ratio)
    FILTER (WHERE had_price_reduction
            AND {{ is_valid_for_ratio_metric('close_price', 'original_list_price') }}) AS median_close_to_original,
  COUNT(*) FILTER (WHERE had_price_reduction)::DOUBLE
    / NULLIF(COUNT(close_price), 0) * 100                          AS pct_with_reduction,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_reduction_amount)
    FILTER (WHERE had_price_reduction)                             AS median_reduction_amount,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY net_price_change_pct)
    FILTER (WHERE had_price_reduction)                             AS median_net_change_pct
{% endset %}

base AS (
  SELECT
    cal.month,
    seg.property_segment AS scope_segment,
    b.price_band,
    c.region_slug,
    c.community_unified_slug,
    c.close_price, c.list_price, c.original_list_price,
    c.sale_to_list_ratio, c.close_to_original_ratio,
    c.had_price_reduction, c.total_reduction_amount, c.net_price_change_pct
  FROM cal
  CROSS JOIN segments seg
  CROSS JOIN bands b
  LEFT JOIN {{ ref('fct_closings') }} c
    ON c.close_month = cal.month
   AND c.price_band  = b.price_band
   AND {{ segment_includes('seg.property_segment', 'c.property_segment') }}
),

metro_agg AS (
  SELECT 'metro' AS scope_type, 'phoenix_metro' AS scope_key, scope_segment AS property_segment, price_band, month,
    {{ base_metrics }}
  FROM base GROUP BY 1, 2, 3, 4, 5
),
region_agg AS (
  SELECT 'region' AS scope_type, region_slug AS scope_key, scope_segment AS property_segment, price_band, month,
    {{ base_metrics }}
  FROM base WHERE region_slug IS NOT NULL GROUP BY 1, 2, 3, 4, 5
),
community_agg AS (
  SELECT 'community' AS scope_type, community_unified_slug AS scope_key, scope_segment AS property_segment, price_band, month,
    {{ base_metrics }}
  FROM base
  WHERE community_unified_slug IS NOT NULL
    AND community_unified_slug IN (SELECT community_unified_slug FROM active_communities)
  GROUP BY 1, 2, 3, 4, 5
)

,
unioned AS (
  SELECT * FROM metro_agg
  UNION ALL SELECT * FROM region_agg
  UNION ALL SELECT * FROM community_agg
),
with_framing AS (
  SELECT
    *,
    LAG(median_sale_to_list,    12) OVER w AS median_sale_to_list_prior_year,
    LAG(median_sale_to_list,     1) OVER w AS median_sale_to_list_prior_month,
    LAG(pct_with_reduction,     12) OVER w AS pct_with_reduction_prior_year,
    AVG(median_sale_to_list) OVER w_t12     AS median_sale_to_list_t12_avg
  FROM unioned
  WINDOW
    w AS (PARTITION BY scope_type, scope_key, property_segment, price_band ORDER BY month),
    w_t12 AS (PARTITION BY scope_type, scope_key, property_segment, price_band ORDER BY month
              ROWS BETWEEN 11 PRECEDING AND CURRENT ROW)
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'price_band', 'month']) }} AS negotiation_pricetier_id,
  scope_type, scope_key, property_segment, price_band, month,
  closing_count, median_sale_to_list, pct_above_list, pct_below_list,
  median_close_to_original, pct_with_reduction,
  median_reduction_amount, median_net_change_pct,
  median_sale_to_list_prior_year,
  median_sale_to_list_prior_month,
  pct_with_reduction_prior_year,
  median_sale_to_list_t12_avg,
  CASE
    WHEN median_sale_to_list_prior_year IS NOT NULL AND median_sale_to_list_prior_year > 0
    THEN ROUND(((median_sale_to_list - median_sale_to_list_prior_year) / median_sale_to_list_prior_year * 100)::NUMERIC, 2)
  END AS pct_change_sale_to_list_yoy,
  {{ confidence_band('closing_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM with_framing
WHERE month < DATE_TRUNC('month', CURRENT_DATE)
  -- Drop sparse zero-closing rows at community grain (see
  -- fct_market_pulse_by_pricetier for full rationale).
  AND NOT (scope_type = 'community' AND COALESCE(closing_count, 0) = 0)
ORDER BY scope_type, scope_key, property_segment, price_band, month
