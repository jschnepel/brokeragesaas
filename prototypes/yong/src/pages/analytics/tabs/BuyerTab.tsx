import type { MarketScope } from '../../../models/MarketScope';
import type { MarketOverview } from '../../../models/MarketOverview';
import type { RegionScope } from '../../../models/RegionScope';
import type { ZipcodeScope } from '../../../models/ZipcodeScope';
import type { CommunityScope } from '../../../models/CommunityScope';
import type { ScopeLevel } from '../../../models/types';
import { Metric, Divider, RankList } from '../components/widgets';
import PriceSegmentBars from '../../../components/market-report/PriceSegmentBars';
import DomDistributionBars from '../../../components/market-report/DomDistributionBars';
import SeasonalTrendsChart from '../../../components/market-report/SeasonalTrendsChart';
import ScopeComparisonTable from '../../../components/market-report/ScopeComparisonTable';
import PropertyTypeTable from '../../../components/market-report/PropertyTypeTable';
import RegionalBenchmarkGrid from '../../../components/market-report/RegionalBenchmarkGrid';
import BenchmarksSidebar from '../../../components/market-report/BenchmarksSidebar';
import H3HeatmapSection from '../../../components/analytics/H3HeatmapSection';

interface BuyerTabProps {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
}

function rewriteUrl(url: string): string {
  if (url === '/insights') return '/temp/analytics';
  if (url.startsWith('/insights/')) return url.replace('/insights/', '/temp/analytics/');
  return url;
}

const BuyerTab: React.FC<BuyerTabProps> = ({ scope, overview, level }) => {
  const kpis = scope.getKpis();
  const priceTiers = scope.getPriceSegments();
  const domDist = scope.getDomDistribution();
  const avgDom = kpis[1]?.rawValue ?? 45;
  const sparkPrices = scope.getTrendHistory().map(t => t.price);
  const sparkVols = scope.getTrendHistory().map(t => t.vol);

  const isMarket = level === 'market';
  const isRegion = level === 'region';
  const isZipcode = level === 'zipcode';
  const isCommunity = level === 'community';

  const rankings = isMarket ? (scope as MarketOverview).getCommunityRankings() : null;

  const buildComparisonRows = () => {
    if (isMarket) {
      return (scope as MarketOverview).getRegions().map(r => {
        const k = r.getKpis();
        return { name: r.name, url: rewriteUrl(r.getUrl()), columns: [k[0].value, k[1].value, k[2].value, k[3].value] };
      });
    }
    if (isRegion) {
      return (scope as RegionScope).getZipcodes().map(z => {
        const k = z.getKpis();
        return { name: z.name, url: rewriteUrl(z.getUrl()), columns: [k[0].value, k[1].value, k[2].value, k[3].value] };
      });
    }
    return [];
  };

  return (
    <>
      {/* ═══ IDX SECTIONS (light background) ═══════════════════════ */}
      <div className="py-2">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 space-y-1">

          {/* ── Market Pulse ─────────────────────────────────── */}
          <Divider label="Market Pulse" tier="idx" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {kpis.map((kpi, i) => (
              <Metric
                key={i}
                label={kpi.label}
                value={kpi.value}
                trend={kpi.trend}
                trendDir={kpi.trendDirection}
                sub={kpi.subtext}
                spark={i === 0 ? sparkPrices : i === 1 ? sparkVols : undefined}
              />
            ))}
          </div>

          {/* ── Geographic Heatmap ──────────────────────────── */}
          <Divider label="Geographic Heatmap" tier="idx" />
          <H3HeatmapSection scope={scope} level={level} defaultMetric="ppsf" />

          {/* ── Inventory: Price Segments + DOM ────────────────── */}
          <Divider label="Active Inventory Distribution" tier="idx" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 p-3">
              <PriceSegmentBars data={priceTiers} title="Price Segments" />
            </div>
            <div className="bg-white border border-gray-100 p-3">
              <DomDistributionBars data={domDist} avgDom={avgDom} />
            </div>
          </div>

          {/* ── Seasonal Activity (market + region) ──────────── */}
          {(isMarket || isRegion) && (
            <>
              <Divider label="Seasonal Activity" tier="idx" />
              <div className="bg-white border border-gray-100 p-3">
                <SeasonalTrendsChart data={overview.getSeasonalTrends()} />
              </div>
            </>
          )}

          {/* ── Community Rankings (market-only) ──────────────── */}
          {isMarket && rankings && (
            <>
              <Divider label="Community Rankings" tier="idx" />
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <RankList title="Fastest Selling" items={rankings.fastestSelling.map(r => ({ name: r.name, value: `${r.value}d`, sub: r.region, bar: 100 - (Number(r.value) / 50 * 100) }))} />
                <RankList title="Lowest Inventory" items={rankings.lowestInventory.map(r => ({ name: r.name, value: `${r.value} mo`, sub: r.region, bar: 100 - (Number(r.value) / 5 * 100) }))} />
                <RankList title="Best Appreciation" items={rankings.highestAppreciation.map(r => ({ name: r.name, value: `${r.value}%`, sub: r.region, bar: Number(r.value) / 20 * 100 }))} />
                <RankList title="Highest $/SqFt" items={rankings.highestPricePerSqFt.map(r => ({ name: r.name, value: `$${r.value}`, sub: r.region, bar: Number(r.value) / 1000 * 100 }))} />
                <RankList title="Most Active" items={rankings.mostActive.map(r => ({ name: r.name, value: `${r.value}`, sub: r.region, bar: Number(r.value) / 35 * 100 }))} />
                <RankList title="Best L/S Ratio" items={rankings.bestListToSale.map(r => ({ name: r.name, value: `${r.value}`, sub: r.region }))} />
              </div>
            </>
          )}

          {/* ── Property Types (zipcode + community) ──────────── */}
          {(isZipcode || isCommunity) && (
            <>
              <Divider label="Property Breakdown" tier="idx" />
              {isCommunity ? (
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
              ) : (
                <div className="bg-white border border-gray-100 p-3">
                  <PropertyTypeTable data={(scope as ZipcodeScope).getPropertyTypes()} />
                </div>
              )}
            </>
          )}

          {/* ── Community: Regional Context ────────────────── */}
          {isCommunity && (
            <>
              <Divider label="Regional Context" tier="idx" />
              <div className="bg-white border border-gray-100 p-3">
                <RegionalBenchmarkGrid data={(scope as CommunityScope).getRegionalContext()} localName={scope.name} />
              </div>
            </>
          )}

          {/* ── Scope Comparison (market + region) ────────────── */}
          {(isMarket || isRegion) && (
            <>
              <Divider label={isMarket ? 'Region Comparison' : 'Zipcode Comparison'} tier="idx" />
              <div className="bg-white border border-gray-100 p-3">
                <ScopeComparisonTable
                  title={isMarket ? 'Regions at a Glance' : 'Zip Codes at a Glance'}
                  headers={isMarket
                    ? ['Region', 'Median Price', 'Avg DOM', 'Inventory', 'List-to-Sale']
                    : ['Zip Code', 'Median Price', 'Avg DOM', 'Inventory', 'Avg $/SqFt']
                  }
                  rows={buildComparisonRows()}
                />
              </div>
            </>
          )}
        </div>
      </div>

    </>
  );
};

export default BuyerTab;
