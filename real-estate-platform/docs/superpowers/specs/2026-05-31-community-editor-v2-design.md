# Community Boundary Editor v2 — Design

**Date:** 2026-05-31
**Status:** Design — approved, proceeding to plan
**Builds on:** `2026-05-29-community-pip-assignment-and-geojson-editor-design.md` (v1)

---

## Problem

The v1 editor (`real-estate-platform/scripts/geo/editor/`) is functional but minimal: terra-draw via `@watergis/maplibre-gl-terradraw` gives basic polygon draw / select / delete, listing-dot overlay, and a save round-trip. It does not support the operations the operator actually needs while curating community polygons over a metro of ~50K listings:

- **Merging shapes** (a community made of two non-contiguous parcels → one polygon).
- **Subtract/cut** (a sub-community sitting inside a larger one needs to be carved out).
- **Snap to listing dots** — boundaries are _defined_ by which listings they capture; vertices should snap to specific listings.
- **Snap to neighbor edges** — adjacent community boundaries must share exact edges, else gaps/overlaps break the smallest-polygon tiebreaker.
- **Vertex weld** — clean up nearly-coincident vertices after a union.
- **Click-to-edit existing community** — currently the editor only draws new shapes; once `geo_boundaries` repopulates, the bulk of work is _editing_ existing polygons.
- **Undo/Redo** — there is none. Every misclick is permanent.
- **Validation at save** — self-intersection or sibling-overlap should block save with a clear reason.
- **Per-community side panel** — clicking a row should fly to and select that polygon; needed once we have dozens.

## Goals

- Make the editor genuinely fast to work in for a single operator drawing/refining ~50–150 community polygons over time.
- Bake in geometry hygiene (snap, validation) so polygons feed the PIP pipeline cleanly.
- Stay a local dev tool — no auth, no multi-user, no deploy.

## Non-Goals (YAGNI for v2)

- Mismatch-flag overlay (listings whose subdivision text disagrees with their polygon).
- Curve/Bezier/Arc primitives (ArcGIS Pro pattern; not needed for community boundaries).
- Buffer tool, import/export panel, ghost overlay, search — Tier-3 niceties, can come later.
- Collaboration / persistence beyond `geo_boundaries`.

## Research-backed decision

Research over leaflet-geoman / maplibre-geoman, nebula.gl, mapshaper, ArcGIS Pro, iD/OSM (see PR #1's research notes) lands cleanly on:

**Switch the draw library from `@watergis/maplibre-gl-terradraw` to `maplibre-geoman` (`@geoman-io/maplibre-geoman-free`).** Same MapLibre map, drop-in plugin, but it ships exactly what's missing: union, difference, cut/split, rotate, scale, drag, vertex + edge + midpoint snap, and feature-source snap targets. Geoman is the most direct upgrade path for our current stack. Nebula.gl is more powerful but requires a deck.gl rendering stack swap. Mapshaper is excellent for batch dissolve/simplify and we'll port its `snap` semantics into a "Weld nearby vertices" tool, but not swap to it.

## Scope (the smallest set that materially changes the experience)

1. **Swap to maplibre-geoman.** Replace the `MaplibreTerradrawControl` mount and the `currentPolygon()` reader with geoman's draw control and feature-collection reader.
2. **Snap configuration.** Enable vertex + edge + midpoint snap with ~12px radius; add the `listings` GeoJSON source as a snap target so polygon vertices snap to listing dots.
3. **Click-to-edit existing.** On page load, fetch all communities via `/api/boundaries`, render them into geoman's editable layer; clicking one selects it for vertex editing.
4. **Side-panel community list.** Render rows for each community: name, area (sq mi), inside-count, with click-to-fly-and-select and hover-to-highlight on the map.
5. **Boolean Ops panel.** Multi-select two shapes (Shift+click), expose Union / Subtract / Intersect buttons (turf as the actual implementation; geoman's modes also acceptable). On Union: also remove the originals and replace with the result.
6. **Undo / Redo** stack with `Cmd+Z` / `Cmd+Shift+Z`. Snapshot the geoman feature collection on every committed change.
7. **Weld nearby vertices** tool: button + threshold slider (1–50 m). Implements Mapshaper's `snap` semantics on the selected polygon — coalesces vertices within the threshold.
8. **Save-time validation.** Block save with a clear panel message if: self-intersection, sibling-overlap with another community (we do allow region overlap), or `count_inside === 0` (likely a misplaced boundary).
9. **Keyboard shortcuts.** `Esc` cancel; `Enter` finish; `Backspace` remove last vertex; `Delete` remove selected vertex/shape; `V` vertex tool; `U` union; `C` cut; `S` subtract; `Cmd/Ctrl+Z` undo; `Cmd/Ctrl+Shift+Z` redo; hold `Shift` to multi-select; hold `Space` for momentary snap toggle.

## Architecture

Same shape as v1 — three files, two of which we extend:

- `geo-compute.ts` — gains pure helpers: `unionPolygons`, `differencePolygons`, `intersectPolygons`, `hasSelfIntersection`, `findSiblingOverlap`, `weldNearbyVertices`. All TDD-tested.
- `server.ts` — unchanged behavior for v2 (no new endpoints needed; click-to-edit uses the existing `GET /api/boundaries`).
- `index.html` — substantial rewrite of the client module: swap control, mount snap config, load editable existing shapes, side-panel list, Boolean Ops panel, Undo/Redo, weld, validation, keyboard map.

## Risks / open questions

- **maplibre-geoman version-sensitivity.** Like v1, the exact package name (`@geoman-io/maplibre-geoman-free` vs paid `@geoman-io/maplibre-geoman`), constructor API, snap config keys, and union/difference invocation pattern need verification at implementation time against the pinned version. Plan includes a verification step.
- **Snap-to-features-from-other-sources.** Geoman supports snap targets but the API for adding an external GeoJSON source as a snap target may require a custom helper. Fallback: implement vertex snap-to-listings manually via `mousemove` → `nearest listing dot within 12px` → adjust pending vertex.
- **Editable-layer interop with multi-source data.** Loading all existing communities into geoman's editable layer at once must not slow the map; with v1's current ~0–50 polygons it's fine; future scale could need clustering. Out of scope for v2.
- **Boolean op semantics with the smallest-area tiebreaker.** Union of two siblings effectively replaces both with one polygon — confirm the operator's intent before destructive ops (button → confirm).

## Success criteria

- Operator can: load Troon, click to edit, drag a vertex with snap, weld near-duplicate vertices, save with validation. Time-to-correct-an-existing-shape under ~30 seconds.
- Operator can: draw a non-contiguous community as two polygons, multi-select, Union → one polygon. Save round-trips cleanly.
- All pure helpers TDD-covered; the swap doesn't regress the v1 save round-trip (validated end-to-end in a browser via Puppeteer plus a direct POST smoke test).
