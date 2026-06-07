{# In prod, materialize as table — the 5 derived `fct_negotiation_<scope>`
   models split this on scope_type for sub-100ms cold fetches. #}
{{ config(materialized='table') }}

-- Monthly negotiation metrics × scope_type × property_segment.
-- close_to_list ratio (legacy) + close_to_original ratio (true negotiation strength).

WITH cal AS (
  SELECT * FROM {{ ref('int_calendar') }}
),

segments AS ({{ property_segments() }}),

{# Negotiation metrics — applies industry-standard outlier rules:
   - Sale-to-list median: drop rows with ratio outside [0.5, 2.0] (Redfin).
   - Mean sale-to-list dropped: outliers swing it; median is sufficient.
   - Reduction amounts: switched from mean to median (right-skewed distribution).
   - Net change pct: switched from mean to median for the same reason. #}
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
    c.region_slug,
    c.community_unified_slug,
    c.subdivision_slug,
    c.postal_code,
    c.close_price, c.list_price, c.original_list_price,
    c.sale_to_list_ratio, c.close_to_original_ratio,
    c.had_price_reduction, c.total_reduction_amount, c.net_price_change_pct
  FROM cal
  CROSS JOIN segments seg
  LEFT JOIN {{ ref('fct_closings') }} c
    ON c.close_month = cal.month
   AND {{ segment_includes('seg.property_segment', 'c.property_segment') }}
),

metro_agg AS (
  SELECT 'metro' AS scope_type, 'phoenix_metro' AS scope_key, scope_segment AS property_segment, month,
    {{ base_metrics }}
  FROM base GROUP BY 1, 2, 3, 4
),
region_agg AS (
  SELECT 'region' AS scope_type, region_slug AS scope_key, scope_segment AS property_segment, month,
    {{ base_metrics }}
  FROM base WHERE region_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
community_agg AS (
  SELECT 'community' AS scope_type, community_unified_slug AS scope_key, scope_segment AS property_segment, month,
    {{ base_metrics }}
  FROM base WHERE community_unified_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
subdivision_agg AS (
  SELECT 'subdivision' AS scope_type, subdivision_slug AS scope_key, scope_segment AS property_segment, month,
    {{ base_metrics }}
  FROM base WHERE subdivision_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
zipcode_agg AS (
  SELECT 'zipcode' AS scope_type, postal_code AS scope_key, scope_segment AS property_segment, month,
    {{ base_metrics }}
  FROM base WHERE postal_code IS NOT NULL GROUP BY 1, 2, 3, 4
)

{# Time-window framing — same pattern as fct_market_pulse: YoY + MoM lags. #}
,
unioned AS (
  SELECT * FROM metro_agg
  UNION ALL SELECT * FROM region_agg
  UNION ALL SELECT * FROM community_agg
  UNION ALL SELECT * FROM subdivision_agg
  UNION ALL SELECT * FROM zipcode_agg
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
    w AS (PARTITION BY scope_type, scope_key, property_segment ORDER BY month),
    w_t12 AS (PARTITION BY scope_type, scope_key, property_segment ORDER BY month
              ROWS BETWEEN 11 PRECEDING AND CURRENT ROW)
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'month']) }} AS negotiation_id,
  scope_type, scope_key, property_segment, month,
  closing_count, median_sale_to_list, pct_above_list, pct_below_list,
  median_close_to_original, pct_with_reduction,
  median_reduction_amount, median_net_change_pct,
  -- Time-window framing columns
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
-- Exclude the in-progress current calendar month — its closing pool is
-- partial mid-month, so any sale-to-list ratio / % above list / %
-- with reduction computed off it is skewed by a small cohort of
-- early-month closings. Same fix as fct_market_pulse — see that
-- model for the full rationale.
WHERE month < DATE_TRUNC('month', CURRENT_DATE)
ORDER BY scope_type, scope_key, property_segment, month
