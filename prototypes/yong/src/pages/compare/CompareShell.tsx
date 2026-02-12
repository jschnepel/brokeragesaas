import { useInsightsScope } from '../../hooks/useInsightsScope';
import Footer from '../../components/Footer';
import ARMLSDisclaimer from '../../components/compliance/ARMLSDisclaimer';
import PageHero from '../../components/shared/PageHero';
import PageShellScopeNav from '../../components/page-shells/PageShellScopeNav';
import CompareContent from './CompareContent';

function buildBreadcrumbs(scope: { name: string; level: string }) {
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Compare', href: '/compare' },
  ];
  if (scope.level !== 'market') {
    crumbs.push({ label: scope.name });
  }
  return crumbs;
}

const CompareShell: React.FC = () => {
  const { scope, overview, level } = useInsightsScope();
  const breadcrumbs = buildBreadcrumbs(scope);

  const subtitle = level === 'market'
    ? "Side-by-side performance analysis across Scottsdale's luxury regions."
    : level === 'community'
      ? `${scope.name} benchmarked against parent averages.`
      : `Comparative analysis across ${scope.name}.`;

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      <PageHero
        title="Comparative Analysis"
        subtitle={subtitle}
        image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000"
        height="60vh"
        minHeight="480px"
        badge="Market Intelligence"
        badgeIcon={<div className="w-2 h-2 bg-[#Bfa67a] rounded-full" />}
        breadcrumbs={breadcrumbs}
        gradient="bg-gradient-to-t from-[#0C1C2E] via-[#0C1C2E]/50 to-[#0C1C2E]/20"
      />

      <CompareContent scope={scope} overview={overview} level={level} />

      <PageShellScopeNav scope={scope} basePath="compare" />
      <ARMLSDisclaimer variant="idx" compact />
      <Footer />
    </div>
  );
};

export default CompareShell;
