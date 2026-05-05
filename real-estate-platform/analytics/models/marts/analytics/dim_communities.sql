{{ config(materialized=('external' if target.name == 'prod' else 'table')) }}

-- One row per (region, community) — for join + display in the dashboard.
-- Augmented with rolling 12-month closing volume so dim is self-describing
-- (community page hero stats can read this directly).

WITH closes AS (
  SELECT
    region_slug,
    region_name,
    community_slug,
    community_name,
    COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS closes_12mo,
    COUNT(*) FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '730 days' AND close_date < CURRENT_DATE - INTERVAL '365 days') AS closes_prior_12mo,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price)
      FILTER (WHERE close_date >= CURRENT_DATE - INTERVAL '365 days') AS median_close_12mo,
    AVG(latitude)   AS centroid_lat,
    AVG(longitude)  AS centroid_lng
  FROM {{ ref('int_listings_geographic_enriched') }}
  WHERE community_slug IS NOT NULL
  GROUP BY 1, 2, 3, 4
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
