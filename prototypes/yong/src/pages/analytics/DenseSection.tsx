import type { ReactNode } from 'react';

type SectionBg = 'white' | 'cream' | 'navy';
type ComplianceTier = 'idx' | 'vow' | 'mixed';

interface DenseSectionProps {
  bg?: SectionBg;
  label?: string;
  tier?: ComplianceTier;
  children: ReactNode;
  className?: string;
}

const BG_CLASSES: Record<SectionBg, string> = {
  white: 'bg-white',
  cream: 'bg-[#F9F8F6]',
  navy: 'bg-[#0C1C2E]',
};

const TIER_BADGE: Record<ComplianceTier, { text: string; color: string }> = {
  idx: { text: 'IDX', color: 'bg-emerald-100 text-emerald-700' },
  vow: { text: 'VOW', color: 'bg-amber-100 text-amber-700' },
  mixed: { text: 'IDX / VOW', color: 'bg-blue-100 text-blue-700' },
};

const DenseSection: React.FC<DenseSectionProps> = ({
  bg = 'white',
  label,
  tier,
  children,
  className = '',
}) => {
  const isNavy = bg === 'navy';

  return (
    <section className={`${BG_CLASSES[bg]} py-6 ${className}`}>
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {(label || tier) && (
          <div className="flex items-center justify-between mb-3">
            {label && (
              <span className={`text-[9px] uppercase tracking-[0.2em] font-bold ${isNavy ? 'text-white/50' : 'text-gray-400'}`}>
                {label}
              </span>
            )}
            {tier && (
              <span className={`text-[8px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 rounded-sm ${TIER_BADGE[tier].color}`}>
                {TIER_BADGE[tier].text}
              </span>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

export default DenseSection;
