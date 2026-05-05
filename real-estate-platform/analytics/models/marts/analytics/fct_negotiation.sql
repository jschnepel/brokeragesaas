{{ config(materialized=('external' if target.name == 'prod' else 'table')) }}

-- Monthly negotiation metrics × scope_type × property_segment.
-- close_to_list ratio (legacy) + close_to_original ratio (true negotiation strength).

WITH cal AS (
  SELECT * FROM {{ ref('int_calendar') }}
),

segments AS (
  SELECT 'residential' AS property_segment UNION ALL
  SELECT 'land'        AS property_segment UNION ALL
  SELECT 'all'         AS property_segment
),

{% set base_metrics %}
  COUNT(close_price) AS closing_count,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sale_to_list_ratio)  AS median_sale_to_list,
  AVG(sale_to_list_ratio)                                          AS mean_sale_to_list,
  COUNT(*) FILTER (WHERE close_price > list_price)::DOUBLE
    / NULLIF(COUNT(close_price), 0) * 100                          AS pct_above_list,
  COUNT(*) FILTER (WHERE close_price < list_price)::DOUBLE
    / NULLIF(COUNT(close_price), 0) * 100                          AS pct_below_list,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_to_original_ratio)
    FILTER (WHERE had_price_reduction)                             AS median_close_to_original,
  AVG(close_to_original_ratio)
    FILTER (WHERE had_price_reduction)                             AS mean_close_to_original,
  COUNT(*) FILTER (WHERE had_price_reduction)::DOUBLE
    / NULLIF(COUNT(close_price), 0) * 100                          AS pct_with_reduction,
  AVG(total_reduction_amount) FILTER (WHERE had_price_reduction)   AS mean_reduction_amount,
  AVG(net_price_change_pct)   FILTER (WHERE had_price_reduction)   AS mean_net_change_pct
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
   AND (seg.property_segment = 'all' OR c.property_segment = seg.property_segment)
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

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'month']) }} AS negotiation_id,
  scope_type, scope_key, property_segment, month,
  closing_count, median_sale_to_list, mean_sale_to_list, pct_above_list, pct_below_list,
  median_close_to_original, mean_close_to_original, pct_with_reduction,
  mean_reduction_amount, mean_net_change_pct,
  {{ confidence_band('closing_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM (
  SELECT * FROM metro_agg
  UNION ALL SELECT * FROM region_agg
  UNION ALL SELECT * FROM community_agg
  UNION ALL SELECT * FROM subdivision_agg
  UNION ALL SELECT * FROM zipcode_agg
) u
ORDER BY scope_type, scope_key, property_segment, month
