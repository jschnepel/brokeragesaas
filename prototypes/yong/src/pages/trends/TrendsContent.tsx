import type { MarketScope } from '../../models/MarketScope';
import type { MarketOverview } from '../../models/MarketOverview';
import type { CommunityScope } from '../../models/CommunityScope';
import type { ScopeLevel } from '../../models/types';
import MultiLineChart from '../../components/trends/MultiLineChart';
import type { ChartSeries } from '../../components/trends/MultiLineChart';
import SeasonalityPanel from '../../components/trends/SeasonalityPanel';
import YoyComparisonTable from '../../components/market-report/YoyComparisonTable';
import PeriodSelector, { usePeriod } from './PeriodSelector';
import type { Period } from './PeriodSelector';

interface TrendsContentProps {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
}

function generateExtendedTrend(scope: MarketScope, period: Period) {
  const base = scope.getTrendHistory();
  const months = period === '3m' ? 3 : period === '6m' ? 6 : period === '1y' ? 12 : 24;

  // Extend trend data backwards from existing data
  const allMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const labels: string[] = [];
  const prices: number[] = [];
  const volumes: number[] = [];
  const doms: number[] = [];
  const inventories: number[] = [];

  const lastPrice = base[base.length - 1]?.price ?? 1.5;
  const lastVol = base[base.length - 1]?.vol ?? 80;

  for (let i = 0; i < months; i++) {
    const monthIdx = (12 + ((new Date().getMonth() - months + i + 1) % 12)) % 12;
    labels.push(allMonthNames[monthIdx]);

    const progress = i / (months - 1);
    const trend = 0.85 + progress * 0.15;
    prices.push(Number((lastPrice * trend * (0.97 + Math.random() * 0.06)).toFixed(3)));
    volumes.push(Math.round(lastVol * (0.7 + progress * 0.3) * (0.85 + Math.random() * 0.3)));
    doms.push(Math.round(55 - progress * 15 + (Math.random() * 8 - 4)));
    inventories.push(Math.round(4.5 - progress * 1.2 + (Math.random() * 0.6 - 0.3)));
  }

  return { labels, prices, volumes, doms, inventories };
}

const TrendsContent: React.FC<TrendsContentProps> = ({ scope, overview, level }) => {
  const [period, setPeriod] = usePeriod();
  const { labels, prices, volumes, doms, inventories } = generateExtendedTrend(scope, period);
  const yoyStats = scope.getYoyStats();

  const isCommunity = level === 'community';

  // Price + Volume chart
  const priceVolSeries: ChartSeries[] = [
    {
      label: 'Median Price',
      data: prices.map(p => p * 1000000),
      color: '#Bfa67a',
      yAxis: 'left',
      format: (v: number) => `$${(v / 1000000).toFixed(2)}M`,
    },
    {
      label: 'Volume',
      data: volumes,
      color: '#0C1C2E',
      yAxis: 'right',
      format: (v: number) => `${Math.round(v)}`,
    },
  ];

  // DOM + Inventory chart
  const domInvSeries: ChartSeries[] = [
    {
      label: 'Avg DOM',
      data: doms,
      color: '#EF4444',
      yAxis: 'left',
      format: (v: number) => `${Math.round(v)}d`,
    },
    {
      label: 'Months Supply',
      data: inventories.map(v => Math.max(0, v)),
      color: '#3B82F6',
      yAxis: 'right',
      format: (v: number) => `${v.toFixed(1)}mo`,
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-6">
      {/* Header + period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#Bfa67a] block mb-1">
            Trend Explorer
          </span>
          <h2 className="text-xl font-serif text-[#0C1C2E]">Time-Series Analysis</h2>
        </div>
        <div className="sticky top-[72px] z-10 bg-[#F9F8F6] py-2">
          <PeriodSelector period={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Price + Volume Chart */}
      <div className="mb-6">
        <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-2">
          Price & Volume Trends
        </span>
        <MultiLineChart labels={labels} series={priceVolSeries} height={260} />
      </div>

      {/* DOM + Inventory Chart */}
      <div className="mb-6">
        <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-2">
          Days on Market & Inventory
        </span>
        <MultiLineChart labels={labels} series={domInvSeries} height={220} />
      </div>

      {/* Seasonality */}
      <div className="mb-6">
        <SeasonalityPanel scope={scope} overview={overview} level={level} />
      </div>

      {/* YoY Table */}
      <div className="mb-6">
        <YoyComparisonTable data={yoyStats} />
      </div>
    </div>
  );
};

export default TrendsContent;
