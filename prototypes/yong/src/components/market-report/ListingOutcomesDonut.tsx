import { CheckCircle2 } from 'lucide-react';
import type { ListingMetrics } from '../../models/types';

interface ListingOutcomesDonutProps {
  data: ListingMetrics;
}

const ListingOutcomesDonut: React.FC<ListingOutcomesDonutProps> = ({ data }) => {
  return (
    <div className="bg-[#0C1C2E] p-6 text-white h-full">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle2 size={16} className="text-[#Bfa67a]" />
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Listing Outcomes</span>
      </div>

      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff10" strokeWidth="12" />
          <circle
            cx="50" cy="50" r="40" fill="none" stroke="#Bfa67a" strokeWidth="12"
            strokeDasharray={`${data.successRate * 2.51} 251`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-serif text-[#Bfa67a]">{data.successRate}%</span>
          <span className="text-[8px] uppercase tracking-widest text-white/60">Success Rate</span>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Total Listed', value: data.totalListed },
          { label: 'Sold', value: data.sold },
          { label: 'Pending', value: data.pending },
          { label: 'Expired', value: data.expired },
          { label: 'Withdrawn', value: data.withdrawn },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-white/60">{item.label}</span>
            <span className="text-sm font-serif">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingOutcomesDonut;
