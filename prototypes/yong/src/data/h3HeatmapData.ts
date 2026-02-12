/**
 * H3 Hexagonal Heatmap Data Layer
 * Pure data: synthetic point generation, H3 hex aggregation, color scale utilities.
 * Zero React dependencies.
 */

import { latLngToCell, cellToBoundary } from 'h3-js';
import { NEIGHBORHOODS } from './neighborhoods';
import type { Neighborhood } from './neighborhoods';

// ── Types ────────────────────────────────────────────────

export type HeatmapMetricId =
  | 'ppsf' | 'dom' | 'density' | 'price'
  | 'appreciation' | 'saleToList' | 'cashBuyer';

export type ColorScaleType = 'sequential' | 'diverging';

export interface HeatmapMetricDef {
  id: HeatmapMetricId;
  label: string;
  unit: string;
  isVow: boolean;
  colorScale: ColorScaleType;
  format: (v: number) => string;
}

export interface HexCellMetrics {
  ppsf: number;
  dom: number;
  density: number;
  price: number;
  appreciation: number;
  saleToList: number;
  cashBuyer: number;
}

export interface HexCell {
  h3Index: string;
  boundary: [number, number][]; // [lat, lng] pairs
  value: number;
  metrics: HexCellMetrics;
  count: number;
  neighborhoodName: string;
}

interface SyntheticPoint {
  lat: number;
  lng: number;
  ppsf: number;
  dom: number;
  price: number;
  appreciation: number;
  saleToList: number;
  cashBuyer: number;
  neighborhoodName: string;
}

// ── Metric Definitions ──────────────────────────────────

export const METRIC_DEFS: HeatmapMetricDef[] = [
  { id: 'ppsf',         label: 'Price per SqFt',  unit: '$/sqft', isVow: false, colorScale: 'sequential', format: v => `$${Math.round(v)}` },
  { id: 'dom',          label: 'Days on Market',   unit: 'days',   isVow: false, colorScale: 'diverging',  format: v => `${Math.round(v)}d` },
  { id: 'density',      label: 'Listing Density',  unit: 'listings', isVow: false, colorScale: 'sequential', format: v => `${Math.round(v)}` },
  { id: 'price',        label: 'Median Price',     unit: '',       isVow: false, colorScale: 'sequential', format: v => `$${(v / 1000).toFixed(0)}K` },
  { id: 'appreciation', label: 'Appreciation',     unit: '%',      isVow: true,  colorScale: 'diverging',  format: v => `${v.toFixed(1)}%` },
  { id: 'saleToList',   label: 'Sale-to-List',     unit: '%',      isVow: true,  colorScale: 'diverging',  format: v => `${v.toFixed(1)}%` },
  { id: 'cashBuyer',    label: 'Cash Buyers',      unit: '%',      isVow: true,  colorScale: 'sequential', format: v => `${Math.round(v)}%` },
];

export function getMetricDef(id: HeatmapMetricId): HeatmapMetricDef {
  return METRIC_DEFS.find(m => m.id === id)!;
}

// ── Seeded PRNG (deterministic) ─────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Box-Muller transform for Gaussian jitter
function gaussianPair(rand: () => number): [number, number] {
  const u1 = rand();
  const u2 = rand();
  const r = Math.sqrt(-2 * Math.log(u1 || 0.0001));
  return [r * Math.cos(2 * Math.PI * u2), r * Math.sin(2 * Math.PI * u2)];
}

// ── Parse helpers ───────────────────────────────────────

function parseCurrency(s: string): number {
  return parseFloat(s.replace(/[$,KM]/gi, '')) * (s.includes('M') ? 1_000_000 : s.includes('K') ? 1_000 : 1);
}

function parseTrend(s: string): number {
  return parseFloat(s.replace(/[+%]/g, ''));
}

// ── Synthetic Point Generation ──────────────────────────

function generatePointsForNeighborhood(
  n: Neighborhood,
  sigma: number,
  rand: () => number,
): SyntheticPoint[] {
  const count = Math.max(5, Math.ceil(n.stats.inventory / 3));
  const [baseLat, baseLng] = n.coordinates;
  const lngScale = Math.cos((baseLat * Math.PI) / 180);

  const basePpsf = parseCurrency(n.stats.avgPpsf);
  const basePrice = parseCurrency(n.stats.avgPrice);
  const baseTrend = parseTrend(n.stats.trend);
  // Derive saleToList from DOM (faster = higher ratio)
  const baseSaleToList = 100 - (n.stats.avgDom - 30) * 0.15;
  // Derive cashBuyer from price (higher price = more cash)
  const baseCash = Math.min(65, 20 + (basePrice / 1_000_000) * 8);

  const points: SyntheticPoint[] = [];
  for (let i = 0; i < count; i++) {
    const [g1, g2] = gaussianPair(rand);
    const lat = baseLat + g1 * sigma;
    const lng = baseLng + g2 * sigma / lngScale;
    const variation = 0.9 + rand() * 0.2; // ±10%

    points.push({
      lat,
      lng,
      ppsf: basePpsf * variation,
      dom: n.stats.avgDom * variation,
      price: basePrice * variation,
      appreciation: baseTrend * variation,
      saleToList: baseSaleToList * (0.98 + rand() * 0.04),
      cashBuyer: baseCash * variation,
      neighborhoodName: n.name,
    });
  }
  return points;
}

