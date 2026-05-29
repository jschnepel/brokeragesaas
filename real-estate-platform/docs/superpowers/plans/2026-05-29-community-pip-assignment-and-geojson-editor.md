# Community PIP Assignment + GeoJSON Boundary Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make point-in-polygon the authoritative way listings are assigned to communities, and give the operator a local tool to draw/edit the community boundary shapes that drive it.

**Architecture:** A standalone local dev tool (Node http server + MapLibre/Terra Draw page) edits the GeoJSON shapes in the RDS `geo_boundaries` table. The dbt analytics pipeline reads those shapes through DuckDB's `spatial` extension and assigns each listing's community via `ST_Covers(boundary, ST_Point(lng, lat))`, smallest-area polygon winning, with subdivision-name matching kept only as a gap-filler.

**Tech Stack:** TypeScript + Node `http` + `pg` (editor server); MapLibre GL JS + `@watergis/maplibre-gl-terradraw` + Turf.js (editor client); dbt + dbt-duckdb `spatial` extension (pipeline); Vitest (unit tests); dbt singular tests.

**Spec:** `docs/superpowers/specs/2026-05-29-community-pip-assignment-and-geojson-editor-design.md`

**Accuracy rules (non-negotiable, from spec):**

1. Predicate is `ST_Covers` (boundary-inclusive), never `ST_Contains`.
2. EPSG:4326 (lng/lat degrees) on both polygons and points. `ST_Point(longitude, latitude)` — X=lng first.
3. Overlap → smallest `area_sq_mi` wins.
4. bbox prefilter before `ST_Covers`.
5. Listings without valid lat/long are excluded from PIP and fall through to the subdivision/region path.

---

## File Structure

**Phase A — editor (new dir `real-estate-platform/scripts/geo/editor/`):**

- `geo-compute.ts` — pure functions: derive `{geometry, bbox, centroid, area_sq_mi, vertex_count}` from a GeoJSON geometry; count listing points inside a polygon. Unit-tested.
- `__tests__/geo-compute.test.ts` — Vitest unit tests.
- `server.ts` — Node http server: serves the page + JSON endpoints (`GET /api/boundaries`, `GET /api/listings`, `POST /api/community`). Uses a `pg.Pool` on `RDS_DATABASE_URL` (same pattern as the sibling geo scripts).
- `index.html` — loads MapLibre GL + `@watergis/maplibre-gl-terradraw` + Turf via ESM CDN; thin client module that draws shapes, overlays listings, shows a live inside-count, and POSTs saves.
- `README.md` — how to run.

**Phase B — pipeline (dbt project `real-estate-platform/analytics/`):**

- `profiles.yml` + `profiles.yml.example` — add `spatial` to every target's `extensions`.
- `models/staging/geo/stg_geo__community_boundaries.sql` — reads `rlsir_platform.public.geo_boundaries`, parses GeoJSON to geometry, exposes bbox extents + `area_sq_mi`.
- `models/staging/geo/_geo__models.yml` — model docs + tests.
- `macros/pip_community.sql` — `pip_community_slug()`, `pip_region_slug()`, `community_unified_slug()` macros (single source of truth, shared by active + closed).
- `tests/assert_pip_semantics.sql` — deterministic singular test of `ST_Covers` + smallest-area tiebreaker.
- `models/intermediate/listings/int_listings_active_cleaned.sql` — modified: add PIP columns, rewire `community_unified_slug`.
- `models/intermediate/listings/int_listings_geographic_enriched.sql` — modified: same.
- `scripts/geo/pip-coverage.mjs` — before/after coverage report (% of listings PIP-assigned, per community).

---

## Phase A — GeoJSON Boundary Editor

### Task A1: Pure geometry-compute module (TDD)

**Files:**

- Create: `real-estate-platform/scripts/geo/editor/geo-compute.ts`
- Test: `real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts
import { describe, it, expect } from "vitest";
import type { Polygon } from "geojson";
import { computeBoundaryRow, countPointsInside } from "../geo-compute";

// A 0.1° x 0.1° square near Scottsdale, ~ -111.9 lng / 33.6 lat.
const square: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [-111.95, 33.6],
      [-111.95, 33.7],
      [-111.85, 33.7],
      [-111.85, 33.6],
      [-111.95, 33.6],
    ],
  ],
};

describe("computeBoundaryRow", () => {
  it("derives bbox, centroid, vertex count, positive area, and stringified geometry", () => {
    const row = computeBoundaryRow(square);
    expect(row.bbox).toEqual([-111.95, 33.6, -111.85, 33.7]);
    expect(row.centroid[0]).toBeCloseTo(-111.9, 2);
    expect(row.centroid[1]).toBeCloseTo(33.65, 2);
    expect(row.vertex_count).toBe(5);
    expect(row.area_sq_mi).toBeGreaterThan(0);
    expect(JSON.parse(row.geometry).type).toBe("Polygon");
  });
});

describe("countPointsInside", () => {
  it("counts only points within the polygon (boundary-inclusive)", () => {
    const inside = { lng: -111.9, lat: 33.65 };
    const outside = { lng: -110.0, lat: 33.65 };
    const onEdge = { lng: -111.95, lat: 33.65 };
    expect(countPointsInside([inside, outside, onEdge], square)).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts`
