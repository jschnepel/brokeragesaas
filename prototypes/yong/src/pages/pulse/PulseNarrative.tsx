import { Zap } from 'lucide-react';
import type { MarketScope } from '../../models/MarketScope';
import type { MarketOverview } from '../../models/MarketOverview';
import type { ScopeLevel } from '../../models/types';

interface PulseNarrativeProps {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
}

function buildWeeklyNarrative(scope: MarketScope): string {
  const kpis = scope.getKpis();
  const score = scope.getConditionScore();
  const yoy = scope.getYoyStats();
  const label = scope.getMarketLabel();

  const soldStat = yoy.find(s => s.metric.includes('Sold Listings'));
  const newStat = yoy.find(s => s.metric.includes('New'));
  const priceStat = yoy.find(s => s.metric.includes('Median'));

  const parts: string[] = [];

  parts.push(
    `${scope.name} is currently a ${label.toLowerCase()} with a Market Action Index of ${score}/100.`
  );

  if (priceStat) {
    parts.push(
      `Median sale prices ${priceStat.direction === 'up' ? 'have risen' : 'have fallen'} ${priceStat.change} year-over-year to ${priceStat.current}.`
    );
  }

  if (soldStat && newStat) {
    parts.push(
      `There were ${soldStat.current} sales in the recent period (${soldStat.change} YoY) against ${newStat.current} new listings (${newStat.change} YoY).`
    );
  }

  const dom = kpis[1];
  if (dom) {
    parts.push(
      `Properties are averaging ${dom.value} days on market, ${dom.trend} compared to last quarter.`
    );
  }

  if (score >= 70) {
    parts.push('Strong demand and limited supply continue to favor sellers. Well-priced listings are attracting multiple offers within days of hitting the market.');
  } else if (score >= 55) {
    parts.push('Market conditions favor sellers modestly. Buyers who are pre-approved and ready to act quickly remain competitive.');
  } else if (score >= 40) {
    parts.push('Balanced conditions give both buyers and sellers leverage. Price negotiations are happening within 2-3% of asking in most segments.');
  } else {
    parts.push('Rising inventory is giving buyers more negotiating power. Sellers should focus on competitive pricing and presentation to attract offers.');
  }

  return parts.join(' ');
}

const PulseNarrative: React.FC<PulseNarrativeProps> = ({ scope }) => {
  const narrative = buildWeeklyNarrative(scope);
  const yoy = scope.getYoyStats();

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* Left: Narrative */}
      <div className="lg:col-span-7">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-[#Bfa67a]" />
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold">
            What's Happening
          </span>
        </div>
        <h2 className="text-2xl font-serif text-[#0C1C2E] mb-6">
          Market <span className="italic font-light">Summary</span>
        </h2>
        <p className="text-gray-600 leading-relaxed text-[15px]">
          {narrative}
        </p>
      </div>

      {/* Right: YoY Quick Stats */}
      <div className="lg:col-span-5">
        <div className="bg-[#0C1C2E] p-6 h-full">
          <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.2em] font-bold block mb-4">
            Year-over-Year Changes
          </span>
          <div className="space-y-3">
            {yoy.slice(0, 5).map((stat) => (
              <div key={stat.metric} className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60 text-sm">{stat.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-serif text-sm">{stat.current}</span>
                  <span className={`text-[10px] font-bold ${
                    stat.direction === 'up' ? 'text-emerald-400' : stat.direction === 'down' ? 'text-rose-400' : 'text-white/40'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PulseNarrative;
