import { Clock } from 'lucide-react';
import type { DomBucket } from '../../models/types';

interface DomDistributionBarsProps {
  data: DomBucket[];
  avgDom?: number;
}

const DomDistributionBars: React.FC<DomDistributionBarsProps> = ({ data, avgDom }) => {
  return (
    <div className="bg-white p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={16} className="text-[#Bfa67a]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Days on Market</span>
      </div>
      <div className="space-y-4">
        {data.map((bucket, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">{bucket.range}</span>
              <span className="text-sm font-bold text-[#0C1C2E]">{bucket.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#Bfa67a] rounded-full transition-all duration-1000"
                style={{ width: `${bucket.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {avgDom !== undefined && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex justify-between">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Avg Days</span>
            <span className="text-lg font-serif text-[#0C1C2E]">{avgDom}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DomDistributionBars;
