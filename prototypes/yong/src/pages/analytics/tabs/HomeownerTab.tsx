import type { MarketScope } from '../../../models/MarketScope';
import type { MarketOverview } from '../../../models/MarketOverview';
import type { RegionScope } from '../../../models/RegionScope';
import type { ZipcodeScope } from '../../../models/ZipcodeScope';
import type { CommunityScope } from '../../../models/CommunityScope';
import type { ScopeLevel } from '../../../models/types';
import { Metric, Divider, RankList, GaugeMini } from '../components/widgets';
import SeasonalTrendsChart from '../../../components/market-report/SeasonalTrendsChart';
import ScopeComparisonTable from '../../../components/market-report/ScopeComparisonTable';
import PropertyTypeTable from '../../../components/market-report/PropertyTypeTable';
import BenchmarksSidebar from '../../../components/market-report/BenchmarksSidebar';
import RegionalBenchmarkGrid from '../../../components/market-report/RegionalBenchmarkGrid';
import H3HeatmapSection from '../../../components/analytics/H3HeatmapSection';

interface HomeownerTabProps {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
}

function rewriteUrl(url: string): string {
  if (url === '/insights') return '/temp/analytics';
  if (url.startsWith('/insights/')) return url.replace('/insights/', '/temp/analytics/');
  return url;
}

const HomeownerTab: React.FC<HomeownerTabProps> = ({ scope, overview, level }) => {
  const kpis = scope.getKpis();
  const avgDom = kpis[1]?.rawValue ?? 45;
  const sparkPrices = scope.getTrendHistory().map(t => t.price);

  const isMarket = level === 'market';
  const isRegion = level === 'region';
  const isZipcode = level === 'zipcode';
  const isCommunity = level === 'community';

  const rankings = isMarket ? (scope as MarketOverview).getCommunityRankings() : null;
  const conditionScore = scope.getConditionScore();

  return (
    <>
      {/* ═══ IDX SECTIONS ══════════════════════════════════════════ */}
      <div className="py-2">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 space-y-1">

          {/* ── Market Health: Condition + Active KPIs ─────── */}
          <Divider label="Market Health" tier="idx" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="bg-white border border-gray-100 p-2.5 flex items-center gap-3">
              <GaugeMini score={conditionScore} label={scope.getMarketLabel()} size={44} />
            </div>
            {kpis.map((kpi, i) => (
              <Metric
                key={i}
                label={kpi.label}
                value={kpi.value}
                trend={kpi.trend}
                trendDir={kpi.trendDirection}
                sub={kpi.subtext}
                spark={i === 0 ? sparkPrices : undefined}
              />
            ))}
          </div>

          {/* ── Geographic Heatmap ──────────────────────────── */}
          <Divider label="Geographic Heatmap" tier="idx" />
          <H3HeatmapSection scope={scope} level={level} defaultMetric="price" />

          {/* ── Narrative (market-only) ───────────────────── */}
          {isMarket && (
            <div className="bg-white border border-gray-100 p-3 mt-1">
              <p className="text-[11px] text-gray-600 leading-relaxed">{scope.getNarrative()}</p>
            </div>
          )}

          {/* ── Community Rankings (market-only) ──────────── */}
          {isMarket && rankings && (
            <>
              <Divider label="Community Standing" tier="idx" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <RankList title="Highest Appreciation" items={rankings.highestAppreciation.map(r => ({ name: r.name, value: `${r.value}%`, sub: r.region, bar: Number(r.value) / 20 * 100 }))} />
                <RankList title="Highest $/SqFt" items={rankings.highestPricePerSqFt.map(r => ({ name: r.name, value: `$${r.value}`, sub: r.region, bar: Number(r.value) / 1000 * 100 }))} />
                <RankList title="Lowest Inventory" items={rankings.lowestInventory.map(r => ({ name: r.name, value: `${r.value} mo`, sub: r.region, bar: 100 - (Number(r.value) / 5 * 100) }))} />
                <RankList title="Most Active" items={rankings.mostActive.map(r => ({ name: r.name, value: `${r.value}`, sub: r.region, bar: Number(r.value) / 35 * 100 }))} />
              </div>
            </>
          )}

          {/* ── Region: Seasonal + Scope Comparison ──────── */}
          {isRegion && (
            <>
              <Divider label="Regional Trends" tier="idx" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-white border border-gray-100 p-3">
                  <SeasonalTrendsChart data={overview.getSeasonalTrends()} />
                </div>
                <div className="bg-white border border-gray-100 p-3">
                  <ScopeComparisonTable
                    title="Zip Codes at a Glance"
                    headers={['Zip Code', 'Median Price', 'Avg DOM', 'Inventory', 'Avg $/SqFt']}
                    rows={(scope as RegionScope).getZipcodes().map(z => {
                      const k = z.getKpis();
                      return { name: z.name, url: rewriteUrl(z.getUrl()), columns: [k[0].value, k[1].value, k[2].value, k[3].value] };
                    })}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Zipcode: Property Types ───────────────────── */}
          {isZipcode && (
            <>
              <Divider label="Property Breakdown" tier="idx" />
              <div className="bg-white border border-gray-100 p-3">
                <PropertyTypeTable data={(scope as ZipcodeScope).getPropertyTypes()} />
              </div>
            </>
          )}

          {/* ── Community: Regional Context + Types ──────── */}
          {isCommunity && (
            <>
              <Divider label="Regional Context" tier="idx" />
              <div className="bg-white border border-gray-100 p-3">
                <RegionalBenchmarkGrid data={(scope as CommunityScope).getRegionalContext()} localName={scope.name} />
              </div>
              <Divider label="Property Breakdown" tier="idx" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 bg-white border border-gray-100 p-3">
                  <PropertyTypeTable data={(scope as CommunityScope).getPropertyTypes()} />
                </div>
                <div className="bg-white border border-gray-100 p-3">
                  <BenchmarksSidebar
                    benchmarks={(scope as CommunityScope).getBenchmarks()}
                    avgDom={avgDom}
                    negotiationGap={(scope as CommunityScope).getPricingDynamics().negotiationGap}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </>
  );
};

export default HomeownerTab;
