-- real-estate-platform/analytics/tests/assert_pip_semantics.sql
-- Returns rows ONLY on failure (dbt singular test convention).
WITH polys AS (
  SELECT 'big'   AS slug, 10.0 AS area_sq_mi, ST_GeomFromText('POLYGON((0 0, 0 10, 10 10, 10 0, 0 0))') AS g
  UNION ALL
  SELECT 'small' AS slug,  1.0 AS area_sq_mi, ST_GeomFromText('POLYGON((4 4, 4 6, 6 6, 6 4, 4 4))') AS g
),
overlap_winner AS (
  -- Point (5,5) is inside both squares; smallest area must win.
  SELECT (
    SELECT slug FROM polys
    WHERE ST_Covers(g, ST_Point(5, 5))
    ORDER BY area_sq_mi ASC LIMIT 1
  ) AS slug
),
boundary_hit AS (
  -- Point (0,5) sits exactly on the big square's edge; ST_Covers must include it.
  SELECT COUNT(*) AS c FROM polys WHERE slug = 'big' AND ST_Covers(g, ST_Point(0, 5))
)
SELECT 'smallest_area_not_chosen' AS failure FROM overlap_winner WHERE slug IS DISTINCT FROM 'small'
UNION ALL
SELECT 'boundary_point_not_covered' AS failure FROM boundary_hit WHERE c < 1
