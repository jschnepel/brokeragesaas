import type { MarketScope } from '../../models/MarketScope';
import type { MarketOverview } from '../../models/MarketOverview';
import type { CommunityScope } from '../../models/CommunityScope';
import type { ScopeLevel, SeasonalTrend } from '../../models/types';
import SeasonalTrendsChart from '../../components/market-report/SeasonalTrendsChart';

interface SeasonalityPanelProps {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
}

const SeasonalityPanel: React.FC<SeasonalityPanelProps> = ({ scope, overview, level }) => {
  let trends: SeasonalTrend[];

  if (level === 'market') {
    trends = overview.getSeasonalTrends();
  } else if (level === 'community') {
    trends = (scope as CommunityScope).getSeasonalTrends();
  } else {
    // Region and Zipcode don't have seasonal — use market-level
    trends = overview.getSeasonalTrends();
  }

  return (
    <div className="bg-white border border-gray-100 p-4">
      <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-3">
        Seasonal Patterns
      </span>
      <SeasonalTrendsChart data={trends} />
    </div>
  );
};

export default SeasonalityPanel;
