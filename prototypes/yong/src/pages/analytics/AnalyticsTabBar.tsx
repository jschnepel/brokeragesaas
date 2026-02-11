export type AnalyticsTab = 'buyer' | 'seller' | 'homeowner';

interface TabDef {
  key: AnalyticsTab;
  label: string;
  sub: string;
}

const TABS: TabDef[] = [
  { key: 'buyer', label: 'Buyer', sub: 'Competition & Pricing' },
  { key: 'seller', label: 'Seller', sub: 'Listing & Timing' },
  { key: 'homeowner', label: 'Homeowner', sub: 'Equity & Growth' },
];

interface AnalyticsTabBarProps {
  active: AnalyticsTab;
  onChange: (tab: AnalyticsTab) => void;
}

const AnalyticsTabBar: React.FC<AnalyticsTabBarProps> = ({ active, onChange }) => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex gap-0">
        {TABS.map(tab => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`relative px-6 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-[#0C1C2E] text-white'
                  : 'text-gray-500 hover:text-[#0C1C2E] hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold block">{tab.label}</span>
              <span className={`text-[8px] tracking-wide block mt-0.5 ${isActive ? 'text-white/50' : 'text-gray-400'}`}>
                {tab.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyticsTabBar;
