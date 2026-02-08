import { BarChart3 } from 'lucide-react';
import { useScrollAnimation } from '../shared/useScrollAnimation';
import type { PriceSegment } from '../../models/types';

interface PriceSegmentBarsProps {
  data: PriceSegment[];
  title?: string;
}

const PriceSegmentBars: React.FC<PriceSegmentBarsProps> = ({ data, title = 'Inventory by Price' }) => {
  const anim = useScrollAnimation();

  return (
    <div
      ref={anim.ref}
      className={`
        bg-white p-6 h-full
        transition-all duration-1000
        ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={16} className="text-[#Bfa67a]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">{title}</span>
      </div>
      <div className="space-y-4">
        {data.map((segment, i) => (
          <div key={i} className="group cursor-pointer">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#0C1C2E] transition-colors">{segment.range}</span>
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <span className="text-[#0C1C2E]">{segment.active} Active</span>
                <span className="text-[#Bfa67a]">{segment.sold} Sold</span>
              </div>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#0C1C2E] transition-all duration-500"
                style={{ width: `${(segment.active / (segment.active + segment.sold)) * 100}%` }}
              />
              <div
                className="h-full bg-[#Bfa67a] transition-all duration-500"
                style={{ width: `${(segment.sold / (segment.active + segment.sold)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceSegmentBars;
