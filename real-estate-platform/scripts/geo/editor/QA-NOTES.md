# Community Polygon QA Notes (Phase D — data-quality standard)

> Read this before drawing or editing a community boundary. These are the
> data-quality gates the analytics pipeline depends on. A polygon that passes
> here produces correct point-in-polygon (PIP) sales counts; a sloppy one
> silently over/under-counts a community.
>
> Basis: `docs/superpowers/plans/2026-06-01-geospatial-analytics-best-practices-research.md`
> and the Boulders test case (2026-06-01) that exposed every failure mode below.
> Pipeline that consumes these shapes: `analytics/models/staging/geo/stg_geo__community_boundaries.sql`
> → `analytics/macros/pip_join_cte.sql` → `int_listings_geographic_enriched`.

---

## 0. The one rule

**A listing belongs to the community whose polygon geometrically contains its
lat/long — never the subdivision name the agent typed.** The polygon IS the
definition. If the polygon is wrong, the community number is wrong, no matter
how good the name data is. Draw the boundary to match how the _market_ defines
the community, then let PIP do the attribution.

---

## 1. Boundary accuracy — the over-cover / under-cover trap

This is the #1 failure mode. The Boulders polygon counted **15** sales when
the true number was **~13** because its eastern edge bulged out and swallowed
**Sierra Boulders** (a separate subdivision ~1.2 mi east at lon −111.8958,
while real Boulders sales sit −111.90 to −111.92).

When you draw/edit:

- **Trace the actual community edge**, not a loose bounding box. Every extra
  acre of polygon can pull in a neighbor's sale.
- **Use the live listing dots + the inside-count panel.** After drawing, scan
  the dots near the boundary: does each one actually belong to this community?
  A dot whose `subdivision_name` clearly names a _different_ community = your
  edge is too wide. Pull it in.
- **Cross-check the count against an authority** (FlexMLS / ARMLS community
  search) for a known window. If PIP says 15 and FlexMLS says 13, the polygon
  is over-covering — find the 2 stray dots and tighten toward them.
- **Under-covering** is just as wrong: if a cul-de-sac that's clearly part of
  the community sits outside your line, its sales vanish. Extend to include it.
- **Golf/resort communities are non-convex** (fairways, carve-outs). Trace the
  real footprint; don't fill the gaps with one big blob, or you eat the
  parcels between holes that belong to other subdivisions.

**Gate:** every boundary dot's subdivision name is plausibly this community,
AND the inside-count is within a few % of the authoritative count for a test
window. If not, fix the edge before saving.

---

## 2. No duplicate polygons

Two polygons for the same physical place = double-counted sales and a broken
smallest-area tiebreak (equal areas → nondeterministic assignment). The clean
build (`scripts/geo/build_clean_communities.py`) removed 8 exact duplicates
(Trilogy ×2, the 3 Desert Mountain shapes, Gainey Ranch + Gainey Ranch Lakes,
etc.). Don't reintroduce them.

- **Before drawing a "new" community, search the side-panel list.** If a shape
  already covers that ground under any name, EDIT it — do not draw a second.
- The editor's **sibling-overlap check** flags this on save (`findSiblingOverlap`).
  If it fires, you're overlapping an existing community — resolve it (see §3),
  don't dismiss it.
