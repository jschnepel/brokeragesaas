import { Plane } from 'lucide-react';
import type { BuyerMigrationSource } from '../../models/types';

interface BuyerMigrationChartProps {
  data: BuyerMigrationSource[];
}

const BuyerMigrationChart: React.FC<BuyerMigrationChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Plane size={16} className="text-[#Bfa67a]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Buyer Migration</span>
      </div>
      <p className="text-[10px] text-gray-400 mb-4">Where buyers are relocating from</p>
      <div className="space-y-3">
        {data.map((source, i) => (
          <div key={i} className="group">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600 group-hover:text-[#0C1C2E] transition-colors">{source.state}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${source.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'}`}>{source.change}</span>
                <span className="text-sm font-bold text-[#0C1C2E]">{source.percentage}%</span>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${source.percentage}%`, backgroundColor: source.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyerMigrationChart;
