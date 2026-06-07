{# In prod, materialize as table (in-DB only, no S3 write) — the 5 derived
   `fct_market_pulse_<scope_type>` models split this on scope_type and write
   per-scope Parquet files. Splitting cuts the cold-fetch from 49s on the
   ~225MB combined file to <1s on metro/region/zipcode flavors. #}
{{ config(materialized='table') }}

-- Monthly time series: closings, medians, ppsf, DOM, volume.
-- Calendar-spined (zero-gap) × scope_type × property_segment.
-- scope_type ∈ ('metro', 'region', 'community', 'zipcode')
-- Aggregates from fct_closings (single source of truth for closed rows).

{# Loop generates one CTE per scope. Each CTE has the same metric set, only
   differing in (scope_type, scope_key) — keeping behaviour identical across
   levels so dbt-WASM/UI can switch scope without per-scope code paths. #}

{# Scope ladder — full 5 levels (metro → region → community → subdivision → zipcode).
   Runs on Fargate with 16GB+ memory; the subdivision-grain CROSS JOIN fits. #}
{%- set scopes = [{'name':'metro','group_col':"'phoenix_metro'",'scope_type_lit':"'metro'",'where':'TRUE'},{'name':'region','group_col':'c.region_slug','scope_type_lit':"'region'",'where':'c.region_slug IS NOT NULL'},{'name':'community','group_col':'c.community_unified_slug','scope_type_lit':"'community'",'where':'c.community_unified_slug IS NOT NULL'},{'name':'subdivision','group_col':'c.subdivision_slug','scope_type_lit':"'subdivision'",'where':'c.subdivision_slug IS NOT NULL'},{'name':'zipcode','group_col':'c.postal_code','scope_type_lit':"'zipcode'",'where':'c.postal_code IS NOT NULL'}] -%}

WITH segments AS (
  {{ property_segments() }}
),

cal AS (
  SELECT * FROM {{ ref('int_calendar') }}
),

{%- for s in scopes %}

{{ s.name }}_agg AS (
  SELECT
    {{ s.scope_type_lit }}                        AS scope_type,
    {{ s.group_col }}::VARCHAR                    AS scope_key,
    seg.property_segment,
    cal.month,
    -- Count of closings: one CLOSED listing = one sale (NAR / Realtor.com
    -- Existing-Home-Sales convention — each closed transaction counted once).
    -- listing_key is unique in fct_closings, so COUNT(*) = one row per close
    -- event. The prior COUNT(DISTINCT dedup_signature) keyed on
    -- parcel_number||close_year, which silently collapsed DISTINCT sales that
    -- share an APN (mobile-home/RV/golf resorts, manufactured parks, multi-unit)
    -- and dropped NULL-APN rows — undercounting whole communities (e.g.
    -- viewpoint-golf-resort 35 real closings → 7). Genuine re-listing inflation
    -- is a one-Closed-record-per-sale property and is not double-counted here.
    COUNT(*) FILTER (
      WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}
    ) AS closing_count,
    -- Median close price, with $/sqft trim applied to the per-sqft median
    -- (Bright MLS convention: drop top/bottom 1.5% bands via hard floor/ceiling).
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price)
      FILTER (WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}) AS median_close,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price_per_sqft)
      FILTER (WHERE {{ segment_includes('seg.property_segment', 'c.property_segment') }}
              AND {{ is_within_ppsf_trim('c.close_price_per_sqft') }}) AS median_ppsf,
    -- Dual-DOM exposure. `typical` excludes >180-day listings (industry-standard
    -- "current market tempo"); `all` matches Redfin (excludes only >365). Both
    -- exposed so consumers can see how much the long-tail moved the headline.
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
  LEFT JOIN {{ ref('fct_closings') }} c
    ON c.close_month = cal.month
   AND {{ s.where }}
  GROUP BY 1, 2, 3, 4
),
{%- endfor %}

