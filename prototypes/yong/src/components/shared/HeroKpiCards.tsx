import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useScrollAnimation } from './useScrollAnimation';

export interface HeroKpiCardData {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  subtext?: string;
}

interface HeroKpiCardsProps {
  kpis: HeroKpiCardData[];
}

const HeroKpiCards: React.FC<HeroKpiCardsProps> = ({ kpis }) => {
  const anim = useScrollAnimation();

  return (
    <section ref={anim.ref} className="relative z-20 -mt-16 max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {kpis.map((stat, i) => (
          <div key={i} className="bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              {stat.trendDirection === 'up' ? (
                <TrendingUp size={20} className="text-[#Bfa67a]"/>
              ) : stat.trendDirection === 'down' ? (
                <TrendingDown size={20} className="text-[#Bfa67a]"/>
              ) : (
                <Minus size={20} className="text-[#Bfa67a]"/>
              )}
              {stat.trend && (
                <span className={`text-xs font-medium flex items-center gap-1 ${
                  stat.trendDirection === 'up' ? 'text-emerald-500' :
                  stat.trendDirection === 'down' ? 'text-rose-500' : 'text-gray-500'
                }`}>
                  {stat.trendDirection === 'up' ? <TrendingUp size={12} /> :
                   stat.trendDirection === 'down' ? <TrendingDown size={12} /> :
                   <Minus size={12} />}
                  {stat.trend}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">{stat.label}</span>
            <span className="text-3xl font-serif text-[#0C1C2E]">{stat.value}</span>
            {stat.subtext && (
              <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-1">{stat.subtext}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroKpiCards;