- Two names for one place (e.g. "Trilogy at Vistancia" = "Trilogy Golf Club at
  Vistancia") → keep ONE polygon, pick the canonical slug, delete the other.

**Gate:** no two saved polygons mutually overlap >95%. Sibling-overlap warning
on save must be understood and resolved, never ignored.

---

## 3. Overlap & parent/child hierarchy (the legitimate nesting case)

Some overlap is real: a sub-community sits _inside_ a larger community
(ICON-at-Silverleaf ⊂ Silverleaf; Candlewood Estates ⊂ Troon North; Troon
Mountain Estates ⊂ Troon Village). This is allowed, but must be modeled
explicitly so a sale rolls up correctly.

- **Industry rule (SafeGraph):** if the larger polygon contains ≥80% of the
  smaller, the larger is the **parent**. The smaller carries `parent_slug` =
  the larger's slug.
- **PIP behavior:** a point inside both is assigned to the **smallest covering
  polygon** (the child), then the macro rolls it up to `parent_slug` so the
  community drilldown shows the top-level community. A point inside only the
  parent stays the parent.
- **In the editor:** when you draw a sub-area inside an existing community, set
  its `parent_slug` to the enclosing community. Leave `parent_slug` NULL for a
  top-level community.
- **Decision you must make per nested pair:** does this sub-area deserve its own
  drilldown entry, or should it just fold into the parent? If it's not a name
  buyers search, give it `parent_slug` and `rank=1` (hidden from the top-level
  dropdown, still rolls up). If it's a marketed community in its own right,
  keep it top-level (`rank=0`) AND set `parent_slug` so its sales also count
  toward the parent total — decide whether double-presence is intended.

**Gate:** every polygon that sits ≥80% inside another has `parent_slug` set.
No silent partial overlaps between two top-level communities (that splits a
sale's neighborhood ambiguously — redraw the shared edge so they tile cleanly).

---

## 4. Metadata every polygon must carry

The pipeline reads these fields off each feature. Missing/garbage values break
attribution or the drilldown.

| Field         | Rule                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `slug`        | kebab-case, unique, stable. This is the join key — never reuse or rename casually (downstream marts + URLs depend on it).          |
| `name`        | Title-Case display name. NOT all-caps ARMLS text. The editor auto-suggests from the dominant inside subdivision — sanity-check it. |
| `region_slug` | the parent region (north-scottsdale, peoria, …). Needed for region rollups; NULL here forces the coarse fallback.                  |
| `parent_slug` | NULL for top-level; the enclosing community's slug for a sub-area (see §3).                                                        |
| `rank`        | 0 = top-level (shown in drilldown), 1 = child (hidden, rolls up).                                                                  |
| `area_sq_mi`  | recomputed server-side from geometry — used for the smallest-area tiebreak. Don't hand-edit.                                       |

**Gate:** slug unique + stable, name Title-Case, region_slug set, parent_slug
correct, rank consistent with parent_slug.

---

## 5. Geometry validity & hygiene

- **EPSG:4326 (lon/lat) always.** ARMLS lat/long is WGS84; the polygons must
  match or PIP silently misses. The editor draws in 4326 — don't import shapes
  in State Plane / NAD83 without reprojecting first.
- **No self-intersections.** The editor's `hasSelfIntersection` (turf `kinks`)
  flags bow-ties; fix before saving — `ST_Covers` behaves unpredictably on
  invalid geometry.
- **Close every ring** (first point = last point). The weld tool
  (`weldNearbyVertices`) cleans near-duplicate vertices from messy traces.
- **Keep vertex count reasonable.** Over-dense traces slow PIP and add no
  accuracy; simplify. Under-dense (a 4-point box) over-covers — see §1.
- **MultiPolygon is fine** for genuinely disjoint parts of one community; don't
  use it to staple two different communities together.

**Gate:** valid geometry (no kinks), closed rings, 4326, sensible vertex count.

---

## 6. Boundary points (the edge-case that silently double/drops)

The pipeline uses **`ST_Covers`** (boundary-inclusive: a point exactly on an
edge counts as inside). This is deliberate — `ST_Contains` would _drop_ edge
points, `ST_Intersects` would _double-count_ them. Consequence for you:

- **Don't let two polygons share an exact edge a listing can sit on**, or that
  listing covers into both and the smallest-area tiebreak decides — which may
  not be what you intend. Tile communities with a clean shared border and let
  the area tiebreak resolve, OR leave a hair gap only if a sale can't land
  there.

---

## 7. Post-edit verification loop (do this every save)

1. **Inside-count panel** — does the number match your expectation / FlexMLS?
2. **Boundary dot scan** — every dot near the edge belongs here?
3. **Sibling-overlap warning** — none, or explained by a parent/child §3?
4. **Validation warning** — no self-intersection?
5. **Metadata** — slug/name/region/parent/rank all correct (§4)?
6. After a batch of edits, **rerun the analytics check** locally and compare
   to authority for 2-3 anchor communities (Boulders ≈13, Desert Mountain,
   Grayhawk) before publishing — see `analytics/tests/` (Phase-D gates):
   - community-count within sane bounds (50–200, not 20K)
   - per-community PIP count vs FlexMLS anchor spot-checks
   - PIP community consistent with listing city/postal (geocode/stray guard)
   - every closing gets a region (coarse fallback holds)

---

## 8. What "done" looks like for a community

A community polygon is correct when:

- its PIP sales count matches the authoritative source for a test window,
- every boundary listing genuinely belongs to it,
- it doesn't duplicate or ambiguously overlap a sibling,
- nested sub-areas carry `parent_slug`,
- metadata is clean and the slug is stable,
- geometry is valid 4326.

When in doubt, **tighten** — an over-covered community pollutes its neighbor's
numbers too, so a loose edge is two communities wrong, not one.
