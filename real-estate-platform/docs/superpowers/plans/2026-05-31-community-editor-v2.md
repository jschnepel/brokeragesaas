# Community Boundary Editor v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the local boundary editor (`real-estate-platform/scripts/geo/editor/`) genuinely fast for the operator: swap to maplibre-geoman, add snap (incl. snap-to-listings), click-to-edit existing shapes, a side-panel community list, Boolean Ops (union/subtract/intersect), undo/redo, a weld-nearby-vertices tool, and save-time validation.

**Builds on:** v1 spec/plan (`2026-05-29-community-pip-assignment-and-geojson-editor*`). v1 stack: Node http server + MapLibre + Terra Draw + Turf, ESM CDN imports, RDS `geo_boundaries` (GeoJSON text + bbox/centroid as `numeric[]`).

**Spec:** `docs/superpowers/specs/2026-05-31-community-editor-v2-design.md`

**Tech Stack:** `@geoman-io/maplibre-geoman-free` (replacing `@watergis/maplibre-gl-terradraw`), Turf v7 (`union`, `difference`, `intersect`, `kinks`, `simplify`, `booleanIntersects`, `distance`), Vitest (unit tests).

---

## File Structure

- Extend: `real-estate-platform/scripts/geo/editor/geo-compute.ts` — adds pure helpers (boolean ops, validation, weld).
- Extend: `real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts` — adds tests for the new helpers.
- Rewrite (substantial): `real-estate-platform/scripts/geo/editor/index.html` — swap draw control, mount snap config, load editable existing shapes, side-panel list, Boolean Ops panel, Undo/Redo, weld tool, validation, keyboard shortcuts.
- Unchanged: `real-estate-platform/scripts/geo/editor/server.ts` (existing endpoints suffice).

---

## Task T1: Verify the maplibre-geoman API + swap the draw control

**Files:** `real-estate-platform/scripts/geo/editor/index.html`

The pinned v1 draw control is `@watergis/maplibre-gl-terradraw@1.13.1`. We swap to `@geoman-io/maplibre-geoman-free` (the open-source build). The exact constructor class, mount call (`map.addControl` vs `gm.attach(map)`), how to enumerate features (`gm.features.getAll()` vs similar), and how to listen for change events are version-sensitive — verify against the actually-resolved package via esm.sh before writing client code.

- [ ] **Step 1: Verify the package API by loading docs.** Use WebFetch on `https://geoman.io/docs/maplibre/introduction` and `https://www.npmjs.com/package/@geoman-io/maplibre-geoman-free`. Record the exact: (a) package name + version (pick the latest stable `1.x`), (b) ES import path, (c) constructor / `gm = new Geoman(map, opts)` shape, (d) how to mount (add a control or `gm.create()`), (e) how to read drawn features (`gm.features.getAll()` returns a FeatureCollection), (f) how to listen for `gm:create` / `gm:update` / `gm:remove` events, (g) the CSS asset path.

