/**
 * Reusable ARMLS disclaimer block.
 * Renders the same visual as the original ListingDetail.tsx hardcoded version.
 */

import { getConfig } from '../../lib/compliance';

interface ARMLSDisclaimerProps {
  variant?: 'idx' | 'vow';
  compact?: boolean;
  className?: string;
}

const ARMLSDisclaimer: React.FC<ARMLSDisclaimerProps> = ({
  variant = 'idx',
  compact = false,
  className = '',
}) => {
  const config = getConfig();

  if (!config.disclaimer.enabled) return null;

  return (
    <section className={`bg-gray-50 ${compact ? 'py-6' : 'py-12'} border-y border-gray-200 ${className}`}>
      <div className={`max-w-[1700px] mx-auto ${compact ? 'px-8 lg:px-20' : 'px-12'} text-left`}>
        <div className={`flex flex-col md:flex-row items-center gap-${compact ? '4' : '8'} border border-dashed border-gray-300 ${compact ? 'p-4' : 'p-8'} rounded-sm opacity-60`}>
          {config.disclaimer.showLogo && (
            <div className="bg-[#0C1C2E] text-white p-4 font-serif text-sm tracking-widest font-black leading-none uppercase text-center shrink-0">
              ARMLS <br />
              <span className="text-[11px] opacity-40">{variant.toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase tracking-wider">
              {config.disclaimer.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ARMLSDisclaimer;
