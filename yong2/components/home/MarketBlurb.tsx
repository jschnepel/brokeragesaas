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
    <SectionFrame className="py-24">
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-center max-w-4xl">
        <div className="font-serif text-[64px] md:text-[96px] leading-none text-gold">{market.bigStat}</div>
        <div>
          <CapsLabel as="div">{market.kicker}</CapsLabel>
          <div className="font-serif italic text-2xl mt-3">{market.bigStatLabel}</div>
          <p className="mt-4 text-stone/80 leading-relaxed max-w-xl">{market.body}</p>
          <a
            href={market.cta.href}
            onClick={() => track('cta_market_intelligence_click', {})}
            className="caps mt-6 inline-block hover:text-stone"
            rel="noopener"
          >
            {market.cta.label} →
          </a>
        </div>
      </div>
    </SectionFrame>
  );
}
