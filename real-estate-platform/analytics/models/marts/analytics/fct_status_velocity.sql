{{ config(materialized=('external' if target.name == 'prod' else 'table'), enabled=(var('enable_active', false))) }}

-- Median days from Active → Pending → Closed across recent cohorts.
-- Grain: scope_type × scope_key × property_segment × month (cohort: closed_month).
-- Combines status_history (transition timing) with closed cohort (when sold).
--
-- Powers the /phoenix Timing tab: "How fast are listings moving through the pipeline?"

WITH segments AS ({{ property_segments() }}),

closed_cohort AS (
  SELECT
    c.listing_key,
    c.close_month,
    c.close_year,
    c.region_slug,
    c.community_slug,
    c.property_segment,
    sh.days_to_first_pending,
    sh.days_pending_to_closed,
    sh.days_active_to_closed,
    sh.went_back_on_market,
    sh.back_on_market_count
  FROM {{ ref('fct_closings') }} c
  JOIN {{ ref('int_listings_status_history') }} sh USING (listing_key)
  -- Last 24 months only for monthly cohort marts
  WHERE c.close_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '24 months'
),

base AS (
  SELECT cc.*, s.property_segment AS scope_segment
  FROM closed_cohort cc
  CROSS JOIN segments s
  WHERE (s.property_segment = 'all' OR cc.property_segment = s.property_segment)
),

metro AS (
  SELECT
    'metro'         AS scope_type,
    'phoenix_metro' AS scope_key,
    scope_segment   AS property_segment,
    close_month     AS month,
    COUNT(*)                                                                 AS cohort_size,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_first_pending)        AS median_days_to_pending,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_pending_to_closed)       AS median_days_pending_to_closed,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_active_to_closed)        AS median_days_active_to_closed,
    AVG(days_to_first_pending)                                                AS mean_days_to_pending,
    AVG(days_pending_to_closed)                                               AS mean_days_pending_to_closed,
    AVG(days_active_to_closed)                                                AS mean_days_active_to_closed,
    COUNT(*) FILTER (WHERE went_back_on_market)::DOUBLE / NULLIF(COUNT(*), 0) * 100 AS pct_back_on_market,
    AVG(back_on_market_count) FILTER (WHERE went_back_on_market)              AS mean_back_on_market_count
  FROM base
  GROUP BY 1, 2, 3, 4
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'month']) }} AS status_velocity_id,
  scope_type, scope_key, property_segment, month,
  cohort_size,
  median_days_to_pending,
  median_days_pending_to_closed,
  median_days_active_to_closed,
  mean_days_to_pending,
  mean_days_pending_to_closed,
  mean_days_active_to_closed,
  pct_back_on_market,
  mean_back_on_market_count,
  {{ confidence_band('cohort_size') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM metro
ORDER BY scope_type, scope_key, property_segment, month
