{{ config(materialized=('external' if target.name == 'prod' else 'table'), enabled=(var('enable_active', false))) }}

-- Weekly pace of new listings going Active × scope_type × property_segment × week.

WITH segments AS (
  SELECT 'residential' AS property_segment UNION ALL
  SELECT 'land'        AS property_segment UNION ALL
  SELECT 'all'         AS property_segment
),

weeks AS (
  SELECT DATE_TRUNC('week', d::DATE) AS week
  FROM range(
    DATE '2011-01-03',
    DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week',
    INTERVAL '7 days'
  ) t(d)
),

new_listings AS (
  SELECT
    DATE_TRUNC('week', sh.first_active_at::DATE) AS week,
    a.region_slug,
    a.community_unified_slug,
    a.subdivision_slug,
    a.postal_code,
    a.property_segment
  FROM {{ ref('int_listings_status_history') }} sh
  JOIN {{ ref('int_listings_active_cleaned') }} a USING (listing_key)
  WHERE sh.first_active_at >= DATE '2011-01-01'
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
    COUNT(*) FILTER (WHERE scope_segment = 'all' OR row_segment = scope_segment) AS new_listings_count
  FROM base GROUP BY 1, 2, 3, 4
),
region_agg AS (
  SELECT 'region' AS scope_type, region_slug AS scope_key, scope_segment AS property_segment, week,
    COUNT(*) FILTER (WHERE scope_segment = 'all' OR row_segment = scope_segment) AS new_listings_count
  FROM base WHERE region_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
community_agg AS (
  SELECT 'community' AS scope_type, community_unified_slug AS scope_key, scope_segment AS property_segment, week,
    COUNT(*) FILTER (WHERE scope_segment = 'all' OR row_segment = scope_segment) AS new_listings_count
  FROM base WHERE community_unified_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
subdivision_agg AS (
  SELECT 'subdivision' AS scope_type, subdivision_slug AS scope_key, scope_segment AS property_segment, week,
    COUNT(*) FILTER (WHERE scope_segment = 'all' OR row_segment = scope_segment) AS new_listings_count
  FROM base WHERE subdivision_slug IS NOT NULL GROUP BY 1, 2, 3, 4
),
zipcode_agg AS (
  SELECT 'zipcode' AS scope_type, postal_code AS scope_key, scope_segment AS property_segment, week,
    COUNT(*) FILTER (WHERE scope_segment = 'all' OR row_segment = scope_segment) AS new_listings_count
  FROM base WHERE postal_code IS NOT NULL GROUP BY 1, 2, 3, 4
),

unioned AS (
  SELECT * FROM metro_agg
  UNION ALL SELECT * FROM region_agg
  UNION ALL SELECT * FROM community_agg
  UNION ALL SELECT * FROM subdivision_agg
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
ORDER BY scope_type, scope_key, property_segment, week
