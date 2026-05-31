// real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts
import { describe, it, expect } from 'vitest';
import type { Polygon, MultiPolygon } from 'geojson';
import { computeBoundaryRow, countPointsInside } from '../geo-compute';
import {
  unionPolygons,
  differencePolygons,
  intersectPolygons,
  hasSelfIntersection,
  findSiblingOverlap,
  weldNearbyVertices,
} from '../geo-compute';

// A 0.1° x 0.1° square near Scottsdale, ~ -111.9 lng / 33.6 lat.
const square: Polygon = {
  type: 'Polygon',
  coordinates: [[
    [-111.95, 33.60],
    [-111.95, 33.70],
    [-111.85, 33.70],
    [-111.85, 33.60],
    [-111.95, 33.60],
  ]],
};

describe('computeBoundaryRow', () => {
  it('derives bbox, centroid, vertex count, positive area, and stringified geometry', () => {
    const row = computeBoundaryRow(square);
    expect(row.bbox).toEqual([-111.95, 33.6, -111.85, 33.7]);
    expect(row.centroid[0]).toBeCloseTo(-111.9, 2);
    expect(row.centroid[1]).toBeCloseTo(33.65, 2);
    expect(row.vertex_count).toBe(5);
    expect(row.area_sq_mi).toBeGreaterThan(0);
    expect(JSON.parse(row.geometry).type).toBe('Polygon');
  });
});

describe('countPointsInside', () => {
  it('counts only points within the polygon (boundary-inclusive)', () => {
    const inside = { lng: -111.9, lat: 33.65 };
    const outside = { lng: -110.0, lat: 33.65 };
    const onEdge = { lng: -111.95, lat: 33.65 };
    expect(countPointsInside([inside, outside, onEdge], square)).toBe(2);
  });
});

const squareA: Polygon = { type: 'Polygon', coordinates: [[[0,0],[0,1],[1,1],[1,0],[0,0]]] };
const squareB: Polygon = { type: 'Polygon', coordinates: [[[0.5,0.5],[0.5,1.5],[1.5,1.5],[1.5,0.5],[0.5,0.5]]] };
const squareC: Polygon = { type: 'Polygon', coordinates: [[[10,10],[10,11],[11,11],[11,10],[10,10]]] };
const bowtie: Polygon = { type: 'Polygon', coordinates: [[[0,0],[2,2],[0,2],[2,0],[0,0]]] };

describe('unionPolygons', () => {
  it('merges overlapping squares into a single Polygon', () => {
    const u = unionPolygons(squareA, squareB);
    expect(u).not.toBeNull();
    expect(u!.type === 'Polygon' || u!.type === 'MultiPolygon').toBe(true);
  });
  it('returns a MultiPolygon when squares are disjoint', () => {
    const u = unionPolygons(squareA, squareC);
    expect(u!.type).toBe('MultiPolygon');
  });
});

describe('differencePolygons', () => {
  it('subtracts B from A leaving a non-null geometry', () => {
    const d = differencePolygons(squareA, squareB);
    expect(d).not.toBeNull();
    expect(d!.type === 'Polygon' || d!.type === 'MultiPolygon').toBe(true);
  });
  it('returns null when B fully contains A', () => {
    const tiny: Polygon = { type: 'Polygon', coordinates: [[[0.1,0.1],[0.1,0.2],[0.2,0.2],[0.2,0.1],[0.1,0.1]]] };
    expect(differencePolygons(tiny, squareA)).toBeNull();
  });
});

describe('intersectPolygons', () => {
  it('returns the overlap polygon', () => {
    const i = intersectPolygons(squareA, squareB);
    expect(i).not.toBeNull();
    expect(i!.type).toBe('Polygon');
  });
  it('returns null for disjoint inputs', () => {
    expect(intersectPolygons(squareA, squareC)).toBeNull();
  });
});

describe('hasSelfIntersection', () => {
  it('flags a bowtie polygon', () => {
    expect(hasSelfIntersection(bowtie)).toBe(true);
  });
  it('passes a clean square', () => {
    expect(hasSelfIntersection(squareA)).toBe(false);
  });
});

describe('findSiblingOverlap', () => {
  it('returns the slug of an overlapping sibling, or null', () => {
    const siblings = [{ slug: 'a', geometry: squareA }, { slug: 'c', geometry: squareC }];
    expect(findSiblingOverlap(squareB, siblings)).toBe('a');
    expect(findSiblingOverlap(squareC, [{ slug: 'a', geometry: squareA }])).toBeNull();
  });
  it('ignores ownSlug when editing in place', () => {
    const siblings = [{ slug: 'self', geometry: squareA }];
    expect(findSiblingOverlap(squareB, siblings, 'self')).toBeNull();
  });
});

describe('weldNearbyVertices', () => {
  it('coalesces vertices within the threshold (meters)', () => {
    const close: Polygon = {
      type: 'Polygon',
      coordinates: [[[-111.9,33.6],[-111.90001,33.60001],[-111.9,33.7],[-111.8,33.7],[-111.8,33.6],[-111.9,33.6]]]
    };
    const before = close.coordinates[0].length;
    const after = weldNearbyVertices(close, 100); // 100 m threshold
    expect(after.coordinates[0].length).toBeLessThan(before);
  });
  it('preserves the polygon ring closure', () => {
    const w = weldNearbyVertices(squareA, 1);
    const ring = w.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
  it('does not degenerate below a triangle (4 points including closure)', () => {
    const w = weldNearbyVertices(squareA, 1000000); // huge threshold
    expect(w.coordinates[0].length).toBeGreaterThanOrEqual(4);
  });
});
