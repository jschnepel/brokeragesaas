"""
Phase A — clean the curated community polygon layer (systematic, all communities).

Input:  GEOJSON-luxury-communities.geojson (repo root) — marketing layer, has
        duplicates, parent/child nesting, Points mixed with Polygons.
Output: analytics/seeds/geo/community_boundaries.geojson — one clean Polygon/
        MultiPolygon per real community, with: slug, name, region_slug,
        area_sq_mi, parent_slug (NULL for top-level), rank.

Rules (uniform for every polygon, no per-community special cases):
  1. Keep only Polygon/MultiPolygon features with a slug. (Points are
     marker-only; they cannot do PIP — logged + dropped.)
  2. Reproject is N/A — source is already lon/lat (EPSG:4326); validate only.
  3. Fix invalid geoms with buffer(0).
  4. Pairwise overlap classification (SafeGraph rule), applied to ALL pairs:
       - mutual >=98%  -> DUPLICATE: keep larger-area, drop the other
       - A inside B >=80% (and not duplicate) -> A.parent = B (child)
       - else -> independent
  5. rank = 0 for top-level, 1 for child (drilldown shows top-level; smallest-
     area-wins tiebreak handles a point landing in both child+parent).
"""
from __future__ import annotations
import json, sys
from pathlib import Path

try:
    from shapely.geometry import shape, mapping
    from shapely.validation import make_valid
except ImportError:
    print("NEED shapely: pip install shapely", file=sys.stderr); raise

ROOT = Path(r"C:/Users/joeys/Desktop/RLSIR Websites")
SRC = ROOT / "GEOJSON-luxury-communities.geojson"
OUT_DIR = ROOT / "real-estate-platform/analytics/seeds/geo"
OUT = OUT_DIR / "community_boundaries.geojson"

DUP_THRESHOLD = 0.98   # mutual coverage -> duplicate
CHILD_THRESHOLD = 0.80 # A-inside-B coverage -> A is child of B

def area_sq_mi(geom_4326) -> float:
    # rough: deg^2 -> sq mi at AZ latitude (~33.5N). 1 deg lat ~69.0 mi,
    # 1 deg lon ~57.6 mi. Good enough for ranking/tiebreak (not display).
    return geom_4326.area * 69.0 * 57.6

# Region-outline polygons in the same GeoJSON carry no slug; map their display
# name -> a clean region slug. Community region_slug is assigned by centroid PIP
# into these (geometry-consistent coarse layer, same lat/long principle one
# level up). A community whose centroid is in no region outline stays NULL ->
# the dbt coarse fallback (city/zip) handles it.
REGION_NAME_TO_SLUG = {
    "North Scottsdale": "north-scottsdale",
    "Paradise Valley": "paradise-valley",
    "Cave Creek / Carefree": "carefree",
    "Fountain Hills / Rio Verde": "fountain-hills",
    "Central Scottsdale": "central-scottsdale",
    "Peoria / Vistancia": "peoria",
    "Phoenix / Arcadia / Biltmore": "arcadia",
    "Anthem / North Phoenix": "anthem",
    "Desert Mountain / Far North": "north-scottsdale",
}

