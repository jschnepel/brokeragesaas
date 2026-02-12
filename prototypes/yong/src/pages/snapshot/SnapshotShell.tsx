import { useInsightsScope } from '../../hooks/useInsightsScope';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ARMLSDisclaimer from '../../components/compliance/ARMLSDisclaimer';
import PageShellHeader from '../../components/page-shells/PageShellHeader';
import SnapshotContent from './SnapshotContent';

const SnapshotShell: React.FC = () => {
  const { scope, overview, level } = useInsightsScope();

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      <Navigation variant="solid" />
      <div className="h-[72px] print:hidden" />

      <PageShellHeader scope={scope} basePath="snapshot" pageLabel="Snapshot" />

      <SnapshotContent scope={scope} overview={overview} level={level} />

      <ARMLSDisclaimer variant="idx" compact />
      <Footer />
    </div>
  );
};

export default SnapshotShell;
