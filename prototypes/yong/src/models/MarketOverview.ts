import { MarketScope } from './MarketScope';
import { RegionScope } from './RegionScope';
import type {
  ScopeLevel,
  KpiMetric,
  TrendPoint,
  DomBucket,
  PriceSegment,
  YoyStat,
  Breadcrumb,
  BuyerMigrationSource,
  SeasonalTrend,
  LuxuryTier,
  BuyerMetrics,
  SellerMetrics,
  HomeownerMetrics,
  MarketIndicators,
  MarketTiming,
  CommunityRankings,
  MonthlyTrend,
  PriceTier,
} from './types';

export class MarketOverview extends MarketScope {
  readonly level: ScopeLevel = 'market';
  private regions: RegionScope[] = [];

  constructor() {
    super(
      'scottsdale-luxury',
      'Scottsdale Luxury Market',
      'Comprehensive market intelligence covering North Scottsdale, Paradise Valley, Carefree, Cave Creek, and surrounding luxury communities.',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2400'
    );
  }

  addRegion(region: RegionScope): void {
    this.regions.push(region);
  }

  getUrl(): string {
    return '/insights';
  }

  getChildren(): MarketScope[] {
    return this.regions;
  }

  getRegions(): RegionScope[] {
    return this.regions;
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [
      { label: 'Home', url: '/' },
      { label: 'Market Insights', url: '/insights' },
    ];
  }

  getKpis(): KpiMetric[] {
    const regions = this.regions;
    if (regions.length === 0) {
      return [
        { label: 'Median List Price', value: '$2.8M', rawValue: 2800000, trend: '+11.5%', trendDirection: 'up', subtext: 'Year over Year' },
        { label: 'Avg Days on Market', value: '45', rawValue: 45, trend: '-4 Days', trendDirection: 'down', subtext: 'Faster than Q3' },
        { label: 'Active Inventory', value: '385', rawValue: 385, trend: '-8.2%', trendDirection: 'down', subtext: `${regions.length} Regions` },
        { label: 'List-to-Sale Ratio', value: '97.5%', rawValue: 97.5, trend: '+0.8%', trendDirection: 'up', subtext: 'Strong Pricing' },
      ];
    }

    const totalInventory = regions.reduce((sum, r) => sum + r.getKpis()[2].rawValue, 0);
    const avgPrice = Math.round(regions.reduce((sum, r) => sum + r.getKpis()[0].rawValue, 0) / regions.length);
    const avgDom = Math.round(regions.reduce((sum, r) => sum + r.getKpis()[1].rawValue, 0) / regions.length);
    const avgRatio = Number((regions.reduce((sum, r) => sum + r.getKpis()[3].rawValue, 0) / regions.length).toFixed(1));

    return [
      {
        label: 'Median List Price',
        value: avgPrice >= 1000000 ? `$${(avgPrice / 1000000).toFixed(1)}M` : `$${(avgPrice / 1000).toFixed(0)}K`,
        rawValue: avgPrice,
        trend: '+11.5%',
        trendDirection: 'up',
        subtext: 'Year over Year',
      },
      {
        label: 'Avg Days on Market',
        value: `${avgDom}`,
        rawValue: avgDom,
        trend: `-${Math.round(avgDom * 0.08)} Days`,
        trendDirection: 'down',
        subtext: 'vs Prior Quarter',
      },
      {
        label: 'Active Inventory',
        value: `${totalInventory}`,
        rawValue: totalInventory,
        trend: '-8.2%',
        trendDirection: 'down',
        subtext: `${regions.length} Regions`,
      },
      {
        label: 'List-to-Sale Ratio',
        value: `${avgRatio}%`,
        rawValue: avgRatio,
        trend: '+0.8%',
        trendDirection: 'up',
        subtext: 'Strong Pricing',
      },
    ];
  }

  getNarrative(): string {
    const regions = this.regions;
    const totalCommunities = regions.reduce(
      (sum, r) => sum + r.getZipcodes().reduce(
        (zSum, z) => zSum + z.getCommunities().length, 0
      ), 0
    );
    return `The Scottsdale luxury market continues its upward trajectory, spanning ${regions.length} distinct regions and ${totalCommunities} premier communities. Overall market conditions favor sellers with strong price appreciation, declining inventory levels, and sustained demand from high-net-worth relocations. Cash transactions dominate the luxury segment, representing over 60% of all closings across the metro area.`;
  }

