import type { LngLatBoundsLike } from 'maplibre-gl';
import type { Polygon, MultiPolygon } from 'geojson';

/**
 * Compute bounding box from a GeoJSON Polygon or MultiPolygon geometry.
 * Returns MapLibre-style bounds: [[minLng, minLat], [maxLng, maxLat]]
 * Note: GeoJSON coordinates are [lng, lat] — same as MapLibre.
 */
export function getGeometryBounds(geometry: Polygon | MultiPolygon): LngLatBoundsLike {
  const allCoords: number[][] = [];
  if (geometry.type === 'Polygon') {
    allCoords.push(...geometry.coordinates[0]);
  } else {
    for (const polygon of geometry.coordinates) {
      allCoords.push(...polygon[0]);
    }
  }
  const lngs = allCoords.map(c => c[0]);
  const lats = allCoords.map(c => c[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}
