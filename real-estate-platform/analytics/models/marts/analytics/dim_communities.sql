{{ config(materialized=('external' if target.name == 'prod' or target.name == 'fargate-prod' else 'table')) }}

-- One row per (region, community) — for join + display in the dashboard.
-- Augmented with rolling 12-month closing volume so dim is self-describing
-- (community page hero stats can read this directly).

-- Keyed on community_unified_slug (polygon community_slug + the
-- subdivision_canonical_map name fallback) — ~80% of closings, vs ~3% from
-- polygon community_slug alone. Output column `community_slug` carries the
-- unified slug so downstream readers + scope_key joins to fct_market_pulse
-- line up. Display name falls back to the canonical subdivision name, then a
-- title-cased slug, when no polygon community_name exists.
WITH closes AS (
  SELECT
    MAX(region_slug)        AS region_slug,
    MAX(region_name)        AS region_name,
    community_unified_slug  AS community_slug,
    COALESCE(MAX(community_name), MAX(canonical_community), REPLACE(community_unified_slug, '-', ' ')) AS community_name,
    COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS closes_12mo,
    COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '730 days' AND close_date < CURRENT_DATE - INTERVAL '365 days') AS closes_prior_12mo,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price)
      FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS median_close_12mo,
    AVG(latitude)   AS centroid_lat,
    AVG(longitude)  AS centroid_lng
  FROM {{ ref('int_listings_geographic_enriched') }}
  WHERE community_unified_slug IS NOT NULL
  GROUP BY community_unified_slug
)

SELECT
  region_slug,
  region_name,
  community_slug,
  community_name,
  closes_12mo,
  closes_prior_12mo,
  median_close_12mo,
  centroid_lat,
  centroid_lng,
  CURRENT_TIMESTAMP AS gold_built_at
FROM closes
