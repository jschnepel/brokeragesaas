/**
 * Market data configuration for the Insights Dashboard.
 * Pure data file -- no React imports.
 */

// ---------------------------------------------------------------------------
// Shared atomic types
// ---------------------------------------------------------------------------

export type Trend = 'up' | 'down' | 'neutral';

export interface MetricPoint {
  value: number;
  change: number;
  trend: Trend;
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

export interface Region {
  name: string;
  medianPrice: number;
  dom: number;
  inventory: number;
  sales: number;
  trend: Trend;
  change: number;
  pricePerSqFt: number;
  listToSale: number;
}

export interface FastestSellingCommunity {
  name: string;
  dom: number;
  region: string;
}

export interface HighestPriceCommunity {
  name: string;
  pricePerSqFt: number;
  region: string;
}

export interface MostActiveCommunity {
  name: string;
  sales: number;
  region: string;
}

export interface HighestAppreciationCommunity {
  name: string;
  change: number;
  region: string;
}

export interface LowestInventoryCommunity {
  name: string;
  inventory: number;
  region: string;
}

export interface BestListToSaleCommunity {
  name: string;
  ratio: number;
  region: string;
}

export interface CommunityMetrics {
  fastestSelling: FastestSellingCommunity[];
  highestPricePerSqFt: HighestPriceCommunity[];
  mostActive: MostActiveCommunity[];
  highestAppreciation: HighestAppreciationCommunity[];
  lowestInventory: LowestInventoryCommunity[];
  bestListToSale: BestListToSaleCommunity[];
}

export interface RecentSale {
  address: string;
  community: string;
  price: number;
  dom: number;
  date: string;
}

export interface MarketIndicators {
  buyerDemand: string;
  sellerConfidence: string;
  investorActivity: string;
  luxurySegmentHealth: string;
  priceNegotiability: string;
  multipleOfferFrequency: string;
}

export interface BuyerMigrationSource {
  state: string;
  percentage: number;
  change: number;
  buyers: number;
}

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

export interface ZipcodeData {
  code: string;
  name: string;
  medianPrice: number;
  priceChange: number;
  dom: number;
  inventory: number;
  appreciation5Yr: number;
}

export interface LuxuryTierData {
  sales: number;
  yoyChange: number;
  avgDOM: number;
  inventory: number;
}

export interface LuxuryTiers {
  tier1M: LuxuryTierData;
  tier2M: LuxuryTierData;
  tier5M: LuxuryTierData;
  tier10M: LuxuryTierData;
}

export interface MarketTiming {
  bestMonthToBuy: string;
  bestMonthToSell: string;
  seasonalPriceSwing: number;
  springRushStart: string;
  inventoryPeak: string;
}

export interface MarketIntelligence {
  buyerMigration: BuyerMigrationSource[];
  buyerMetrics: BuyerMetrics;
  sellerMetrics: SellerMetrics;
  homeownerMetrics: HomeownerMetrics;
  zipcodes: ZipcodeData[];
  luxuryTiers: LuxuryTiers;
  marketTiming: MarketTiming;
}

export type OverallCondition = 'seller' | 'buyer' | 'neutral';

export interface MarketData {
  overallCondition: OverallCondition;
  conditionScore: number;
  lastUpdated: string;
  primaryMetrics: {
    medianPrice: MetricPoint;
    avgDaysOnMarket: MetricPoint;
    inventoryMonths: MetricPoint;
    listToSaleRatio: MetricPoint;
  };
  monthlyTrends: MonthlyTrend[];
  priceTiers: PriceTier[];
  regions: Region[];
  communityMetrics: CommunityMetrics;
  recentSales: RecentSale[];
  indicators: MarketIndicators;
  marketIntelligence: MarketIntelligence;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const MARKET_DATA: MarketData = {
  overallCondition: 'seller' as const,
  conditionScore: 72,
  lastUpdated: 'February 2026',

  // Primary metrics
  primaryMetrics: {
    medianPrice: { value: 1850000, change: 6.2, trend: 'up' as const },
    avgDaysOnMarket: { value: 42, change: -8, trend: 'down' as const },
    inventoryMonths: { value: 3.2, change: -0.5, trend: 'down' as const },
    listToSaleRatio: { value: 97.2, change: 1.1, trend: 'up' as const },
  },

  // Monthly trends (last 6 months)
  monthlyTrends: [
    { month: 'Sep', medianPrice: 1720000, sales: 165, inventory: 4.1 },
    { month: 'Oct', medianPrice: 1755000, sales: 178, inventory: 3.8 },
    { month: 'Nov', medianPrice: 1780000, sales: 156, inventory: 3.6 },
    { month: 'Dec', medianPrice: 1795000, sales: 142, inventory: 3.4 },
    { month: 'Jan', medianPrice: 1820000, sales: 185, inventory: 3.3 },
    { month: 'Feb', medianPrice: 1850000, sales: 198, inventory: 3.2 },
  ],

  // Price tier breakdown
  priceTiers: [
    { tier: '$500K - $1M', percentage: 28, count: 156, avgDOM: 35 },
    { tier: '$1M - $2M', percentage: 35, count: 195, avgDOM: 42 },
    { tier: '$2M - $3M', percentage: 20, count: 112, avgDOM: 48 },
    { tier: '$3M - $5M', percentage: 12, count: 67, avgDOM: 58 },
    { tier: '$5M+', percentage: 5, count: 28, avgDOM: 72 },
  ],

  // Regional data
  regions: [
    { name: 'North Scottsdale', medianPrice: 2800000, dom: 38, inventory: 2.8, sales: 45, trend: 'up' as const, change: 8.2, pricePerSqFt: 525, listToSale: 98.2 },
    { name: 'Paradise Valley', medianPrice: 4500000, dom: 52, inventory: 4.1, sales: 18, trend: 'up' as const, change: 12.0, pricePerSqFt: 685, listToSale: 96.5 },
    { name: 'Central Scottsdale', medianPrice: 1200000, dom: 35, inventory: 2.5, sales: 62, trend: 'up' as const, change: 5.4, pricePerSqFt: 385, listToSale: 97.8 },
    { name: 'South Scottsdale', medianPrice: 650000, dom: 32, inventory: 2.9, sales: 78, trend: 'up' as const, change: 4.8, pricePerSqFt: 320, listToSale: 98.5 },
    { name: 'Arcadia', medianPrice: 1800000, dom: 28, inventory: 2.2, sales: 38, trend: 'up' as const, change: 7.8, pricePerSqFt: 465, listToSale: 99.1 },
    { name: 'Carefree/Cave Creek', medianPrice: 1650000, dom: 45, inventory: 3.8, sales: 24, trend: 'neutral' as const, change: 2.1, pricePerSqFt: 420, listToSale: 95.8 },
    { name: 'Fountain Hills', medianPrice: 750000, dom: 48, inventory: 4.2, sales: 35, trend: 'neutral' as const, change: 1.8, pricePerSqFt: 295, listToSale: 94.2 },
    { name: 'Rio Verde', medianPrice: 875000, dom: 55, inventory: 4.8, sales: 22, trend: 'neutral' as const, change: 1.2, pricePerSqFt: 275, listToSale: 93.5 },
  ],

  // Community-level metrics for bento box
  communityMetrics: {
    fastestSelling: [
      { name: 'Arcadia Proper', dom: 18, region: 'Arcadia' },
      { name: 'DC Ranch', dom: 21, region: 'North Scottsdale' },
      { name: 'Gainey Ranch', dom: 24, region: 'Central Scottsdale' },
      { name: 'Silverleaf', dom: 26, region: 'North Scottsdale' },
      { name: 'McCormick Ranch', dom: 28, region: 'Central Scottsdale' },
    ],
    highestPricePerSqFt: [
      { name: 'Paradise Valley Estates', pricePerSqFt: 845, region: 'Paradise Valley' },
      { name: 'Silverleaf', pricePerSqFt: 725, region: 'North Scottsdale' },
      { name: 'Mummy Mountain', pricePerSqFt: 695, region: 'Paradise Valley' },
      { name: 'Estancia', pricePerSqFt: 615, region: 'North Scottsdale' },
      { name: 'Arcadia Proper', pricePerSqFt: 585, region: 'Arcadia' },
    ],
    mostActive: [
      { name: 'DC Ranch', sales: 28, region: 'North Scottsdale' },
      { name: 'McCormick Ranch', sales: 24, region: 'Central Scottsdale' },
      { name: 'Gainey Ranch', sales: 22, region: 'Central Scottsdale' },
      { name: 'Grayhawk', sales: 19, region: 'Central Scottsdale' },
      { name: 'Desert Mountain', sales: 16, region: 'North Scottsdale' },
    ],
    highestAppreciation: [
      { name: 'Paradise Valley Estates', change: 14.2, region: 'Paradise Valley' },
      { name: 'Silverleaf', change: 12.8, region: 'North Scottsdale' },
      { name: 'Arcadia Proper', change: 11.5, region: 'Arcadia' },
      { name: 'Estancia', change: 10.2, region: 'North Scottsdale' },
      { name: 'DC Ranch', change: 9.8, region: 'North Scottsdale' },
    ],
    lowestInventory: [
      { name: 'Arcadia Proper', inventory: 1.8, region: 'Arcadia' },
      { name: 'Gainey Ranch', inventory: 2.1, region: 'Central Scottsdale' },
      { name: 'DC Ranch', inventory: 2.4, region: 'North Scottsdale' },
      { name: 'McCormick Ranch', inventory: 2.6, region: 'Central Scottsdale' },
      { name: 'Silverleaf', inventory: 2.9, region: 'North Scottsdale' },
    ],
    bestListToSale: [
      { name: 'Arcadia Proper', ratio: 101.2, region: 'Arcadia' },
      { name: 'DC Ranch', ratio: 99.5, region: 'North Scottsdale' },
      { name: 'Gainey Ranch', ratio: 98.8, region: 'Central Scottsdale' },
      { name: 'Silverleaf', ratio: 98.2, region: 'North Scottsdale' },
      { name: 'McCormick Ranch', ratio: 97.5, region: 'Central Scottsdale' },
    ],
  },

  // Recent notable sales
  recentSales: [
    { address: '9820 E Thompson Peak Pkwy', community: 'DC Ranch', price: 4250000, dom: 21, date: 'Feb 5' },
    { address: '24200 N Alma School Rd', community: 'Silverleaf', price: 8750000, dom: 45, date: 'Feb 3' },
    { address: '10040 E Happy Valley Rd', community: 'Desert Mountain', price: 3100000, dom: 18, date: 'Feb 1' },
    { address: '6001 E Naumann Dr', community: 'Paradise Valley', price: 5600000, dom: 32, date: 'Jan 28' },
  ],

  // Market indicators
  indicators: {
    buyerDemand: 'High',
    sellerConfidence: 'Strong',
    investorActivity: 'Moderate',
    luxurySegmentHealth: 'Excellent',
    priceNegotiability: 'Low',
    multipleOfferFrequency: '45%',
  },

  // Market Intelligence Data
  marketIntelligence: {
    // Buyer migration sources
    buyerMigration: [
      { state: 'California', percentage: 34, change: 12, buyers: 245 },
      { state: 'New York', percentage: 18, change: 8, buyers: 130 },
      { state: 'Illinois', percentage: 14, change: 15, buyers: 101 },
      { state: 'Washington', percentage: 9, change: 5, buyers: 65 },
      { state: 'Texas', percentage: 8, change: -3, buyers: 58 },
      { state: 'Other', percentage: 17, change: 2, buyers: 123 },
    ],
    // Buyer insights
    buyerMetrics: {
      avgSearchTime: 4.2,
      avgOffersBeforeAccepted: 2.8,
      cashBuyerPercentage: 42,
      firstTimeBuyerPercentage: 18,
      investorPercentage: 24,
      avgDownPayment: 28,
      competitionIndex: 78,
      preApprovalRate: 89,
    },
    // Seller insights
    sellerMetrics: {
      avgTimeToSell: 38,
      avgPriceReduction: 2.4,
      firstWeekShowings: 12,
      offersPerListing: 3.2,
      aboveAskingPercentage: 35,
      withdrawnRate: 4.8,
      avgPhotosTopListings: 42,
      virtualTourImpact: 28,
    },
    // Homeowner equity insights
    homeownerMetrics: {
      avgEquityGain1Yr: 86500,
      avgEquityGain5Yr: 425000,
      refinanceOpportunity: 34,
      helocUsage: 18,
      avgHomeAge: 12,
      avgRenovationROI: 72,
    },
    // Zipcode level data
    zipcodes: [
      { code: '85255', name: 'North Scottsdale', medianPrice: 2450000, priceChange: 9.2, dom: 35, inventory: 2.4, appreciation5Yr: 58 },
      { code: '85253', name: 'Paradise Valley', medianPrice: 4200000, priceChange: 14.5, dom: 48, inventory: 3.8, appreciation5Yr: 72 },
      { code: '85258', name: 'Central Scottsdale', medianPrice: 1150000, priceChange: 6.8, dom: 32, inventory: 2.1, appreciation5Yr: 45 },
      { code: '85251', name: 'Old Town', medianPrice: 875000, priceChange: 5.2, dom: 28, inventory: 2.8, appreciation5Yr: 38 },
      { code: '85254', name: 'Kierland Area', medianPrice: 1350000, priceChange: 7.5, dom: 30, inventory: 2.0, appreciation5Yr: 52 },
      { code: '85262', name: 'Carefree/Cave Creek', medianPrice: 1580000, priceChange: 4.2, dom: 52, inventory: 4.1, appreciation5Yr: 41 },
    ],
    // Luxury tier insights
    luxuryTiers: {
      tier1M: { sales: 312, yoyChange: 8, avgDOM: 42, inventory: 3.2 },
      tier2M: { sales: 145, yoyChange: 12, avgDOM: 48, inventory: 3.8 },
      tier5M: { sales: 42, yoyChange: 24, avgDOM: 68, inventory: 4.5 },
      tier10M: { sales: 12, yoyChange: 58, avgDOM: 95, inventory: 5.2 },
    },
    // Market timing indicators
    marketTiming: {
      bestMonthToBuy: 'November',
      bestMonthToSell: 'April',
      seasonalPriceSwing: 8.5,
      springRushStart: 'Mid-February',
      inventoryPeak: 'June',
    },
  },
};
