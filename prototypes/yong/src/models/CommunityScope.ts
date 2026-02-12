import { MarketScope } from './MarketScope';
import type {
  ScopeLevel,
  KpiMetric,
  TrendPoint,
  DomBucket,
  PriceSegment,
  YoyStat,
  Breadcrumb,
  RegionalStat,
  Benchmarks,
  PricingDynamics,
  FinancingData,
  ListingMetrics,
  PricingSuccess,
  PropertyType,
  PpsfPoint,
  CommunityConfig,
} from './types';

export class CommunityScope extends MarketScope {
  readonly level: ScopeLevel = 'community';
  readonly type: string;
  private parentZipcodeCode: string;
  private parentRegionSlug: string = '';
  private config: CommunityConfig;

  constructor(config: CommunityConfig) {
    super(config.slug, config.name, config.description, config.image);
    this.type = config.type;
    this.parentZipcodeCode = config.zipcodeCode;
    this.config = config;
  }

  getParentZipcodeCode(): string {
    return this.parentZipcodeCode;
  }

  setParentRegionSlug(slug: string): void {
    this.parentRegionSlug = slug;
  }

  getParentRegionSlug(): string {
    return this.parentRegionSlug;
  }

  getUrl(): string {
    return `/insights/${this.parentRegionSlug}/${this.parentZipcodeCode}/${this.slug}`;
  }

