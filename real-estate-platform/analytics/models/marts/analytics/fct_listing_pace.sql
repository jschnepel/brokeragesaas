{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table'), enabled=(var('enable_active', false))) }}

-- Weekly pace of new listings going Active × scope_type × property_segment × week.
--
-- Sourced from listing_records.on_market_date (with fallback chain to
-- listing_contract_date / original_entry_timestamp). Prior implementation
-- read from int_listings_status_history which only carries change_log events
-- captured by the sync Lambda since ~2026-04-01 — that left every week
-- before April 2026 at zero, and the rolling 52-wk average was filling
-- almost entirely with zero historical weeks, producing spurious "+184%
-- vs 52-wk" signals on the latest weeks (the metric was effectively
-- "this week vs the change-log start date" rather than "this week vs the
-- trailing year"). Union of closed + currently-active covers ~95% of all
-- listings ever; Cancelled/Withdrawn that never closed nor are currently
-- active are excluded (a known minor under-count, < 5%).

WITH segments AS ({{ property_segments() }}),

-- 3-year rolling window. Pace consumers only need the trailing 52-week
-- comparison; longer history bloats the mart from ~5MB to ~600MB (cross-
-- join of weeks × 7 segments × 5 scope grains × ~5,000 subdivisions),
-- which OOMs Next.js's hyparquet reader at request time. The first 52
-- weeks of the window are buffer so the trailing 52wk average is fully
-- populated for every emitted row.
weeks AS (
  SELECT DATE_TRUNC('week', d::DATE) AS week
  FROM range(
    DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '3 years',
    DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week',
    INTERVAL '7 days'
  ) t(d)
),

-- Union closed + active. Each listing_key appears at most once across both
-- (a listing is either still active OR has closed — not both). For each
-- row, derive the "first active" date via the canonical fallback chain:
-- on_market_date (preferred, but only 10-27% populated) →
-- listing_contract_date (100% populated since 2022) →
-- original_entry_timestamp (100% populated since 2011, ARMLS receipt time).
--
-- Closed side reads from int_listings_geographic_enriched (not the cleaned
-- model directly) because that's where region_slug / community_unified_slug
-- live for closed listings — the cleaned model only carries postal_code,
-- with the polygon/canonical-map join in the geographic_enriched layer.
-- Active side reads from int_listings_active_cleaned which already does
-- the geographic enrichment inline.
all_listings AS (
  SELECT
    listing_key,
    COALESCE(on_market_date, listing_contract_date, original_entry_timestamp::DATE) AS active_date,
    region_slug, community_unified_slug, subdivision_slug, postal_code, property_segment
  FROM {{ ref('int_listings_geographic_enriched') }}
  UNION ALL
  SELECT
    listing_key,
    COALESCE(on_market_date, listing_contract_date, original_entry_timestamp::DATE) AS active_date,
    region_slug, community_unified_slug, subdivision_slug, postal_code, property_segment
  FROM {{ ref('int_listings_active_cleaned') }}
),

new_listings AS (
  SELECT
    DATE_TRUNC('week', active_date) AS week,
    region_slug, community_unified_slug, subdivision_slug, postal_code, property_segment
  FROM all_listings
  WHERE active_date IS NOT NULL
    AND active_date >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '3 years'
    AND active_date <  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
),

base AS (
  SELECT
    w.week,
    seg.property_segment AS scope_segment,
    nl.region_slug,
    nl.community_unified_slug,
    nl.subdivision_slug,
    nl.postal_code,
    nl.property_segment AS row_segment
  FROM weeks w
  CROSS JOIN segments seg
  LEFT JOIN new_listings nl ON nl.week = w.week
),

metro_agg AS (
  SELECT 'metro' AS scope_type, 'phoenix_metro' AS scope_key, scope_segment AS property_segment, week,
    COUNT(*) FILTER (WHERE {{ segment_includes('scope_segment', 'row_segment') }} AND row_segment IS NOT NULL) AS new_listings_count
  FROM base GROUP BY 1, 2, 3, 4
),
region_agg AS (
  SELECT 'region' AS scope_type, region_slug AS scope_key, scope_segment AS property_segment, week,
    COUNT(*) FILTER (WHERE {{ segment_includes('scope_segment', 'row_segment') }} AND row_segment IS NOT NULL) AS new_listings_count
  FROM base WHERE region_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
community_agg AS (
  SELECT 'community' AS scope_type, community_unified_slug AS scope_key, scope_segment AS property_segment, week,
    COUNT(*) FILTER (WHERE {{ segment_includes('scope_segment', 'row_segment') }} AND row_segment IS NOT NULL) AS new_listings_count
  FROM base WHERE community_unified_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
-- subdivision grain intentionally dropped from pace mart — ~5,000 subdivision
-- slugs × 156 weeks × 7 segments was the dominant row-count contributor
-- (650K rows -> ~5M rows just for subdivision aggregates). No current
-- consumer uses subdivision-grain pace; can be added back as a separate
-- mart if needed without bloating the metro/region/community/zipcode rollup.
zipcode_agg AS (
  SELECT 'zipcode' AS scope_type, postal_code AS scope_key, scope_segment AS property_segment, week,
    COUNT(*) FILTER (WHERE {{ segment_includes('scope_segment', 'row_segment') }} AND row_segment IS NOT NULL) AS new_listings_count
  FROM base WHERE postal_code IS NOT NULL GROUP BY 1, 2, 3, 4
),

unioned AS (
  SELECT * FROM metro_agg
  UNION ALL SELECT * FROM region_agg
  UNION ALL SELECT * FROM community_agg
  UNION ALL SELECT * FROM zipcode_agg
),

with_smoothing AS (
  SELECT *,
    AVG(new_listings_count) OVER (
      PARTITION BY scope_type, scope_key, property_segment ORDER BY week
      ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
    ) AS new_listings_4wk_avg,
    AVG(new_listings_count) OVER (
      PARTITION BY scope_type, scope_key, property_segment ORDER BY week
      ROWS BETWEEN 51 PRECEDING AND CURRENT ROW
    ) AS new_listings_52wk_avg
  FROM unioned
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'week']) }} AS listing_pace_id,
  scope_type, scope_key, property_segment, week,
  new_listings_count, new_listings_4wk_avg, new_listings_52wk_avg,
  CASE WHEN new_listings_52wk_avg > 0 THEN (new_listings_4wk_avg - new_listings_52wk_avg) / new_listings_52wk_avg * 100 END AS pct_change_vs_52wk,
  {{ confidence_band('new_listings_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM with_smoothing
-- Exclude the in-progress current calendar week — the current week's
-- new-listing count is partial mid-week (e.g., today is Friday → only
-- 5/7 days of listings have come in), and including it makes the
-- latest weekly bar visually crash to ~half of the trailing weeks.
-- The next dbt build after week-end picks up the now-complete week.
-- Mirror of the monthly fix in fct_market_pulse — see that model for
-- the full rationale.
WHERE week < DATE_TRUNC('week', CURRENT_DATE)
ORDER BY scope_type, scope_key, property_segment, week
