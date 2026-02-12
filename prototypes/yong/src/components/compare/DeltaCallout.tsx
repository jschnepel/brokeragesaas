import { Zap } from 'lucide-react';

interface DeltaCalloutProps {
  insights: string[];
}

const DeltaCallout: React.FC<DeltaCalloutProps> = ({ insights }) => {
  if (insights.length === 0) return null;

  return (
    <div className="bg-[#0C1C2E] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={12} className="text-[#Bfa67a]" />
        <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#Bfa67a]">
          Key Insights
        </span>
      </div>
      <div className="space-y-1.5">
        {insights.map((insight, i) => (
          <p key={i} className="text-sm text-white/80 font-light leading-relaxed">
            {insight}
          </p>
        ))}
      </div>
    </div>
  );
};

export default DeltaCallout;