  getChildren(): MarketScope[] {
    return [];
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [
      { label: 'Home', url: '/' },
      { label: 'Market Insights', url: '/insights' },
      { label: this.parentRegionSlug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), url: `/insights/${this.parentRegionSlug}` },
      { label: this.parentZipcodeCode, url: `/insights/${this.parentRegionSlug}/${this.parentZipcodeCode}` },
      { label: this.name, url: this.getUrl() },
    ];
  }

  getKpis(): KpiMetric[] {
    const s = this.config.baseStats;
    return [
      {
        label: 'Median List Price',
        value: `$${(s.medianPrice / 1000000).toFixed(1)}M`,
        rawValue: s.medianPrice,
        trend: `+${(s.trend * 100).toFixed(1)}%`,
        trendDirection: s.trend > 0 ? 'up' : s.trend < 0 ? 'down' : 'neutral',
        subtext: 'Year over Year',
      },
      {
        label: 'Avg Days on Market',
        value: `${s.avgDom}`,
        rawValue: s.avgDom,
        trend: `-${Math.round(s.avgDom * 0.1)} Days`,
        trendDirection: 'down',
        subtext: 'Faster than Q3',
      },
      {
        label: 'Active Inventory',
        value: `${s.inventory}`,
        rawValue: s.inventory,
        trend: `-${(7 + Math.round(Math.random() * 5)).toFixed(1)}%`,
        trendDirection: 'down',
        subtext: 'Low Supply',
      },
      {
        label: 'Months Supply',
        value: s.monthsSupply.toFixed(1),
        rawValue: s.monthsSupply,
        trend: `-0.3`,
        trendDirection: 'down',
        subtext: s.monthsSupply < 3 ? "Strong Seller's" : 'Balanced',
      },
    ];
  }

  getNarrative(): string {
    const s = this.config.baseStats;
    const priceStr = `$${(s.medianPrice / 1000000).toFixed(1)}M`;
    return `${this.name} continues to demonstrate strong market fundamentals with a median list price of ${priceStr} and average days on market of ${s.avgDom}. Cash transactions represent ${s.cashPortion}% of all closings this quarter, underscoring the financial strength of buyers in this market. Limited inventory of just ${s.inventory} active listings continues to drive premium pricing and competitive bidding situations.`;
  }

  getConditionScore(): number {
    const s = this.config.baseStats;
    let score = 50;
    if (s.monthsSupply < 3) score += 15;
    else if (s.monthsSupply < 4) score += 5;
    if (s.trend > 0.1) score += 10;
    else if (s.trend > 0.05) score += 5;
    if (s.avgDom < 40) score += 5;
    if (s.inventory < 30) score += 5;
    return Math.min(100, Math.max(0, score));
  }

  getTrendHistory(): TrendPoint[] {
    const s = this.config.baseStats;
    const basePrice = s.medianPrice / 1000000;
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => ({
      month,
      price: Number((basePrice - (0.05 * (5 - i)) + (Math.random() * 0.05)).toFixed(2)),
      vol: Math.round(8 + Math.random() * 14),
    }));
  }

  getDomDistribution(): DomBucket[] {
    const s = this.config.baseStats;
    const fastPct = s.avgDom < 35 ? 55 : s.avgDom < 50 ? 45 : 35;
    const remaining = 100 - fastPct;
    return [
      { range: '< 30 Days', count: Math.round(fastPct * 0.6), percentage: fastPct },
      { range: '30-60 Days', count: Math.round(remaining * 0.45 * 0.6), percentage: Math.round(remaining * 0.45) },
      { range: '60-90 Days', count: Math.round(remaining * 0.33 * 0.6), percentage: Math.round(remaining * 0.33) },
      { range: '90+ Days', count: Math.round(remaining * 0.22 * 0.6), percentage: 100 - fastPct - Math.round(remaining * 0.45) - Math.round(remaining * 0.33) },
    ];
  }

  getPriceSegments(): PriceSegment[] {
    const s = this.config.baseStats;
    const base = s.medianPrice;
    if (base >= 5000000) {
      return [
        { range: '$3M - $5M', active: 3 + Math.round(Math.random() * 5), sold: 2 + Math.round(Math.random() * 4) },
        { range: '$5M - $8M', active: 5 + Math.round(Math.random() * 5), sold: 3 + Math.round(Math.random() * 4) },
        { range: '$8M - $12M', active: 3 + Math.round(Math.random() * 4), sold: 1 + Math.round(Math.random() * 3) },
        { range: '$12M+', active: 2 + Math.round(Math.random() * 3), sold: 1 + Math.round(Math.random() * 2) },
      ];
    }
    if (base >= 3000000) {
      return [
        { range: '$2M - $3M', active: 8 + Math.round(Math.random() * 8), sold: 5 + Math.round(Math.random() * 6) },
        { range: '$3M - $5M', active: 15 + Math.round(Math.random() * 20), sold: 8 + Math.round(Math.random() * 10) },
        { range: '$5M - $8M', active: 10 + Math.round(Math.random() * 12), sold: 3 + Math.round(Math.random() * 5) },
        { range: '$8M+', active: 5 + Math.round(Math.random() * 10), sold: 1 + Math.round(Math.random() * 4) },
      ];
    }
    return [
      { range: '$500K - $1M', active: 5 + Math.round(Math.random() * 8), sold: 4 + Math.round(Math.random() * 6) },
      { range: '$1M - $2M', active: 10 + Math.round(Math.random() * 15), sold: 6 + Math.round(Math.random() * 8) },
      { range: '$2M - $4M', active: 8 + Math.round(Math.random() * 10), sold: 4 + Math.round(Math.random() * 6) },
      { range: '$4M+', active: 3 + Math.round(Math.random() * 5), sold: 1 + Math.round(Math.random() * 3) },
    ];
  }

  getYoyStats(): YoyStat[] {
    const s = this.config.baseStats;
    const soldCurrent = Math.round(s.inventory * 0.6);
    const soldPrev = Math.round(soldCurrent / (1 + s.trend * 0.8));
    const pendingCurrent = Math.round(s.inventory * 0.25);
    const pendingPrev = Math.round(pendingCurrent / (1 + s.trend * 0.6));
    const newListCurrent = Math.round(s.inventory * 0.7);
    const newListPrev = Math.round(newListCurrent * 1.15);
    const prevPrice = s.medianPrice / (1 + s.trend);
    const prevPpsf = s.ppsf / (1 + s.trend * 0.6);

    return [
      { metric: 'Sold Listings', current: `${soldCurrent}`, prevYear: `${soldPrev}`, change: `+${(((soldCurrent - soldPrev) / soldPrev) * 100).toFixed(1)}%`, direction: 'up' },
      { metric: 'Pending Listings', current: `${pendingCurrent}`, prevYear: `${pendingPrev}`, change: `+${(((pendingCurrent - pendingPrev) / pendingPrev) * 100).toFixed(1)}%`, direction: 'up' },
      { metric: 'New Listings', current: `${newListCurrent}`, prevYear: `${newListPrev}`, change: `${(((newListCurrent - newListPrev) / newListPrev) * 100).toFixed(1)}%`, direction: 'down' },
      { metric: 'Median Sold Price', current: `$${(s.medianPrice / 1000000).toFixed(2)}M`, prevYear: `$${(prevPrice / 1000000).toFixed(2)}M`, change: `+${(s.trend * 100).toFixed(1)}%`, direction: 'up' },
      { metric: 'Avg. Sold $/SqFt', current: `$${s.ppsf}`, prevYear: `$${Math.round(prevPpsf)}`, change: `+${((s.trend * 0.6) * 100).toFixed(1)}%`, direction: 'up' },
    ];
  }

  getBenchmarks(): Benchmarks {
    const s = this.config.baseStats;
    return {
      highestSale: `$${(s.highestSale / 1000000).toFixed(1)}M`.replace('.0M', 'M'),
      lowestSale: `$${(s.lowestSale / 1000000).toFixed(2)}M`,
      avgSqFt: s.avgSqFt.toLocaleString(),
      cashPortion: `${s.cashPortion}%`,
    };
  }

  getPricingDynamics(): PricingDynamics {
    const s = this.config.baseStats;
    return {
      successRate: 85 + Math.random() * 8,
      listingsWithCuts: 10 + Math.round(Math.random() * 10),
      avgPriceCut: -(s.medianPrice * 0.03),
      negotiationGap: -(1 + Math.random() * 2),
    };
  }

  getFinancingData(): FinancingData {
    const s = this.config.baseStats;
    const cash = s.cashPortion;
    const remaining = 100 - cash;
    return {
      cash,
      conventional: Math.round(remaining * 0.65),
      jumbo: Math.round(remaining * 0.3),
      other: 100 - cash - Math.round(remaining * 0.65) - Math.round(remaining * 0.3),
      avgDownPayment: `${Math.round(cash * 0.75)}%`,
      avgLoanAmount: `$${((s.medianPrice * (1 - cash / 100) * 0.8) / 1000000).toFixed(1)}M`,
    };
  }

  getListingMetrics(): ListingMetrics {
    const s = this.config.baseStats;
    const totalListed = Math.round(s.inventory * 1.7);
    const sold = Math.round(totalListed * 0.68);
    const pending = Math.round(totalListed * 0.07);
    const expired = Math.round(totalListed * 0.15);
    const withdrawn = totalListed - sold - pending - expired;
    return {
      totalListed,
      sold,
      expired,
      withdrawn,
      pending,
      successRate: Number(((sold / totalListed) * 100).toFixed(1)),
      avgPriceReduction: -(3 + Math.random() * 3),
      listingsWithReductions: Math.round(totalListed * 0.25),
    };
  }

  getPricingSuccess(): PricingSuccess {
    return {
      aboveList: 12,
      atList: 38,
      belowList: 50,
      avgOverList: '+2.4%',
      avgUnderList: '-3.8%',
    };
  }

  getPropertyTypes(): PropertyType[] {
    const s = this.config.baseStats;
    const ppsf = s.ppsf;
    return [
      { type: 'Single Family', active: Math.round(s.inventory * 0.65), sold: Math.round(s.inventory * 0.35), avgPrice: `$${(s.medianPrice * 1.1 / 1000000).toFixed(1)}M`, ppsf: `$${Math.round(ppsf * 1.0)}` },
      { type: 'Custom Lot', active: Math.round(s.inventory * 0.18), sold: Math.round(s.inventory * 0.05), avgPrice: `$${(s.medianPrice * 0.35 / 1000000).toFixed(1)}M`, ppsf: 'N/A' },
      { type: 'Townhome', active: Math.round(s.inventory * 0.1), sold: Math.round(s.inventory * 0.06), avgPrice: `$${(s.medianPrice * 0.5 / 1000000).toFixed(1)}M`, ppsf: `$${Math.round(ppsf * 0.85)}` },
      { type: 'Patio Home', active: Math.round(s.inventory * 0.07), sold: Math.round(s.inventory * 0.04), avgPrice: `$${(s.medianPrice * 0.6 / 1000000).toFixed(1)}M`, ppsf: `$${Math.round(ppsf * 0.92)}` },
    ];
  }

  getRegionalContext(): RegionalStat[] {
    const s = this.config.baseStats;
    return [
      { metric: 'Median Price', local: `$${(s.medianPrice / 1000000).toFixed(1)}M`, regional: `$${((s.medianPrice * 0.55) / 1000000).toFixed(2)}M`, metro: '$555K' },
      { metric: 'Avg $/SqFt', local: `$${s.ppsf}`, regional: `$${Math.round(s.ppsf * 0.65)}`, metro: '$318' },
      { metric: 'Inv. Turnover', local: `${(12 + Math.random() * 4).toFixed(1)}%`, regional: `${(17 + Math.random() * 5).toFixed(1)}%`, metro: '25.2%' },
      { metric: '5-Year Equity', local: `+${(60 + Math.round(s.trend * 100)).toFixed(0)}%`, regional: `+${(50 + Math.round(s.trend * 50))}%`, metro: '+50%' },
    ];
  }

  getBuyerMigration(): BuyerMigrationSource[] {
    return MarketScope.generateBuyerMigration();
  }

  getSeasonalTrends(): SeasonalTrend[] {
    return MarketScope.generateSeasonalTrends();
  }

  getPpsfTrend(): PpsfPoint[] {
    const s = this.config.baseStats;
    const currentPpsf = s.ppsf;
    const quarters = ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
    return quarters.map((month, i) => ({
      month,
      ppsf: Math.round(currentPpsf * (0.82 + (i * 0.025))),
    }));
  }
}
