'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Listing } from '@/lib/types';
import { FadeImage } from '@/components/shared/FadeImage';
import { formatPrice, formatSqft } from '@/components/shared/formatters';
import { useSavedListing } from '@/components/portfolio/HeroTopBar';

/**
 * Substring fingerprint of the host brokerage. Any listing whose
 * ListOfficeName contains this is FROM Russ Lyon and therefore does
 * NOT need the ARMLS IDX mark (ARMLS rules: only IDX listings from
 * OTHER brokerages require the IDX logo near the data). Substring
 * because ARMLS records the office name with various suffixes
 * ('Russ Lyon Sotheby's', 'Russ Lyon Sotheby's Intl Realty', etc.).
 */
const HOST_BROKERAGE_FINGERPRINT = 'russ lyon';

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
  // ARMLS IDX rule § Attribution: "Listing Brokerage Name MANDATORY"
  // on every search-result card. Render the listing office name
  // alongside the agent name — "Listed by {agent}, {office}". Truncate
  // long office names so the row doesn't wrap to three lines on small
  // cards; the full name shows on the detail page footer.
  const attributionAgent = listing.listAgentName ?? (listing.listAgentKey ? 'Agent' : null);
  const attribution = attributionAgent
    ? listing.listOfficeName
      ? `Listed by ${attributionAgent}, ${listing.listOfficeName}`
      : `Listed by ${attributionAgent}`
    : null;
  // IDX mark surfaces only on listings held by brokerages OTHER than
  // the host (Russ Lyon). Per ARMLS Rules § IDX display: in-house
  // listings don't require the IDX mark; third-party IDX listings do.
  // Fingerprint match is intentionally permissive on suffix variants.
  const isThirdPartyIdx = !(
    listing.listOfficeName?.toLowerCase().includes(HOST_BROKERAGE_FINGERPRINT)
  );

  const { isSaved, toggle: toggleSaved } = useSavedListing(listing.listingKey, {
    slug: listing.slug,
    address: headline,
    community: listing.community,
    price: listing.listPrice,
    imageUrl: listing.coverPhotoUrl,
    beds: listing.bedrooms,
    baths:
      typeof listing.bathroomsTotal === 'number' ? listing.bathroomsTotal : null,
    livingArea: listing.livingArea,
  });

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
          // Cards lazy-load by default (next/image) — only the cards
          // currently in the viewport request bytes. FadeImage fades
          // each card photo in once it decodes so as the visitor scrolls
          // and Load More fires, new cards reveal cinematically rather
          // than popping in.
          <FadeImage
            src={listing.coverPhotoUrl}
            alt={headline}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 35vw, 50vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        {listing.status !== 'Active' ? (
          <span className="absolute top-2 left-2 caps bg-ink/85 px-2 py-0.5 text-[0.65rem]">
            {listing.status === 'Active Under Contract' ? 'Under Contract' : listing.status}
          </span>
        ) : null}
        {/* Save heart — absolute-positioned on the photo so it
         *  doesn't compete with the address row. Stops navigation
         *  propagation so clicking the heart doesn't open the
         *  detail page. */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSaved();
          }}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remove from saved' : 'Save this listing'}
          className={`absolute top-2 right-2 w-9 h-9 rounded-full backdrop-blur-sm border flex items-center justify-center transition-colors ${
            isSaved
              ? 'bg-gold/90 text-ink border-gold'
              : 'bg-ink/55 text-stone border-white/20 hover:bg-ink/80 hover:border-gold hover:text-gold'
          }`}
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill={isSaved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </Link>
      <div className="p-3 flex flex-col gap-1">
        <div className="caps text-[0.65rem] truncate">{listing.community}</div>
        <div className="font-serif text-base text-stone leading-tight line-clamp-2">{headline}</div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-gold font-medium mt-0.5">{formatPrice(listing.listPrice)}</div>
          {/* ARMLS IDX mark — only on listings held by other brokerages.
           *  Sits in the price row so it reads as a compliance tag, not
           *  a decorative element. Light-mode pill preserves the
           *  crimson trademark color against the dark card. */}
          {isThirdPartyIdx ? (
            <span
              className="inline-flex items-center bg-stone/95 rounded-sm px-1.5 py-0.5 shrink-0"
              aria-label="ARMLS IDX listing"
              title="Listing courtesy of ARMLS"
            >
              <Image
                src="/images/armls-idx-logo.png"
                alt=""
                width={44}
                height={11}
                unoptimized
              />
            </span>
          ) : null}
        </div>
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
