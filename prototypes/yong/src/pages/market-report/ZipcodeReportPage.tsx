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
import DomDistributionBars from '../../components/market-report/DomDistributionBars';
import PropertyTypeTable from '../../components/market-report/PropertyTypeTable';
import RecentSalesTable from '../../components/market-report/RecentSalesTable';
import AgentContactSection from '../../components/market-report/AgentContactSection';

const ZipcodeReportPage: React.FC = () => {
  const { region, zipcode: zipcodeCode } = useParams<{ region: string; zipcode: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [zipcodeCode]);

  const zipcode = region && zipcodeCode
    ? MarketRegistry.getZipcode(region, zipcodeCode)
    : undefined;

  if (!zipcode) {
    return <Navigate to={region ? `/market-report/${region}` : '/market-report'} replace />;
  }

  const communities = zipcode.getCommunities();
  const kpis = zipcode.getKpis();

  const comparisonRows = communities.map(c => {
    const cKpis = c.getKpis();
    return {
      name: c.name,
      url: c.getUrl(),
      columns: [
        c.type,
        cKpis[0].value,
        `${cKpis[1].rawValue}d`,
        `${cKpis[2].rawValue}`,
        cKpis[0].trend,
      ],
    };
  });

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">
      <SEOHead
        title={`${zipcodeCode} Market Report | ${MarketRegistry.getRegion(region!)?.name ?? 'Real Estate Intelligence'}`}
        description={`Detailed real estate analytics for ${zipcodeCode}`}
      />
      <MarketReportHero
        title={`${zipcodeCode}: ${zipcode.name}`}
        subtitle={zipcode.description}
        image={zipcode.image}
        breadcrumbs={zipcode.getBreadcrumbs()}
      />

      <HeroKpiCards kpis={kpis} />

      <div className="max-w-[1600px] mx-auto px-8">
        <div className="grid grid-cols-12 gap-[1px] bg-gray-200">
          {/* Narrative */}
          <div className="col-span-12">
            <NarrativeBlock
              title={`${zipcodeCode} ${zipcode.name}`}
              marketLabel={zipcode.getMarketLabel()}
              narrative={zipcode.getNarrative()}
              conditionScore={zipcode.getConditionScore()}
            />
          </div>

          {/* Community Comparison Table */}
          {comparisonRows.length > 0 && (
            <div className="col-span-12">
              <ScopeComparisonTable
                title={`Communities in ${zipcodeCode}`}
                headers={['Community', 'Type', 'Median', 'DOM', 'Inventory', 'YoY']}
                rows={comparisonRows}
                variant="dark"
              />
            </div>
          )}

          {/* Community Drilldown Cards */}
          {communities.length > 0 && (
            <div className="col-span-12 bg-white pt-6 px-6">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold mb-6 block">Explore Communities</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[1px] bg-gray-200">
                {communities.map((c, i) => {
                  const cKpis = c.getKpis();
                  return (
                    <DrilldownCard
                      key={c.slug}
                      name={c.name}
                      url={c.getUrl()}
                      image={c.image}
                      subtitle={c.type}
                      index={i}
                      stats={[
                        { label: 'Median', value: cKpis[0].value },
                        { label: 'DOM', value: `${cKpis[1].rawValue}d` },
                        { label: 'Active', value: `${cKpis[2].rawValue}` },
                        { label: 'Trend', value: cKpis[0].trend },
                      ]}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Trend + DOM */}
          <div className="col-span-12 lg:col-span-8">
            <PriceTrendChart data={zipcode.getTrendHistory()} />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <DomDistributionBars data={zipcode.getDomDistribution()} avgDom={kpis[1].rawValue} />
          </div>

          {/* Property Type Breakdown */}
          <div className="col-span-12">
            <PropertyTypeTable data={zipcode.getPropertyTypes()} />
          </div>

          {/* Recent Notable Sales */}
          <div className="col-span-12">
            <RecentSalesTable data={zipcode.getRecentSales()} />
          </div>
        </div>
      </div>

      <AgentContactSection communityCount={communities.length} />
      <Footer />
    </div>
  );
};

export default ZipcodeReportPage;
