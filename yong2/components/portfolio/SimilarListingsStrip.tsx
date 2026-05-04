import Link from 'next/link';
import Image from 'next/image';
import { CapsLabel } from '@/components/shared/CapsLabel';

export type SimilarListingTile = {
  slug: string;
  address: string;
  community: string;
  price: number | null;
  imageUrl: string;
  beds: number;
  baths: number;
  livingArea: number;
};

type SimilarListingsStripProps = {
  listings: ReadonlyArray<SimilarListingTile>;
};

const DOLLAR = (n: number | null) =>
  n != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
    : 'Price Upon Request';

/**
 * Three-card strip beneath The Read — surfaces nearby comparable
 * inventory so the visitor's session continues if this listing
 * isn't the right fit. Card design mirrors the FeaturedPortfolio
 * tiles on the landing for visual consistency.
 *
 * Renders nothing if `listings.length === 0`.
 */
export function SimilarListingsStrip({ listings }: SimilarListingsStripProps) {
  if (listings.length === 0) return null;
  return (
    <section data-track="similar" className="border-t border-white/10 pt-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <CapsLabel as="div">Other offerings</CapsLabel>
          <h2 className="display-lg italic mt-3">You may also consider.</h2>
        </div>
        <Link
          href="/portfolio"
          className="caps hover:text-gold transition-colors"
        >
          View all listings →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {listings.map((l) => (
          <Link
            key={l.slug}
            href={`/portfolio/${l.slug}`}
            className="relative aspect-[4/5] overflow-hidden bg-ink-elevated group"
          >
            <Image
              src={l.imageUrl}
              alt={l.address}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-[900ms] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="caps mb-1">{l.community}</div>
              <div className="font-serif text-lg leading-tight">{l.address}</div>
              <div className="caps text-stone/85 mt-1">{DOLLAR(l.price)}</div>
              <div className="text-xs text-stone/65 mt-1">
                {l.beds} bd · {l.baths} ba · {l.livingArea.toLocaleString()} sf
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
