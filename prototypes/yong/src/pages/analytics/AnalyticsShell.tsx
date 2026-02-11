import { useSearchParams } from 'react-router-dom';
import { useInsightsScope } from '../../hooks/useInsightsScope';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ARMLSDisclaimer from '../../components/compliance/ARMLSDisclaimer';
import AnalyticsHeader from './AnalyticsHeader';
import AnalyticsTabBar from './AnalyticsTabBar';
import type { AnalyticsTab } from './AnalyticsTabBar';
import ScopeNav from './ScopeNav';
import BuyerTab from './tabs/BuyerTab';
import SellerTab from './tabs/SellerTab';
import HomeownerTab from './tabs/HomeownerTab';

function isValidTab(val: string | null): val is AnalyticsTab {
  return val === 'buyer' || val === 'seller' || val === 'homeowner';
}

const AnalyticsShell: React.FC = () => {
  const { scope, overview, level } = useInsightsScope();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: AnalyticsTab = isValidTab(rawTab) ? rawTab : 'buyer';

  const handleTabChange = (tab: AnalyticsTab) => {
    setSearchParams(tab === 'buyer' ? {} : { tab }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      <Navigation variant="solid" />
      {/* Spacer for fixed nav */}
      <div className="h-[72px]" />

      <AnalyticsHeader scope={scope} />
      <AnalyticsTabBar active={activeTab} onChange={handleTabChange} />

      {activeTab === 'buyer' && (
        <BuyerTab scope={scope} overview={overview} level={level} />
      )}
      {activeTab === 'seller' && (
        <SellerTab scope={scope} overview={overview} level={level} />
      )}
      {activeTab === 'homeowner' && (
        <HomeownerTab scope={scope} overview={overview} level={level} />
      )}

      <ScopeNav scope={scope} />
      <ARMLSDisclaimer variant="idx" compact />
      <Footer />
    </div>
  );
};

export default AnalyticsShell;
