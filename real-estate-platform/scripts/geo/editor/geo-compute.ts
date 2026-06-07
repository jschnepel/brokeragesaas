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
  const centroidGeom = centroid(feature).geometry;
  if (!centroidGeom) {
    throw new Error('Failed to compute centroid for geometry');
  }
  const c = centroidGeom.coordinates;
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

// ─── v2: Boolean ops, validation, weld ───────────────────────────────────────

import union from '@turf/union';
import difference from '@turf/difference';
import intersect from '@turf/intersect';
import kinks from '@turf/kinks';
import booleanIntersects from '@turf/boolean-intersects';
import distance from '@turf/distance';
import { featureCollection } from '@turf/helpers';

type AnyPolygon = Polygon | MultiPolygon;

function asFeature(geom: AnyPolygon) {
  return { type: 'Feature' as const, properties: {}, geometry: geom };
}

export function unionPolygons(a: AnyPolygon, b: AnyPolygon): AnyPolygon | null {
  const result = union(featureCollection([asFeature(a), asFeature(b)]));
  return result ? (result.geometry as AnyPolygon) : null;
}

export function differencePolygons(a: AnyPolygon, b: AnyPolygon): AnyPolygon | null {
  const result = difference(featureCollection([asFeature(a), asFeature(b)]));
  return result ? (result.geometry as AnyPolygon) : null;
}

export function intersectPolygons(a: AnyPolygon, b: AnyPolygon): AnyPolygon | null {
  const result = intersect(featureCollection([asFeature(a), asFeature(b)]));
  return result ? (result.geometry as AnyPolygon) : null;
}

export function hasSelfIntersection(geom: AnyPolygon): boolean {
  return kinks(asFeature(geom)).features.length > 0;
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
    if (ownSlug !== undefined && s.slug === ownSlug) continue;
    if (booleanIntersects(asFeature(candidate), asFeature(s.geometry))) return s.slug;
  }
  return null;
}

export function weldNearbyVertices(geom: Polygon, thresholdMeters: number): Polygon {
  const km = thresholdMeters / 1000;
  const MIN_RING_LEN = 4; // triangle + closure
  const weldRing = (ring: number[][]): number[][] => {
    if (ring.length < MIN_RING_LEN) return ring;
    const keep: number[][] = [ring[0]];
    for (let i = 1; i < ring.length - 1; i++) {
      const prev = keep[keep.length - 1];
      const d = distance(prev, ring[i], { units: 'kilometers' });
      if (d > km) keep.push(ring[i]);
    }
    keep.push(keep[0]); // explicit ring closure
    return keep.length >= MIN_RING_LEN ? keep : ring;
  };
  return { type: 'Polygon', coordinates: geom.coordinates.map(weldRing) };
}
