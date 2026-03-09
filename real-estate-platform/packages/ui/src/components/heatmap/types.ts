/**
 * H3 Heatmap shared types and metric definitions.
 * Ported from prototypes/yong — adapted for platform design tokens.
 */

export type HeatmapMetricId = 'ppsf' | 'dom' | 'density' | 'price' | 'saleToList';
export type ColorScaleType = 'sequential' | 'diverging';

export interface HeatmapMetricDef {
  id: HeatmapMetricId;
  label: string;
  unit: string;
  colorScale: ColorScaleType;
  format: (v: number) => string;
}

export interface HexCellMetrics {
  ppsf: number;
  dom: number;
  density: number;
  price: number;
  saleToList: number;
}

export interface HexCell {
  h3Index: string;
  boundary: [number, number][]; // [lat, lng] pairs
  value: number;
  metrics: HexCellMetrics;
  count: number;
  neighborhoodName: string;
  city: string;
}

export const METRIC_DEFS: HeatmapMetricDef[] = [
  { id: 'ppsf', label: 'Price per SqFt', unit: '$/sqft', colorScale: 'sequential', format: v => `$${Math.round(v)}` },
  { id: 'dom', label: 'Days on Market', unit: 'days', colorScale: 'diverging', format: v => `${Math.round(v)}d` },
  { id: 'density', label: 'Listing Density', unit: 'listings', colorScale: 'sequential', format: v => `${Math.round(v)}` },
  { id: 'price', label: 'Median Price', unit: '', colorScale: 'sequential', format: v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K` },
  { id: 'saleToList', label: 'Sale-to-List', unit: '%', colorScale: 'diverging', format: v => `${v.toFixed(1)}%` },
];

export function getMetricDef(id: HeatmapMetricId): HeatmapMetricDef {
  return METRIC_DEFS.find(m => m.id === id)!;
}

// ── Color Scale ─────────────────────────────────────

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

// Brand gradient: near-white → slate blue → SIR Navy
const COLOR_STOPS = [
  hexToRgb('#F0F4F8'),
  hexToRgb('#5B8DB8'),
  hexToRgb('#002349'),
];

function interpolateStops(stops: [number, number, number][], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const segCount = stops.length - 1;
  const seg = Math.min(Math.floor(clamped * segCount), segCount - 1);
  const localT = clamped * segCount - seg;
  const [r1, g1, b1] = stops[seg];
  const [r2, g2, b2] = stops[seg + 1];
  return rgbToHex(lerp(r1, r2, localT), lerp(g1, g2, localT), lerp(b1, b2, localT));
}

export function getColor(value: number, min: number, max: number): string {
  const range = max - min || 1;
  const t = (value - min) / range;
  return interpolateStops(COLOR_STOPS, t);
}

export function getGradientCss(): string {
  const colors = COLOR_STOPS.map(([r, g, b]) => rgbToHex(r, g, b));
  return `linear-gradient(to right, ${colors.join(', ')})`;
}
