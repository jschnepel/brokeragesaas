import { DollarSign, ArrowDown, Home, Zap, Clock, Percent } from 'lucide-react';
import type { Benchmarks } from '../../models/types';

interface BenchmarksSidebarProps {
  benchmarks: Benchmarks;
  avgDom: number;
  negotiationGap: number;
}

const BenchmarksSidebar: React.FC<BenchmarksSidebarProps> = ({ benchmarks, avgDom, negotiationGap }) => {
  const items = [
    { icon: <DollarSign size={18} />, label: 'Highest Sale', value: benchmarks.highestSale },
    { icon: <ArrowDown size={18} />, label: 'Entry Point', value: benchmarks.lowestSale },
    { icon: <Home size={18} />, label: 'Avg Home Size', value: `${benchmarks.avgSqFt} SF` },
    { icon: <Zap size={18} />, label: 'Cash Transactions', value: benchmarks.cashPortion },
    { icon: <Clock size={18} />, label: 'Avg Days to Sell', value: `${avgDom} Days` },
    { icon: <Percent size={18} />, label: 'List-to-Sale Ratio', value: `${(100 - Math.abs(negotiationGap)).toFixed(1)}%` },
  ];

  return (
    <div className="bg-[#0C1C2E] p-8 h-full">
      <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold mb-6 block">Quarter Highlights</span>
      <div className="space-y-6">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-4 group cursor-pointer">
            <div className="p-2 bg-white/10 text-[#Bfa67a] group-hover:bg-[#Bfa67a] group-hover:text-white transition-all">
              {item.icon}
            </div>
            <div className="flex-1">
              <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold block">{item.label}</span>
              <span className="text-lg font-serif text-white group-hover:text-[#Bfa67a] transition-colors">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BenchmarksSidebar;
