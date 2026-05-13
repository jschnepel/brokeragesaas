import Image from 'next/image';
import Link from 'next/link';
import { CapsLabel } from '@/components/shared/CapsLabel';

type AgentMiniCardProps = {
  name: string;
  brokerage: string;
  photoUrl: string;
  /**
   * tel: href for the advisor's phone, e.g. `tel:+19093765494`. Pass null
   * to suppress the call button — the card then renders an "Inquire ↗"
   * action linking to the tour/contact page instead.
   */
  phoneHref: string | null;
  /** Tour-request link, pre-filled for this listing. */
  tourHref: string;
};

/**
 * Agent introduction card — sidebar ornament for the listing detail
 * page. Photo + name + brokerage + Call/Tour links. Restrained — no
 * filled buttons here; the page already has filled CTAs at the
 * bottom action row.
 */
export function AgentMiniCard({
  name,
  brokerage,
  photoUrl,
  phoneHref,
  tourHref,
}: AgentMiniCardProps) {
  return (
    <div className="bg-ink-elevated/30 p-6 md:p-8 border border-white/5 hover:border-white/15 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-full border border-gold/30">
          <Image
            src={photoUrl}
            alt={`Portrait of ${name}`}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <CapsLabel as="div" className="text-[10px] text-stone/60 mb-1">
            Your Advisor
          </CapsLabel>
          <p className="font-serif text-xl text-stone leading-tight">{name}</p>
          <p className="text-xs text-stone/55 mt-0.5">{brokerage}</p>
        </div>
      </div>
      <div className={`grid gap-2 mt-5 pt-5 border-t border-white/10 ${phoneHref ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {phoneHref ? (
          <a
            href={phoneHref}
            className="caps text-[10px] tracking-[0.3em] text-stone/85 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors text-center py-2.5 border border-white/10 hover:border-gold/40"
          >
            Call ↗
          </a>
        ) : (
          <Link
            href={tourHref}
            className="caps text-[10px] tracking-[0.3em] text-stone/85 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors text-center py-2.5 border border-white/10 hover:border-gold/40"
          >
            Inquire ↗
          </Link>
        )}
        {phoneHref ? (
          <Link
            href={tourHref}
            className="caps text-[10px] tracking-[0.3em] text-gold hover:bg-gold hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors text-center py-2.5 border border-gold/40 hover:border-gold"
          >
            Tour ↗
          </Link>
        ) : null}
      </div>
    </div>
  );
}
