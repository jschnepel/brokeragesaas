{{ config(materialized='test') }}

-- Custom singular test: community-scope marts must attribute closings to far
-- more than the ~50 communities that have hand-drawn boundary polygons.
-- Community attribution keys on community_unified_slug (polygon community_slug
-- with the subdivision_canonical_map name fallback, ~80% of closings). If
-- anyone reverts to community_slug (polygon point-in-polygon only, ~3%), the
-- distinct community count collapses to ~50 and whole communities disappear
-- from the dashboard — the exact undercount this guard exists to prevent.
--
-- Threshold of 300 is well above the polygon-only count (~50) and far below
-- the unified-key count (thousands), so it catches a regression without being
-- brittle to normal data drift.
--
-- A singular test passes when it returns ZERO rows.

SELECT COUNT(DISTINCT scope_key) AS community_count
FROM {{ ref('fct_market_pulse') }}
WHERE scope_type = 'community'
HAVING COUNT(DISTINCT scope_key) < 300