Expected: FAIL — `Cannot find module '../geo-compute'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// real-estate-platform/scripts/geo/editor/geo-compute.ts
import area from "@turf/area";
import centroid from "@turf/centroid";
import bbox from "@turf/bbox";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint } from "@turf/helpers";
import type { Polygon, MultiPolygon, Feature } from "geojson";

const SQ_METERS_PER_SQ_MILE = 2_589_988.110336;

export interface BoundaryRow {
  geometry: string; // GeoJSON text, EPSG:4326
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  centroid: [number, number]; // [lng, lat]
  area_sq_mi: number;
  vertex_count: number;
}

export interface LngLat {
  lng: number;
  lat: number;
}

function countVertices(geom: Polygon | MultiPolygon): number {
  if (geom.type === "Polygon") {
    return geom.coordinates.reduce((sum, ring) => sum + ring.length, 0);
  }
  return geom.coordinates.reduce(
    (sum, poly) => sum + poly.reduce((s, ring) => s + ring.length, 0),
    0,
  );
}

export function computeBoundaryRow(geom: Polygon | MultiPolygon): BoundaryRow {
  const feature: Feature<Polygon | MultiPolygon> = {
    type: "Feature",
    properties: {},
    geometry: geom,
  };
  const [minLng, minLat, maxLng, maxLat] = bbox(feature);
  const c = centroid(feature).geometry.coordinates;
  return {
    geometry: JSON.stringify(geom),
    bbox: [minLng, minLat, maxLng, maxLat],
    centroid: [c[0], c[1]],
    area_sq_mi: area(feature) / SQ_METERS_PER_SQ_MILE,
    vertex_count: countVertices(geom),
  };
}

export function countPointsInside(
  points: LngLat[],
  geom: Polygon | MultiPolygon,
): number {
  let n = 0;
  for (const p of points) {
    if (booleanPointInPolygon(turfPoint([p.lng, p.lat]), geom)) n += 1;
  }
  return n;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts`
Expected: PASS (both tests). If `@turf/*` submodules are not installed, run `pnpm add -D @turf/area @turf/centroid @turf/bbox @turf/boolean-point-in-polygon @turf/helpers` at the repo root first, then re-run.

- [ ] **Step 5: Commit**

```bash
git add real-estate-platform/scripts/geo/editor/geo-compute.ts real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts
git commit -m "feat(geo): pure geometry-compute helpers for boundary editor"
```

---

### Task A2: Editor server (boundaries + listings + save endpoints)

**Files:**

- Create: `real-estate-platform/scripts/geo/editor/server.ts`

Reuses the `pg.Pool` pattern from `scripts/geo/verify-db.ts` and `computeBoundaryRow` from Task A1.

- [ ] **Step 1: Write the server**

