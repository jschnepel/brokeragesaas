import { useSearchParams, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
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

      {/* VOW Data Banner */}
      <div className="bg-[#0C1C2E] py-4">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <Link
            to="/insights/vow"
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-amber-500/20 flex items-center justify-center rounded-sm">
                <Lock size={13} className="text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold">
                  VOW Sold Data
                </span>
                <p className="text-[11px] text-white/40">
                  Unlock sold transaction analytics, equity trends, and pricing intelligence
                </p>
              </div>
            </div>
            <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-bold group-hover:text-[#Bfa67a] transition-colors">
              View VOW Insights &rarr;
            </span>
          </Link>
        </div>
      </div>

      <ScopeNav scope={scope} />
      <ARMLSDisclaimer variant="idx" compact />
      <Footer />
    </div>
  );
};

export default AnalyticsShell;
