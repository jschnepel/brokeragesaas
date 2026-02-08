import { MarketScope } from './MarketScope';
import { ZipcodeScope } from './ZipcodeScope';
import type {
  ScopeLevel,
  KpiMetric,
  TrendPoint,
  DomBucket,
  PriceSegment,
  YoyStat,
  Breadcrumb,
  RegionConfig,
} from './types';

export interface TopCommunityRanking {
  name: string;
  slug: string;
  value: string;
  url: string;
}

export interface TopCommunities {
  fastestSelling: TopCommunityRanking[];
  highestValue: TopCommunityRanking[];
  mostActive: TopCommunityRanking[];
  bestAppreciation: TopCommunityRanking[];
}

export class RegionScope extends MarketScope {
  readonly level: ScopeLevel = 'region';
  private zipcodes: ZipcodeScope[] = [];
  private config: RegionConfig;

  constructor(config: RegionConfig) {
    super(config.slug, config.name, config.description, config.image);
    this.config = config;
  }

  addZipcode(zipcode: ZipcodeScope): void {
    this.zipcodes.push(zipcode);
  }

  getUrl(): string {
    return `/market-report/${this.slug}`;
  }

  getChildren(): MarketScope[] {
    return this.zipcodes;
  }

  getZipcodes(): ZipcodeScope[] {
    return this.zipcodes;
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [
      { label: 'Home', url: '/' },
      { label: 'Market Report', url: '/market-report' },
      { label: this.name, url: this.getUrl() },
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
        subtext: `${this.zipcodes.length} Zip Codes`,
      },
      {
        label: 'List-to-Sale Ratio',
        value: `${s.listToSale}%`,
        rawValue: s.listToSale,
        trend: '+0.5%',
        trendDirection: 'up',
        subtext: 'Strong Pricing',
      },
    ];
  }

  getNarrative(): string {
    const s = this.config.baseStats;
    const totalCommunities = this.zipcodes.reduce(
      (sum, z) => sum + z.getCommunities().length, 0
    );
    const priceStr = s.medianPrice >= 1000000
      ? `$${(s.medianPrice / 1000000).toFixed(1)}M`
      : `$${(s.medianPrice / 1000).toFixed(0)}K`;
    return `${this.name} encompasses ${this.zipcodes.length} zip codes and ${totalCommunities} luxury communities, with a combined median list price of ${priceStr}. The region has shown ${(s.trend * 100).toFixed(1)}% year-over-year price appreciation, supported by ${s.avgDom}-day average days on market and a list-to-sale ratio of ${s.listToSale}%. ${s.monthsSupply < 3 ? 'Tight inventory conditions continue to favor sellers' : 'Market conditions remain balanced'} across the region.`;
  }

  getConditionScore(): number {
    if (this.zipcodes.length === 0) {
      const s = this.config.baseStats;
      let score = 50;
      if (s.monthsSupply < 3) score += 15;
      if (s.trend > 0.1) score += 10;
      if (s.avgDom < 40) score += 5;
      return Math.min(100, score);
    }
    return Math.round(this.zipcodes.reduce((sum, z) => sum + z.getConditionScore(), 0) / this.zipcodes.length);
  }

  getTrendHistory(): TrendPoint[] {
    const s = this.config.baseStats;
    const basePrice = s.medianPrice / 1000000;
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => ({
      month,
      price: Number((basePrice - (0.03 * (5 - i))).toFixed(2)),
      vol: Math.round(30 + Math.random() * 50),
    }));
  }

  getDomDistribution(): DomBucket[] {
    const s = this.config.baseStats;
    const fastPct = s.avgDom < 35 ? 48 : s.avgDom < 50 ? 38 : 30;
    const remaining = 100 - fastPct;
    return [
      { range: '< 30 Days', count: Math.round(s.inventory * fastPct / 100), percentage: fastPct },
      { range: '30-60 Days', count: Math.round(s.inventory * remaining * 0.38 / 100), percentage: Math.round(remaining * 0.38) },
      { range: '60-90 Days', count: Math.round(s.inventory * remaining * 0.35 / 100), percentage: Math.round(remaining * 0.35) },
      { range: '90+ Days', count: Math.round(s.inventory * remaining * 0.27 / 100), percentage: 100 - fastPct - Math.round(remaining * 0.38) - Math.round(remaining * 0.35) },
    ];
  }

  getPriceSegments(): PriceSegment[] {
    const s = this.config.baseStats;
    if (s.medianPrice >= 3000000) {
      return [
        { range: '$1M - $2M', active: 15, sold: 12 },
        { range: '$2M - $4M', active: 35, sold: 22 },
        { range: '$4M - $8M', active: 25, sold: 10 },
        { range: '$8M+', active: 12, sold: 4 },
      ];
    }
    return [
      { range: '$500K - $1M', active: 20, sold: 15 },
      { range: '$1M - $2M', active: 40, sold: 28 },
      { range: '$2M - $4M', active: 18, sold: 10 },
      { range: '$4M+', active: 8, sold: 3 },
    ];
  }

  getYoyStats(): YoyStat[] {
    const s = this.config.baseStats;
    const soldCurrent = Math.round(s.inventory * 0.5);
    const soldPrev = Math.round(soldCurrent / (1 + s.trend * 0.6));
    const pendingCurrent = Math.round(s.inventory * 0.2);
    const pendingPrev = Math.round(pendingCurrent / (1 + s.trend * 0.4));
    const newListCurrent = Math.round(s.inventory * 0.65);
    const newListPrev = Math.round(newListCurrent * 1.1);

    return [
      { metric: 'Sold Listings', current: `${soldCurrent}`, prevYear: `${soldPrev}`, change: `+${(((soldCurrent - soldPrev) / soldPrev) * 100).toFixed(1)}%`, direction: 'up' },
      { metric: 'Pending Listings', current: `${pendingCurrent}`, prevYear: `${pendingPrev}`, change: `+${(((pendingCurrent - pendingPrev) / pendingPrev) * 100).toFixed(1)}%`, direction: 'up' },
      { metric: 'New Listings', current: `${newListCurrent}`, prevYear: `${newListPrev}`, change: `${(((newListCurrent - newListPrev) / newListPrev) * 100).toFixed(1)}%`, direction: 'down' },
      { metric: 'Median Sold Price', current: `$${(s.medianPrice / 1000000).toFixed(2)}M`, prevYear: `$${(s.medianPrice / (1 + s.trend) / 1000000).toFixed(2)}M`, change: `+${(s.trend * 100).toFixed(1)}%`, direction: 'up' },
      { metric: 'Avg. Sold $/SqFt', current: `$${s.ppsf}`, prevYear: `$${Math.round(s.ppsf / (1 + s.trend * 0.6))}`, change: `+${(s.trend * 60).toFixed(1)}%`, direction: 'up' },
    ];
  }

  getTopCommunities(): TopCommunities {
    const allCommunities = this.zipcodes.flatMap(z => z.getCommunities());
    if (allCommunities.length === 0) {
      return { fastestSelling: [], highestValue: [], mostActive: [], bestAppreciation: [] };
    }

    const withKpis = allCommunities.map(c => ({
      community: c,
      kpis: c.getKpis(),
    }));

    const fastestSelling = [...withKpis]
      .sort((a, b) => a.kpis[1].rawValue - b.kpis[1].rawValue)
      .slice(0, 5)
      .map(item => ({
        name: item.community.name,
        slug: item.community.slug,
        value: `${item.kpis[1].rawValue} days`,
        url: item.community.getUrl(),
      }));

    const highestValue = [...withKpis]
      .sort((a, b) => b.kpis[0].rawValue - a.kpis[0].rawValue)
      .slice(0, 5)
      .map(item => ({
        name: item.community.name,
        slug: item.community.slug,
        value: item.kpis[0].value,
        url: item.community.getUrl(),
      }));

    const mostActive = [...withKpis]
      .sort((a, b) => b.kpis[2].rawValue - a.kpis[2].rawValue)
      .slice(0, 5)
      .map(item => ({
        name: item.community.name,
        slug: item.community.slug,
        value: `${item.kpis[2].rawValue} listings`,
        url: item.community.getUrl(),
      }));

    const bestAppreciation = [...withKpis]
      .sort((a, b) => {
        const aT = parseFloat(a.kpis[0].trend);
        const bT = parseFloat(b.kpis[0].trend);
        return bT - aT;
      })
      .slice(0, 5)
      .map(item => ({
        name: item.community.name,
        slug: item.community.slug,
        value: item.kpis[0].trend,
        url: item.community.getUrl(),
      }));

    return { fastestSelling, highestValue, mostActive, bestAppreciation };
  }

  getPriceSegmentsDetailed(): PriceSegment[] {
    return this.getPriceSegments();
  }
}
