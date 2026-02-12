import type { MarketScope } from '../../models/MarketScope';
import type { MarketOverview } from '../../models/MarketOverview';
import type { ScopeLevel } from '../../models/types';

interface PulseTrendChartsProps {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
}

const PulseTrendCharts: React.FC<PulseTrendChartsProps> = ({ scope }) => {
  const trendHistory = scope.getTrendHistory();
  const kpis = scope.getKpis();

  const prices = trendHistory.map(t => t.price);
  const volumes = trendHistory.map(t => t.vol);
  const months = trendHistory.map(t => t.month);

  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Derived summary stats
  const priceGrowth = prices.length >= 2
    ? (((prices[prices.length - 1] - prices[0]) / prices[0]) * 100).toFixed(1)
    : '0';
  const totalSales = volumes.reduce((sum, v) => sum + v, 0);
  const inventoryTrend = kpis[2]?.trend ?? '—';

  return (
    <div className="bg-white p-8 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold block mb-2">
            6-Month Trend
          </span>
          <h2 className="text-2xl font-serif text-[#0C1C2E]">
            Price <span className="italic font-light">Trajectory</span>
          </h2>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#Bfa67a] rounded-full" />
            <span className="text-gray-500">Median Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#0C1C2E] rounded-full" />
            <span className="text-gray-500">Sales Volume</span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-64 flex items-end gap-4 mb-6 flex-1">
        {trendHistory.map((month) => {
          const priceHeight = ((month.price - minPrice) / priceRange) * 100 + 40;
          const salesHeight = (month.vol / 200) * 100;

          return (
            <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center gap-1 h-48">
                <div
                  className="w-1/3 bg-[#Bfa67a] transition-all duration-500 hover:bg-[#0C1C2E]"
                  style={{ height: `${priceHeight}%` }}
                  title={`$${(month.price).toFixed(2)}M`}
                />
                <div
                  className="w-1/3 bg-[#0C1C2E]/20 transition-all duration-500 hover:bg-[#0C1C2E]/40"
                  style={{ height: `${salesHeight}%` }}
                  title={`${month.vol} sales`}
                />
              </div>
              <span className="text-xs text-gray-400 font-medium">{month.month}</span>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
            Price Growth
          </span>
          <span className="text-xl font-serif text-[#0C1C2E]">+{priceGrowth}%</span>
          <span className="text-gray-400 text-xs ml-2">6-mo</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
            Total Sales
          </span>
          <span className="text-xl font-serif text-[#0C1C2E]">{totalSales.toLocaleString()}</span>
          <span className="text-gray-400 text-xs ml-2">units</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
            Inventory Change
          </span>
          <span className="text-xl font-serif text-[#0C1C2E]">{inventoryTrend}</span>
          <span className="text-gray-400 text-xs ml-2">6-mo</span>
        </div>
      </div>
    </div>
  );
};

export default PulseTrendCharts;
