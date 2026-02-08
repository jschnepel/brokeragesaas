import { Target, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { PricingSuccess } from '../../models/types';

interface PricingSuccessTripleProps {
  data: PricingSuccess;
}

const PricingSuccessTriple: React.FC<PricingSuccessTripleProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Target size={16} className="text-[#Bfa67a]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Pricing Success Analysis</span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-[#F9F8F6] border-t-2 border-[#Bfa67a]">
          <ArrowUp size={18} className="text-[#Bfa67a] mx-auto mb-2" />
          <span className="text-2xl font-serif text-[#0C1C2E] block">{data.aboveList}%</span>
          <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Above List</span>
          <span className="text-[10px] text-[#Bfa67a] font-bold block mt-1">{data.avgOverList}</span>
        </div>
        <div className="text-center p-4 bg-[#F9F8F6] border-t-2 border-[#0C1C2E]">
          <Minus size={18} className="text-[#0C1C2E] mx-auto mb-2" />
          <span className="text-2xl font-serif text-[#0C1C2E] block">{data.atList}%</span>
          <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">At List</span>
          <span className="text-[10px] text-[#0C1C2E] font-bold block mt-1">Full Price</span>
        </div>
        <div className="text-center p-4 bg-[#F9F8F6] border-t-2 border-gray-300">
          <ArrowDown size={18} className="text-gray-400 mx-auto mb-2" />
          <span className="text-2xl font-serif text-[#0C1C2E] block">{data.belowList}%</span>
          <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Below List</span>
          <span className="text-[10px] text-gray-500 font-bold block mt-1">{data.avgUnderList}</span>
        </div>
      </div>
      <div className="bg-[#F9F8F6] p-4 rounded">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Key Insight</span>
        <p className="text-sm text-gray-600">Half of all sales close below asking price, averaging 3.8% under list. Proper pricing strategy is critical.</p>
      </div>
    </div>
  );
};

export default PricingSuccessTriple;