```typescript
// real-estate-platform/scripts/geo/editor/server.ts
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import type { Polygon, MultiPolygon } from "geojson";
import { computeBoundaryRow } from "./geo-compute";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.GEO_EDITOR_PORT ?? 5300);

const pool = new pg.Pool({
  connectionString: process.env.RDS_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 4,
});

const ACTIVE_STATUSES = [
  "Active",
  "Active Under Contract",
  "Pending",
  "Coming Soon",
];

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function getBoundaries(): Promise<unknown> {
  const { rows } = await pool.query(
    `SELECT slug, name, type, geometry, area_sq_mi, properties->>'regionSlug' AS region_slug
       FROM geo_boundaries`,
  );
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    type: r.type,
    regionSlug: r.region_slug,
    areaSqMi: r.area_sq_mi,
    geometry:
      typeof r.geometry === "string" ? JSON.parse(r.geometry) : r.geometry,
  }));
}

async function getListings(bbox: number[]): Promise<unknown> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const { rows } = await pool.query(
    `SELECT listing_key,
            longitude::float8 AS lng,
            latitude::float8  AS lat,
            list_price,
            standard_status,
            subdivision_name
       FROM listing_records
      WHERE standard_status = ANY($1)
        AND latitude  BETWEEN $2 AND $3
        AND longitude BETWEEN $4 AND $5
        AND latitude IS NOT NULL AND longitude IS NOT NULL
      LIMIT 60000`,
    [ACTIVE_STATUSES, minLat, maxLat, minLng, maxLng],
  );
  return rows;
}

async function saveCommunity(payload: {
  slug: string;
  name: string;
  regionSlug: string;
  geometry: Polygon | MultiPolygon;
}): Promise<unknown> {
  const row = computeBoundaryRow(payload.geometry);
  const properties = JSON.stringify({ regionSlug: payload.regionSlug });
  await pool.query(
    `INSERT INTO geo_boundaries
       (name, slug, type, geometry, geometry_simple, bbox, centroid, properties, source, vertex_count, area_sq_mi)
     VALUES ($1, $2, 'community', $3, $3, $4, $5, $6::jsonb, 'editor', $7, $8)
     ON CONFLICT (slug, type) DO UPDATE SET
       name = EXCLUDED.name,
       geometry = EXCLUDED.geometry,
       geometry_simple = EXCLUDED.geometry_simple,
       bbox = EXCLUDED.bbox,
       centroid = EXCLUDED.centroid,
       properties = geo_boundaries.properties || EXCLUDED.properties,
       source = 'editor',
       vertex_count = EXCLUDED.vertex_count,
       area_sq_mi = EXCLUDED.area_sq_mi`,
    [
      payload.name,
      payload.slug,
      row.geometry,
      JSON.stringify(row.bbox),
      JSON.stringify({ type: "Point", coordinates: row.centroid }),
      properties,
      row.vertex_count,
      row.area_sq_mi,
    ],
  );
  return { ok: true, areaSqMi: row.area_sq_mi, vertexCount: row.vertex_count };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    if (req.method === "GET" && url.pathname === "/") {
      const html = await readFile(path.join(__dirname, "index.html"), "utf8");
      res.writeHead(200, { "content-type": "text/html" });
      res.end(html);
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/boundaries") {
      return json(res, 200, await getBoundaries());
    }
    if (req.method === "GET" && url.pathname === "/api/listings") {
      const b = (url.searchParams.get("bbox") ?? "").split(",").map(Number);
      if (b.length !== 4 || b.some(Number.isNaN))
        return json(res, 400, { error: "bad bbox" });
      return json(res, 200, await getListings(b));
    }
    if (req.method === "POST" && url.pathname === "/api/community") {
      const body = (await readBody(req)) as Parameters<typeof saveCommunity>[0];
      if (!body.slug || !body.geometry)
        return json(res, 400, { error: "slug and geometry required" });
      return json(res, 200, await saveCommunity(body));
    }
    json(res, 404, { error: "not found" });
  } catch (err) {
    json(res, 500, {
      error: err instanceof Error ? err.message : "server error",
    });
  }
});

server.listen(PORT, () => {
  process.stdout.write(`geo editor running at http://localhost:${PORT}\n`);
});
```

- [ ] **Step 2: Verify the unique constraint exists**

The upsert uses `ON CONFLICT (slug, type)`. Confirm a matching unique constraint/index on `geo_boundaries`:

Run: `node -e "const pg=require('pg');const p=new pg.Pool({connectionString:process.env.RDS_DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query(\"SELECT indexdef FROM pg_indexes WHERE tablename='geo_boundaries'\").then(r=>{console.log(r.rows.map(x=>x.indexdef).join('\n'));return p.end()})"`
Expected: a UNIQUE index covering `(slug, type)`. If only `(slug)` is unique, change the `ON CONFLICT` target to `(slug)`. If neither exists, STOP and add a migration `packages/database/src/migrations/0NN_geo_boundaries_unique_slug_type.sql` with `CREATE UNIQUE INDEX ... ON geo_boundaries (slug, type);` before continuing.

- [ ] **Step 3: Smoke-test the read endpoints**

Run: `npx tsx real-estate-platform/scripts/geo/editor/server.ts` (in one terminal), then in another:
`curl "http://localhost:5300/api/boundaries" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log('boundaries:',JSON.parse(d).length))"`
`curl "http://localhost:5300/api/listings?bbox=-112.0,33.6,-111.8,33.8" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log('listings:',JSON.parse(d).length))"`
Expected: `boundaries: 61` (48 communities + 13 regions, approx) and a non-zero listings count. Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add real-estate-platform/scripts/geo/editor/server.ts
git commit -m "feat(geo): editor server with boundaries, listings, and save endpoints"
```

---

### Task A3: Editor page (map + draw + listing overlay + live count + save)

**Files:**

- Create: `real-estate-platform/scripts/geo/editor/index.html`

- [ ] **Step 1: Write the page**

```html
<!-- real-estate-platform/scripts/geo/editor/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>RLSIR Community Boundary Editor</title>
    <link
      href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"
      rel="stylesheet"
    />
    <link
      href="https://unpkg.com/@watergis/maplibre-gl-terradraw@1.0.2/dist/maplibre-gl-terradraw.css"
      rel="stylesheet"
    />
    <style>
      html,
      body {
        margin: 0;
        height: 100%;
        font-family: system-ui, sans-serif;
      }
      #map {
        position: absolute;
        inset: 0 320px 0 0;
      }
      #panel {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 320px;
        padding: 16px;
        box-sizing: border-box;
        background: #0c1c2e;
        color: #f9f8f6;
        overflow: auto;
      }
      label {
        display: block;
        margin: 8px 0 2px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #bfa67a;
      }
      input,
      button {
        width: 100%;
        padding: 8px;
        box-sizing: border-box;
        margin-bottom: 8px;
      }
      button {
        background: #bfa67a;
        border: 0;
        color: #0c1c2e;
        font-weight: 700;
        cursor: pointer;
      }
      .count {
        font-size: 28px;
        font-weight: 700;
      }
      .muted {
        color: #9fb0c0;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div id="panel">
      <label>Community slug</label>
      <input id="slug" placeholder="troon-north" />
      <label>Display name</label>
      <input id="name" placeholder="Troon North" />
      <label>Region slug</label>
      <input id="region" placeholder="north-scottsdale" />
      <label>Listings inside polygon</label>
      <div class="count" id="count">—</div>
      <div class="muted" id="meta"></div>
      <button id="save">Save community</button>
      <div class="muted" id="status"></div>
    </div>

    <script type="module">
      import maplibregl from "https://esm.sh/maplibre-gl@4.7.1";
      import { MaplibreTerradrawControl } from "https://esm.sh/@watergis/maplibre-gl-terradraw@1.0.2";
      import booleanPointInPolygon from "https://esm.sh/@turf/boolean-point-in-polygon@7";
      import { point } from "https://esm.sh/@turf/helpers@7";

      const map = new maplibregl.Map({
        container: "map",
        style:
          "https://api.maptiler.com/maps/streets/style.json?key=6DagWlYgkxoFxL5RaX6S",
        center: [-111.9, 33.7],
        zoom: 10,
      });

      const draw = new MaplibreTerradrawControl({
        modes: ["polygon", "select", "delete"],
        open: true,
      });
      map.addControl(draw, "top-left");

      let listings = []; // [{lng, lat, ...}]

      async function loadListings() {
        const b = map.getBounds();
        const bbox = [
          b.getWest(),
          b.getSouth(),
          b.getEast(),
          b.getNorth(),
        ].join(",");
        const res = await fetch(`/api/listings?bbox=${bbox}`);
        listings = await res.json();
        const fc = {
          type: "FeatureCollection",
          features: listings.map((l) => ({
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: [l.lng, l.lat] },
          })),
        };
        const src = map.getSource("listings");
        if (src) src.setData(fc);
        else {
          map.addSource("listings", { type: "geojson", data: fc });
          map.addLayer({
            id: "listings",
            type: "circle",
            source: "listings",
            paint: {
              "circle-radius": 3,
              "circle-color": "#d4654b",
              "circle-opacity": 0.7,
            },
          });
        }
      }

      function currentPolygon() {
        const td = draw.getTerraDrawInstance();
        const snapshot = td
          .getSnapshot()
          .filter((f) => f.geometry.type === "Polygon");
        return snapshot.length ? snapshot[snapshot.length - 1] : null;
      }

      function updateCount() {
        const poly = currentPolygon();
        if (!poly) {
          document.getElementById("count").textContent = "—";
          return;
        }
        let n = 0;
        for (const l of listings)
          if (booleanPointInPolygon(point([l.lng, l.lat]), poly)) n += 1;
        document.getElementById("count").textContent = String(n);
        document.getElementById("meta").textContent =
          `${poly.geometry.coordinates[0].length} vertices`;
      }

      map.on("load", loadListings);
      map.on("moveend", loadListings);
      // Terra Draw fires 'finish' on the underlying instance when a shape is committed.
      map.on("idle", updateCount);

      document.getElementById("save").addEventListener("click", async () => {
        const poly = currentPolygon();
        const slug = document.getElementById("slug").value.trim();
        const name = document.getElementById("name").value.trim();
        const region = document.getElementById("region").value.trim();
        const status = document.getElementById("status");
        if (!poly || !slug || !name || !region) {
          status.textContent = "slug, name, region, and a polygon are required";
          return;
        }
        status.textContent = "saving…";
        const res = await fetch("/api/community", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            slug,
            name,
            regionSlug: region,
            geometry: poly.geometry,
          }),
        });
        const body = await res.json();
        status.textContent = res.ok
          ? `saved — ${body.areaSqMi.toFixed(2)} sq mi, ${body.vertexCount} verts`
          : `error: ${body.error}`;
      });
    </script>
  </body>
