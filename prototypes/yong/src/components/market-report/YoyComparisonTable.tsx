import { Scale, ArrowUp, ArrowDown } from 'lucide-react';
import type { YoyStat } from '../../models/types';

interface YoyComparisonTableProps {
  data: YoyStat[];
}

const YoyComparisonTable: React.FC<YoyComparisonTableProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Scale size={16} className="text-[#Bfa67a]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Year-Over-Year Comparison</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-[9px] uppercase tracking-widest text-gray-400 font-bold py-2">Metric</th>
              <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-2">Current</th>
              <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-2">Prior Year</th>
              <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {data.map((stat, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 text-sm text-gray-600">{stat.metric}</td>
                <td className="py-3 text-sm text-right font-medium text-[#0C1C2E]">{stat.current}</td>
                <td className="py-3 text-sm text-right text-gray-400">{stat.prevYear}</td>
                <td className="py-3 text-sm text-right font-bold">
                  <span className={`flex items-center justify-end gap-1 ${
                    stat.direction === 'up' ? 'text-emerald-600' :
                    stat.direction === 'down' ? 'text-rose-500' : 'text-gray-400'
                  }`}>
                    {stat.direction === 'up' ? <ArrowUp size={12} /> : stat.direction === 'down' ? <ArrowDown size={12} /> : null}
                    {stat.change}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YoyComparisonTable;
