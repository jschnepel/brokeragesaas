import { useParams, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MarketRegistry } from '../../models';
import Footer from '../../components/Footer';
import SEOHead from '../../components/shared/SEOHead';
import MarketReportHero from '../../components/market-report/MarketReportHero';
import KpiCardStrip from '../../components/market-report/KpiCardStrip';
import NarrativeBlock from '../../components/market-report/NarrativeBlock';
import BenchmarksSidebar from '../../components/market-report/BenchmarksSidebar';
import PriceTrendChart from '../../components/market-report/PriceTrendChart';
import DomDistributionBars from '../../components/market-report/DomDistributionBars';
import PriceSegmentBars from '../../components/market-report/PriceSegmentBars';
import YoyComparisonTable from '../../components/market-report/YoyComparisonTable';
import RegionalBenchmarkGrid from '../../components/market-report/RegionalBenchmarkGrid';
import BuyerMigrationChart from '../../components/market-report/BuyerMigrationChart';
import PricingSuccessTriple from '../../components/market-report/PricingSuccessTriple';
import PropertyTypeTable from '../../components/market-report/PropertyTypeTable';
import ListingOutcomesDonut from '../../components/market-report/ListingOutcomesDonut';
import SeasonalTrendsChart from '../../components/market-report/SeasonalTrendsChart';
import FinancingBreakdownChart from '../../components/market-report/FinancingBreakdownChart';
import PpsfTrendChart from '../../components/market-report/PpsfTrendChart';
import AgentContactSection from '../../components/market-report/AgentContactSection';

const CommunityReportPage: React.FC = () => {
  const { region, zipcode, community: communitySlug } = useParams<{ region: string; zipcode: string; community: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [communitySlug]);

  const community = communitySlug ? MarketRegistry.getCommunity(communitySlug) : undefined;

  if (!community) {
    return <Navigate to={region && zipcode ? `/market-report/${region}/${zipcode}` : '/market-report'} replace />;
  }

  const kpis = community.getKpis();
  const benchmarks = community.getBenchmarks();
  const dynamics = community.getPricingDynamics();

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans selection:bg-[#0C1C2E] selection:text-white antialiased overflow-x-hidden">
      <SEOHead
        title={`${community.name} Market Report`}
        description={`Market intelligence for ${community.name}`}
      />
      <MarketReportHero
        title={`${community.name}: Market Report`}
        subtitle={community.type}
        image={community.image}
        breadcrumbs={community.getBreadcrumbs()}
        badge="Latest"
      />

      <KpiCardStrip kpis={kpis} />

      <div className="max-w-[1600px] mx-auto px-8">
        <div className="grid grid-cols-12 gap-[1px] bg-gray-200">
          {/* Narrative + Benchmarks */}
          <div className="col-span-12 lg:col-span-8">
            <NarrativeBlock
              title={community.name}
              marketLabel={community.getMarketLabel()}
              narrative={community.getNarrative()}
              conditionScore={community.getConditionScore()}
              secondaryText={`The luxury segment continues to outperform broader market indices, driven by limited inventory and sustained demand from high-net-worth buyers relocating from high-tax states. Cash transactions remain the dominant force, representing ${benchmarks.cashPortion} of all closings this quarter.`}
            />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <BenchmarksSidebar
              benchmarks={benchmarks}
              avgDom={kpis[1].rawValue}
              negotiationGap={dynamics.negotiationGap}
            />
          </div>

          {/* Price Trend + DOM */}
          <div className="col-span-12 lg:col-span-8">
            <PriceTrendChart data={community.getTrendHistory()} />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <DomDistributionBars data={community.getDomDistribution()} avgDom={kpis[1].rawValue} />
          </div>

          {/* Price Segments + YoY */}
          <div className="col-span-12 lg:col-span-6">
            <PriceSegmentBars data={community.getPriceSegments()} />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <YoyComparisonTable data={community.getYoyStats()} />
          </div>

          {/* Regional Benchmarks */}
          <div className="col-span-12">
            <RegionalBenchmarkGrid
              data={community.getRegionalContext()}
              localName={community.name}
            />
          </div>

          {/* Buyer Migration + Pricing Success */}
          <div className="col-span-12 lg:col-span-6">
            <BuyerMigrationChart data={community.getBuyerMigration()} />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <PricingSuccessTriple data={community.getPricingSuccess()} />
          </div>

          {/* Property Types + Listing Outcomes */}
          <div className="col-span-12 lg:col-span-8">
            <PropertyTypeTable data={community.getPropertyTypes()} />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <ListingOutcomesDonut data={community.getListingMetrics()} />
          </div>

          {/* Seasonal Trends */}
          <div className="col-span-12">
            <SeasonalTrendsChart data={community.getSeasonalTrends()} />
          </div>

          {/* Financing + PPSF */}
          <div className="col-span-12 lg:col-span-6">
            <FinancingBreakdownChart data={community.getFinancingData()} />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <PpsfTrendChart data={community.getPpsfTrend()} />
          </div>
        </div>
      </div>

      <AgentContactSection />
      <Footer />
    </div>
  );
};

export default CommunityReportPage;
