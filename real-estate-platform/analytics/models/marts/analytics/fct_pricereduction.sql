{{ config(materialized=('external' if target.name == 'prod' else 'table')) }}

-- Monthly price-reduction metrics × scope_type × property_segment × price_band.

WITH cal AS (
  SELECT * FROM {{ ref('int_calendar') }}
),

segments AS (
  SELECT 'residential' AS property_segment UNION ALL
  SELECT 'land'        AS property_segment UNION ALL
  SELECT 'all'         AS property_segment
),

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
   AND (seg.property_segment = 'all' OR c.property_segment = seg.property_segment)
),

{% set metrics %}
  COUNT(*) FILTER (WHERE had_price_reduction IS NOT NULL) AS closing_count,
  COUNT(*) FILTER (WHERE had_price_reduction)             AS reduced_count,
  COUNT(*) FILTER (WHERE had_price_reduction)::DOUBLE
    / NULLIF(COUNT(*) FILTER (WHERE had_price_reduction IS NOT NULL), 0) * 100 AS pct_with_reduction,
  AVG(total_reduction_amount) FILTER (WHERE had_price_reduction) AS mean_reduction_amount,
  AVG(net_price_change_pct)   FILTER (WHERE had_price_reduction) AS mean_net_change_pct,
  AVG(reduction_count::DOUBLE) FILTER (WHERE had_price_reduction) AS mean_reductions_per_listing
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

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'month', 'price_band']) }} AS pricereduction_id,
  scope_type, scope_key, property_segment, price_band, month,
  closing_count, reduced_count, pct_with_reduction,
  mean_reduction_amount, mean_net_change_pct, mean_reductions_per_listing,
  {{ confidence_band('closing_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM (
  SELECT * FROM metro_agg
  UNION ALL SELECT * FROM region_agg
  UNION ALL SELECT * FROM community_agg
  UNION ALL SELECT * FROM subdivision_agg
  UNION ALL SELECT * FROM zipcode_agg
) u
ORDER BY scope_type, scope_key, property_segment, price_band, month
