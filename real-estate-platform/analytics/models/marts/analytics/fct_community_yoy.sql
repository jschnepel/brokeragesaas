{{ config(materialized=('external' if target.name == 'prod' else 'table')) }}

-- YoY % change in median ppsf per community.
-- "Hot" / "cold" leaderboards drop out of this with ORDER BY ppsf_pct_change DESC/ASC.

WITH base AS (
  SELECT *
  FROM {{ ref('fct_closings') }}
  WHERE community_slug IS NOT NULL AND property_segment = 'residential'
),

current_year AS (
  SELECT
    community_slug,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price_per_sqft) AS median_ppsf,
    COUNT(*) AS sales
  FROM base
  WHERE close_date >= CURRENT_DATE - INTERVAL '365 days'
  GROUP BY 1
  HAVING COUNT(*) >= 10
),

prior_year AS (
  SELECT
    community_slug,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price_per_sqft) AS median_ppsf,
    COUNT(*) AS sales
  FROM base
  WHERE close_date BETWEEN CURRENT_DATE - INTERVAL '730 days'
                       AND CURRENT_DATE - INTERVAL '365 days'
  GROUP BY 1
  HAVING COUNT(*) >= 10
),

dim AS (
  SELECT DISTINCT region_slug, region_name, community_slug, community_name
  FROM base
)

SELECT
  -- Surrogate key (per amendment 2026-04-28 §4.4)
  {{ dbt_utils.generate_surrogate_key([
    "'community'", 'd.community_slug', "'residential'", "EXTRACT(YEAR FROM CURRENT_DATE)::TEXT"
  ]) }} AS yoy_id,
  'community'      AS scope_type,
  d.community_slug AS scope_key,
  'residential'    AS property_segment,
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
JOIN prior_year   py ON py.community_slug = d.community_slug
WHERE cy.median_ppsf >= 50 AND py.median_ppsf >= 50  -- exclude manufactured/mobile homes