unioned AS (
  {%- for s in scopes %}
  SELECT * FROM {{ s.name }}_agg
  {%- if not loop.last %} UNION ALL {%- endif %}
  {%- endfor %}
),

{# Time-window framing — adds prior_year, prior_month, T12 trailing
   averages, and pct-change columns industry-standard published market
   reports use. yong2 can render "vs last year" / "trend" badges off these
   columns without UI-side window math. #}
with_framing AS (
  SELECT
    *,
    -- Trailing-3mo smoothing of median price + trailing-12mo sample count
    AVG(median_close) OVER w_t3                    AS median_close_3mo,
    SUM(closing_count) OVER w_t12                  AS sample_12mo,
    -- Prior-year-same-month (YoY): NAR / Realtor.com standard comparison
    LAG(median_close, 12)   OVER w_ordered         AS median_close_prior_year,
    LAG(median_dom, 12)     OVER w_ordered         AS median_dom_prior_year,
    LAG(closing_count, 12)  OVER w_ordered         AS closing_count_prior_year,
    -- Prior-month: fast-trend signal (de-emphasized due to seasonality but
    -- valuable for current-month movement)
    LAG(median_close, 1)    OVER w_ordered         AS median_close_prior_month,
    LAG(closing_count, 1)   OVER w_ordered         AS closing_count_prior_month,
    -- Trailing-12mo average (smooths seasonality fully)
    AVG(median_close) OVER w_t12                   AS median_close_t12_avg,
    AVG(closing_count::DOUBLE) OVER w_t12          AS closing_count_t12_avg
  FROM unioned
  WINDOW
    w_ordered AS (PARTITION BY scope_type, scope_key, property_segment ORDER BY month),
    w_t3      AS (PARTITION BY scope_type, scope_key, property_segment ORDER BY month
                  ROWS BETWEEN 2 PRECEDING AND CURRENT ROW),
    w_t12     AS (PARTITION BY scope_type, scope_key, property_segment ORDER BY month
                  ROWS BETWEEN 11 PRECEDING AND CURRENT ROW)
),

with_changes AS (
  SELECT
    *,
    -- YoY percentage change in median price
    CASE
      WHEN median_close_prior_year IS NOT NULL AND median_close_prior_year > 0
      THEN ROUND(((median_close - median_close_prior_year) / median_close_prior_year * 100)::NUMERIC, 1)
    END AS pct_change_close_yoy,
    -- MoM percentage change
    CASE
      WHEN median_close_prior_month IS NOT NULL AND median_close_prior_month > 0
      THEN ROUND(((median_close - median_close_prior_month) / median_close_prior_month * 100)::NUMERIC, 1)
    END AS pct_change_close_mom,
    -- YoY change in closing count (volume trend)
    CASE
      WHEN closing_count_prior_year IS NOT NULL AND closing_count_prior_year > 0
      THEN ROUND(((closing_count - closing_count_prior_year)::DOUBLE / closing_count_prior_year * 100)::NUMERIC, 1)
    END AS pct_change_count_yoy
  FROM with_framing
)

SELECT
  -- Surrogate key (per amendment 2026-04-28 §4.4)
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'month']) }} AS market_pulse_id,
  *,
  {{ confidence_band('closing_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM with_changes
-- Exclude the current calendar month — it's still in progress when the mart
-- runs mid-month, so its closing_count is partial and any YoY overlay
-- against a complete prior-year month surfaces a fake 50%+ "drop" that
-- isn't a real signal (flagged on /phoenix/timing 2026-05-22 where May 2026
-- showed 4,613 closings vs a complete May 2025 of 9,553 — purely the result
-- of being viewed on the 22nd of an unfinished month). On the 1st of each
-- month the prior month becomes "complete" and re-enters the mart on the
-- next dbt build. Matches Redfin / Realtor.com / NAR convention of only
-- publishing closed-month aggregates.
WHERE month < DATE_TRUNC('month', CURRENT_DATE)
ORDER BY scope_type, scope_key, property_segment, month
