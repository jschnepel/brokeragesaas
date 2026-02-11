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

// Intelligence data types (absorbed from insightsConfig.ts)

export interface BuyerMetrics {
  avgSearchTime: number;
  avgOffersBeforeAccepted: number;
  cashBuyerPercentage: number;
  firstTimeBuyerPercentage: number;
  investorPercentage: number;
  avgDownPayment: number;
  competitionIndex: number;
  preApprovalRate: number;
}

export interface SellerMetrics {
  avgTimeToSell: number;
  avgPriceReduction: number;
  firstWeekShowings: number;
  offersPerListing: number;
  aboveAskingPercentage: number;
  withdrawnRate: number;
  avgPhotosTopListings: number;
  virtualTourImpact: number;
}

export interface HomeownerMetrics {
  avgEquityGain1Yr: number;
  avgEquityGain5Yr: number;
  refinanceOpportunity: number;
  helocUsage: number;
  avgHomeAge: number;
  avgRenovationROI: number;
}

export interface MarketIndicators {
  buyerDemand: string;
  sellerConfidence: string;
  investorActivity: string;
  luxurySegmentHealth: string;
  priceNegotiability: string;
  multipleOfferFrequency: string;
}

export interface MarketTiming {
  bestMonthToBuy: string;
  bestMonthToSell: string;
  seasonalPriceSwing: number;
  springRushStart: string;
  inventoryPeak: string;
}

export interface CommunityRanking {
  name: string;
  value: string | number;
  region: string;
}

export interface CommunityRankings {
  fastestSelling: CommunityRanking[];
  highestPricePerSqFt: CommunityRanking[];
  mostActive: CommunityRanking[];
  highestAppreciation: CommunityRanking[];
  lowestInventory: CommunityRanking[];
  bestListToSale: CommunityRanking[];
}

export interface MonthlyTrend {
  month: string;
  medianPrice: number;
  sales: number;
  inventory: number;
}

export interface PriceTier {
  tier: string;
  percentage: number;
  count: number;
  avgDOM: number;
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
