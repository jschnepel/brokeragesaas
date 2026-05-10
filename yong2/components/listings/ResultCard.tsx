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

// UTC-locked formatter so server (UTC) and client (local TZ) agree on
// the rendered string. Using toLocaleDateString without timeZone:'UTC'
// produced React #418 hydration text mismatches when a timestamp
// straddled midnight UTC (e.g. 2026-05-08T23:30Z renders as May 8 on the
// server and May 9 on the client in any TZ east of UTC).
const UPDATED_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatUpdated(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return UPDATED_FORMATTER.format(d);
}

/**
 * Compact 2-column grid card.
 *
 * @compliance IDX (ARMLS): "Listed by {agent}, {office}" line and the
 *   last-updated timestamp are mandatory display elements on each
 *   IDX search-result card. Both render at 12px (text-[12px]) per
 *   the ≥12px font rule. Do not remove without legal review.
 */
export function ResultCard({ listing, highlighted, onHover, onCardClick }: ResultCardProps) {
  const headline = listing.unparsedAddress
    || `${listing.streetNumber ?? ''} ${listing.streetName ?? ''}`.trim()
    || listing.community;

  const beds = listing.bedrooms != null ? `${listing.bedrooms} bd` : null;
  const baths = listing.bathroomsTotal != null ? `${listing.bathroomsTotal} ba` : null;
  const sqft = listing.livingArea != null ? formatSqft(listing.livingArea) : null;

  const updated = formatUpdated(listing.modificationTimestamp);
  const attribution =
    listing.listAgentName || listing.listAgentKey
      ? `Listed by ${listing.listAgentName ?? 'Agent'}`
      : null;

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
        href={`/listings/${listing.slug}`}
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
        {(attribution || updated) && (
          <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
            {attribution && (
              <p className="text-[12px] text-stone/65 leading-tight truncate">
                {attribution}
              </p>
            )}
            {updated && (
              <p className="text-[12px] text-stone/45 leading-tight tabular-nums">
                Updated {updated}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