</html>
```

- [ ] **Step 2: Manual browser verification**

Run: `npx tsx real-estate-platform/scripts/geo/editor/server.ts`, open `http://localhost:5300`.
Verify, in order:

1. Red listing dots render and refresh on pan/zoom.
2. Drawing a polygon updates the "Listings inside polygon" count (matches roughly the dots enclosed).
3. The Terra Draw snapshot API is `getTerraDrawInstance().getSnapshot()` returning GeoJSON Features — if the loaded version differs, fix `currentPolygon()` to match (check the printed error in devtools). This is the one version-sensitive spot.
4. Saving with slug `test-delete-me` / name `Test` / region `north-scottsdale` returns a success status line.

- [ ] **Step 3: Clean up the smoke-test row**

Run: `node -e "const pg=require('pg');const p=new pg.Pool({connectionString:process.env.RDS_DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query(\"DELETE FROM geo_boundaries WHERE slug='test-delete-me' AND type='community'\").then(r=>{console.log('deleted',r.rowCount);return p.end()})"`
Expected: `deleted 1`.

- [ ] **Step 4: Commit**

```bash
git add real-estate-platform/scripts/geo/editor/index.html
git commit -m "feat(geo): boundary editor page with listing overlay and live inside-count"
```

---

### Task A4: Editor README + npm script

