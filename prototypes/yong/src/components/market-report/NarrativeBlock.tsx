import { Download, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../shared/useScrollAnimation';
import MarketGauge from './MarketGauge';

interface NarrativeBlockProps {
  title: string;
  marketLabel: string;
  narrative: string;
  conditionScore: number;
  secondaryText?: string;
}

const NarrativeBlock: React.FC<NarrativeBlockProps> = ({ title, marketLabel, narrative, conditionScore, secondaryText }) => {
  const anim = useScrollAnimation();

  return (
    <div
      ref={anim.ref}
      className={`
        bg-white p-10 h-full
        transition-all duration-1000
        ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
    >
      <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">Market Analysis</span>
      <h2 className="text-3xl md:text-4xl font-serif leading-[1.1] text-[#0C1C2E] mb-8">
        {title}: <span className="italic text-gray-400">{marketLabel}</span>
      </h2>

      <div className="prose prose-lg text-gray-500 font-light leading-relaxed mb-8 max-w-none">
        <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left first-letter:leading-none">
          {narrative}
        </p>
        {secondaryText && (
          <p className="mt-6">{secondaryText}</p>
        )}
      </div>

      <MarketGauge score={conditionScore} label={marketLabel} />

      <div className="flex flex-wrap gap-3 mt-8">
        <button className="bg-[#0C1C2E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all flex items-center gap-2">
          <Download size={14} />
          Full Report PDF
        </button>
        <button className="border border-[#0C1C2E] text-[#0C1C2E] px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#0C1C2E] hover:text-white transition-all flex items-center gap-2">
          Schedule Consultation
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default NarrativeBlock;
