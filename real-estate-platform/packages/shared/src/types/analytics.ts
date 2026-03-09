/**
 * Market Analytics Types
 * Shared across database queries, API routes, and UI components.
 */

// ── Geographic Filters ──────────────────────────────

export interface GeoFilter {
  city?: string;
  postalCode?: string;
  subdivisionName?: string;
}

// ── Portfolio Filters (raw listing queries) ─────────

export interface PortfolioFilter extends GeoFilter {
  priceMin?: number;
  priceMax?: number;
  pool?: boolean;
  bedsMin?: number;
  bathsMin?: number;
}

export interface PortfolioTrendRow {
  month: string;
  medianPrice: number;
  medianPpsf: number;
  listingCount: number;
}

export type TimeWindow = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface AnalyticsQuery extends GeoFilter {
  timeWindow?: TimeWindow;
  months?: number; // trailing N months
  status?: string | string[];
}

// ── Time Series ─────────────────────────────────────

export interface TimeSeriesPoint {
  month: string; // ISO date string (first of month)
  value: number;
}

export interface MultiSeriesPoint {
  month: string;
  [key: string]: string | number;
}

// ── Market Pulse (Category 1) ───────────────────────

export interface MarketPulseKpis {
  medianPrice: number;
  medianPricePerSqft: number;
  medianDom: number;
  activeInventory: number;
  monthsOfSupply: number;
  absorptionRate: number;
  avgCloseToListRatio: number;
  minPrice: number;
  maxPrice: number;
}

export interface MarketPulseRow {
  month: string;
  status: string;
  listingCount: number;
  avgListPrice: number;
  medianListPrice: number;
  avgClosePrice: number;
  medianClosePrice: number;
  avgPricePerSqft: number;
  medianPricePerSqft: number;
  avgClosePricePerSqft: number;
  medianClosePricePerSqft: number;
  avgDom: number;
  medianDom: number;
  avgSqft: number;
  minPrice: number;
  maxPrice: number;
}

// ── Price Intelligence (Category 2) ─────────────────

export interface PriceBandRow {
  priceBand: string;
  bandOrder: number;
  listingCount: number;
  avgDom: number;
  avgPricePerSqft: number;
  status: string;
}

// ── Supply & Demand (Category 3) ────────────────────

export interface SupplyDemandRow {
  month: string;
  newListings: number;
  newPendings: number;
  newClosings: number;
  expired: number;
  withdrawn: number;
}

// ── Inventory Age ───────────────────────────────────

export interface InventoryAgeRow {
  domBand: string;
  bandOrder: number;
  listingCount: number;
  avgPrice: number;
  avgPricePerSqft: number;
}

// ── Community Scorecard (Category 8) ────────────────

export interface CommunityScorecard {
  city: string;
  postalCode: string;
  subdivisionName: string;
  activeCount: number;
  closedCount: number;
  pendingCount: number;
  avgActivePrice: number;
  medianActivePrice: number;
  avgClosePrice: number;
  medianClosePrice: number;
  avgPricePerSqft: number;
  medianPricePerSqft: number;
  avgDom: number;
  medianDom: number;
  avgSqft: number;
  avgLotAcres: number;
  avgYearBuilt: number;
  avgCloseToListRatio: number;
  avgAnnualTax: number;
  avgHoaFee: number;
  poolPct: number;
  fireplacePct: number;
  horsePct: number;
  avgGarageSpaces: number;
  centroidLat: number;
  centroidLng: number;
}

// ── Feature Price Impact ────────────────────────────

export interface FeaturePriceImpact {
  feature: string;
  label: string;
  avgPpsfWith: number;
  avgPpsfWithout: number;
  priceDelta: number;
  pctImpact: number;
  countWith: number;
  countWithout: number;
}

// ── Heatmap (for H3 hex aggregation) ────────────────

export interface HeatmapPoint {
  listingKey: string;
  latitude: number;
  longitude: number;
  subdivisionName: string | null;
  city: string | null;
  postalCode: string;
  listPrice: number;
  closePrice: number | null;
  pricePerSqft: number | null;
  daysOnMarket: number | null;
  saleToListPct: number | null;
  standardStatus: string;
}

export type HeatmapMetricId =
  | 'ppsf'
  | 'dom'
  | 'density'
  | 'price'
  | 'saleToList';

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

// ── ARMLS Attribution (Compliance) ──────────────────

export interface ArmlsAttributionData {
  periodStart: string; // ISO date
  periodEnd: string;   // ISO date
}
