{{ config(materialized=('external' if target.name == 'prod' else 'table')) }}

-- Monthly time series: closings, medians, ppsf, DOM, volume.
-- Calendar-spined (zero-gap) × scope_type × property_segment.
-- scope_type ∈ ('metro', 'region', 'community', 'zipcode')
-- Aggregates from fct_closings (single source of truth for closed rows).

{# Loop generates one CTE per scope. Each CTE has the same metric set, only
   differing in (scope_type, scope_key) — keeping behaviour identical across
   levels so dbt-WASM/UI can switch scope without per-scope code paths. #}

{#
  Scope ladder:
    metro       → phoenix_metro                                     (1 key)
    region      → c.region_slug — polygon point-in-polygon          (~13 keys, fully covered)
    community   → c.community_unified_slug — polygon-canonical
                  with subdivision_canonical_map fallback           (~95% coverage)
    subdivision → c.subdivision_slug — finest grain                 (every recognized subdivision)
    zipcode     → c.postal_code                                     (~426 keys)
#}
{%- set scopes = [
  {'name': 'metro',       'group_col': "'phoenix_metro'",          'scope_type_lit': "'metro'",       'where': "TRUE"},
  {'name': 'region',      'group_col': 'c.region_slug',            'scope_type_lit': "'region'",      'where': "c.region_slug IS NOT NULL"},
  {'name': 'community',   'group_col': 'c.community_unified_slug', 'scope_type_lit': "'community'",   'where': "c.community_unified_slug IS NOT NULL"},
  {'name': 'subdivision', 'group_col': 'c.subdivision_slug',       'scope_type_lit': "'subdivision'", 'where': "c.subdivision_slug IS NOT NULL"},
  {'name': 'zipcode',     'group_col': 'c.postal_code',            'scope_type_lit': "'zipcode'",     'where': "c.postal_code IS NOT NULL"},
] -%}

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
    COUNT(c.listing_key) FILTER (
      WHERE (seg.property_segment = 'all' OR c.property_segment = seg.property_segment)
    ) AS closing_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price)
      FILTER (WHERE (seg.property_segment = 'all' OR c.property_segment = seg.property_segment)) AS median_close,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.close_price_per_sqft)
      FILTER (WHERE (seg.property_segment = 'all' OR c.property_segment = seg.property_segment)) AS median_ppsf,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.days_on_market)
      FILTER (WHERE (seg.property_segment = 'all' OR c.property_segment = seg.property_segment)) AS median_dom,
    PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY c.close_price)
      FILTER (WHERE (seg.property_segment = 'all' OR c.property_segment = seg.property_segment)) AS p10_close,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY c.close_price)
      FILTER (WHERE (seg.property_segment = 'all' OR c.property_segment = seg.property_segment)) AS p90_close,
    SUM(c.close_price)
      FILTER (WHERE (seg.property_segment = 'all' OR c.property_segment = seg.property_segment)) AS total_volume
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

with_smoothing AS (
  SELECT
    *,
    AVG(median_close) OVER (
      PARTITION BY scope_type, scope_key, property_segment
      ORDER BY month
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS median_close_3mo,
    SUM(closing_count) OVER (
      PARTITION BY scope_type, scope_key, property_segment
      ORDER BY month
      ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
    ) AS sample_12mo
  FROM unioned
)

SELECT
  -- Surrogate key (per amendment 2026-04-28 §4.4)
  {{ dbt_utils.generate_surrogate_key(['scope_type', 'scope_key', 'property_segment', 'month']) }} AS market_pulse_id,
  *,
  {{ confidence_band('closing_count') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM with_smoothing
ORDER BY scope_type, scope_key, property_segment, month
