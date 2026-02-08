import { MarketScope } from './MarketScope';
import { CommunityScope } from './CommunityScope';
import type {
  ScopeLevel,
  KpiMetric,
  TrendPoint,
  DomBucket,
  PriceSegment,
  YoyStat,
  Breadcrumb,
  PropertyType,
  RecentSale,
  ZipcodeConfig,
} from './types';

export class ZipcodeScope extends MarketScope {
  readonly level: ScopeLevel = 'zipcode';
  readonly code: string;
  private parentRegionSlug: string;
  private communities: CommunityScope[] = [];
  private config: ZipcodeConfig;

  constructor(config: ZipcodeConfig, parentRegionSlug: string) {
    super(config.code, config.name, config.description, config.image);
    this.code = config.code;
    this.parentRegionSlug = parentRegionSlug;
    this.config = config;
  }

  addCommunity(community: CommunityScope): void {
    this.communities.push(community);
    community.setParentRegionSlug(this.parentRegionSlug);
  }

  getParentRegionSlug(): string {
    return this.parentRegionSlug;
  }

  getUrl(): string {
    return `/market-report/${this.parentRegionSlug}/${this.code}`;
  }

  getChildren(): MarketScope[] {
    return this.communities;
  }

  getCommunities(): CommunityScope[] {
    return this.communities;
  }

  getBreadcrumbs(): Breadcrumb[] {
    const regionName = this.parentRegionSlug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    return [
      { label: 'Home', url: '/' },
      { label: 'Market Report', url: '/market-report' },
      { label: regionName, url: `/market-report/${this.parentRegionSlug}` },
      { label: this.code, url: this.getUrl() },
    ];
  }

  getKpis(): KpiMetric[] {
    const s = this.config.baseStats;
    return [
      {
        label: 'Median List Price',
        value: s.medianPrice >= 1000000 ? `$${(s.medianPrice / 1000000).toFixed(1)}M` : `$${(s.medianPrice / 1000).toFixed(0)}K`,
        rawValue: s.medianPrice,
        trend: `+${(s.trend * 100).toFixed(1)}%`,
        trendDirection: s.trend > 0 ? 'up' : s.trend < 0 ? 'down' : 'neutral',
        subtext: 'Year over Year',
      },
      {
        label: 'Avg Days on Market',
        value: `${s.avgDom}`,
        rawValue: s.avgDom,
        trend: `-${Math.round(s.avgDom * 0.08)} Days`,
        trendDirection: 'down',
        subtext: 'vs Prior Quarter',
      },
      {
        label: 'Active Inventory',
        value: `${s.inventory}`,
        rawValue: s.inventory,
        trend: `-${(5 + Math.round(Math.random() * 8)).toFixed(1)}%`,
        trendDirection: 'down',
        subtext: `${this.communities.length} Communities`,
      },
      {
        label: 'Avg $/SqFt',
        value: `$${s.ppsf}`,
        rawValue: s.ppsf,
        trend: `+${(s.trend * 60).toFixed(1)}%`,
        trendDirection: 'up',
        subtext: 'Trending Up',
      },
    ];
  }

  getNarrative(): string {
    const s = this.config.baseStats;
    const priceStr = s.medianPrice >= 1000000
      ? `$${(s.medianPrice / 1000000).toFixed(1)}M`
      : `$${(s.medianPrice / 1000).toFixed(0)}K`;
    return `The ${this.code} zip code area (${this.name}) features ${this.communities.length} luxury communities with a combined median list price of ${priceStr}. Average days on market of ${s.avgDom} and ${s.inventory} active listings indicate ${s.monthsSupply < 3 ? 'a strong seller\'s market' : 'balanced conditions'}. Year-over-year price appreciation of ${(s.trend * 100).toFixed(1)}% reflects sustained buyer demand in this premier area.`;
  }

  getConditionScore(): number {
    if (this.communities.length === 0) {
      const s = this.config.baseStats;
      let score = 50;
      if (s.monthsSupply < 3) score += 15;
      if (s.trend > 0.1) score += 10;
      if (s.avgDom < 40) score += 5;
      return Math.min(100, score);
    }
    return Math.round(this.communities.reduce((sum, c) => sum + c.getConditionScore(), 0) / this.communities.length);
  }

