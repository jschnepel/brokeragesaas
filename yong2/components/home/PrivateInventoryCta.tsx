import Link from 'next/link';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

/**
 * Homepage CTA into the off-market signup surface. The site mentions
 * the off-market pipeline in copy across home / about / market reports
 * without a subscription path. This section names the offer and
 * routes interested visitors to `/private-inventory`.
 *
 * Position is between `TestimonialsSection` and `MarketBlurb` —
 * after social proof has warmed the audience but before the
 * editorial market-intel teaser closes the page. The CTA is the
 * single weighted action on the section so the next step is
 * unambiguous.
 */
export function PrivateInventoryCta() {
  return (
    <SectionFrame className="py-24 md:py-32 border-t border-white/5 bg-ink-surface">
      <div className="max-w-3xl">
        <CapsLabel as="div">Private inventory</CapsLabel>
        <h2 className="display-lg mt-4 text-balance text-stone tracking-[-0.005em]">
          The third of $10M+ trades that
          <br />
          <em className="font-light text-gold">never reach the MLS.</em>
        </h2>
        <p className="mt-8 text-base md:text-lg leading-relaxed text-stone/80 max-w-2xl">
          Membership transfers, architectural commissions, and long-tenure estates increasingly
          change hands by introduction. Yong&rsquo;s practice runs a quiet registry of these —
          shared by phone and email, never publicly posted.
        </p>
        <p className="mt-4 text-base leading-relaxed text-stone/70 max-w-2xl">
          Subscribe to be considered for fit-matched introductions when they surface.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/private-inventory"
            className="caps inline-flex items-center gap-3 bg-gold text-ink px-7 py-4 hover:bg-[color:var(--gold-muted)] transition-colors group"
          >
            <span>Request a conversation</span>
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            href="/market-reports"
            className="caps inline-flex items-center gap-3 text-stone/75 hover:text-gold transition-colors px-2 py-4"
          >
            <span>Read the market reports</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </SectionFrame>
  );
}
