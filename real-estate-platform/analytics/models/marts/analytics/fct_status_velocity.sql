{{ config(materialized=('external' if target.name == 'prod' else 'table'), enabled=(var('enable_active', false))) }}

-- Median days from Active → Pending → Closed across recent cohorts.
-- Last 24 months only — older trends in fct_market_pulse.

WITH segments AS (
  SELECT 'residential' AS property_segment UNION ALL
  SELECT 'land'        AS property_segment UNION ALL
  SELECT 'all'         AS property_segment
),

closed_cohort AS (
  SELECT
    c.listing_key,
    c.close_month,
    c.region_slug,
    c.community_unified_slug,
    c.subdivision_slug,
    c.postal_code,
    c.property_segment,
    sh.days_to_first_pending,
    sh.days_pending_to_closed,
    sh.days_active_to_closed,
    sh.went_back_on_market,
    sh.back_on_market_count
  FROM {{ ref('fct_closings') }} c
  JOIN {{ ref('int_listings_status_history') }} sh USING (listing_key)
  WHERE c.close_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '24 months'
),

base AS (
  SELECT cc.*, seg.property_segment AS scope_segment
  FROM closed_cohort cc
  CROSS JOIN segments seg
  WHERE (seg.property_segment = 'all' OR cc.property_segment = seg.property_segment)
),

{% set metrics %}
  COUNT(*) AS cohort_size,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_first_pending)        AS median_days_to_pending,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_pending_to_closed)       AS median_days_pending_to_closed,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_active_to_closed)        AS median_days_active_to_closed,
  AVG(days_to_first_pending)                                                AS mean_days_to_pending,
  AVG(days_pending_to_closed)                                               AS mean_days_pending_to_closed,
  AVG(days_active_to_closed)                                                AS mean_days_active_to_closed,
  COUNT(*) FILTER (WHERE went_back_on_market)::DOUBLE / NULLIF(COUNT(*), 0) * 100 AS pct_back_on_market,
  AVG(back_on_market_count) FILTER (WHERE went_back_on_market)              AS mean_back_on_market_count
{% endset %}

metro_agg AS (
  SELECT 'metro' AS scope_type, 'phoenix_metro' AS scope_key, scope_segment AS property_segment, close_month AS month,
    {{ metrics }}
  FROM base GROUP BY 1, 2, 3, 4
),
region_agg AS (
  SELECT 'region' AS scope_type, region_slug AS scope_key, scope_segment AS property_segment, close_month AS month,
    {{ metrics }}
  FROM base WHERE region_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
community_agg AS (
  SELECT 'community' AS scope_type, community_unified_slug AS scope_key, scope_segment AS property_segment, close_month AS month,
    {{ metrics }}
  FROM base WHERE community_unified_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
subdivision_agg AS (
  SELECT 'subdivision' AS scope_type, subdivision_slug AS scope_key, scope_segment AS property_segment, close_month AS month,
    {{ metrics }}
  FROM base WHERE subdivision_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
zipcode_agg AS (
  SELECT 'zipcode' AS scope_type, postal_code AS scope_key, scope_segment AS property_segment, close_month AS month,
    {{ metrics }}
  FROM base WHERE postal_code IS NOT NULL GROUP BY 1, 2, 3, 4
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'month']) }} AS status_velocity_id,
  scope_type, scope_key, property_segment, month,
  cohort_size, median_days_to_pending, median_days_pending_to_closed, median_days_active_to_closed,
  mean_days_to_pending, mean_days_pending_to_closed, mean_days_active_to_closed,
  pct_back_on_market, mean_back_on_market_count,
  {{ confidence_band('cohort_size') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM (
  SELECT * FROM metro_agg
  UNION ALL SELECT * FROM region_agg
  UNION ALL SELECT * FROM community_agg
  UNION ALL SELECT * FROM subdivision_agg
  UNION ALL SELECT * FROM zipcode_agg
) u
ORDER BY scope_type, scope_key, property_segment, month
