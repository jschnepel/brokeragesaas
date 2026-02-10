import { useParams, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MarketRegistry } from '../../models';
import Footer from '../../components/Footer';
import SEOHead from '../../components/shared/SEOHead';
import MarketReportHero from '../../components/market-report/MarketReportHero';
import HeroKpiCards from '../../components/shared/HeroKpiCards';
import NarrativeBlock from '../../components/market-report/NarrativeBlock';
import ScopeComparisonTable from '../../components/market-report/ScopeComparisonTable';
import DrilldownCard from '../../components/market-report/DrilldownCard';
import PriceTrendChart from '../../components/market-report/PriceTrendChart';
import PriceSegmentBars from '../../components/market-report/PriceSegmentBars';
import YoyComparisonTable from '../../components/market-report/YoyComparisonTable';
import TopCommunitiesGrid from '../../components/market-report/TopCommunitiesGrid';
import AgentContactSection from '../../components/market-report/AgentContactSection';

const RegionReportPage: React.FC = () => {
  const { region: regionSlug } = useParams<{ region: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [regionSlug]);

  const region = regionSlug ? MarketRegistry.getRegion(regionSlug) : undefined;

  if (!region) {
    return <Navigate to="/market-report" replace />;
  }

  const zipcodes = region.getZipcodes();
  const kpis = region.getKpis();

  const zipcodeRows = zipcodes.map(z => {
    const zKpis = z.getKpis();
    const communityCount = z.getCommunities().length;
    return {
      name: `${z.code} — ${z.name}`,
      url: z.getUrl(),
      columns: [
        zKpis[0].value,
        zKpis[0].trend,
        `${zKpis[1].rawValue}d`,
        `${zKpis[2].rawValue}`,
        `${communityCount}`,
      ],
    };
  });

  const totalCommunities = zipcodes.reduce((sum, z) => sum + z.getCommunities().length, 0);

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">
      <SEOHead
        title={`${region.name} Market Report | Real Estate Intelligence`}
        description={`Market analytics for ${region.name}`}
      />
      <MarketReportHero
        title={`${region.name}: Market Report`}
        subtitle={region.description}
        image={region.image}
        breadcrumbs={region.getBreadcrumbs()}
      />

      <HeroKpiCards kpis={kpis} />

      <div className="max-w-[1600px] mx-auto px-8">
        <div className="grid grid-cols-12 gap-[1px] bg-gray-200">
          {/* Narrative */}
          <div className="col-span-12">
            <NarrativeBlock
              title={region.name}
              marketLabel={region.getMarketLabel()}
              narrative={region.getNarrative()}
              conditionScore={region.getConditionScore()}
            />
          </div>

          {/* Zipcode Comparison Table */}
          {zipcodeRows.length > 0 && (
            <div className="col-span-12">
              <ScopeComparisonTable
                title={`Zip Codes in ${region.name}`}
                headers={['Zip Code', 'Median', 'YoY Change', 'DOM', 'Inventory', 'Communities']}
                rows={zipcodeRows}
                variant="dark"
              />
            </div>
          )}

          {/* Zipcode Drilldown Cards */}
          {zipcodes.length > 0 && (
            <div className="col-span-12 bg-white pt-6 px-6">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold mb-6 block">Explore Zip Codes</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-gray-200">
                {zipcodes.map((z, i) => {
                  const zKpis = z.getKpis();
                  return (
                    <DrilldownCard
                      key={z.code}
                      name={`${z.code} — ${z.name}`}
                      url={z.getUrl()}
                      image={z.image}
                      subtitle={`${z.getCommunities().length} communities`}
                      index={i}
                      stats={[
                        { label: 'Median', value: zKpis[0].value },
                        { label: 'DOM', value: `${zKpis[1].rawValue}d` },
                        { label: 'Active', value: `${zKpis[2].rawValue}` },
                        { label: '$/SqFt', value: zKpis[3].value },
                      ]}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Trend */}
          <div className="col-span-12">
            <PriceTrendChart data={region.getTrendHistory()} />
          </div>

          {/* Price Segments + YoY */}
          <div className="col-span-12 lg:col-span-6">
            <PriceSegmentBars data={region.getPriceSegments()} title="Active vs Sold by Price Tier" />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <YoyComparisonTable data={region.getYoyStats()} />
          </div>

          {/* Top Communities */}
          <div className="col-span-12">
            <TopCommunitiesGrid data={region.getTopCommunities()} />
          </div>
        </div>
      </div>

      <AgentContactSection communityCount={totalCommunities} />
      <Footer />
    </div>
  );
};

export default RegionReportPage;
