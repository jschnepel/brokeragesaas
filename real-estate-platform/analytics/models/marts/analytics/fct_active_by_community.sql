{{ config(materialized=('external' if target.name == 'prod' else 'table'), enabled=(var('enable_active', false))) }}

-- Per-community active counts + median list/DOM.
-- Grain: community × property_segment.
-- Powers /market community-level rankings ("which communities have the most
-- inventory right now") and the community detail page.

WITH segments AS ({{ property_segments() }}),

base AS (
  SELECT a.*, s.property_segment AS scope_segment
  FROM {{ ref('int_listings_active_cleaned') }} a
  CROSS JOIN segments s
  WHERE (s.property_segment = 'all' OR a.property_segment = s.property_segment)
    AND a.community_slug IS NOT NULL
)

SELECT
  {{ dbt_utils.generate_surrogate_key(["'community'", 'community_slug', 'scope_segment']) }} AS active_community_id,
  'community'    AS scope_type,
  community_slug AS scope_key,
  scope_segment  AS property_segment,
  region_slug,
  region_name,
  community_name,
  COUNT(*)                                        AS active_count,
  COUNT(*) FILTER (WHERE is_active)               AS strict_active_count,
  COUNT(*) FILTER (WHERE is_pending OR is_aux)    AS pending_count,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)         AS median_list_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price_per_sqft) AS median_ppsf,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)     AS median_dom,
  AVG(latitude)  AS centroid_lat,
  AVG(longitude) AS centroid_lng,
  {{ confidence_band('COUNT(*)') }} AS confidence,
  CURRENT_TIMESTAMP AS gold_built_at
FROM base
GROUP BY community_slug, scope_segment, region_slug, region_name, community_name
ORDER BY active_count DESC
