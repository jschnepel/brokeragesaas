import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MarketScope } from '../../models/MarketScope';
import type { MarketOverview } from '../../models/MarketOverview';
import type { CommunityScope } from '../../models/CommunityScope';
import type { ScopeLevel } from '../../models/types';
import MarketGauge from '../../components/market-report/MarketGauge';
import NarrativeBlock from '../../components/market-report/NarrativeBlock';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import SnapshotActions from './SnapshotActions';

interface SnapshotContentProps {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
}

const SnapshotContent: React.FC<SnapshotContentProps> = ({ scope, level }) => {
  const kpis = scope.getKpis();
  const score = scope.getConditionScore();
  const label = scope.getMarketLabel();
  const narrative = scope.getNarrative();
  const trendHistory = scope.getTrendHistory();
  const priceSegments = scope.getPriceSegments();
  const yoyStats = scope.getYoyStats();

  const isCommunity = level === 'community';
  const communityScope = isCommunity ? (scope as CommunityScope) : null;
  const benchmarks = communityScope?.getBenchmarks();
  const pricingDynamics = communityScope?.getPricingDynamics();

  // Sparkline from trend data
  const sparkPrices = trendHistory.map(t => t.price);
  const sparkW = 200;
  const sparkH = 40;
  let sparkPath = '';
  if (sparkPrices.length >= 2) {
    const max = Math.max(...sparkPrices);
    const min = Math.min(...sparkPrices);
    const range = max - min || 1;
    sparkPath = sparkPrices
      .map((p, i) => {
        const x = (i / (sparkPrices.length - 1)) * sparkW;
        const y = sparkH - ((p - min) / range) * (sparkH - 4) - 2;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-8">
      {/* Header row: title + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#Bfa67a] block mb-1">
            Market Snapshot
          </span>
          <h2 className="text-2xl font-serif text-[#0C1C2E]">{scope.name}</h2>
          <span className="text-xs text-gray-400 mt-0.5 block">
            Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <SnapshotActions />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white border border-gray-100 p-4">
            <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-1">
              {kpi.label}
            </span>
            <span className="text-xl font-serif text-[#0C1C2E] block leading-tight">
              <AnimatedCounter value={kpi.rawValue} format={
                kpi.label.includes('Price') ? 'currency' :
                kpi.label.includes('Ratio') || kpi.label.includes('Supply') ? 'decimal' : 'integer'
              } />
            </span>
            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold mt-1 ${
              kpi.trendDirection === 'up' ? 'text-emerald-500' :
              kpi.trendDirection === 'down' ? 'text-rose-500' : 'text-gray-400'
            }`}>
              {kpi.trendDirection === 'up' ? <TrendingUp size={10} /> :
               kpi.trendDirection === 'down' ? <TrendingDown size={10} /> :
               <Minus size={10} />}
              {kpi.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Gauge + Narrative */}
      <div className="mb-6">
        <NarrativeBlock
          title={scope.name}
          marketLabel={label}
          narrative={narrative}
          conditionScore={score}
        />
      </div>

      {/* Sparkline trend */}
      {sparkPath && (
        <div className="bg-white border border-gray-100 p-4 mb-6">
          <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-2">
            Price Trend ({trendHistory.length} Months)
          </span>
          <svg width="100%" height={sparkH} viewBox={`0 0 ${sparkW} ${sparkH}`} preserveAspectRatio="none">
            <path d={sparkPath} fill="none" stroke="#Bfa67a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-gray-400">{trendHistory[0].month}</span>
            <span className="text-[8px] text-gray-400">{trendHistory[trendHistory.length - 1].month}</span>
          </div>
        </div>
      )}

      {/* Price Segments */}
      <div className="bg-white border border-gray-100 p-4 mb-6">
        <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-3">
          Price Segments
        </span>
        <div className="space-y-2">
          {priceSegments.map((seg, i) => {
            const total = seg.active + seg.sold;
            const maxTotal = Math.max(...priceSegments.map(s => s.active + s.sold));
            const pct = (total / maxTotal) * 100;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-[#0C1C2E] w-28 shrink-0 font-serif">{seg.range}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="bg-[#0C1C2E] h-full"
                      style={{ width: `${(seg.active / maxTotal) * 100}%` }}
                    />
                    <div
                      className="bg-[#Bfa67a] h-full"
                      style={{ width: `${(seg.sold / maxTotal) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-[9px] text-gray-500 w-16 text-right shrink-0">
                  {seg.active}A / {seg.sold}S
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="inline-flex items-center gap-1 text-[8px] text-gray-400">
            <span className="w-2 h-2 bg-[#0C1C2E]" /> Active
          </span>
          <span className="inline-flex items-center gap-1 text-[8px] text-gray-400">
            <span className="w-2 h-2 bg-[#Bfa67a]" /> Sold
          </span>
        </div>
      </div>

      {/* YoY Table */}
      <div className="bg-white border border-gray-100 p-4 mb-6">
        <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-3">
          Year-over-Year Comparison
        </span>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-[8px] uppercase tracking-widest text-gray-400 font-bold pb-2">Metric</th>
              <th className="text-right text-[8px] uppercase tracking-widest text-gray-400 font-bold pb-2">Current</th>
              <th className="text-right text-[8px] uppercase tracking-widest text-gray-400 font-bold pb-2">Prior Year</th>
              <th className="text-right text-[8px] uppercase tracking-widest text-gray-400 font-bold pb-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {yoyStats.map((stat, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-[#0C1C2E] font-serif text-xs">{stat.metric}</td>
                <td className="py-2 text-right font-serif text-xs">{stat.current}</td>
                <td className="py-2 text-right text-gray-400 text-xs">{stat.prevYear}</td>
                <td className={`py-2 text-right text-xs font-bold ${
                  stat.direction === 'up' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {stat.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Community-only: Benchmarks + Pricing Dynamics */}
      {isCommunity && benchmarks && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-gray-100 p-4">
            <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-2">
              Benchmarks
            </span>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[9px] text-gray-500">Highest Sale</span>
                <span className="text-xs font-serif text-[#0C1C2E]">{benchmarks.highestSale}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-gray-500">Lowest Sale</span>
                <span className="text-xs font-serif text-[#0C1C2E]">{benchmarks.lowestSale}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-gray-500">Avg Sq Ft</span>
                <span className="text-xs font-serif text-[#0C1C2E]">{benchmarks.avgSqFt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-gray-500">Cash Portion</span>
                <span className="text-xs font-serif text-[#0C1C2E]">{benchmarks.cashPortion}</span>
              </div>
            </div>
          </div>
          {pricingDynamics && (
            <div className="bg-white border border-gray-100 p-4">
              <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-2">
                Pricing Dynamics
              </span>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[9px] text-gray-500">Success Rate</span>
                  <span className="text-xs font-serif text-[#0C1C2E]">{pricingDynamics.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-gray-500">Listings w/ Cuts</span>
                  <span className="text-xs font-serif text-[#0C1C2E]">{pricingDynamics.listingsWithCuts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-gray-500">Avg Price Cut</span>
                  <span className="text-xs font-serif text-rose-500">${Math.abs(Math.round(pricingDynamics.avgPriceCut)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-gray-500">Negotiation Gap</span>
                  <span className="text-xs font-serif text-[#0C1C2E]">{pricingDynamics.negotiationGap.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline Gauge */}
      <div className="mb-6">
        <MarketGauge score={score} label={label} />
      </div>

      {/* Footer disclaimer for print */}
      <div className="hidden print:block border-t border-gray-200 pt-4 mt-8">
        <p className="text-[8px] text-gray-400 leading-relaxed">
          Data sourced from ARMLS. Information deemed reliable but not guaranteed. Generated on {new Date().toLocaleDateString()}.
          This snapshot is for informational purposes only.
        </p>
      </div>
    </div>
  );
};

export default SnapshotContent;
