import { useEffect } from 'react';
import { MarketRegistry } from '../../models';
import Footer from '../../components/Footer';
import SEOHead from '../../components/shared/SEOHead';
import MarketReportHero from '../../components/market-report/MarketReportHero';
import KpiCardStrip from '../../components/market-report/KpiCardStrip';
import NarrativeBlock from '../../components/market-report/NarrativeBlock';
import ScopeComparisonTable from '../../components/market-report/ScopeComparisonTable';
import DrilldownCard from '../../components/market-report/DrilldownCard';
import PriceSegmentBars from '../../components/market-report/PriceSegmentBars';
import LuxuryTierCards from '../../components/market-report/LuxuryTierCards';
import BuyerMigrationChart from '../../components/market-report/BuyerMigrationChart';
import SeasonalTrendsChart from '../../components/market-report/SeasonalTrendsChart';
import AgentContactSection from '../../components/market-report/AgentContactSection';

const MarketOverviewPage: React.FC = () => {
  const overview = MarketRegistry.getOverview();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const regions = overview.getRegions();
  const kpis = overview.getKpis();

  const regionRows = regions.map(r => {
    const rKpis = r.getKpis();
    const zipcodeCount = r.getZipcodes().length;
    const communityCount = r.getZipcodes().reduce((sum, z) => sum + z.getCommunities().length, 0);
    return {
      name: r.name,
      url: r.getUrl(),
      columns: [
        rKpis[0].value,
        `${rKpis[1].rawValue}d`,
        `${rKpis[2].rawValue}`,
        rKpis[0].trend,
        rKpis[3].value,
        `${zipcodeCount} zips / ${communityCount} communities`,
      ],
    };
  });

  const totalCommunities = regions.reduce(
    (sum, r) => sum + r.getZipcodes().reduce((zSum, z) => zSum + z.getCommunities().length, 0), 0
  );

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">
      <SEOHead
        title="Scottsdale Market Report | Real Estate Intelligence"
        description="Comprehensive market data and analytics for Scottsdale luxury real estate."
      />
      <MarketReportHero
        title="Market Report"
        subtitle="Comprehensive market intelligence covering Scottsdale, Paradise Valley, Carefree, Cave Creek, and surrounding luxury communities."
        image={overview.image}
        breadcrumbs={overview.getBreadcrumbs()}
        badge="Latest"
      />

      <KpiCardStrip kpis={kpis} />

      <div className="max-w-[1600px] mx-auto px-8">
        <div className="grid grid-cols-12 gap-[1px] bg-gray-200">
          {/* Narrative */}
          <div className="col-span-12">
            <NarrativeBlock
              title="Scottsdale Luxury Market"
              marketLabel={overview.getMarketLabel()}
              narrative={overview.getNarrative()}
              conditionScore={overview.getConditionScore()}
            />
          </div>

          {/* Region Comparison Table */}
          <div className="col-span-12">
            <ScopeComparisonTable
              title="Region Comparison"
              headers={['Region', 'Median', 'DOM', 'Inventory', 'YoY', '$/SqFt Ratio', 'Coverage']}
              rows={regionRows}
              variant="dark"
            />
          </div>

          {/* Region Drilldown Cards */}
          <div className="col-span-12 bg-white pt-6 px-6">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold mb-6 block">Explore Regions</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-gray-200">
              {regions.map((r, i) => {
                const rKpis = r.getKpis();
                return (
                  <DrilldownCard
                    key={r.slug}
                    name={r.name}
                    url={r.getUrl()}
                    image={r.image}
                    subtitle={`${r.getZipcodes().length} zip codes`}
                    index={i}
                    stats={[
                      { label: 'Median', value: rKpis[0].value },
                      { label: 'DOM', value: `${rKpis[1].rawValue}d` },
                      { label: 'Inventory', value: `${rKpis[2].rawValue}` },
                      { label: 'YoY', value: rKpis[0].trend },
                    ]}
                  />
                );
              })}
            </div>
          </div>

          {/* Price Tier Breakdown */}
          <div className="col-span-12 lg:col-span-6">
            <PriceSegmentBars data={overview.getPriceTiers()} title="Market-Wide Price Tiers" />
          </div>

          {/* Luxury Tiers */}
          <div className="col-span-12 lg:col-span-6">
            <LuxuryTierCards tiers={overview.getLuxuryTiers()} />
          </div>

          {/* Buyer Migration */}
          <div className="col-span-12 lg:col-span-6">
            <BuyerMigrationChart data={overview.getBuyerMigration()} />
          </div>

          {/* Seasonal Trends */}
          <div className="col-span-12 lg:col-span-6">
            <SeasonalTrendsChart data={overview.getSeasonalTrends()} />
          </div>
        </div>
      </div>

      <AgentContactSection communityCount={totalCommunities} />
      <Footer />
    </div>
  );
};

export default MarketOverviewPage;
