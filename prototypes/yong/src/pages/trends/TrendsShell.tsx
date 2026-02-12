import { useInsightsScope } from '../../hooks/useInsightsScope';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ARMLSDisclaimer from '../../components/compliance/ARMLSDisclaimer';
import PageShellHeader from '../../components/page-shells/PageShellHeader';
import PageShellScopeNav from '../../components/page-shells/PageShellScopeNav';
import TrendsContent from './TrendsContent';

const TrendsShell: React.FC = () => {
  const { scope, overview, level } = useInsightsScope();

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      <Navigation variant="solid" />
      <div className="h-[72px]" />

      <PageShellHeader scope={scope} basePath="trends" pageLabel="Trends" />

      <TrendsContent scope={scope} overview={overview} level={level} />

      <PageShellScopeNav scope={scope} basePath="trends" />
      <ARMLSDisclaimer variant="idx" compact />
      <Footer />
    </div>
  );
};

export default TrendsShell;
