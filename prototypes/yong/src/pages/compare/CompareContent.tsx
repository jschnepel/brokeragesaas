import { useMemo } from 'react';
import { DollarSign, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import type { MarketScope } from '../../models/MarketScope';
import type { MarketOverview } from '../../models/MarketOverview';
import type { CommunityScope } from '../../models/CommunityScope';
import type { ScopeLevel } from '../../models/types';
import { MarketRegistry } from '../../models';
import { useScrollAnimation } from '../../components/shared/useScrollAnimation';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import RadarChart from '../../components/compare/RadarChart';
import ParallelBarChart from '../../components/compare/ParallelBarChart';
import { GaugeMini, SparkLine } from '../../pages/analytics/components/widgets';

interface CompareContentProps {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
}

interface ComparisonItem {
  scope: MarketScope;
  name: string;
  price: number;
  dom: number;
  inventory: number;
  condition: number;
  appreciation: number;
}

const COLORS = ['#0C1C2E', '#Bfa67a', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

function buildComparisons(scope: MarketScope, level: ScopeLevel): ComparisonItem[] {
  if (level === 'community') {
    const comm = scope as CommunityScope;
    const zipcode = MarketRegistry.getZipcode(comm.getParentRegionSlug(), comm.getParentZipcodeCode());
    const region = MarketRegistry.getRegion(comm.getParentRegionSlug());
    const items: ComparisonItem[] = [buildItem(scope)];
    if (zipcode) items.push(buildItem(zipcode));
    if (region) items.push(buildItem(region));
    return items;
  }
  const children = scope.getChildren().slice(0, 6);
  return children.map(buildItem);
}

function buildItem(scope: MarketScope): ComparisonItem {
  const kpis = scope.getKpis();
  const trendHistory = scope.getTrendHistory();
  const priceGrowth = trendHistory.length >= 2
    ? ((trendHistory[trendHistory.length - 1].price - trendHistory[0].price) / trendHistory[0].price) * 100
    : 0;
  return {
    scope,
    name: scope.name,
    price: kpis[0]?.rawValue ?? 0,
    dom: kpis[1]?.rawValue ?? 0,
    inventory: kpis[2]?.rawValue ?? 0,
    condition: scope.getConditionScore(),
    appreciation: Number(priceGrowth.toFixed(1)),
  };
}

function normalize(values: number[], invert = false): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map(v => {
    const norm = ((v - min) / range) * 80 + 10;
    return invert ? 100 - norm : norm;
  });
}

function generateInsights(items: ComparisonItem[]): string[] {
  if (items.length < 2) return [];
  const insights: string[] = [];

  const fastest = [...items].sort((a, b) => a.dom - b.dom)[0];
  const slowest = [...items].sort((a, b) => b.dom - a.dom)[0];
  if (fastest.name !== slowest.name) {
    insights.push(`${fastest.name} sells ${slowest.dom - fastest.dom} days faster on average than ${slowest.name}.`);
  }

  const highApp = [...items].sort((a, b) => b.appreciation - a.appreciation)[0];
  if (highApp.appreciation > 0) {
    insights.push(`${highApp.name} leads in appreciation at ${highApp.appreciation.toFixed(1)}% over the period.`);
  }

  const highPrice = [...items].sort((a, b) => b.price - a.price)[0];
  const lowPrice = [...items].sort((a, b) => a.price - b.price)[0];
  if (highPrice.name !== lowPrice.name && highPrice.price > 0 && lowPrice.price > 0) {
    const ratio = (highPrice.price / lowPrice.price).toFixed(1);
    insights.push(`${highPrice.name} commands ${ratio}x the median price of ${lowPrice.name}.`);
  }

  return insights.slice(0, 3);
}

function formatPrice(v: number): string {
  return v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;
}

const CompareContent: React.FC<CompareContentProps> = ({ scope, level }) => {
  const items = useMemo(() => buildComparisons(scope, level), [scope, level]);
  const insights = useMemo(() => generateInsights(items), [items]);
  const summaryAnim = useScrollAnimation(0.2);
  const insightsAnim = useScrollAnimation(0.2);
  const radarAnim = useScrollAnimation(0.2);
  const detailAnim = useScrollAnimation(0.2);

  if (items.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-8 lg:px-20 py-20 text-center">
        <span className="text-sm text-gray-400">No comparable scopes available at this level.</span>
      </div>
    );
  }

  // Winners for summary cards
  const highestPriced = [...items].sort((a, b) => b.price - a.price)[0];
  const fastestSelling = [...items].sort((a, b) => a.dom - b.dom)[0];
  const bestCondition = [...items].sort((a, b) => b.condition - a.condition)[0];
  const topGrowth = [...items].sort((a, b) => b.appreciation - a.appreciation)[0];

  const winners = [
    {
      icon: DollarSign,
      label: 'Highest Value',
      name: highestPriced.name,
      value: highestPriced.price >= 1000000
        ? highestPriced.price / 1000000
        : highestPriced.price / 1000,
      prefix: '$',
      suffix: highestPriced.price >= 1000000 ? 'M' : 'K',
      decimals: highestPriced.price >= 1000000 ? 2 : 0,
    },
    {
      icon: Clock,
      label: 'Fastest Market',
      name: fastestSelling.name,
      value: fastestSelling.dom,
      prefix: '',
      suffix: ' days',
      decimals: 0,
    },
    {
      icon: Target,
      label: 'Best Condition',
      name: bestCondition.name,
      value: bestCondition.condition,
      prefix: '',
      suffix: '/100',
      decimals: 0,
    },
    {
      icon: TrendingUp,
      label: 'Top Growth',
      name: topGrowth.name,
      value: topGrowth.appreciation,
      prefix: '+',
      suffix: '%',
      decimals: 1,
    },
  ];

  // Radar data
  const radarDims = ['Price', 'Speed', 'Supply', 'Condition', 'Growth'];
  const normalizedPrices = normalize(items.map(it => it.price));
  const normalizedDom = normalize(items.map(it => it.dom), true);
  const normalizedInv = normalize(items.map(it => it.inventory), true);
  const normalizedCond = items.map(it => it.condition);
  const normalizedApp = normalize(items.map(it => it.appreciation));

  const radarDatasets = items.map((item, idx) => ({
    label: item.name.length > 20 ? item.name.slice(0, 18) + '\u2026' : item.name,
    values: [
      normalizedPrices[idx],
      normalizedDom[idx],
      normalizedInv[idx],
      normalizedCond[idx],
      normalizedApp[idx],
    ],
    color: COLORS[idx % COLORS.length],
  }));

  // Bar groups
  const barGroups = [
    {
      label: 'Median Price',
      values: items.map((item, idx) => ({
        name: item.name.length > 18 ? item.name.slice(0, 16) + '\u2026' : item.name,
        value: item.price,
        color: COLORS[idx % COLORS.length],
      })),
    },
    {
      label: 'Avg Days on Market',
      values: items.map((item, idx) => ({
        name: item.name.length > 18 ? item.name.slice(0, 16) + '\u2026' : item.name,
        value: item.dom,
        color: COLORS[idx % COLORS.length],
      })),
    },
    {
      label: 'Active Inventory',
      values: items.map((item, idx) => ({
        name: item.name.length > 18 ? item.name.slice(0, 16) + '\u2026' : item.name,
        value: item.inventory,
        color: COLORS[idx % COLORS.length],
      })),
    },
  ];

  // Stats for insights panel
  const prices = items.map(it => it.price);
  const doms = items.map(it => it.dom);
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);
  const lowDom = Math.min(...doms);
  const highDom = Math.max(...doms);
  const avgCondition = Math.round(items.reduce((s, it) => s + it.condition, 0) / items.length);

  return (
    <>
      {/* Overlapping Summary Cards */}
      <section className="relative z-20 -mt-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <div
          ref={summaryAnim.ref}
          className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 ${
            summaryAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {winners.map((card, ci) => {
            const Icon = card.icon;
            return (
              <div key={ci} className="bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Icon size={20} className="text-[#Bfa67a]" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
                  {card.label}
                </span>
                <span className="text-3xl font-serif text-[#0C1C2E]">
                  {card.prefix}
                  <AnimatedCounter value={card.value} suffix={card.suffix} decimals={card.decimals} />
                </span>
                <span className="text-xs text-gray-500 block mt-1">{card.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Key Insights */}
      {insights.length > 0 && (
        <section className="py-20">
          <div
            ref={insightsAnim.ref}
            className={`max-w-[1600px] mx-auto px-8 lg:px-20 transition-all duration-700 ${
              insightsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left: Narrative insights */}
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={14} className="text-[#Bfa67a]" />
                  <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold">
                    Key Insights
                  </span>
                </div>
                <h2 className="text-2xl font-serif text-[#0C1C2E] mb-6">
                  What We <span className="italic font-light">Found</span>
                </h2>
                <div className="space-y-4">
                  {insights.map((insight, ii) => (
                    <p key={ii} className="text-gray-600 leading-relaxed text-[15px]">
                      {insight}
                    </p>
                  ))}
                </div>
              </div>

              {/* Right: Comparison overview panel */}
              <div className="lg:col-span-5">
                <div className="bg-[#0C1C2E] p-6 h-full">
                  <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.2em] font-bold block mb-4">
                    Comparison Overview
                  </span>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Areas Compared</span>
                      <span className="text-white font-serif text-sm">{items.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Price Range</span>
                      <span className="text-white font-serif text-sm">
                        {formatPrice(lowPrice)} &ndash; {formatPrice(highPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">DOM Range</span>
                      <span className="text-white font-serif text-sm">{lowDom} &ndash; {highDom} days</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="text-white/60 text-sm">Avg Condition</span>
                      <span className="text-white font-serif text-sm">{avgCondition}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Performance Radar + Side-by-Side Metrics */}
      <section className="py-16 bg-white">
        <div
          ref={radarAnim.ref}
          className={`max-w-[1600px] mx-auto px-8 lg:px-20 transition-all duration-700 ${
            radarAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-8">
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
                Performance Overview
              </span>
              <h2 className="text-2xl font-serif text-[#0C1C2E]">
                Head-to-Head <span className="italic font-light">Comparison</span>
              </h2>
            </div>
          </div>
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Radar Chart */}
            <div className="lg:col-span-5 bg-[#F9F8F6] p-8 flex items-center justify-center">
              <RadarChart
                dimensions={radarDims}
                datasets={radarDatasets.slice(0, 4)}
                size={340}
              />
            </div>

            {/* Right: Parallel Bar Chart */}
            <div className="lg:col-span-7">
              <ParallelBarChart
                groups={barGroups}
                format={(v) =>
                  v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` :
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}K` :
                  `${v}`
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Cards */}
      <section className="py-16">
        <div
          ref={detailAnim.ref}
          className={`max-w-[1600px] mx-auto px-8 lg:px-20 transition-all duration-700 ${
            detailAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-8">
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
                Area Profiles
              </span>
              <h2 className="text-2xl font-serif text-[#0C1C2E]">
                Detailed <span className="italic font-light">Breakdown</span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, idx) => {
              const kpis = item.scope.getKpis();
              const trendPrices = item.scope.getTrendHistory().map(t => t.price);
              return (
                <div
                  key={idx}
                  className="bg-white p-6 shadow-sm hover:shadow-md transition-all border-l-2 border-transparent hover:border-[#Bfa67a] group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <h3 className="text-sm font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors truncate">
                        {item.name}
                      </h3>
                    </div>
                    <GaugeMini score={item.condition} label="" size={32} />
                  </div>

                  {trendPrices.length >= 2 && (
                    <div className="mb-4 py-3 border-t border-b border-gray-100">
                      <SparkLine points={trendPrices} color={COLORS[idx % COLORS.length]} w={160} h={24} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {kpis.slice(0, 4).map((kpi, ki) => (
                      <div key={ki}>
                        <span className="text-[8px] uppercase tracking-[0.15em] text-gray-400 font-bold block mb-0.5">
                          {kpi.label}
                        </span>
                        <span className="text-sm font-serif text-[#0C1C2E]">{kpi.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default CompareContent;
