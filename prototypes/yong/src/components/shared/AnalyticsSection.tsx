import type { ReactNode } from 'react';

type SectionBg = 'white' | 'cream' | 'navy';
type ComplianceTier = 'idx' | 'vow' | 'mixed';

interface AnalyticsSectionProps {
  bg?: SectionBg;
  label?: string;
  title?: string;
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

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  bg = 'white',
  label,
  title,
  tier,
  children,
  className = '',
}) => {
  const isNavy = bg === 'navy';

  return (
    <section className={`${BG_CLASSES[bg]} py-20 ${className}`}>
      <div className="max-w-[1400px] mx-auto px-8 lg:px-24">
        {(label || title || tier) && (
          <div className="flex items-start justify-between mb-12">
            <div>
              {label && (
                <span className={`text-[10px] uppercase tracking-[0.3em] font-bold block mb-4 ${isNavy ? 'text-[#Bfa67a]' : 'text-[#Bfa67a]'}`}>
                  {label}
                </span>
              )}
              {title && (
                <h2 className={`text-3xl lg:text-4xl font-serif ${isNavy ? 'text-white' : 'text-[#0C1C2E]'}`}>
                  {title}
                </h2>
              )}
            </div>
            {tier && (
              <span className={`text-[9px] uppercase tracking-[0.2em] font-bold px-3 py-1.5 rounded-sm shrink-0 ${TIER_BADGE[tier].color}`}>
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

export default AnalyticsSection;
