/**
 * H3 Hexagonal Aggregation Utility
 * Converts raw HeatmapPoint[] from the database into HexCell[] for the heatmap.
 * Uses h3-js for geographic indexing.
 */

import { latLngToCell, cellToBoundary } from 'h3-js';
import type { HeatmapPoint, HexCell, HexCellMetrics } from '../types/analytics';

interface AggBucket {
  points: HeatmapPoint[];
  subdivisions: Set<string>;
  cities: Set<string>;
}

// Greater Phoenix metro bounding box — excludes outliers (Flagstaff, Prescott, etc.)
const PHOENIX_BOUNDS = {
  minLat: 33.0,
  maxLat: 33.95,
  minLng: -112.6,
  maxLng: -111.3,
};

// Outlier threshold — exclude vacant land / obvious data errors
const MIN_LIST_PRICE = 10000;

function isInPhoenixMetro(lat: number, lng: number): boolean {
  return (
    lat >= PHOENIX_BOUNDS.minLat &&
    lat <= PHOENIX_BOUNDS.maxLat &&
    lng >= PHOENIX_BOUNDS.minLng &&
    lng <= PHOENIX_BOUNDS.maxLng
  );
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Aggregate HeatmapPoint[] into HexCell[] at the given H3 resolution.
 * Filters to Greater Phoenix metro bounding box to exclude outliers.
 * @param points - Raw listing points from database
 * @param resolution - H3 resolution (7 = metro, 8 = neighborhood)
 * @returns HexCell[] ready for the H3Heatmap component
 */
export function aggregateToHexCells(
  points: HeatmapPoint[],
  resolution: number = 7,
): HexCell[] {
  const cellMap = new Map<string, AggBucket>();

  for (const pt of points) {
    if (!pt.latitude || !pt.longitude) continue;

    // Filter to Phoenix metro — exclude far-flung ARMLS listings
    if (!isInPhoenixMetro(pt.latitude, pt.longitude)) continue;

    // Exclude vacant lots / data errors (keeps stale-but-active listings for density)
    if (pt.listPrice < MIN_LIST_PRICE) continue;

    const h3Index = latLngToCell(pt.latitude, pt.longitude, resolution);

    let bucket = cellMap.get(h3Index);
    if (!bucket) {
      bucket = { points: [], subdivisions: new Set(), cities: new Set() };
      cellMap.set(h3Index, bucket);
    }
    bucket.points.push(pt);
    if (pt.subdivisionName) bucket.subdivisions.add(pt.subdivisionName);
    if (pt.city) bucket.cities.add(pt.city);
  }

  const cells: HexCell[] = [];

  for (const [h3Index, { points: pts, subdivisions, cities }] of cellMap) {
    const ppsfs = pts.filter(p => p.pricePerSqft != null).map(p => p.pricePerSqft!);
    const doms = pts.filter(p => p.daysOnMarket != null).map(p => p.daysOnMarket!);
    const prices = pts.map(p => p.closePrice ?? p.listPrice);
    const stls = pts.filter(p => p.saleToListPct != null).map(p => p.saleToListPct!);

    const metrics: HexCellMetrics = {
      ppsf: median(ppsfs),
      dom: avg(doms),
      density: pts.length,
      price: median(prices),
      saleToList: avg(stls),
    };

    const boundary = cellToBoundary(h3Index) as [number, number][];

    // neighborhoodName = subdivision names only; city is separate
    const subdivisionNames = [...subdivisions].slice(0, 3).join(', ');
    const primaryCity = [...cities][0] || 'Unknown';

    cells.push({
      h3Index,
      boundary,
      value: metrics.ppsf, // default metric
      metrics,
      count: pts.length,
      neighborhoodName: subdivisionNames || primaryCity,
      city: primaryCity,
    });
  }

  return cells;
}
