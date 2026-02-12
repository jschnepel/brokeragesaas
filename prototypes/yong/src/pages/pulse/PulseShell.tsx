import { useInsightsScope } from '../../hooks/useInsightsScope';
import Footer from '../../components/Footer';
import ARMLSDisclaimer from '../../components/compliance/ARMLSDisclaimer';
import PageHero from '../../components/shared/PageHero';
import PageShellScopeNav from '../../components/page-shells/PageShellScopeNav';
import { useScrollAnimation } from '../../components/shared/useScrollAnimation';
import PulseSummaryStrip from './PulseSummaryStrip';
import PulseMarketGauge from './PulseMarketGauge';
import PulseTrendCharts from './PulseTrendCharts';
import PulseRankedLists from './PulseRankedLists';
import PulseNarrative from './PulseNarrative';
import PulseActivityFeed from './PulseActivityFeed';

function buildBreadcrumbs(scope: { name: string; level: string }, basePath: string) {
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Market Pulse', href: `/${basePath}` },
  ];
  if (scope.level !== 'market') {
    crumbs.push({ label: scope.name });
  }
  return crumbs;
}

const PulseShell: React.FC = () => {
  const { scope, overview, level } = useInsightsScope();
  const gaugeAnim = useScrollAnimation(0.2);
  const rankingsAnim = useScrollAnimation(0.2);
  const activityAnim = useScrollAnimation(0.2);

  const breadcrumbs = buildBreadcrumbs(scope, 'pulse');
  const subtitle = level === 'market'
    ? "Real-time market activity and performance metrics for Scottsdale's luxury market."
    : `Live activity and performance data for ${scope.name}.`;

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      {/* Hero */}
      <PageHero
        title="Market Pulse"
        subtitle={subtitle}
        image="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=2000"
        height="60vh"
        minHeight="480px"
        badge="Live Market Data"
        badgeIcon={<div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
        breadcrumbs={breadcrumbs}
        gradient="bg-gradient-to-t from-[#0C1C2E] via-[#0C1C2E]/50 to-[#0C1C2E]/20"
      />

      {/* Overlapping KPI Cards */}
      <section className="relative z-20 -mt-16 max-w-[1600px] mx-auto px-8 lg:px-20">
        <PulseSummaryStrip scope={scope} />
      </section>

      {/* Market Condition & Trends */}
      <section className="py-20">
        <div
          ref={gaugeAnim.ref}
          className={`max-w-[1600px] mx-auto px-8 lg:px-20 transition-all duration-700 ${gaugeAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Market Gauge + Narrative */}
            <div className="lg:col-span-4">
              <PulseMarketGauge scope={scope} />
            </div>

            {/* Right: Trend Charts */}
            <div className="lg:col-span-8">
              <PulseTrendCharts scope={scope} overview={overview} level={level} />
            </div>
          </div>
        </div>
      </section>

      {/* What's Happening Narrative */}
      <section className="py-16 bg-white">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <PulseNarrative scope={scope} overview={overview} level={level} />
        </div>
      </section>

      {/* Rankings */}
      <section className="py-16">
        <div
          ref={rankingsAnim.ref}
          className={`max-w-[1600px] mx-auto px-8 lg:px-20 transition-all duration-700 ${rankingsAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-8">
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
                Market Rankings
              </span>
              <h2 className="text-2xl font-serif text-[#0C1C2E]">
                Performance <span className="italic font-light">Leaders</span>
              </h2>
            </div>
          </div>
          <PulseRankedLists scope={scope} overview={overview} level={level} />
        </div>
      </section>

      {/* Activity Feed */}
      <section className="py-16 bg-white">
        <div
          ref={activityAnim.ref}
          className={`max-w-[1600px] mx-auto px-8 lg:px-20 transition-all duration-700 ${activityAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-8">
            <div>
              <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
                Market Activity
              </span>
              <h2 className="text-2xl font-serif text-[#0C1C2E]">
                Recent Notable <span className="italic font-light">Activity</span>
              </h2>
            </div>
          </div>
          <PulseActivityFeed scope={scope} level={level} />
        </div>
      </section>

      {/* Scope Navigation */}
      <PageShellScopeNav scope={scope} basePath="pulse" />
      <ARMLSDisclaimer variant="idx" compact />
      <Footer />
    </div>
  );
};

export default PulseShell;