**Files:**

- Create: `real-estate-platform/scripts/geo/editor/README.md`
- Modify: `real-estate-platform/package.json` (add a `geo:editor` script)

- [ ] **Step 1: Write the README**

````markdown
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
````

Drawn polygons are EPSG:4326. Save upserts one community by slug; bbox/centroid/area/vertex
count are recomputed server-side from the geometry.

````

- [ ] **Step 2: Add the npm script**

In `real-estate-platform/package.json`, add to `"scripts"`:

```json
"geo:editor": "tsx scripts/geo/editor/server.ts"
````

- [ ] **Step 3: Commit**

```bash
git add real-estate-platform/scripts/geo/editor/README.md real-estate-platform/package.json
git commit -m "docs(geo): editor README and geo:editor npm script"
```

---

## Phase B — dbt Point-in-Polygon Assignment

### Task B1: Enable the DuckDB spatial extension

**Files:**

- Modify: `real-estate-platform/analytics/profiles.yml` (add `- spatial` to each target's `extensions:`)
- Modify: `real-estate-platform/analytics/profiles.yml.example` (same)

- [ ] **Step 1: Add `spatial` to every `extensions:` block**

In `profiles.yml`, each target lists:

```yaml
extensions:
  - httpfs
  - parquet
  - postgres
```

Add `- spatial` to the `dev`, `prod`, `fargate-prod`, and `ci` targets (and the same blocks in `profiles.yml.example`):

```yaml
extensions:
  - httpfs
  - parquet
  - postgres
  - spatial
```

- [ ] **Step 2: Verify spatial loads and the core functions work**

Run: `cd real-estate-platform/analytics && DBT_PROFILES_DIR=. dbt run-operation --quiet run_query --args '{sql: "SELECT ST_Covers(ST_GeomFromText(''POLYGON((0 0,0 1,1 1,1 0,0 0))''), ST_Point(0.5,0.5)) AS hit"}'` — if `run_query` is not defined, instead run a one-off: `DBT_PROFILES_DIR=. dbt show --inline "SELECT ST_Covers(ST_GeomFromText('POLYGON((0 0,0 1,1 1,1 0,0 0))'), ST_Point(0.5,0.5)) AS hit"`
Expected: a single row `hit = true`. If the extension fails to load on `dev`, run `dbt debug` and confirm dbt-duckdb auto-installs `spatial`; if offline, pre-install once with the DuckDB CLI `INSTALL spatial;`.

- [ ] **Step 3: Commit**

```bash
git add real-estate-platform/analytics/profiles.yml real-estate-platform/analytics/profiles.yml.example
git commit -m "build(analytics): enable DuckDB spatial extension across dbt targets"
```

---

### Task B2: Boundaries staging model

**Files:**

- Create: `real-estate-platform/analytics/models/staging/geo/stg_geo__community_boundaries.sql`
- Create: `real-estate-platform/analytics/models/staging/geo/_geo__models.yml`

- [ ] **Step 1: Write the staging model**

```sql
-- real-estate-platform/analytics/models/staging/geo/stg_geo__community_boundaries.sql
{{ config(materialized='table', tags=['staging', 'geo']) }}

-- Community boundary polygons, read live from the RDS geo_boundaries table
-- (attached as the read-only `rlsir_platform` postgres catalog). geometry is
-- stored as plain GeoJSON text, so ST_GeomFromGeoJSON parses it directly — no
-- PostGIS WKB involved. bbox extents are derived from the parsed geometry for a
-- cheap prefilter before the ST_Covers test downstream.

WITH src AS (
  SELECT
    slug          AS community_slug,
    name          AS community_name,
    properties->>'regionSlug' AS region_slug,
    area_sq_mi,
    geometry      AS geometry_text
  FROM rlsir_platform.public.geo_boundaries
  WHERE type = 'community'
    AND geometry IS NOT NULL
)

SELECT
  community_slug,
  community_name,
  region_slug,
  area_sq_mi,
  ST_GeomFromGeoJSON(geometry_text) AS boundary_geom,
  ST_XMin(ST_GeomFromGeoJSON(geometry_text)) AS bbox_min_lng,
  ST_XMax(ST_GeomFromGeoJSON(geometry_text)) AS bbox_max_lng,
  ST_YMin(ST_GeomFromGeoJSON(geometry_text)) AS bbox_min_lat,
  ST_YMax(ST_GeomFromGeoJSON(geometry_text)) AS bbox_max_lat
