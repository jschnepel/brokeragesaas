'use client';

import Image from 'next/image';
import Link from 'next/link';
import { homeContent } from '@/content/home';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { track } from '@/lib/analytics/events';

type FeaturedListing = {
  slug: string;
  address: string;
  community: string;
  price: number | null;
  imageUrl: string | null;
  tag?: string;
  /**
   * Listing key — optional only because the home query may evolve. When
   * present we use it for `result_card_click` so the home → detail funnel
   * is stitchable to the listing-level events.
   */
  listingKey?: string;
};

type FeaturedPortfolioProps = { listings: FeaturedListing[] };

/**
 * Home-page "Now offering" tiles. Made client so each tile can fire a
 * typed `result_card_click` before navigating — the source dimension on
 * the resulting `listing_view` (derived from the referrer) tells us
 * which entry point converted.
 */
export function FeaturedPortfolio({ listings }: FeaturedPortfolioProps) {
  const { portfolio } = homeContent;
  return (
    <SectionFrame className="py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <CapsLabel as="div">{portfolio.kicker}</CapsLabel>
          <h2 className="display-lg italic mt-3">{portfolio.headline}</h2>
        </div>
        <Link href={portfolio.cta.href} className="caps hover:text-gold transition-colors hidden md:inline">
          {portfolio.cta.label} →
        </Link>
      </div>
      {listings.length === 0 ? (
        <div className="border border-white/10 px-8 py-16 text-center">
          <p className="font-serif italic text-stone/80 text-xl">Inventory refreshes daily.</p>
          <Link
            href={portfolio.cta.href}
            className="caps inline-block mt-6 hover:text-gold transition-colors"
          >
            Visit the Portfolio →
          </Link>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((l, index) => (
          <Link
            key={l.slug}
            href={`/portfolio/${l.slug}`}
            onClick={() =>
              track('result_card_click', {
                // Fall back to slug for analytics-only ID continuity if the
                // upstream query hasn't been updated to surface listingKey yet.
                listingKey: l.listingKey ?? l.slug,
                position: index,
              })
            }
            className="relative aspect-[4/5] overflow-hidden bg-ink-elevated group"
          >
            {l.imageUrl ? (
              <Image
                src={l.imageUrl}
                alt={l.address}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-[900ms] group-hover:scale-105"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            {l.tag ? (
              <span className="absolute top-3 left-3 caps bg-ink/70 px-2 py-1">{l.tag}</span>
            ) : null}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="caps mb-1">{l.community}</div>
              <div className="font-serif text-lg leading-tight">{l.address}</div>
              <div className="caps text-stone/80 mt-1">
                {l.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(l.price) : 'Price Upon Request'}
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}
      {/* Mobile-only trailing CTA — desktop pattern hides it (the header
       * row CTA covers it); mobile needs the affordance below the grid. */}
      {listings.length > 0 && (
        <div className="md:hidden mt-8 text-center">
          <Link href={portfolio.cta.href} className="caps hover:text-gold transition-colors">
            {portfolio.cta.label} →
          </Link>
        </div>
      )}
    </SectionFrame>
  );
}
