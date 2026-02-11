import type {
  ScopeLevel,
  KpiMetric,
  TrendPoint,
  DomBucket,
  PriceSegment,
  YoyStat,
  Breadcrumb,
  ScopeSummary,
  BuyerMigrationSource,
  SeasonalTrend,
} from './types';

export abstract class MarketScope {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly image: string;
  abstract readonly level: ScopeLevel;

  constructor(slug: string, name: string, description: string, image: string) {
    this.slug = slug;
    this.name = name;
    this.description = description;
    this.image = image;
  }

  abstract getKpis(): KpiMetric[];
  abstract getNarrative(): string;
  abstract getConditionScore(): number;
  abstract getTrendHistory(): TrendPoint[];
  abstract getChildren(): MarketScope[];
  abstract getBreadcrumbs(): Breadcrumb[];
  abstract getDomDistribution(): DomBucket[];
  abstract getPriceSegments(): PriceSegment[];
  abstract getYoyStats(): YoyStat[];

  getUrl(): string {
    return '/insights';
  }

  getMarketLabel(): string {
    const index = this.getConditionScore();
    if (index < 40) return "Buyer's Market";
    if (index < 55) return 'Balanced Market';
    if (index < 70) return "Seller's Market";
    return "Strong Seller's Market";
  }

  toSummary(): ScopeSummary {
    const kpis = this.getKpis();
    return {
      slug: this.slug,
      name: this.name,
      level: this.level,
      url: this.getUrl(),
      image: this.image,
      description: this.description,
      kpiHighlight: kpis.length > 0
        ? { label: kpis[0].label, value: kpis[0].value }
        : undefined,
    };
  }

  // Shared data generators
  protected static generateBuyerMigration(): BuyerMigrationSource[] {
    return [
      { state: 'California', percentage: 42, change: '+8%', color: '#0C1C2E' },
      { state: 'Texas', percentage: 18, change: '+3%', color: '#Bfa67a' },
      { state: 'Illinois', percentage: 12, change: '+2%', color: '#6B7280' },
      { state: 'Washington', percentage: 8, change: '+1%', color: '#9CA3AF' },
      { state: 'Local (AZ)', percentage: 14, change: '-5%', color: '#D1D5DB' },
      { state: 'International', percentage: 6, change: '+2%', color: '#E5E7EB' },
    ];
  }

  protected static generateSeasonalTrends(): SeasonalTrend[] {
    return [
      { month: 'Jan', sales: 8, avgDOM: 52, label: 'Slow' },
      { month: 'Feb', sales: 12, avgDOM: 45, label: 'Warming' },
      { month: 'Mar', sales: 18, avgDOM: 38, label: 'Peak' },
      { month: 'Apr', sales: 22, avgDOM: 32, label: 'Peak' },
      { month: 'May', sales: 20, avgDOM: 35, label: 'Strong' },
      { month: 'Jun', sales: 15, avgDOM: 42, label: 'Moderate' },
      { month: 'Jul', sales: 10, avgDOM: 55, label: 'Summer Lull' },
      { month: 'Aug', sales: 9, avgDOM: 58, label: 'Summer Lull' },
      { month: 'Sep', sales: 14, avgDOM: 48, label: 'Recovery' },
      { month: 'Oct', sales: 18, avgDOM: 40, label: 'Fall Peak' },
      { month: 'Nov', sales: 15, avgDOM: 42, label: 'Strong' },
      { month: 'Dec', sales: 10, avgDOM: 50, label: 'Holiday' },
    ];
  }
}
