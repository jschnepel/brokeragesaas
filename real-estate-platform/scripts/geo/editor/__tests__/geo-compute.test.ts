// real-estate-platform/scripts/geo/editor/__tests__/geo-compute.test.ts
import { describe, it, expect } from 'vitest';
import type { Polygon } from 'geojson';
import { computeBoundaryRow, countPointsInside } from '../geo-compute';

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
