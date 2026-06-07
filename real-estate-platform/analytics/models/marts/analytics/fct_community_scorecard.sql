{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table')) }}

-- One row per (community × property_segment) — current snapshot for the
-- /phoenix/[region]/[community] page. Rolling 12-month metrics.
--
-- Per-segment cohort thresholds (research-driven — different real-estate
-- segments have different baseline volumes, so a one-size-fits-all >=5 wrongly
-- suppresses land + multi_family communities that have legitimate signal).
--   residential: >=5 closings (was the prior universal floor)
--   land:        >=3 closings (volumes are 10-20× lower)
--   commercial:  >=3
--   multi_family:>=3
--   rental + for_sale + all: report at residential threshold (>=5)
--
-- Community attribution keys on community_unified_slug (polygon community_slug
-- with the subdivision_canonical_map name fallback, ~80% of closings) rather
-- than community_slug (polygon point-in-polygon only, ~3%), which previously
-- dropped every non-polygon community. Output `community_slug` carries the
-- unified slug so the scope_key contract to fct_market_pulse is unchanged.

WITH segments AS ({{ property_segments() }}),

base AS (
  SELECT
    c.*,
    seg.property_segment AS scope_segment
  FROM {{ ref('fct_closings') }} c
  CROSS JOIN segments seg
  WHERE c.community_unified_slug IS NOT NULL
    AND {{ segment_includes('seg.property_segment', 'c.property_segment') }}
)

SELECT
  {{ dbt_utils.generate_surrogate_key([
    "'community'", 'community_unified_slug', 'scope_segment'
  ]) }} AS scorecard_id,
  'community'            AS scope_type,
  community_unified_slug AS scope_key,
  scope_segment         AS property_segment,
  MAX(region_slug)      AS region_slug,
  MAX(region_name)      AS region_name,
  community_unified_slug AS community_slug,
  -- Display name: polygon community_name when present, else title-cased slug.
  COALESCE(MAX(community_name), REPLACE(community_unified_slug, '-', ' ')) AS community_name,

  COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS closes_12mo,
  COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '730 days'
                     AND close_date <  CURRENT_DATE - INTERVAL '365 days') AS closes_prior_12mo,

  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price)
    FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS median_close_12mo,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price_per_sqft)
    FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days'
            AND {{ is_within_ppsf_trim('close_price_per_sqft') }}) AS median_ppsf_12mo,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)
    FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days'
            AND {{ is_valid_for_dom_typical('days_on_market') }}) AS median_dom_typical_12mo,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)
    FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days'
            AND {{ is_valid_for_dom_metric('days_on_market') }}) AS median_dom_12mo,

  -- Negotiation. Apply Redfin's outlier filter (sale/list 0.5..2.0) on the
  -- ratio metric so a single fire-sale or auction overpay doesn't tank a
  -- community's reported negotiation strength.
  AVG(sale_to_list_ratio)
    FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days'
            AND {{ is_valid_for_ratio_metric('close_price', 'list_price') }})
    AS mean_sale_to_list_12mo,
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

  {{ confidence_band_strict("COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days')") }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at

FROM base
GROUP BY scope_segment, community_unified_slug
HAVING COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') >= CASE
  WHEN scope_segment IN ('land', 'commercial', 'multi_family') THEN 3
  ELSE 5
END
