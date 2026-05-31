{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table')) }}

-- YoY % change in median ppsf per community × property_segment.
-- "Hot" / "cold" leaderboards drop out of this with ORDER BY ppsf_pct_change DESC/ASC.
--
-- Per-segment cohort thresholds:
--   residential: >=10 sales each side
--   land:        >=5
--   commercial:  >=5
--   multi_family:>=5

WITH segments AS ({{ property_segments() }}),

base AS (
  SELECT c.*, seg.property_segment AS scope_segment
  FROM {{ ref('fct_closings') }} c
  CROSS JOIN segments seg
  -- community_unified_slug (polygon + canonical-map fallback, ~80%) instead of
  -- community_slug (polygon-only, ~3%). See fct_community_scorecard for detail.
  WHERE c.community_unified_slug IS NOT NULL
    AND {{ segment_includes('seg.property_segment', 'c.property_segment') }}
),

current_year AS (
  SELECT
    community_unified_slug AS community_slug,
    scope_segment,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price_per_sqft) AS median_ppsf,
    COUNT(*) AS sales
  FROM base
  WHERE close_date >= CURRENT_DATE - INTERVAL '365 days'
  GROUP BY 1, 2
  HAVING COUNT(*) >= CASE
    WHEN scope_segment IN ('land', 'commercial', 'multi_family') THEN 5
    ELSE 10
  END
),

prior_year AS (
  SELECT
    community_unified_slug AS community_slug,
    scope_segment,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price_per_sqft) AS median_ppsf,
    COUNT(*) AS sales
  FROM base
  WHERE close_date BETWEEN CURRENT_DATE - INTERVAL '730 days'
                       AND CURRENT_DATE - INTERVAL '365 days'
  GROUP BY 1, 2
  HAVING COUNT(*) >= CASE
    WHEN scope_segment IN ('land', 'commercial', 'multi_family') THEN 5
    ELSE 10
  END
),

dim AS (
  SELECT
    community_unified_slug AS community_slug,
    MAX(region_slug)  AS region_slug,
    MAX(region_name)  AS region_name,
    COALESCE(MAX(community_name), REPLACE(community_unified_slug, '-', ' ')) AS community_name
  FROM base
  GROUP BY community_unified_slug
)

SELECT
  {{ dbt_utils.generate_surrogate_key([
    "'community'", 'd.community_slug', 'cy.scope_segment', "EXTRACT(YEAR FROM CURRENT_DATE)::TEXT"
  ]) }} AS yoy_id,
  'community'      AS scope_type,
  d.community_slug AS scope_key,
  cy.scope_segment AS property_segment,
  EXTRACT(YEAR FROM CURRENT_DATE)::INT AS year,
  d.region_slug,
  d.region_name,
  d.community_slug,
  d.community_name,
  cy.median_ppsf      AS current_median_ppsf,
  py.median_ppsf      AS prior_median_ppsf,
  cy.sales            AS current_sales,
  py.sales            AS prior_sales,
  CASE
    WHEN py.median_ppsf > 0
    THEN (cy.median_ppsf - py.median_ppsf) / py.median_ppsf * 100
  END AS ppsf_pct_change,
  CURRENT_TIMESTAMP AS gold_built_at
FROM dim d
JOIN current_year cy ON cy.community_slug = d.community_slug
JOIN prior_year   py ON py.community_slug = d.community_slug AND py.scope_segment = cy.scope_segment
WHERE cy.median_ppsf >= 50 AND py.median_ppsf >= 50  -- exclude manufactured/mobile artifact
