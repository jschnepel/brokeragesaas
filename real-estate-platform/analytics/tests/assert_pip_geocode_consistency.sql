{{ config(materialized='test', severity='warn') }}

-- Phase-D gate (WARN): a PIP-assigned community should be geographically
-- consistent with the listing's own city — a cheap guard against a bad
-- geocode landing a point in the wrong polygon, OR a polygon over-covering
-- into a neighboring city (the Boulders→Sierra-Boulders over-cover class).
--
-- Heuristic: for each community, find its dominant city (mode of listing
-- cities inside it). Flag listings whose city != the community's dominant
-- city AND where that community is overwhelmingly (>=90%) one city — i.e.
-- a clear outlier crossing a city line. Severity=warn: real communities do
-- straddle city borders (Scottsdale/Carefree), so this surfaces candidates
-- for boundary review rather than hard-failing the build.
--
-- Returns one row per flagged (community, stray_city, n) — review in the
-- polygon editor (see scripts/geo/editor/QA-NOTES.md §1).

WITH attributed AS (
  SELECT community_pip_slug AS slug, UPPER(TRIM(city)) AS city
  FROM {{ ref('int_listings_geographic_enriched') }}
  WHERE community_pip_slug IS NOT NULL
    AND city IS NOT NULL AND TRIM(city) <> ''
    AND close_date >= CURRENT_DATE - INTERVAL '365 days'
),
per_city AS (
  SELECT slug, city, COUNT(*) AS n_city
  FROM attributed GROUP BY 1, 2
),
per_comm AS (
  SELECT slug, COUNT(*) AS n_total, COUNT(DISTINCT city) AS n_cities
  FROM attributed GROUP BY 1
),
dominant AS (
  SELECT slug, city AS dom_city, n_city,
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY n_city DESC) AS rk
  FROM per_city
)
SELECT
  pc.slug,
  d.dom_city,
  city.city       AS stray_city,
  city.n_city     AS stray_n,
  pc.n_total
FROM per_comm pc
JOIN dominant d   ON d.slug = pc.slug AND d.rk = 1
JOIN per_city city ON city.slug = pc.slug AND city.city <> d.dom_city
WHERE pc.n_total >= 10
  -- community is essentially single-city (dominant >=90%) yet has stray rows
  AND d.n_city::DOUBLE / pc.n_total >= 0.90
  AND city.n_city >= 1