- [ ] **Step 2: Replace the imports + control mount in `index.html`.** Swap the CSS `<link>` and the JS `import` for geoman; remove the `MaplibreTerradrawControl` lines; mount geoman per its docs. Wire a basic `gm:create` / `gm:update` event handler that calls a new `function refreshCount()` (we'll wire it fully in T6 — for now it just logs the FeatureCollection length to confirm events fire).

- [ ] **Step 3: Replace `currentPolygon()`.** Use geoman's feature reader (e.g. `gm.features.getAll()` filtered for `geometry.type === 'Polygon'`, last one wins). Keep the function signature; downstream code (`updateCount`, save handler) stays the same.

- [ ] **Step 4: Browser regression test via Puppeteer.** Run the server (`npx tsx real-estate-platform/scripts/geo/editor/server.ts`), navigate to `http://localhost:5300`, expose `window.__map` and the geoman instance for introspection, confirm: no console errors, listing dots still render (count > 0 from the `/api/listings` call), `__gm` is defined, the polygon-mode button is visible. Take a screenshot. Direct POST a tiny 5-vertex test polygon to `/api/community`, expect `ok:true`, then delete the test row.

- [ ] **Step 5: Commit** — stage ONLY `index.html` and a brief one-line comment in the head documenting the pinned geoman version:

```bash
git add real-estate-platform/scripts/geo/editor/index.html
git commit -m "feat(geo-editor): swap terra-draw control for maplibre-geoman"
```

---

## Task T2: Pure helpers — Boolean ops, validation, weld (TDD)

**Files:**

- Extend: `real-estate-platform/scripts/geo/editor/geo-compute.ts`
- Extend: `real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts`

Add six exported pure functions, each TDD-tested. They use turf v7 sub-packages (`@turf/union`, `@turf/difference`, `@turf/intersect`, `@turf/kinks`, `@turf/distance`, `@turf/boolean-intersects`, `@turf/helpers`). Install any that aren't already a devDep.

- [ ] **Step 1: Write the failing tests** (append to `geo-compute.test.ts`):

```typescript
import type { Polygon, MultiPolygon } from "geojson";
import {
  unionPolygons,
  differencePolygons,
  intersectPolygons,
  hasSelfIntersection,
  findSiblingOverlap,
  weldNearbyVertices,
} from "../geo-compute";

const squareA: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ],
  ],
};
const squareB: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [0.5, 0.5],
      [0.5, 1.5],
      [1.5, 1.5],
      [1.5, 0.5],
      [0.5, 0.5],
    ],
  ],
};
const squareC: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [10, 10],
      [10, 11],
      [11, 11],
      [11, 10],
      [10, 10],
    ],
  ],
};
const bowtie: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [2, 2],
      [0, 2],
      [2, 0],
      [0, 0],
    ],
  ],
};

describe("unionPolygons", () => {
  it("merges overlapping squares into a single Polygon", () => {
    const u = unionPolygons(squareA, squareB);
    expect(u).not.toBeNull();
    expect(u!.type === "Polygon" || u!.type === "MultiPolygon").toBe(true);
  });
  it("returns a MultiPolygon when squares are disjoint", () => {
    const u = unionPolygons(squareA, squareC);
    expect(u!.type).toBe("MultiPolygon");
  });
});

describe("differencePolygons", () => {
  it("subtracts B from A leaving an L-shape", () => {
    const d = differencePolygons(squareA, squareB);
    expect(d).not.toBeNull();
    expect(d!.type === "Polygon" || d!.type === "MultiPolygon").toBe(true);
  });
  it("returns null when B fully contains A", () => {
    const tiny: Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [0.1, 0.1],
          [0.1, 0.2],
          [0.2, 0.2],
          [0.2, 0.1],
          [0.1, 0.1],
        ],
      ],
    };
    expect(differencePolygons(tiny, squareA)).toBeNull();
  });
});

describe("intersectPolygons", () => {
  it("returns the overlap square", () => {
    const i = intersectPolygons(squareA, squareB);
    expect(i).not.toBeNull();
    expect(i!.type).toBe("Polygon");
  });
  it("returns null for disjoint inputs", () => {
    expect(intersectPolygons(squareA, squareC)).toBeNull();
  });
});

describe("hasSelfIntersection", () => {
  it("flags a bowtie polygon", () => {
    expect(hasSelfIntersection(bowtie)).toBe(true);
  });
  it("passes a clean square", () => {
    expect(hasSelfIntersection(squareA)).toBe(false);
  });
});

describe("findSiblingOverlap", () => {
  it("returns the slug of an overlapping sibling, or null", () => {
    const siblings = [
      { slug: "a", geometry: squareA },
      { slug: "c", geometry: squareC },
    ];
    expect(findSiblingOverlap(squareB, siblings)).toBe("a");
    expect(
      findSiblingOverlap(
        squareC,
        siblings.filter((s) => s.slug !== "c"),
      ),
    ).toBeNull();
  });
  it("ignores the same slug (editing in place)", () => {
    const siblings = [{ slug: "self", geometry: squareA }];
    expect(findSiblingOverlap(squareB, siblings, "self")).toBeNull();
  });
});

describe("weldNearbyVertices", () => {
  it("coalesces vertices within the threshold (meters)", () => {
    const close: Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [-111.9, 33.6],
          [-111.90001, 33.60001],
          [-111.9, 33.7],
          [-111.8, 33.7],
          [-111.8, 33.6],
          [-111.9, 33.6],
        ],
      ],
    };
    const before = close.coordinates[0].length;
    const after = weldNearbyVertices(close, 100); // 100m threshold
    expect(after.coordinates[0].length).toBeLessThan(before);
  });
  it("preserves the polygon ring closure", () => {
    const w = weldNearbyVertices(squareA, 1);
    const ring = w.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
});
```

- [ ] **Step 2: Run tests to see them fail.** `npx vitest run real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts` — expect `unionPolygons` etc. to be undefined.

- [ ] **Step 3: Install any missing turf sub-packages** at the pnpm workspace root (`real-estate-platform/`):

```bash
pnpm add -Dw @turf/union @turf/difference @turf/intersect @turf/kinks @turf/distance @turf/boolean-intersects
```

(`@turf/area`, `@turf/bbox`, `@turf/centroid`, `@turf/boolean-point-in-polygon`, `@turf/helpers` were installed in v1.)

- [ ] **Step 4: Implement.** Append to `geo-compute.ts`:

```typescript
import union from "@turf/union";
import difference from "@turf/difference";
import intersect from "@turf/intersect";
import kinks from "@turf/kinks";
import booleanIntersects from "@turf/boolean-intersects";
import distance from "@turf/distance";
import { polygon as turfPolygon, featureCollection } from "@turf/helpers";

type AnyPolygon = Polygon | MultiPolygon;

function feat(geom: AnyPolygon) {
  return { type: "Feature" as const, properties: {}, geometry: geom };
}

export function unionPolygons(a: AnyPolygon, b: AnyPolygon): AnyPolygon | null {
  const u = union(featureCollection([feat(a), feat(b)]));
  return u ? (u.geometry as AnyPolygon) : null;
}

export function differencePolygons(
  a: AnyPolygon,
  b: AnyPolygon,
): AnyPolygon | null {
  const d = difference(featureCollection([feat(a), feat(b)]));
  return d ? (d.geometry as AnyPolygon) : null;
}

export function intersectPolygons(
  a: AnyPolygon,
  b: AnyPolygon,
): AnyPolygon | null {
  const i = intersect(featureCollection([feat(a), feat(b)]));
  return i ? (i.geometry as AnyPolygon) : null;
}

export function hasSelfIntersection(geom: AnyPolygon): boolean {
  const k = kinks(feat(geom));
  return k.features.length > 0;
}

export interface SiblingShape {
  slug: string;
  geometry: AnyPolygon;
}

export function findSiblingOverlap(
  candidate: AnyPolygon,
  siblings: SiblingShape[],
  ownSlug?: string,
): string | null {
  for (const s of siblings) {
    if (ownSlug && s.slug === ownSlug) continue;
    if (booleanIntersects(feat(candidate), feat(s.geometry))) return s.slug;
  }
  return null;
}

export function weldNearbyVertices(
  geom: Polygon,
  thresholdMeters: number,
): Polygon {
  const km = thresholdMeters / 1000;
  const weldRing = (ring: number[][]): number[][] => {
    if (ring.length < 4) return ring;
    const keep: number[][] = [ring[0]];
    for (let i = 1; i < ring.length - 1; i++) {
      const prev = keep[keep.length - 1];
      const d = distance(prev, ring[i], { units: "kilometers" });
      if (d > km) keep.push(ring[i]);
    }
    // Ensure ring closure
    keep.push(keep[0]);
    return keep.length >= 4 ? keep : ring; // don't degenerate below a triangle
  };
  return { type: "Polygon", coordinates: geom.coordinates.map(weldRing) };
}
```

- [ ] **Step 5: Run tests, expect all pass:** `npx vitest run real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts`.

- [ ] **Step 6: Commit** — stage only `geo-compute.ts`, the test file, and the workspace `package.json`/`pnpm-lock.yaml`:

```bash
git add real-estate-platform/scripts/geo/editor/geo-compute.ts real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts real-estate-platform/package.json real-estate-platform/pnpm-lock.yaml
git commit -m "feat(geo-editor): pure helpers for boolean ops, validation, weld"
```

---

## Task T3: Click-to-edit existing + side-panel community list

**Files:** `real-estate-platform/scripts/geo/editor/index.html`

On load, fetch `/api/boundaries`, push every community polygon into geoman's editable layer, and render a side-panel list with name + area + inside-count. Click a row → fly to its bbox and select the shape in geoman. Hover a row → highlight its outline on the map.

- [ ] **Step 1: Replace the right-panel HTML** — add a scrollable `#shape-list` above the existing slug/name/region inputs. Each row is `<button class="shape-row" data-slug="X">…</button>`. The save-form section stays below it.

- [ ] **Step 2: Add a maplibre source/layer pair for hover-highlight.** A `geojson` source `community-hover` with empty features, layered above listings with a thick outline.

- [ ] **Step 3: Load existing shapes after the map loads.** Fetch `/api/boundaries`, filter `type === 'community'`, push each into geoman's feature collection (use the documented method from T1's verification — likely `gm.features.add(featureCollection)`). Set a custom `properties.communitySlug` on each so we can identify it later.

