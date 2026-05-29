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