  getConditionScore(): number {
    if (this.regions.length === 0) return 65;
    return Math.round(this.regions.reduce((sum, r) => sum + r.getConditionScore(), 0) / this.regions.length);
  }

  getTrendHistory(): TrendPoint[] {
    return [
      { month: 'Jul', price: 2.55, vol: 85 },
      { month: 'Aug', price: 2.60, vol: 92 },
      { month: 'Sep', price: 2.68, vol: 110 },
      { month: 'Oct', price: 2.72, vol: 105 },
      { month: 'Nov', price: 2.76, vol: 90 },
      { month: 'Dec', price: 2.80, vol: 78 },
    ];
  }

  getDomDistribution(): DomBucket[] {
    return [
      { range: '< 30 Days', count: 145, percentage: 38 },
      { range: '30-60 Days', count: 110, percentage: 28 },
      { range: '60-90 Days', count: 80, percentage: 21 },
      { range: '90+ Days', count: 50, percentage: 13 },
    ];
  }

  getPriceSegments(): PriceSegment[] {
    return [
      { range: '$500K - $1M', active: 45, sold: 35 },
      { range: '$1M - $2M', active: 95, sold: 60 },
      { range: '$2M - $5M', active: 120, sold: 55 },
      { range: '$5M+', active: 65, sold: 18 },
    ];
  }

  getYoyStats(): YoyStat[] {
    return [
      { metric: 'Sold Listings', current: '285', prevYear: '248', change: '+14.9%', direction: 'up' },
      { metric: 'Pending Listings', current: '112', prevYear: '88', change: '+27.3%', direction: 'up' },
      { metric: 'New Listings', current: '198', prevYear: '225', change: '-12.0%', direction: 'down' },
      { metric: 'Median Sold Price', current: '$2.65M', prevYear: '$2.38M', change: '+11.3%', direction: 'up' },
      { metric: 'Avg. Sold $/SqFt', current: '$625', prevYear: '$572', change: '+9.3%', direction: 'up' },
    ];
  }

  getLuxuryTiers(): LuxuryTier[] {
    return [
      { threshold: '$1M+', label: 'Luxury Entry', activeListing: 280, soldLastQuarter: 168, avgDOM: 38, inventory: 280 },
      { threshold: '$2M+', label: 'Premium', activeListing: 185, soldLastQuarter: 88, avgDOM: 45, inventory: 185 },
      { threshold: '$5M+', label: 'Ultra-Luxury', activeListing: 65, soldLastQuarter: 22, avgDOM: 62, inventory: 65 },
      { threshold: '$10M+', label: 'Trophy', activeListing: 18, soldLastQuarter: 5, avgDOM: 95, inventory: 18 },
    ];
  }

  getBuyerMigration(): BuyerMigrationSource[] {
    return MarketScope.generateBuyerMigration();
  }

  getSeasonalTrends(): SeasonalTrend[] {
    return MarketScope.generateSeasonalTrends();
  }

  getPriceTiers(): PriceSegment[] {
    return [
      { range: '$500K - $1M', active: 45, sold: 35 },
      { range: '$1M - $2M', active: 95, sold: 60 },
      { range: '$2M - $3M', active: 55, sold: 30 },
      { range: '$3M - $5M', active: 65, sold: 25 },
      { range: '$5M - $10M', active: 45, sold: 14 },
      { range: '$10M+', active: 18, sold: 5 },
    ];
  }

  // ── Intelligence data (absorbed from insightsConfig.ts) ────────────

  getMarketIntelligence(): {
    buyerMetrics: BuyerMetrics;
    sellerMetrics: SellerMetrics;
    homeownerMetrics: HomeownerMetrics;
    marketTiming: MarketTiming;
  } {
    return {
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
      homeownerMetrics: {
        avgEquityGain1Yr: 86500,
        avgEquityGain5Yr: 425000,
        refinanceOpportunity: 34,
        helocUsage: 18,
        avgHomeAge: 12,
        avgRenovationROI: 72,
      },
      marketTiming: {
        bestMonthToBuy: 'November',
        bestMonthToSell: 'April',
        seasonalPriceSwing: 8.5,
        springRushStart: 'Mid-February',
        inventoryPeak: 'June',
      },
    };
  }