- [ ] **Step 4: Render the side-panel list.** For each community, compute `area_sq_mi` (use the value from the API or compute via `computeBoundaryRow`); compute the inside-count using `countPointsInside` against the currently loaded `listings`. Update the count when listings reload.

- [ ] **Step 5: Wire click + hover handlers.** On row click: read `data-slug`, find the geoman feature, fly to its bbox (compute via `@turf/bbox`), select it (geoman's select API per T1). On row hover: setData on the `community-hover` source to that feature; on leave, clear.

- [ ] **Step 6: Browser regression via Puppeteer.** Confirm: rows appear (count matches `/api/boundaries` length); clicking a row pans/zooms the map and the shape is selected (vertex handles visible); hovering highlights the outline. Take a screenshot.

- [ ] **Step 7: Commit:**

```bash
git add real-estate-platform/scripts/geo/editor/index.html
git commit -m "feat(geo-editor): click-to-edit existing communities + side-panel list"
```

---

## Task T4: Snap configuration (vertex / edge / midpoint + listings as snap target)

**Files:** `real-estate-platform/scripts/geo/editor/index.html`

Enable geoman's snap (vertex + edge + midpoint, ~12px). Add the `listings` source as a snap target so polygon vertices snap to listing dots. Hold `Space` for momentary toggle.

- [ ] **Step 1: Enable built-in snap on construction.** Per the API confirmed in T1, pass `snap: { mode: 'vertex|edge|midpoint', radius: 12 }` (exact key/shape depends on the version — adapt). Confirm in the browser that dragging a vertex near another shape's vertex visibly snaps.

- [ ] **Step 2: Add listings as a snap target.** Geoman supports custom snap sources via `gm.snap.addSource(source)` (exact API per docs). If unsupported, FALL BACK to a custom snap handler: on `gm:vertex:drag`, find the nearest listing dot within 12 px on screen (convert px to map coords via `map.project`/`map.unproject`), and if within range, replace the dragged vertex coord with the listing coord. Implement whichever path the library supports; document which you used.

- [ ] **Step 3: Momentary snap toggle via `Space`.** Add a `keydown`/`keyup` listener: while space is held, force snap on (radius bumped to e.g. 24 px); on release, restore default. If the library doesn't have an imperative API for this, no-op gracefully and document.

- [ ] **Step 4: Browser test.** Manually verify in-browser (with puppeteer assistance): drag a polygon vertex over a listing dot — coords should equal the dot's lat/long after release. Capture the geoman feature collection JSON for visual confirmation.

- [ ] **Step 5: Commit:**

```bash
git add real-estate-platform/scripts/geo/editor/index.html
git commit -m "feat(geo-editor): snap to vertex/edge/midpoint and to listing dots"
```

---

## Task T5: Boolean Ops panel (Union / Subtract / Intersect)

**Files:** `real-estate-platform/scripts/geo/editor/index.html`

Add a Boolean Ops section to the right panel: when ≥ 2 polygon features are selected (Shift+click in geoman), enable Union / Subtract / Intersect buttons. Subtract uses the first-selected minus the second-selected. The operation replaces the two inputs with the single result (after a `confirm()` for destructive ops).

- [ ] **Step 1: Add the panel HTML.** Three buttons + a small caption: "Select 2 shapes (Shift+click), then choose an op."

- [ ] **Step 2: Track selection.** Listen for geoman's selection events (verified in T1) and store the array of selected feature IDs in a `selected` variable. Update button `disabled` state: enabled only when `selected.length === 2`.

- [ ] **Step 3: Wire each button.** Click handler reads the two geometries, calls `unionPolygons` / `differencePolygons` / `intersectPolygons` from `geo-compute.ts` (port the imports from the existing inline turf), confirms ("This will replace 2 shapes with 1 result. Continue?"), removes the two input features from geoman, and adds the result. If the result is null (empty/contained), show a status line and do not delete.

- [ ] **Step 4: Browser smoke.** In Puppeteer, push two overlapping Polygons into geoman, simulate the Union click handler directly, confirm one combined feature remains. Take a screenshot.

- [ ] **Step 5: Commit:**

```bash
git add real-estate-platform/scripts/geo/editor/index.html
git commit -m "feat(geo-editor): Boolean Ops panel (Union / Subtract / Intersect)"
```

---

## Task T6: Undo / Redo

**Files:** `real-estate-platform/scripts/geo/editor/index.html`

Snapshot the geoman FeatureCollection JSON on every committed change (`gm:create`, `gm:update`, `gm:remove`, plus our Boolean Ops + Weld). `Cmd/Ctrl+Z` pops the latest off the undo stack; `Cmd/Ctrl+Shift+Z` redoes.

- [ ] **Step 1: Add the stacks and a snapshot helper.** Two arrays: `undoStack`, `redoStack`. A `snapshot()` function calls `gm.features.getAll()` and `structuredClone`s it, pushes onto `undoStack`, clears `redoStack`. Cap `undoStack` length at 50.

- [ ] **Step 2: Subscribe to geoman events.** On `gm:create` / `gm:update` / `gm:remove` (names per T1 verification): call `snapshot()`.

- [ ] **Step 3: Add restore.** `restore(fc)` clears geoman's collection and re-adds the snapshot via the documented method (per T1).

- [ ] **Step 4: Wire keys.** `keydown` listener: if `(e.metaKey || e.ctrlKey) && e.key === 'z'` and `!e.shiftKey`, pop from `undoStack` → push current onto `redoStack` → `restore`. If shift+z, swap directions. `preventDefault()` on both.

- [ ] **Step 5: Wire Boolean Ops + Weld** to call `snapshot()` BEFORE mutating geoman.

- [ ] **Step 6: Manual + puppeteer smoke.** Draw → undo → confirm shape gone. Redo → confirm shape back. Take a screenshot.

- [ ] **Step 7: Commit:**

```bash
git add real-estate-platform/scripts/geo/editor/index.html
git commit -m "feat(geo-editor): undo/redo with Cmd+Z"
```

---

## Task T7: Weld Nearby Vertices tool

**Files:** `real-estate-platform/scripts/geo/editor/index.html`

Add a "Weld vertices" section: a threshold slider (1–50 m, default 10 m) and a button. Click → calls `weldNearbyVertices` from `geo-compute.ts` on the currently-selected polygon and replaces it in geoman.

- [ ] **Step 1: Add the panel HTML.** Slider + label + button.

- [ ] **Step 2: Handler.** Read `selected` (single polygon required; disable when not). Snapshot for undo, then replace the feature with the welded result via geoman's update API. Show "welded — N vertices removed" in the status line.

- [ ] **Step 3: Browser smoke.** With a known polygon of nearly-coincident vertices, run the handler and confirm the vertex count drops.

- [ ] **Step 4: Commit:**

```bash
git add real-estate-platform/scripts/geo/editor/index.html
git commit -m "feat(geo-editor): weld-nearby-vertices tool"
```

---

## Task T8: Save-time validation + keyboard shortcuts

**Files:** `real-estate-platform/scripts/geo/editor/index.html`

Gate save on: (a) `hasSelfIntersection` → false; (b) `findSiblingOverlap(candidate, allOtherCommunities, ownSlug)` → null; (c) `countPointsInside(listings, polygon) > 0`. Each failure shows a status line and refuses to POST. Also wire the full keyboard map.

- [ ] **Step 1: Replace the save handler.** Before POST, run the three validations using helpers from `geo-compute.ts`. On any failure: show a status line like `cannot save: self-intersection at … vertices`, `cannot save: overlaps "dc-ranch"`, `cannot save: no listings inside the polygon`. Do NOT submit.

- [ ] **Step 2: Keyboard shortcuts** — `keydown` listener:
  - `Escape` — call geoman cancel-draw (per T1).
  - `Enter` — call geoman finish-draw.
  - `Backspace` — geoman remove-last-vertex (if API exposes it; else best-effort).
  - `Delete` — geoman remove-selected.
  - `V` — switch to vertex/select tool.
  - `U` — Union (if 2 selected).
  - `C` — Cut (Subtract).
  - `S` — Subtract (alias of C).
  - `Cmd/Ctrl+Z` / `Cmd/Ctrl+Shift+Z` — already wired in T6.
  - `Shift` — geoman supports multi-select on Shift+click natively (no extra wiring).
  - `Space` — momentary snap toggle (T4).

  Where a shortcut can't be wired because the library's imperative API doesn't expose it, no-op gracefully and add a brief comment.

- [ ] **Step 3: Browser smoke.** Save a bowtie → expect rejection with a self-intersection message. Save a polygon overlapping an existing community → expect rejection with the sibling slug. Save a polygon with no listings inside → expect rejection. Save a valid polygon → expect ok.

- [ ] **Step 4: Commit:**

```bash
git add real-estate-platform/scripts/geo/editor/index.html
git commit -m "feat(geo-editor): save-time validation and keyboard shortcuts"
```

---

## Cross-cutting

- All commits authored by Joey Schnepel only; NO Co-Authored-By / Signed-off-by / AI/Claude/Anthropic attribution anywhere.
- Stage only the files listed per task. The working tree still has unrelated uncommitted changes from the user's other work — never `git add -A`/`.`.
- The editor is dev-only; `window.__map` / `window.__gm` debug hooks are acceptable to keep for introspection.
- v1's `server.ts` is unchanged. v1's `geo-compute.ts` exports remain backward-compatible (T2 only adds new exports).

## Self-Review notes (post-write)

- Spec coverage: every numbered scope item in `2026-05-31-community-editor-v2-design.md` maps to a task above (geoman swap → T1; snap → T4; click-to-edit + list → T3; Boolean Ops → T5; Undo/Redo → T6; weld → T7; validation + keyboard → T8). Pure helpers underpin T5/T7/T8 → T2.
- Library-version-sensitive integration points (geoman API) are isolated in T1 with explicit verification steps; downstream tasks read the result.
- One known follow-up not blocking: snap-source-for-listings may fall back to a custom px-distance handler if geoman's API doesn't accept external GeoJSON sources directly; documented in T4 Step 2.
