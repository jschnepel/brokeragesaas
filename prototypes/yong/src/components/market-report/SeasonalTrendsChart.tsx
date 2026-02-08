import { Calendar } from 'lucide-react';
import type { SeasonalTrend } from '../../models/types';

interface SeasonalTrendsChartProps {
  data: SeasonalTrend[];
}

const SeasonalTrendsChart: React.FC<SeasonalTrendsChartProps> = ({ data }) => {
  const maxSales = Math.max(...data.map(m => m.sales));

  return (
    <div className="bg-white p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#Bfa67a]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Seasonal Market Patterns</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest text-gray-400">
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#Bfa67a]"></span> Peak Season</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-300"></span> Slow Season</span>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-2">
        {data.map((month, i) => {
          const height = (month.sales / maxSales) * 100;
          const isPeak = month.label === 'Peak' || month.label === 'Fall Peak';
          const isSlow = month.label === 'Summer Lull' || month.label === 'Slow' || month.label === 'Holiday';
          return (
            <div key={i} className="text-center group cursor-pointer">
              <div className="h-32 flex flex-col justify-end mb-2">
                <div
                  className={`w-full rounded-t transition-all duration-500 group-hover:opacity-80 ${
                    isPeak ? 'bg-[#Bfa67a]' : isSlow ? 'bg-gray-300' : 'bg-[#0C1C2E]'
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-gray-600 block">{month.month}</span>
              <span className="text-[8px] text-gray-400">{month.sales}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                <span className="text-[8px] text-[#Bfa67a] font-bold block">{month.avgDOM}d DOM</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <span className="text-lg font-serif text-[#0C1C2E] block">Mar-Apr</span>
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Best to Sell</span>
        </div>
        <div className="text-center">
          <span className="text-lg font-serif text-[#0C1C2E] block">Jul-Aug</span>
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Best to Buy</span>
        </div>
        <div className="text-center">
          <span className="text-lg font-serif text-[#0C1C2E] block">32 Days</span>
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Peak Season DOM</span>
        </div>
        <div className="text-center">
          <span className="text-lg font-serif text-[#0C1C2E] block">58 Days</span>
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Slow Season DOM</span>
        </div>
      </div>
    </div>
  );
};

export default SeasonalTrendsChart;
