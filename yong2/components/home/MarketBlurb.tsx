'use client';

import { homeContent } from '@/content/home';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { track } from '@/lib/analytics/events';

/**
 * Home market-intelligence teaser. Now a client component so the "Read the
 * Reports" CTA can fire `cta_market_intelligence_click` before nav. The
 * link is internal (/market-reports) so the global anchor delegate would
 * skip it — explicit handler is required.
 */
export function MarketBlurb() {
  const { market } = homeContent;
  return (
    <SectionFrame className="py-24 md:py-28">
      <div className="grid grid-cols-1 md:grid-cols-[auto_auto_1fr] gap-6 md:gap-10 items-center max-w-4xl">
        <div
          className="font-serif leading-none text-gold"
          style={{ fontSize: 'clamp(56px, 10vw, 104px)' }}
        >
          {market.bigStat}
        </div>
        {/* Vertical gold rule between the big stat and the editorial copy
         * — separates the figure from the prose without a heavy divider.
         * Hidden on mobile where the layout stacks. */}
        <span aria-hidden="true" className="hidden md:block w-px h-24 bg-gold/30" />
        <div>
          <CapsLabel as="div">{market.kicker}</CapsLabel>
          <div className="font-serif italic text-2xl mt-3 text-balance">{market.bigStatLabel}</div>
          <p className="mt-4 text-stone/80 leading-relaxed max-w-xl">{market.body}</p>
          <a
            href={market.cta.href}
            onClick={() => track('cta_market_intelligence_click', {})}
            className="cta-ghost mt-6"
            rel="noopener"
          >
            <span>{market.cta.label}</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </SectionFrame>
  );
}
