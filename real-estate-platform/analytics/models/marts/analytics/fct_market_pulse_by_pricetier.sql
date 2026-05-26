{# In prod, materialize as table — the per-scope `_metro`/`_region`/
   `_community` split files split this on scope_type and write
   separate parquets. Splitting is necessary at community grain: the
   unified mart hits ~5M rows (20K distinct communities × 8 bands ×
   180+ months) which is too heavy for yong2 to cold-fetch when the
   user has only selected metro / region scope. Metro + region splits
   are tiny (~10K + ~80K rows) and load instantly; community ships
   separately and is only fetched when a community filter is active. #}
{{ config(materialized='table') }}

-- Monthly market-pulse time series with `price_band` added to the grain.
-- Sibling of `fct_market_pulse` — same metrics, but one additional
-- dimension (price band) so /phoenix KPIs can filter to an arbitrary
-- band selection without per-request silver-layer re-aggregation. The
-- yong2 server action reads this mart and sums/weight-averages the
-- bands the user selected.
--
-- Grain: scope_type × scope_key × property_segment × price_band × month
-- Scope ladder: metro + region + community.
--   - Subdivision/zipcode excluded — adding price_band to those grains
--     would balloon row count past the dashboard-payload budget without
--     a clear product use case (no /phoenix subdivision drill-down today).
--   - Active inventory by band is already covered by fct_active_by_pricetier
--     at every scope grain — this mart covers closed-deal metrics
--     (closings, median close, ppsf, dom, volume) plus YoY/MoM framing.
--
-- Cardinality estimate (real numbers as of 2026-05):
--   metro:      1 × 8 bands × ~24 months  = ~192 rows
--   region:    13 × 8 bands × ~24 months  = ~2.5k rows
--   community:130 × 8 bands × ~24 months  = ~25k rows
--   ───────────────────────────────────────────────
--   total:                                ~28k rows × ~15 columns
--   parquet:                              ~2-5MB (sparse cube compresses well)
--
-- Time-window framing (YoY/MoM/T12) PARTITIONs by price_band as well,
-- so "Median Close YoY" inside the $800K-$2M band compares against the
-- same band a year ago — not against an all-band metro headline.

{# Scope ladder — metro + region + community. See header for the
   cardinality rationale on subdivision/zipcode exclusion. #}
{%- set scopes = [{'name':'metro','group_col':"'phoenix_metro'",'scope_type_lit':"'metro'",'where':'TRUE'},{'name':'region','group_col':'c.region_slug','scope_type_lit':"'region'",'where':'c.region_slug IS NOT NULL'},{'name':'community','group_col':'c.community_unified_slug','scope_type_lit':"'community'",'where':'c.community_unified_slug IN (SELECT community_unified_slug FROM active_communities)'}] -%}

WITH segments AS (
  {{ property_segments() }}
),

cal AS (
  SELECT * FROM {{ ref('int_calendar') }}
),

bands AS (
  -- Distinct price_band universe — sourced from fct_closings so the
  -- band list always matches the upstream macro that derives them.
  -- Listings with NULL price_band (no close_price or out-of-range) are
  -- excluded; they'd never match a user's filter selection anyway.
  SELECT DISTINCT price_band
  FROM {{ ref('fct_closings') }}
  WHERE price_band IS NOT NULL
),

active_communities AS (
  -- Restrict the community scope to communities with meaningful recent
  -- activity (>=6 closings in trailing 12 months). int_listings_closed_cleaned
  -- emits a `community_unified_slug` per listing, but ~22% of those slugs
  -- appear exactly once in 14 years — almost certainly noise (typos,
  -- one-off luxury-condo mislabels, mobile-home park entries). Without
  -- this filter the community grain hits 20,384 distinct slugs and the
  -- price-tier cross-join explodes to ~5M rows, most of which the user
  -- can't usefully filter against. The 6-closes/12mo threshold drops
  -- the dropdown to ~3,400 active communities (matches "meaningful
  -- market" filter convention used elsewhere in the analytics layer).
  --
  -- A proper source-level cleanup of community_unified_slug derivation
  -- lives outside this mart — file separately.
  SELECT community_unified_slug
  FROM {{ ref('fct_closings') }}
  WHERE community_unified_slug IS NOT NULL
    AND close_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
    AND close_date <  DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY 1
  HAVING COUNT(*) >= 6
),

{%- for s in scopes %}

{{ s.name }}_agg AS (
  SELECT
    {{ s.scope_type_lit }}                        AS scope_type,
    {{ s.group_col }}::VARCHAR                    AS scope_key,
    seg.property_segment,
    b.price_band,
    cal.month,
    COUNT(DISTINCT c.dedup_signature) FILTER (
      WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}
    ) AS closing_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price)
      FILTER (WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}) AS median_close,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price_per_sqft)
      FILTER (WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}
              AND {{ is_within_ppsf_trim('c.close_price_per_sqft') }}) AS median_ppsf,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.days_on_market)
      FILTER (WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}
              AND {{ is_valid_for_dom_typical('c.days_on_market') }}) AS median_dom_typical,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.days_on_market)
      FILTER (WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}
              AND {{ is_valid_for_dom_metric('c.days_on_market') }}) AS median_dom,
    PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY c.close_price)
      FILTER (WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}) AS p10_close,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY c.close_price)
      FILTER (WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}) AS p90_close,
    SUM(c.close_price)
      FILTER (WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}) AS total_volume
  FROM cal
  CROSS JOIN segments seg
  CROSS JOIN bands b
  LEFT JOIN {{ ref('fct_closings') }} c
    ON c.close_month = cal.month
   AND c.price_band  = b.price_band
   AND {{ s.where }}
  GROUP BY 1, 2, 3, 4, 5
),
{%- endfor %}

