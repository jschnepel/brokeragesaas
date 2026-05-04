{{ config(materialized='table') }}

-- One row per community — current snapshot for the /phoenix/[region]/[community] page.
-- Rolling 12-month metrics; community must have ≥5 closings to qualify.

WITH base AS (
  SELECT * FROM {{ ref('fct_closings') }}
  WHERE community_slug IS NOT NULL
    AND property_segment = 'residential'
)

SELECT
  -- Surrogate key (per amendment 2026-04-28 §4.4)
  {{ dbt_utils.generate_surrogate_key([
    "'community'", 'community_slug', "'residential'"
  ]) }} AS scorecard_id,
  'community'    AS scope_type,
  community_slug AS scope_key,
  'residential'  AS property_segment,
  region_slug,
  region_name,
  community_slug,
  community_name,

  COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS closes_12mo,
  COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '730 days'
                     AND close_date <  CURRENT_DATE - INTERVAL '365 days') AS closes_prior_12mo,

  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price)
    FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS median_close_12mo,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price_per_sqft)
    FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS median_ppsf_12mo,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)
    FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS median_dom_12mo,

  -- Negotiation
  AVG(sale_to_list_ratio)
    FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS mean_sale_to_list_12mo,
  COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days' AND had_price_reduction)::DOUBLE
    / NULLIF(COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days'), 0) * 100
    AS pct_with_reduction_12mo,

  -- Property feel
  AVG(living_area)    FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS mean_living_area,
  AVG(year_built)     FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS mean_year_built,
  AVG(lot_size_acres) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS mean_lot_acres,

  -- Centroid for map zoom
  AVG(latitude)  AS centroid_lat,
  AVG(longitude) AS centroid_lng,

  -- Community amenity flags (majority vote across all closes)
  AVG(CASE WHEN is_gated THEN 1.0 ELSE 0.0 END)            > 0.5 AS is_gated,
  AVG(CASE WHEN is_golf_community THEN 1.0 ELSE 0.0 END)   > 0.5 AS is_golf_community,
  AVG(CASE WHEN is_age_restricted THEN 1.0 ELSE 0.0 END)   > 0.5 AS is_age_restricted,

  {{ confidence_band("COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days')") }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at

FROM base
GROUP BY region_slug, region_name, community_slug, community_name
HAVING COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') >= 5
