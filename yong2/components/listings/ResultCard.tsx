'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Listing } from '@/lib/types';
import { formatPrice, formatSqft } from '@/components/shared/formatters';

type ResultCardProps = {
  listing: Listing;
  highlighted: boolean;
  onHover: (key: string | null) => void;
  onCardClick: (key: string) => void;
};

/**
 * Compact 2-column grid card. Slightly denser than the portfolio tile so
 * we can fit the full result panel without forcing the user to scroll past
 * mostly-photo cards.
 */
export function ResultCard({ listing, highlighted, onHover, onCardClick }: ResultCardProps) {
  const headline = listing.unparsedAddress
    || `${listing.streetNumber ?? ''} ${listing.streetName ?? ''}`.trim()
    || listing.community;

  const beds = listing.bedrooms != null ? `${listing.bedrooms} bd` : null;
  const baths = listing.bathroomsTotal != null ? `${listing.bathroomsTotal} ba` : null;
  const sqft = listing.livingArea != null ? formatSqft(listing.livingArea) : null;

  return (
    <article
      data-listing-key={listing.listingKey}
      onMouseEnter={() => onHover(listing.listingKey)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onCardClick(listing.listingKey)}
      className={`group flex flex-col bg-ink-elevated border transition-all cursor-pointer ${
        highlighted
          ? 'border-gold ring-2 ring-gold/50 shadow-[0_0_20px_rgba(212,184,138,0.25)]'
          : 'border-white/10 hover:border-gold/40'
      }`}
    >
      <Link
        href={`/portfolio/${listing.slug}`}
        className="relative aspect-[4/3] overflow-hidden bg-ink"
        onClick={(e) => e.stopPropagation()}
      >
        {listing.coverPhotoUrl ? (
          <Image
            src={listing.coverPhotoUrl}
            alt={headline}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 35vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        {listing.status !== 'Active' ? (
          <span className="absolute top-2 left-2 caps bg-ink/85 px-2 py-0.5 text-[0.65rem]">
            {listing.status === 'Active Under Contract' ? 'Under Contract' : listing.status}
          </span>
        ) : null}
      </Link>
      <div className="p-3 flex flex-col gap-1">
        <div className="caps text-[0.65rem] truncate">{listing.community}</div>
        <div className="font-serif text-base text-stone leading-tight line-clamp-2">{headline}</div>
        <div className="text-gold font-medium mt-0.5">{formatPrice(listing.listPrice)}</div>
        <div className="text-xs text-mute">
          {[beds, baths, sqft].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>
    </article>
  );
}
