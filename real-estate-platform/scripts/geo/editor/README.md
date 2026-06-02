# Community Boundary Editor

Local dev tool to draw/edit community boundary polygons in the `geo_boundaries` RDS table.
Listings render as dots; the panel shows a live count of listings inside the polygon you draw.
Saved shapes feed the dbt point-in-polygon community assignment.

## Run

```bash
# RDS_DATABASE_URL must be set (see repo .env.local)
pnpm geo:editor          # or: npx tsx scripts/geo/editor/server.ts
# open http://localhost:5300
```

Drawn polygons are EPSG:4326. Save upserts one community by slug; bbox/centroid/area/vertex
count are recomputed server-side from the geometry.

## Before you draw/edit — READ THE QA STANDARD

**[QA-NOTES.md](./QA-NOTES.md)** — the data-quality gates every polygon must pass
(boundary accuracy / over-cover trap, no duplicates, parent/child hierarchy,
required metadata, geometry validity, ST_Covers boundary behavior, and the
post-edit verification loop). A polygon that fails these silently over- or
under-counts a community's sales. Grounded in the geospatial best-practices
research and the Boulders test case that exposed each failure mode.
