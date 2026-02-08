// Shared interfaces for the Market Report drill-down system

export type ScopeLevel = 'market' | 'region' | 'zipcode' | 'community';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface KpiMetric {
  label: string;
  value: string;
  rawValue: number;
  trend: string;
  trendDirection: TrendDirection;
  subtext: string;
}

export interface TrendPoint {
  month: string;
  price: number;
  vol: number;
}

export interface PriceSegment {
  range: string;
  active: number;
  sold: number;
}

export interface YoyStat {
  metric: string;
  current: string;
  prevYear: string;
  change: string;
  direction: TrendDirection;
}

export interface DomBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface RegionalStat {
  metric: string;
  local: string;
  regional: string;
  metro: string;
}

export interface BuyerMigrationSource {
  state: string;
  percentage: number;
  change: string;
  color: string;
}

export interface SeasonalTrend {
  month: string;
  sales: number;
  avgDOM: number;
  label: string;
}

export interface PricingSuccess {
  aboveList: number;
  atList: number;
  belowList: number;
  avgOverList: string;
  avgUnderList: string;
}

export interface PropertyType {
  type: string;
  active: number;
  sold: number;
  avgPrice: string;
  ppsf: string;
}

export interface ListingMetrics {
  totalListed: number;
  sold: number;
  expired: number;
  withdrawn: number;
  pending: number;
  successRate: number;
  avgPriceReduction: number;
  listingsWithReductions: number;
}

export interface FinancingData {
  cash: number;
  conventional: number;
  jumbo: number;
  other: number;
  avgDownPayment: string;
  avgLoanAmount: string;
}

export interface PpsfPoint {
  month: string;
  ppsf: number;
}

export interface Benchmarks {
  highestSale: string;
  lowestSale: string;
  avgSqFt: string;
  cashPortion: string;
}

export interface PricingDynamics {
  successRate: number;
  listingsWithCuts: number;
  avgPriceCut: number;
  negotiationGap: number;
}

export interface Breadcrumb {
  label: string;
  url: string;
}

export interface ScopeSummary {
  slug: string;
  name: string;
  level: ScopeLevel;
  url: string;
  image: string;
  description: string;
  kpiHighlight?: { label: string; value: string };
}

export interface LuxuryTier {
  threshold: string;
  label: string;
  activeListing: number;
  soldLastQuarter: number;
  avgDOM: number;
  inventory: number;
}

export interface RecentSale {
  address: string;
  community: string;
  price: string;
  dom: number;
  date: string;
}

// Config types used by the factory
export interface RegionConfig {
  slug: string;
  name: string;
  description: string;
  image: string;
  baseStats: {
    medianPrice: number;
    avgDom: number;
    inventory: number;
    monthsSupply: number;
    listToSale: number;
    ppsf: number;
    trend: number; // YoY as decimal e.g. 0.12 = +12%
  };
}

export interface ZipcodeConfig {
  code: string;
  name: string;
  regionSlug: string;
  description: string;
  image: string;
  baseStats: {
    medianPrice: number;
    avgDom: number;
    inventory: number;
    monthsSupply: number;
    listToSale: number;
    ppsf: number;
    trend: number;
  };
}

export interface CommunityConfig {
  slug: string;
  name: string;
  zipcodeCode: string;
  type: string;
  description: string;
  image: string;
  baseStats: {
    medianPrice: number;
    avgDom: number;
    inventory: number;
    monthsSupply: number;
    listToSale: number;
    ppsf: number;
    trend: number;
    highestSale: number;
    lowestSale: number;
    avgSqFt: number;
    cashPortion: number;
  };
}
