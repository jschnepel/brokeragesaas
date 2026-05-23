{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table'), enabled=(var('enable_active', false))) }}

-- Median days from Active → Pending → Closed across recent cohorts.
--
-- DATA WINDOW: last 6 months only.
--
-- listing_change_log is populated by the sync Lambda observing field changes
-- during upserts. The Lambda started capturing changes on 2026-04-01, which
-- means listings that were ALREADY Closed before then never had their Pending
-- or Active transitions recorded. Coverage of with_status_history per close
-- month (verified 2026-05-09):
--   2026-05  99.3%   ← reliable
--   2026-04  88.1%   ← reliable
--   2026-03  66.1%   ← partial
--   2026-02   0.5%   ← unreliable (pre-capture)
--   2026-01   0.0%   ← no data
--
-- 24-month or longer windows would expose the false sparsity to consumers,
-- so the mart is capped at 6 months. The confidence band still flags any
-- low-cohort scopes (community/subdivision) within the window.
--
-- Older trends should come from fct_market_pulse (which uses close_date,
-- not status transitions, so it's complete back to 2011).

WITH segments AS ({{ property_segments() }}),

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
  -- Exclude the in-progress current calendar month — closings flowing
  -- in mid-month would bias the velocity medians toward whatever cohort
  -- closes earliest in the month (often cash deals or pre-arranged
  -- closings). Window stays at 6 complete months; the dbt build that
  -- runs on the 1st of each new month picks up the now-completed prior
  -- month automatically.
  WHERE c.close_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '6 months'
    AND c.close_date <  DATE_TRUNC('month', CURRENT_DATE)
),

base AS (
  SELECT cc.*, seg.property_segment AS scope_segment
  FROM closed_cohort cc
  CROSS JOIN segments seg
  WHERE {{ segment_includes('seg.property_segment', 'cc.property_segment') }}
),

{# Status velocity — Phase A cleanup: dropped mean_days_* columns (medians are
   the honest metric for right-skewed durations). mean_back_on_market_count
   kept (small integer range 0-5, mean is fine). DOM filters applied to keep
   "listed 3 years ago, never sold" stuck listings out of the median. #}
{% set metrics %}
  COUNT(*) AS cohort_size,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_first_pending)
    FILTER (WHERE {{ is_valid_for_dom_metric('days_to_first_pending') }}) AS median_days_to_pending,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_pending_to_closed)
    FILTER (WHERE {{ is_valid_for_dom_metric('days_pending_to_closed') }}) AS median_days_pending_to_closed,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_active_to_closed)
    FILTER (WHERE {{ is_valid_for_dom_metric('days_active_to_closed') }}) AS median_days_active_to_closed,
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