unioned AS (
  {%- for s in scopes %}
  SELECT * FROM {{ s.name }}_agg
  {%- if not loop.last %} UNION ALL {%- endif %}
  {%- endfor %}
),

-- Time-window framing — identical to fct_market_pulse but PARTITIONed
-- by price_band as well, so YoY/MoM lag compares a band against itself.
with_framing AS (
  SELECT
    *,
    AVG(median_close) OVER w_t3                    AS median_close_3mo,
    SUM(closing_count) OVER w_t12                  AS sample_12mo,
    LAG(median_close, 12)   OVER w_ordered         AS median_close_prior_year,
    LAG(median_dom, 12)     OVER w_ordered         AS median_dom_prior_year,
    LAG(closing_count, 12)  OVER w_ordered         AS closing_count_prior_year,
    LAG(median_close, 1)    OVER w_ordered         AS median_close_prior_month,
    LAG(closing_count, 1)   OVER w_ordered         AS closing_count_prior_month,
    AVG(median_close) OVER w_t12                   AS median_close_t12_avg,
    AVG(closing_count::DOUBLE) OVER w_t12          AS closing_count_t12_avg
  FROM unioned
  WINDOW
    w_ordered AS (PARTITION BY scope_type, scope_key, property_segment, price_band ORDER BY month),
    w_t3      AS (PARTITION BY scope_type, scope_key, property_segment, price_band ORDER BY month
                  ROWS BETWEEN 2 PRECEDING AND CURRENT ROW),
    w_t12     AS (PARTITION BY scope_type, scope_key, property_segment, price_band ORDER BY month
                  ROWS BETWEEN 11 PRECEDING AND CURRENT ROW)
),

with_changes AS (
  SELECT
    *,
    CASE
      WHEN median_close_prior_year IS NOT NULL AND median_close_prior_year > 0
      THEN ROUND(((median_close - median_close_prior_year) / median_close_prior_year * 100)::NUMERIC, 1)
    END AS pct_change_close_yoy,
    CASE
      WHEN median_close_prior_month IS NOT NULL AND median_close_prior_month > 0
      THEN ROUND(((median_close - median_close_prior_month) / median_close_prior_month * 100)::NUMERIC, 1)
    END AS pct_change_close_mom,
    CASE
      WHEN closing_count_prior_year IS NOT NULL AND closing_count_prior_year > 0
      THEN ROUND(((closing_count - closing_count_prior_year)::DOUBLE / closing_count_prior_year * 100)::NUMERIC, 1)
    END AS pct_change_count_yoy
  FROM with_framing
)

SELECT
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'price_band', 'month']) }} AS market_pulse_pricetier_id,
  *,
  {{ confidence_band('closing_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM with_changes
-- Exclude the still-in-progress current calendar month (same convention
-- as fct_market_pulse — see that model's footer for rationale).
WHERE month < DATE_TRUNC('month', CURRENT_DATE)
  -- Drop synthetic CROSS JOIN artifacts. When a (month, segment, band)
  -- cell has zero closings, the LEFT JOIN produces NULL for the scope
  -- columns at region/community grain — emit-it-as-NULL-row is wrong
  -- for the filter use case (these rows can't match a user's scope
  -- selection anyway). Metro grain uses a literal scope_key so never NULL.
  AND scope_key IS NOT NULL
  -- Drop sparse zero-closing rows at the community grain — keeps the
  -- per-scope community parquet from ballooning to 5M rows when most
  -- of those rows are empty (20K distinct communities × 8 bands × 180+
  -- months produces a Cartesian explosion that's 57% zeros). Metro and
  -- region keep their calendar spine intact (charts can rely on a
  -- continuous time axis); community is for filter-aggregation only,
  -- where missing-row and zero-row are semantically identical.
  AND NOT (scope_type = 'community' AND COALESCE(closing_count, 0) = 0)
ORDER BY scope_type, scope_key, property_segment, price_band, month
