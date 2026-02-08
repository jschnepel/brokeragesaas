import { useScrollAnimation } from '../shared/useScrollAnimation';
import type { LuxuryTier } from '../../models/types';

interface LuxuryTierCardsProps {
  tiers: LuxuryTier[];
}

const LuxuryTierCards: React.FC<LuxuryTierCardsProps> = ({ tiers }) => {
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
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Luxury Tier Analysis</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-gray-200">
        {tiers.map((tier, i) => (
          <div
            key={i}
            className={`
              bg-white p-6 border-t-4
              transition-all duration-500
              ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              ${i === 0 ? 'border-[#Bfa67a]' : i === 1 ? 'border-[#0C1C2E]' : i === 2 ? 'border-gray-400' : 'border-gray-300'}
            `}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="text-center mb-4">
              <span className="text-2xl font-serif text-[#0C1C2E] block">{tier.threshold}</span>
              <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">{tier.label}</span>
            </div>
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Active</span>
                <span className="text-sm font-serif text-[#0C1C2E]">{tier.activeListing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Sold (Q4)</span>
                <span className="text-sm font-serif text-[#Bfa67a]">{tier.soldLastQuarter}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Avg DOM</span>
                <span className="text-sm font-serif text-[#0C1C2E]">{tier.avgDOM} days</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LuxuryTierCards;