FROM src
```

- [ ] **Step 2: Write the model docs/tests**

```yaml
# real-estate-platform/analytics/models/staging/geo/_geo__models.yml
version: 2

models:
  - name: stg_geo__community_boundaries
    description: Community boundary polygons from RDS geo_boundaries, parsed to DuckDB geometry.
    columns:
      - name: community_slug
        tests: [not_null, unique]
      - name: boundary_geom
        tests: [not_null]
      - name: area_sq_mi
        tests: [not_null]
```

- [ ] **Step 3: Build and verify**

Run: `cd real-estate-platform/analytics && DBT_PROFILES_DIR=. dbt build --select stg_geo__community_boundaries`
Expected: model builds; tests pass; row count ≈ number of communities in `geo_boundaries` (~48).

- [ ] **Step 4: Commit**

```bash
git add real-estate-platform/analytics/models/staging/geo/
git commit -m "feat(analytics): stg_geo__community_boundaries from RDS GeoJSON"
```

---

### Task B3: PIP macros (shared by active + closed)

**Files:**

- Create: `real-estate-platform/analytics/macros/pip_community.sql`

- [ ] **Step 1: Write the macros**

```sql
-- real-estate-platform/analytics/macros/pip_community.sql

{# Smallest covering community for a point. bbox prefilter (BETWEEN) narrows to
   the 1-2 candidate polygons before the boundary-inclusive ST_Covers test;
   smallest area_sq_mi wins on overlap. NULL when no polygon covers the point
   (or lat/long is NULL). EPSG:4326 — ST_Point(lng, lat). #}
{% macro pip_community_slug(lat_col, lng_col) %}
(
  SELECT b.community_slug
  FROM {{ ref('stg_geo__community_boundaries') }} b
  WHERE {{ lng_col }} BETWEEN b.bbox_min_lng AND b.bbox_max_lng
    AND {{ lat_col }} BETWEEN b.bbox_min_lat AND b.bbox_max_lat
    AND ST_Covers(b.boundary_geom, ST_Point({{ lng_col }}, {{ lat_col }}))
  ORDER BY b.area_sq_mi ASC NULLS LAST
  LIMIT 1
)
{% endmacro %}

{% macro pip_region_slug(lat_col, lng_col) %}
(
  SELECT b.region_slug
  FROM {{ ref('stg_geo__community_boundaries') }} b
  WHERE {{ lng_col }} BETWEEN b.bbox_min_lng AND b.bbox_max_lng
    AND {{ lat_col }} BETWEEN b.bbox_min_lat AND b.bbox_max_lat
    AND ST_Covers(b.boundary_geom, ST_Point({{ lng_col }}, {{ lat_col }}))
  ORDER BY b.area_sq_mi ASC NULLS LAST
  LIMIT 1
)
{% endmacro %}

{# Unified community: PIP authoritative, canonical-map subdivision slug as the
   gap-filler where no polygon covers the point. Junk slugs filtered to NULL. #}
{% macro community_unified_slug(pip_slug_col, canonical_slug_col) %}
  CASE
    WHEN {{ pip_slug_col }} IS NOT NULL THEN {{ pip_slug_col }}
    WHEN {{ canonical_slug_col }} IS NULL OR {{ canonical_slug_col }} = '' THEN NULL
    WHEN {{ canonical_slug_col }} IN (
      'none', 'na', 'n-a', 'unknown', 'metes-bounds', 'metes-and-bounds',
      'no-subdivision', 'no-subdivisions', 'no-sub', 'tbd', 'see-remarks',
      'rural', 'farm', 'subdivision'
    ) THEN NULL
    ELSE {{ canonical_slug_col }}
  END
{% endmacro %}
```

- [ ] **Step 2: Commit**

```bash
git add real-estate-platform/analytics/macros/pip_community.sql
git commit -m "feat(analytics): PIP community/region macros (ST_Covers, smallest-area wins)"
```

---

### Task B4: Deterministic PIP semantics test (TDD)

**Files:**

- Create: `real-estate-platform/analytics/tests/assert_pip_semantics.sql`

This singular test is self-contained (inline polygons, no production data) and locks the two semantics the macros depend on: boundary-inclusive `ST_Covers` and smallest-area tiebreaking.

- [ ] **Step 1: Write the failing test**

```sql
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
```

- [ ] **Step 2: Run the test against a build that lacks spatial to confirm it can fail**

Run: `cd real-estate-platform/analytics && DBT_PROFILES_DIR=. dbt test --select assert_pip_semantics`
Expected if Task B1 was skipped/broken: ERROR (`ST_Covers` unknown) — proving the test exercises spatial. With B1 applied it should PASS (0 failing rows). If it returns failing rows, the DuckDB build's `ST_Covers`/`ST_Point` semantics differ from the spec assumption — STOP and reconcile before wiring the macros into production models.

- [ ] **Step 3: Commit**

```bash
git add real-estate-platform/analytics/tests/assert_pip_semantics.sql
git commit -m "test(analytics): deterministic PIP semantics (ST_Covers + smallest-area)"
```

---

### Task B5: Rewire active listings to PIP-first

**Files:**

- Modify: `real-estate-platform/analytics/models/intermediate/listings/int_listings_active_cleaned.sql`

The model currently computes `community_unified_slug` inline at lines ~213-226 from `geo.community_slug` (the precomputed PostGIS slug) coalesced with the canonical-map slug. Replace the `geo.community_slug` source of truth with a fresh DuckDB PIP against `stg_geo__community_boundaries`, keeping the canonical map as the fallback.

- [ ] **Step 1: Add PIP columns and rewire the unified slug**

Replace the existing `community_unified_slug` CASE expression (the block beginning `CASE\n    WHEN geo.community_slug IS NOT NULL THEN geo.community_slug` and ending `END AS community_unified_slug,`) with:

```sql
  -- Community via fresh point-in-polygon (authoritative), canonical-map slug as
  -- the gap-filler. See macros/pip_community.sql. EPSG:4326; ST_Covers; smallest
  -- polygon wins; NULL when no polygon covers the point.
  {{ pip_community_slug('s.latitude', 's.longitude') }} AS community_pip_slug,
  {{ pip_region_slug('s.latitude', 's.longitude') }}    AS region_pip_slug,
  {{ community_unified_slug(
       pip_community_slug('s.latitude', 's.longitude'),
       "NULLIF(LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(dc.canonical_community), '[^A-Za-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')), '')"
  ) }} AS community_unified_slug,
```

Keep the existing `subdivision_slug` expression unchanged. Leave the existing `geo.region_slug`/`geo.region_name`/`geo.community_slug` passthrough columns in place (the heatmap and dim models still read `region_slug`); `region_pip_slug` is additive.

- [ ] **Step 2: Build active + a downstream mart and verify no errors**

Run: `cd real-estate-platform/analytics && DBT_PROFILES_DIR=. dbt build --select int_listings_active_cleaned+ --vars '{enable_active: true}'`
Expected: `int_listings_active_cleaned` and dependents (e.g. `fct_active_by_pricetier`) build clean. If the correlated subquery errors with a codegen/UNNEST message, see the perf fallback note at the end of this plan.

- [ ] **Step 3: Sanity-check Troon coverage**

Run: `DBT_PROFILES_DIR=. dbt show --inline "SELECT community_pip_slug, COUNT(*) FROM {{ ref('int_listings_active_cleaned') }} WHERE community_pip_slug LIKE 'troon%' GROUP BY 1"`
Expected: non-zero counts for the Troon community slug(s) — confirming PIP assigns Troon listings by location.

- [ ] **Step 4: Commit**

```bash
git add real-estate-platform/analytics/models/intermediate/listings/int_listings_active_cleaned.sql
git commit -m "feat(analytics): PIP-first community assignment for active listings"
```

---

### Task B6: Rewire closed listings to PIP-first

**Files:**

- Modify: `real-estate-platform/analytics/models/intermediate/listings/int_listings_geographic_enriched.sql`

This model computes `community_unified_slug` at lines ~74-83 from `community_slug` (the `lg.community_slug` PostGIS passthrough) coalesced with `canonical_slug`. The model already exposes `canonical_slug` and joins `lg` (listing_geography) and `dc` (canonical map) in the `slug_helpers` CTE; latitude/longitude come from `int_listings_closed_cleaned` via `c.*`.

- [ ] **Step 1: Replace the unified-slug CASE with the macro + add PIP columns**

In the final `SELECT`, replace the existing `community_unified_slug` CASE block (`CASE\n    WHEN community_slug IS NOT NULL THEN community_slug ... END AS community_unified_slug,`) with:

```sql
  -- Community via fresh point-in-polygon (authoritative), canonical-map slug as
  -- the gap-filler. Mirrors int_listings_active_cleaned via shared macros.
  {{ pip_community_slug('latitude', 'longitude') }} AS community_pip_slug,
  {{ pip_region_slug('latitude', 'longitude') }}    AS region_pip_slug,
  {{ community_unified_slug(
       pip_community_slug('latitude', 'longitude'),
       'canonical_slug'
  ) }} AS community_unified_slug,
```

`latitude`/`longitude` are available because `slug_helpers` selects `c.*` from `int_listings_closed_cleaned`. Keep `subdivision_slug` and `price_band` unchanged.

- [ ] **Step 2: Build closed + a downstream mart**

Run: `cd real-estate-platform/analytics && DBT_PROFILES_DIR=. dbt build --select int_listings_geographic_enriched+ --exclude resource_type:test`
Then run tests: `DBT_PROFILES_DIR=. dbt test --select int_listings_geographic_enriched dim_communities`
Expected: builds clean; `dim_communities` still populates (it reads `community_slug` — confirm it now reads `community_unified_slug` if community-page coverage should benefit; if `dim_communities` should switch to the unified slug, update its `WHERE community_slug IS NOT NULL` / `GROUP BY` to use `community_unified_slug` in a follow-up and note it).

- [ ] **Step 3: Commit**

```bash
git add real-estate-platform/analytics/models/intermediate/listings/int_listings_geographic_enriched.sql
git commit -m "feat(analytics): PIP-first community assignment for closed listings"
```

---

### Task B7: Coverage report (success metric)

**Files:**

- Create: `real-estate-platform/scripts/geo/pip-coverage.mjs`

- [ ] **Step 1: Write the coverage script**

```javascript
// real-estate-platform/scripts/geo/pip-coverage.mjs
// Reports community-assignment coverage from the built DuckDB analytics db.
// Run AFTER `dbt build` so the intermediate tables exist locally.
import { DuckDBInstance } from "@duckdb/node-api";

const DB =
  "real-estate-platform/analytics/_local_output/rlsir_analytics_dev.duckdb";

const instance = await DuckDBInstance.create(DB, { access_mode: "READ_ONLY" });
const conn = await instance.connect();

for (const model of [
  "int_listings_active_cleaned",
  "int_listings_geographic_enriched",
]) {
  const reader = await conn.runAndReadAll(`
    SELECT
      COUNT(*) AS total,
      COUNT(community_pip_slug) AS pip_assigned,
      COUNT(community_unified_slug) AS unified_assigned,
      ROUND(100.0 * COUNT(community_pip_slug) / COUNT(*), 1) AS pip_pct,
      ROUND(100.0 * COUNT(community_unified_slug) / COUNT(*), 1) AS unified_pct
    FROM ${model}
  `);
  const r = reader.getRowObjects()[0];
  console.log(`\n${model}`);
  console.log(
    `  total=${r.total} pip=${r.pip_assigned} (${r.pip_pct}%) unified=${r.unified_assigned} (${r.unified_pct}%)`,
  );
}
```

- [ ] **Step 2: Run it and record the baseline**

Run: `node real-estate-platform/scripts/geo/pip-coverage.mjs`
Expected: prints PIP% and unified% per model. (If `@duckdb/node-api` is not installed, `pnpm add -D @duckdb/node-api` at repo root.) Record the numbers in the commit message — this is the before/after success metric. PIP% should track the share of inventory in curated communities; unified% should stay near its pre-change level (PIP shouldn't _reduce_ coverage).

- [ ] **Step 3: Commit**

```bash
git add real-estate-platform/scripts/geo/pip-coverage.mjs
git commit -m "feat(geo): PIP community-assignment coverage report"
```

---

## Perf fallback (only if Task B5/B6 correlated subquery is slow or errors)

The correlated scalar subquery is the simplest drop-in. If profiling the Fargate run shows it dominating runtime on the ~1.8M closed rows, or DuckDB raises a correlated-subquery codegen error, replace the per-row subquery with a one-shot spatial join model:

- Create `int_listings_community_pip.sql` that reads `listing_key, latitude, longitude` from `int_listings_closed_cleaned` and the active source, `LEFT JOIN stg_geo__community_boundaries b ON <bbox BETWEEN clauses> AND ST_Covers(b.boundary_geom, ST_Point(longitude, latitude))`, then `QUALIFY ROW_NUMBER() OVER (PARTITION BY listing_key ORDER BY b.area_sq_mi) = 1` to keep the smallest polygon.
- The two int models then `LEFT JOIN int_listings_community_pip USING (listing_key)` and reference `community_pip_slug`/`region_pip_slug` columns instead of the macro subqueries (the `community_unified_slug()` macro is unchanged — pass the joined column).

This keeps semantics identical (still `ST_Covers`, smallest-area, bbox prefilter) but does the spatial work once.

---

## Self-Review Notes

- **Spec coverage:** editor standalone-local (A1-A4) ✓; listing overlay + live count (A3) ✓; PIP in dbt/DuckDB (B1-B6) ✓; ST_Covers + 4326 + smallest-area + bbox prefilter (B3, B4) ✓; subdivision fallback retained as gap-filler (B3 macro) ✓; coverage success metric (B7) ✓; shared macro to keep active/closed in sync (B3) ✓.
- **Deferred (per spec non-goals):** mismatch-flag overlay; auth; upstream PostGIS changes; broad community expansion.
- **Known version-sensitive spot:** Terra Draw snapshot retrieval in `index.html` (A3 Step 2) — verify in-browser against the pinned `@watergis/maplibre-gl-terradraw` version.
- **Follow-up flagged, not in scope:** `dim_communities` and other marts currently key on `community_slug`; decide per-mart whether to switch reads to `community_unified_slug` so community pages gain the PIP coverage.
