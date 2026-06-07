{# In prod, materialize as table — per-scope splits write to S3. See
   fct_market_pulse_by_pricetier header for the cardinality rationale. #}
{{ config(materialized='table', enabled=(var('enable_active', false))) }}

-- Median days from Active → Pending → Closed across recent cohorts,
-- broken out by `price_band`. Sibling of `fct_status_velocity` —
-- same metrics, same 6-month data window (capped by listing_change_log
-- capture start of 2026-04-01), but with price band added to the
-- grain so /phoenix activity velocity KPIs can filter to a band.
--
-- Grain: scope_type × scope_key × property_segment × price_band × month
-- Scope ladder: metro + region + community.
-- Cardinality at 6-month window: ~6k rows total — trivial payload.

WITH segments AS ({{ property_segments() }}),

active_communities AS (
  -- Source from fct_community_scorecard — see fct_market_pulse_by_pricetier
  -- for the full rationale.
  SELECT scope_key AS community_unified_slug
  FROM {{ ref('fct_community_scorecard') }}
  WHERE scope_type = 'community'
    AND property_segment = 'all'
    AND closes_12mo >= 6
),

closed_cohort AS (
  SELECT
    c.listing_key,
    c.close_month,
    c.region_slug,
    c.community_unified_slug,
    c.price_band,
    c.property_segment,
    sh.days_to_first_pending,
    sh.days_pending_to_closed,
    sh.days_active_to_closed,
    sh.went_back_on_market,
    sh.back_on_market_count
  FROM {{ ref('fct_closings') }} c
  JOIN {{ ref('int_listings_status_history') }} sh USING (listing_key)
  WHERE c.close_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '6 months'
    AND c.close_date <  DATE_TRUNC('month', CURRENT_DATE)
    AND c.price_band IS NOT NULL
),

base AS (
  SELECT cc.*, seg.property_segment AS scope_segment
  FROM closed_cohort cc
  CROSS JOIN segments seg
  WHERE {{ segment_includes('seg.property_segment', 'cc.property_segment') }}
),

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
  SELECT 'metro' AS scope_type, 'phoenix_metro' AS scope_key, scope_segment AS property_segment,
    price_band, close_month AS month,
    {{ metrics }}
  FROM base GROUP BY 1, 2, 3, 4, 5
),
region_agg AS (
  SELECT 'region' AS scope_type, region_slug AS scope_key, scope_segment AS property_segment,
    price_band, close_month AS month,
    {{ metrics }}
  FROM base WHERE region_slug IS NOT NULL GROUP BY 1, 2, 3, 4, 5
),
community_agg AS (
  SELECT 'community' AS scope_type, community_unified_slug AS scope_key, scope_segment AS property_segment,
    price_band, close_month AS month,
    {{ metrics }}
  FROM base
  WHERE community_unified_slug IS NOT NULL
    AND community_unified_slug IN (SELECT community_unified_slug FROM active_communities)
  GROUP BY 1, 2, 3, 4, 5
)

-- Same coverage_pct join-back as fct_status_velocity — but against the
-- price-banded pulse so coverage compares like-for-like cohorts.
,
with_coverage AS (
  SELECT
    u.scope_type, u.scope_key, u.property_segment, u.price_band, u.month,
    u.cohort_size, u.median_days_to_pending, u.median_days_pending_to_closed,
    u.median_days_active_to_closed, u.pct_back_on_market, u.mean_back_on_market_count,
    mp.closing_count AS closings_total,
    CASE WHEN mp.closing_count > 0
      THEN ROUND((u.cohort_size::DOUBLE / mp.closing_count * 100)::NUMERIC, 1)
    END AS coverage_pct
  FROM (
    SELECT * FROM metro_agg
    UNION ALL SELECT * FROM region_agg
    UNION ALL SELECT * FROM community_agg
  ) u
  LEFT JOIN {{ ref('fct_market_pulse_by_pricetier') }} mp
    ON mp.scope_type = u.scope_type
   AND mp.scope_key  = u.scope_key
   AND mp.property_segment = u.property_segment
   AND mp.price_band = u.price_band
   AND mp.month      = u.month
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'price_band', 'month']) }} AS status_velocity_pricetier_id,
  scope_type, scope_key, property_segment, price_band, month,
  cohort_size, closings_total, coverage_pct,
  median_days_to_pending, median_days_pending_to_closed, median_days_active_to_closed,
  pct_back_on_market, mean_back_on_market_count,
  {{ confidence_band('cohort_size') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM with_coverage
ORDER BY scope_type, scope_key, property_segment, price_band, month