// ── H3 Aggregation ──────────────────────────────────────

export function generateHexCells(
  neighborhoods: Neighborhood[],
  resolution: number,
  metric: HeatmapMetricId,
): HexCell[] {
  const sigma = resolution >= 8 ? 0.008 : 0.015;
  const rand = seededRandom(42 + resolution);

  // Generate all synthetic points
  const allPoints: SyntheticPoint[] = [];
  for (const n of neighborhoods) {
    allPoints.push(...generatePointsForNeighborhood(n, sigma, rand));
  }

  // Group by H3 cell — store all metric values per point
  const cellMap = new Map<string, { points: SyntheticPoint[]; names: string[] }>();

  for (const pt of allPoints) {
    const h3Index = latLngToCell(pt.lat, pt.lng, resolution);

    if (!cellMap.has(h3Index)) {
      cellMap.set(h3Index, { points: [], names: [] });
    }
    const entry = cellMap.get(h3Index)!;
    entry.points.push(pt);
    if (!entry.names.includes(pt.neighborhoodName)) {
      entry.names.push(pt.neighborhoodName);
    }
  }

  // Aggregate to HexCell[]
  const cells: HexCell[] = [];
  for (const [h3Index, { points, names }] of cellMap) {
    const n = points.length;
    const avg = (fn: (p: SyntheticPoint) => number) =>
      points.reduce((sum, p) => sum + fn(p), 0) / n;

    const allMetrics: HexCellMetrics = {
      ppsf: avg(p => p.ppsf),
      dom: avg(p => p.dom),
      density: n,
      price: avg(p => p.price),
      appreciation: avg(p => p.appreciation),
      saleToList: avg(p => p.saleToList),
      cashBuyer: avg(p => p.cashBuyer),
    };

    const aggValue = metric === 'density' ? n : allMetrics[metric];

    // cellToBoundary returns [lat, lng][] pairs
    const boundary = cellToBoundary(h3Index) as [number, number][];

    cells.push({
      h3Index,
      boundary,
      value: aggValue,
      metrics: allMetrics,
      count: n,
      neighborhoodName: names.join(', '),
    });
  }

  return cells;
}

// ── Color Scale Utilities ───────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

// SIR brand gradient: white → SIR Blue
// Light hexes glow on dark tiles, deep navy marks high-value areas
const SIR_SCALE = [
  hexToRgb('#F0F4F8'), // near-white with blue cast (low)
  hexToRgb('#5B8DB8'), // slate blue (mid)
  hexToRgb('#002349'), // SIR Blue / Pantone 289 (high)
];

const SEQ_STOPS = SIR_SCALE;
const DIV_STOPS = SIR_SCALE;

function interpolateStops(
  stops: [number, number, number][],
  t: number,
): string {
  const clamped = Math.max(0, Math.min(1, t));
  const segCount = stops.length - 1;
  const seg = Math.min(Math.floor(clamped * segCount), segCount - 1);
  const localT = clamped * segCount - seg;

  const [r1, g1, b1] = stops[seg];
  const [r2, g2, b2] = stops[seg + 1];
  return rgbToHex(lerp(r1, r2, localT), lerp(g1, g2, localT), lerp(b1, b2, localT));
}

export function getColor(
  value: number,
  min: number,
  max: number,
  scaleType: ColorScaleType,
): string {
  const range = max - min || 1;
  const t = (value - min) / range;
  return scaleType === 'sequential'
    ? interpolateStops(SEQ_STOPS, t)
    : interpolateStops(DIV_STOPS, t);
}

export function getGradientCss(scaleType: ColorScaleType): string {
  const stops = scaleType === 'sequential' ? SEQ_STOPS : DIV_STOPS;
  const colors = stops.map(([r, g, b]) => rgbToHex(r, g, b));
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

// ── Filter Neighborhoods by Scope ───────────────────────

export function filterNeighborhoods(
  level: 'market' | 'region' | 'zipcode' | 'community',
  scopeSlug?: string,
): Neighborhood[] {
  if (level === 'market' || !scopeSlug) return [...NEIGHBORHOODS];

  if (level === 'region') {
    return NEIGHBORHOODS.filter(n => n.region === scopeSlug);
  }

  if (level === 'zipcode') {
    return NEIGHBORHOODS.filter(n => n.zipCodes.includes(scopeSlug));
  }

  // community — match by neighborhood id
  return NEIGHBORHOODS.filter(n => n.id === scopeSlug);
}

// ── Bounds Calculation ──────────────────────────────────

export function computeBounds(cells: HexCell[]): [[number, number], [number, number]] | null {
  if (cells.length === 0) return null;

  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (const cell of cells) {
    for (const [lat, lng] of cell.boundary) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
  }

  // Zero padding — hex cells fill the viewport edge-to-edge
  const latPad = 0;
  const lngPad = 0;

  return [
    [minLat - latPad, minLng - lngPad],
    [maxLat + latPad, maxLng + lngPad],
  ];
}