  getMarketIndicators(): MarketIndicators {
    return {
      buyerDemand: 'High',
      sellerConfidence: 'Strong',
      investorActivity: 'Moderate',
      luxurySegmentHealth: 'Excellent',
      priceNegotiability: 'Low',
      multipleOfferFrequency: '45%',
    };
  }

  getCommunityRankings(): CommunityRankings {
    return {
      fastestSelling: [
        { name: 'Arcadia Proper', value: 18, region: 'Arcadia' },
        { name: 'DC Ranch', value: 21, region: 'North Scottsdale' },
        { name: 'Gainey Ranch', value: 24, region: 'Central Scottsdale' },
        { name: 'Silverleaf', value: 26, region: 'North Scottsdale' },
        { name: 'McCormick Ranch', value: 28, region: 'Central Scottsdale' },
      ],
      highestPricePerSqFt: [
        { name: 'Paradise Valley Estates', value: 845, region: 'Paradise Valley' },
        { name: 'Silverleaf', value: 725, region: 'North Scottsdale' },
        { name: 'Mummy Mountain', value: 695, region: 'Paradise Valley' },
        { name: 'Estancia', value: 615, region: 'North Scottsdale' },
        { name: 'Arcadia Proper', value: 585, region: 'Arcadia' },
      ],
      mostActive: [
        { name: 'DC Ranch', value: 28, region: 'North Scottsdale' },
        { name: 'McCormick Ranch', value: 24, region: 'Central Scottsdale' },
        { name: 'Gainey Ranch', value: 22, region: 'Central Scottsdale' },
        { name: 'Grayhawk', value: 19, region: 'Central Scottsdale' },
        { name: 'Desert Mountain', value: 16, region: 'North Scottsdale' },
      ],
      highestAppreciation: [
        { name: 'Paradise Valley Estates', value: 14.2, region: 'Paradise Valley' },
        { name: 'Silverleaf', value: 12.8, region: 'North Scottsdale' },
        { name: 'Arcadia Proper', value: 11.5, region: 'Arcadia' },
        { name: 'Estancia', value: 10.2, region: 'North Scottsdale' },
        { name: 'DC Ranch', value: 9.8, region: 'North Scottsdale' },
      ],
      lowestInventory: [
        { name: 'Arcadia Proper', value: 1.8, region: 'Arcadia' },
        { name: 'Gainey Ranch', value: 2.1, region: 'Central Scottsdale' },
        { name: 'DC Ranch', value: 2.4, region: 'North Scottsdale' },
        { name: 'McCormick Ranch', value: 2.6, region: 'Central Scottsdale' },
        { name: 'Silverleaf', value: 2.9, region: 'North Scottsdale' },
      ],
      bestListToSale: [
        { name: 'Arcadia Proper', value: '101.2%', region: 'Arcadia' },
        { name: 'DC Ranch', value: '99.5%', region: 'North Scottsdale' },
        { name: 'Gainey Ranch', value: '98.8%', region: 'Central Scottsdale' },
        { name: 'Silverleaf', value: '98.2%', region: 'North Scottsdale' },
        { name: 'McCormick Ranch', value: '97.5%', region: 'Central Scottsdale' },
      ],
    };
  }

  getMonthlyTrends(): MonthlyTrend[] {
    return [
      { month: 'Sep', medianPrice: 1720000, sales: 165, inventory: 4.1 },
      { month: 'Oct', medianPrice: 1755000, sales: 178, inventory: 3.8 },
      { month: 'Nov', medianPrice: 1780000, sales: 156, inventory: 3.6 },
      { month: 'Dec', medianPrice: 1795000, sales: 142, inventory: 3.4 },
      { month: 'Jan', medianPrice: 1820000, sales: 185, inventory: 3.3 },
      { month: 'Feb', medianPrice: 1850000, sales: 198, inventory: 3.2 },
    ];
  }

  getPriceTierBreakdown(): PriceTier[] {
    return [
      { tier: '$500K - $1M', percentage: 28, count: 156, avgDOM: 35 },
      { tier: '$1M - $2M', percentage: 35, count: 195, avgDOM: 42 },
      { tier: '$2M - $3M', percentage: 20, count: 112, avgDOM: 48 },
      { tier: '$3M - $5M', percentage: 12, count: 67, avgDOM: 58 },
      { tier: '$5M+', percentage: 5, count: 28, avgDOM: 72 },
    ];
  }
}