  getTrendHistory(): TrendPoint[] {
    const s = this.config.baseStats;
    const basePrice = s.medianPrice / 1000000;
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => ({
      month,
      price: Number((basePrice - (0.04 * (5 - i))).toFixed(2)),
      vol: Math.round(15 + Math.random() * 25),
    }));
  }

  getDomDistribution(): DomBucket[] {
    const s = this.config.baseStats;
    const fastPct = s.avgDom < 35 ? 50 : s.avgDom < 50 ? 40 : 32;
    const remaining = 100 - fastPct;
    return [
      { range: '< 30 Days', count: Math.round(s.inventory * fastPct / 100), percentage: fastPct },
      { range: '30-60 Days', count: Math.round(s.inventory * remaining * 0.4 / 100), percentage: Math.round(remaining * 0.4) },
      { range: '60-90 Days', count: Math.round(s.inventory * remaining * 0.35 / 100), percentage: Math.round(remaining * 0.35) },
      { range: '90+ Days', count: Math.round(s.inventory * remaining * 0.25 / 100), percentage: 100 - fastPct - Math.round(remaining * 0.4) - Math.round(remaining * 0.35) },
    ];
  }

  getPriceSegments(): PriceSegment[] {
    const s = this.config.baseStats;
    const base = s.medianPrice;
    if (base >= 3000000) {
      return [
        { range: '$1M - $2M', active: 8 + Math.round(Math.random() * 6), sold: 6 + Math.round(Math.random() * 4) },
        { range: '$2M - $4M', active: 20 + Math.round(Math.random() * 15), sold: 12 + Math.round(Math.random() * 8) },
        { range: '$4M - $8M', active: 12 + Math.round(Math.random() * 10), sold: 5 + Math.round(Math.random() * 5) },
        { range: '$8M+', active: 5 + Math.round(Math.random() * 8), sold: 2 + Math.round(Math.random() * 3) },
      ];
    }
    return [
      { range: '$500K - $1M', active: 10 + Math.round(Math.random() * 10), sold: 8 + Math.round(Math.random() * 6) },
      { range: '$1M - $2M', active: 15 + Math.round(Math.random() * 12), sold: 10 + Math.round(Math.random() * 8) },
      { range: '$2M - $4M', active: 8 + Math.round(Math.random() * 8), sold: 4 + Math.round(Math.random() * 5) },
      { range: '$4M+', active: 3 + Math.round(Math.random() * 5), sold: 1 + Math.round(Math.random() * 3) },
    ];
  }

  getYoyStats(): YoyStat[] {
    const s = this.config.baseStats;
    const soldCurrent = Math.round(s.inventory * 0.55);
    const soldPrev = Math.round(soldCurrent / (1 + s.trend * 0.7));
    const newListCurrent = Math.round(s.inventory * 0.75);
    const newListPrev = Math.round(newListCurrent * 1.12);
    return [
      { metric: 'Sold Listings', current: `${soldCurrent}`, prevYear: `${soldPrev}`, change: `+${(((soldCurrent - soldPrev) / soldPrev) * 100).toFixed(1)}%`, direction: 'up' },
      { metric: 'Median Sold Price', current: `$${(s.medianPrice / 1000000).toFixed(2)}M`, prevYear: `$${(s.medianPrice / (1 + s.trend) / 1000000).toFixed(2)}M`, change: `+${(s.trend * 100).toFixed(1)}%`, direction: 'up' },
      { metric: 'New Listings', current: `${newListCurrent}`, prevYear: `${newListPrev}`, change: `${(((newListCurrent - newListPrev) / newListPrev) * 100).toFixed(1)}%`, direction: 'down' },
      { metric: 'Avg $/SqFt', current: `$${s.ppsf}`, prevYear: `$${Math.round(s.ppsf / (1 + s.trend * 0.6))}`, change: `+${(s.trend * 60).toFixed(1)}%`, direction: 'up' },
    ];
  }

  getPropertyTypes(): PropertyType[] {
    const s = this.config.baseStats;
    return [
      { type: 'Single Family', active: Math.round(s.inventory * 0.6), sold: Math.round(s.inventory * 0.32), avgPrice: `$${(s.medianPrice * 1.05 / 1000000).toFixed(1)}M`, ppsf: `$${Math.round(s.ppsf)}` },
      { type: 'Custom Lot', active: Math.round(s.inventory * 0.15), sold: Math.round(s.inventory * 0.04), avgPrice: `$${(s.medianPrice * 0.3 / 1000000).toFixed(1)}M`, ppsf: 'N/A' },
      { type: 'Townhome', active: Math.round(s.inventory * 0.15), sold: Math.round(s.inventory * 0.08), avgPrice: `$${(s.medianPrice * 0.45 / 1000000).toFixed(1)}M`, ppsf: `$${Math.round(s.ppsf * 0.82)}` },
      { type: 'Patio Home', active: Math.round(s.inventory * 0.1), sold: Math.round(s.inventory * 0.06), avgPrice: `$${(s.medianPrice * 0.55 / 1000000).toFixed(1)}M`, ppsf: `$${Math.round(s.ppsf * 0.9)}` },
    ];
  }

  getRecentSales(): RecentSale[] {
    const communityNames = this.communities.length > 0
      ? this.communities.map(c => c.name)
      : [this.name];

    return [
      { address: '10242 E Pinnacle Peak Rd', community: communityNames[0], price: `$${(this.config.baseStats.medianPrice * 2.5 / 1000000).toFixed(1)}M`, dom: 12, date: 'Dec 2024' },
      { address: '23015 N Desert Mountain Dr', community: communityNames[Math.min(1, communityNames.length - 1)], price: `$${(this.config.baseStats.medianPrice * 1.8 / 1000000).toFixed(1)}M`, dom: 28, date: 'Nov 2024' },
      { address: '9876 E Troon North Dr', community: communityNames[Math.min(2, communityNames.length - 1)], price: `$${(this.config.baseStats.medianPrice * 1.2 / 1000000).toFixed(1)}M`, dom: 35, date: 'Nov 2024' },
      { address: '34501 N Scottsdale Rd', community: communityNames[0], price: `$${(this.config.baseStats.medianPrice * 0.9 / 1000000).toFixed(1)}M`, dom: 45, date: 'Oct 2024' },
    ];
  }
}