def main():
    g = json.loads(SRC.read_text(encoding="utf-8"))
    feats = g["features"]
    polys = []   # (slug, name, region_slug, shapely_geom)
    region_outlines = []  # (region_slug, shapely_geom)
    dropped_points = []
    for f in feats:
        p = f.get("properties") or {}
        slug = p.get("slug")
        geom = f.get("geometry")
        gtype = (geom or {}).get("type")
        # Region-outline polygons: no slug, name matches the region map.
        if not slug and gtype in ("Polygon", "MultiPolygon"):
            rname = p.get("name")
            rslug = REGION_NAME_TO_SLUG.get(rname)
            if rslug:
                rg = shape(geom)
                if not rg.is_valid:
                    rg = make_valid(rg)
                region_outlines.append((rslug, rg))
            continue
        if not slug or gtype not in ("Polygon", "MultiPolygon"):
            if slug:
                dropped_points.append(slug)
            continue
        sg = shape(geom)
        if not sg.is_valid:
            sg = make_valid(sg)
        # make_valid can yield GeometryCollection; keep polygonal parts
        if sg.geom_type == "GeometryCollection":
            from shapely.geometry import MultiPolygon, Polygon
            parts = [x for x in sg.geoms if x.geom_type in ("Polygon", "MultiPolygon")]
            if not parts:
                continue
            sg = parts[0] if len(parts) == 1 else MultiPolygon(
                [x for part in parts for x in (part.geoms if part.geom_type=="MultiPolygon" else [part])]
            )
        region = p.get("regionSlug") or p.get("region_slug") or p.get("region")
        polys.append([slug, p.get("name") or slug, region, sg])

    n = len(polys)
    areas = [area_sq_mi(pp[3]) for pp in polys]

    # Assign region_slug per community: smallest region outline whose polygon
    # covers the community centroid (region outlines can overlap at edges;
    # smallest wins, same rule as community PIP). Overrides any source region.
    region_assigned = 0
    for pp in polys:
        if pp[2]:  # keep an existing source region if present
            continue
        cen = pp[3].representative_point()  # guaranteed inside the polygon
        best = None; best_area = None
        for rslug, rg in region_outlines:
            if rg.covers(cen):
                a = rg.area
                if best_area is None or a < best_area:
                    best, best_area = rslug, a
        if best:
            pp[2] = best; region_assigned += 1

    # Pairwise overlap (bbox prefilter then intersection area). O(n^2), n~110 -> fine.
    drop = set()
    parent = {}   # child_idx -> parent_idx
    dup_pairs, child_pairs = [], []
    for i in range(n):
        if i in drop: continue
        gi = polys[i][3]; ai = areas[i]
        bi = gi.bounds
        for j in range(i+1, n):
            if j in drop: continue
            gj = polys[j][3]; aj = areas[j]
            bj = gj.bounds
            # bbox prefilter
            if bi[2] < bj[0] or bj[2] < bi[0] or bi[3] < bj[1] or bj[3] < bi[1]:
                continue
            if not gi.intersects(gj): continue
            inter = gi.intersection(gj).area
            if inter <= 0: continue
            cov_i = inter / gi.area   # fraction of i covered by j
            cov_j = inter / gj.area   # fraction of j covered by i
            if cov_i >= DUP_THRESHOLD and cov_j >= DUP_THRESHOLD:
                # duplicate: drop smaller area (keep i if larger)
                loser = j if ai >= aj else i
                drop.add(loser)
                dup_pairs.append((polys[i][0], polys[j][0], f"drop {polys[loser][0]}"))
                if loser == i: break  # i gone, stop its inner loop
            elif cov_j >= CHILD_THRESHOLD:
                # j mostly inside i -> j child of i
                parent[j] = i; child_pairs.append((polys[j][0], polys[i][0]))
            elif cov_i >= CHILD_THRESHOLD:
                parent[i] = j; child_pairs.append((polys[i][0], polys[j][0]))

    out_feats = []
    for idx, (slug, name, region, sg) in enumerate(polys):
        if idx in drop: continue
        pidx = parent.get(idx)
        parent_slug = polys[pidx][0] if pidx is not None and pidx not in drop else None
        out_feats.append({
            "type": "Feature",
            "properties": {
                "slug": slug, "name": name, "region_slug": region,
                "area_sq_mi": round(areas[idx], 4),
                "parent_slug": parent_slug,
                "rank": 1 if parent_slug else 0,
            },
            "geometry": mapping(sg),
        })

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"type": "FeatureCollection", "features": out_feats}), encoding="utf-8")

    print(f"input polygon features: {n}")
    print(f"region outlines found: {len(region_outlines)}; communities region-assigned: {region_assigned}")
    print(f"dropped Point-only features: {len(dropped_points)}")
    print(f"duplicates removed: {len(dup_pairs)}")
    for a,b,act in dup_pairs: print(f"   DUP {a} ~= {b} -> {act}")
    print(f"child->parent links: {len(child_pairs)}")
    for c,pp in child_pairs: print(f"   CHILD {c} -> {pp}")
    top = [f for f in out_feats if not f['properties']['parent_slug']]
    print(f"output features: {len(out_feats)}  (top-level: {len(top)}, children: {len(out_feats)-len(top)})")
    print(f"boulders present: {[f['properties']['slug'] for f in out_feats if 'boulder' in f['properties']['slug']]}")

if __name__ == "__main__":
    main()
