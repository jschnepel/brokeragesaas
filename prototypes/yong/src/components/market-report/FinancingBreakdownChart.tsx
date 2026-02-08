import { Banknote } from 'lucide-react';
import type { FinancingData } from '../../models/types';

interface FinancingBreakdownChartProps {
  data: FinancingData;
}

const FinancingBreakdownChart: React.FC<FinancingBreakdownChartProps> = ({ data }) => {
  const items = [
    { label: 'Cash', value: data.cash, color: '#0C1C2E' },
    { label: 'Conventional', value: data.conventional, color: '#Bfa67a' },
    { label: 'Jumbo', value: data.jumbo, color: '#6B7280' },
    { label: 'Other', value: data.other, color: '#D1D5DB' },
  ];

  return (
    <div className="bg-white p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Banknote size={16} className="text-[#Bfa67a]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Financing Breakdown</span>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {items.map((item, i) => (
          <div key={i} className="text-center">
            <div className="w-full h-24 bg-gray-100 rounded relative overflow-hidden mb-2">
              <div
                className="absolute bottom-0 w-full transition-all duration-1000 rounded-t"
                style={{ height: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
            <span className="text-lg font-serif text-[#0C1C2E] block">{item.value}%</span>
            <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 bg-[#F9F8F6] p-4 rounded">
        <div>
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Avg Down Payment</span>
          <span className="text-xl font-serif text-[#0C1C2E]">{data.avgDownPayment}</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Avg Loan Amount</span>
          <span className="text-xl font-serif text-[#0C1C2E]">{data.avgLoanAmount}</span>
        </div>
      </div>
    </div>
  );
};

export default FinancingBreakdownChart;
