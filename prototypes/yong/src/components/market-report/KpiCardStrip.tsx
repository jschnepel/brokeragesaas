import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useScrollAnimation } from '../shared/useScrollAnimation';
import type { KpiMetric } from '../../models/types';

interface KpiCardStripProps {
  kpis: KpiMetric[];
}

const KpiCardStrip: React.FC<KpiCardStripProps> = ({ kpis }) => {
  const anim = useScrollAnimation();

  return (
    <section ref={anim.ref} className="relative z-20 -mt-16 max-w-[1600px] mx-auto px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-gray-200 shadow-2xl shadow-black/20">
        {kpis.map((stat, i) => (
          <div
            key={i}
            className={`
              bg-white p-8 border-t-4 border-[#Bfa67a]
              transition-all duration-500
              ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">{stat.label}</span>
              {stat.trendDirection === 'up' ? (
                <TrendingUp size={16} className="text-emerald-600"/>
              ) : stat.trendDirection === 'down' ? (
                <TrendingDown size={16} className="text-[#0C1C2E]"/>
              ) : (
                <Minus size={16} className="text-gray-300"/>
              )}
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-serif text-[#0C1C2E]">{stat.value}</span>
              <span className={`text-xs font-bold ${
                stat.trendDirection === 'up' ? 'text-emerald-600' :
                stat.trendDirection === 'down' ? 'text-[#0C1C2E]' : 'text-gray-500'
              }`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide">{stat.subtext}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default KpiCardStrip;
