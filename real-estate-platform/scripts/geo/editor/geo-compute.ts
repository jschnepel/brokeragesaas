// real-estate-platform/scripts/geo/editor/geo-compute.ts
import area from '@turf/area';
import centroid from '@turf/centroid';
import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point as turfPoint } from '@turf/helpers';
import type { Polygon, MultiPolygon, Feature } from 'geojson';

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
  if (geom.type === 'Polygon') {
    return geom.coordinates.reduce((sum, ring) => sum + ring.length, 0);
  }
  return geom.coordinates.reduce(
    (sum, poly) => sum + poly.reduce((s, ring) => s + ring.length, 0),
    0,
  );
}

export function computeBoundaryRow(geom: Polygon | MultiPolygon): BoundaryRow {
  const feature: Feature<Polygon | MultiPolygon> = { type: 'Feature', properties: {}, geometry: geom };
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

export function countPointsInside(points: LngLat[], geom: Polygon | MultiPolygon): number {
  let n = 0;
  for (const p of points) {
    if (booleanPointInPolygon(turfPoint([p.lng, p.lat]), geom)) n += 1;
  }
  return n;
}
