import { Building2 } from 'lucide-react';
import { useScrollAnimation } from '../shared/useScrollAnimation';
import type { RegionalStat } from '../../models/types';

interface RegionalBenchmarkGridProps {
  data: RegionalStat[];
  localName: string;
  regionalName?: string;
  metroName?: string;
}

const RegionalBenchmarkGrid: React.FC<RegionalBenchmarkGridProps> = ({
  data,
  localName,
  regionalName = 'N. Scottsdale',
  metroName = 'Phoenix Metro',
}) => {
  const anim = useScrollAnimation();

  return (
    <div
      ref={anim.ref}
      className={`
        bg-[#0C1C2E] p-8 text-white h-full
        transition-all duration-1000
        ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-[#Bfa67a]" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Regional Benchmark Comparison</span>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">{localName} vs Market</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {data.map((stat, i) => (
          <div key={i} className="text-center">
            <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold block mb-3">{stat.metric}</span>
            <div className="space-y-2">
              <div className="bg-[#Bfa67a] px-4 py-2">
                <span className="text-[8px] uppercase tracking-widest text-white/60 font-bold block">{localName}</span>
                <span className="text-xl font-serif">{stat.local}</span>
              </div>
              <div className="bg-white/10 px-4 py-2">
                <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold block">{regionalName}</span>
                <span className="text-lg font-serif text-white/80">{stat.regional}</span>
              </div>
              <div className="bg-white/5 px-4 py-2">
                <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold block">{metroName}</span>
                <span className="text-base font-serif text-white/60">{stat.metro}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionalBenchmarkGrid;
