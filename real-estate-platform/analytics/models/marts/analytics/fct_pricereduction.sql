{# In prod, materialize as table — the 5 derived `fct_pricereduction_<scope>`
   models split this on scope_type for sub-100ms cold fetches. #}
{{ config(materialized='table') }}

-- Monthly price-reduction metrics × scope_type × property_segment × price_band.

WITH cal AS (
  SELECT * FROM {{ ref('int_calendar') }}
),

segments AS ({{ property_segments() }}),

base AS (
  SELECT
    cal.month,
    seg.property_segment AS scope_segment,
    c.region_slug,
    c.community_unified_slug,
    c.subdivision_slug,
    c.postal_code,
    c.price_band,
    c.had_price_reduction,
    c.total_reduction_amount,
    c.net_price_change_pct,
    c.reduction_count
  FROM cal
  CROSS JOIN segments seg
  LEFT JOIN {{ ref('fct_closings') }} c
    ON c.close_month = cal.month
   AND {{ segment_includes('seg.property_segment', 'c.property_segment') }}
),

{# Price-reduction metrics — switched from mean to median for currency/pct
   columns (right-skewed; one $500K cut on a luxury listing swings the mean).
   mean_reductions_per_listing kept (small integer range 0-10, mean is fine). #}
{% set metrics %}
  COUNT(*) FILTER (WHERE had_price_reduction IS NOT NULL) AS closing_count,
  COUNT(*) FILTER (WHERE had_price_reduction)             AS reduced_count,
  COUNT(*) FILTER (WHERE had_price_reduction)::DOUBLE
    / NULLIF(COUNT(*) FILTER (WHERE had_price_reduction IS NOT NULL), 0) * 100 AS pct_with_reduction,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_reduction_amount)
    FILTER (WHERE had_price_reduction) AS median_reduction_amount,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY net_price_change_pct)
    FILTER (WHERE had_price_reduction) AS median_net_change_pct,
  AVG(reduction_count::DOUBLE)
    FILTER (WHERE had_price_reduction) AS mean_reductions_per_listing
{% endset %}

metro_agg AS (
  SELECT 'metro' AS scope_type, 'phoenix_metro' AS scope_key, scope_segment AS property_segment,
    COALESCE(price_band, 'all_bands') AS price_band, month,
    {{ metrics }}
  FROM base GROUP BY 1, 2, 3, 4, 5
),
region_agg AS (
  SELECT 'region' AS scope_type, region_slug AS scope_key, scope_segment AS property_segment,
    COALESCE(price_band, 'all_bands') AS price_band, month,
    {{ metrics }}
  FROM base WHERE region_slug IS NOT NULL GROUP BY 1, 2, 3, 4, 5
),
community_agg AS (
  SELECT 'community' AS scope_type, community_unified_slug AS scope_key, scope_segment AS property_segment,
    COALESCE(price_band, 'all_bands') AS price_band, month,
    {{ metrics }}
  FROM base WHERE community_unified_slug IS NOT NULL GROUP BY 1, 2, 3, 4, 5
),
subdivision_agg AS (
  SELECT 'subdivision' AS scope_type, subdivision_slug AS scope_key, scope_segment AS property_segment,
    COALESCE(price_band, 'all_bands') AS price_band, month,
    {{ metrics }}
  FROM base WHERE subdivision_slug IS NOT NULL GROUP BY 1, 2, 3, 4, 5
),
zipcode_agg AS (
  SELECT 'zipcode' AS scope_type, postal_code AS scope_key, scope_segment AS property_segment,
    COALESCE(price_band, 'all_bands') AS price_band, month,
    {{ metrics }}
  FROM base WHERE postal_code IS NOT NULL GROUP BY 1, 2, 3, 4, 5
)

{# Time-window framing for pct_with_reduction — YoY + T12 only (no MoM since
   price-reduction prevalence has weekly noise). #}
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
    LAG(pct_with_reduction, 12) OVER w  AS pct_with_reduction_prior_year,
    AVG(pct_with_reduction) OVER w_t12  AS pct_with_reduction_t12_avg
  FROM unioned
  WINDOW
    w AS (PARTITION BY scope_type, scope_key, property_segment, price_band ORDER BY month),
    w_t12 AS (PARTITION BY scope_type, scope_key, property_segment, price_band ORDER BY month
              ROWS BETWEEN 11 PRECEDING AND CURRENT ROW)
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'month', 'price_band']) }} AS pricereduction_id,
  scope_type, scope_key, property_segment, price_band, month,
  closing_count, reduced_count, pct_with_reduction,
  median_reduction_amount, median_net_change_pct, mean_reductions_per_listing,
  pct_with_reduction_prior_year,
  pct_with_reduction_t12_avg,
  CASE
    WHEN pct_with_reduction_prior_year IS NOT NULL AND pct_with_reduction_prior_year > 0
    THEN ROUND((pct_with_reduction - pct_with_reduction_prior_year)::NUMERIC, 1)
  END AS pct_change_with_reduction_yoy,
  {{ confidence_band('closing_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM with_framing
-- Exclude the in-progress current calendar month — its closing pool is
-- partial mid-month, so the % with reduction / mean reduction amount
-- computed off it is skewed. Same fix as fct_market_pulse.
WHERE month < DATE_TRUNC('month', CURRENT_DATE)
ORDER BY scope_type, scope_key, property_segment, price_band, month
