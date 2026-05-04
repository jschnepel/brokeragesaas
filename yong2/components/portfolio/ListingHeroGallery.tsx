'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Listing } from '@/lib/types';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { ListingLightbox } from './ListingLightbox';
import { track } from '@/lib/analytics/events';
import {
  formatPrice,
  formatBeds,
  formatBaths,
  formatSqft,
  formatAcres,
} from '@/components/shared/formatters';

/**
 * Filter to remove non-photo URLs (tour-factory, virtual-tour iframes etc.)
 * that occasionally end up in the ARMLS photo array. We only keep URLs that
 * look like actual image files OR are from the Spark CDN photos host (which
 * always serves images even when the path lacks an extension).
 */
function isPhotoUrl(url: string): boolean {
  // Same-origin public assets (e.g. /mock-listing/foo.jpg from the
  // preview page, or /hero/foo.jpg from any first-party gallery).
  // `new URL()` rejects these because they have no origin to parse.
  if (url.startsWith('/') && /\.(jpe?g|png|webp|avif|gif)$/i.test(url)) {
    return true;
  }
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('sparkplatform.com')) return true;
    return /\.(jpe?g|png|webp|avif|gif)$/i.test(u.pathname);
  } catch {
    return false;
  }
}

type ListingHeroGalleryProps = {
  listing: Listing;
  photos: string[];
};

/**
 * Listing detail hero — single hero photo (desktop) / horizontal snap-gallery
 * (mobile) with a 4-up thumbnail strip below. Clicking the hero or any
 * thumbnail opens the fullscreen lightbox at the corresponding index.
 *
 * Adapted from the premium-site HeroGallery to yong2's Midnight & Stone palette
 * (ink/stone/gold instead of navy/white/gold).
 */
export function ListingHeroGallery({ listing, photos: rawPhotos }: ListingHeroGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Defensive: drop any non-image URLs (e.g., virtual-tour links) so neither
  // next/image (strict remotePatterns check) nor the lightbox break.
  const photos = rawPhotos.filter(isPhotoUrl);

  const headline =
    listing.unparsedAddress
      || `${listing.streetNumber ?? ''} ${listing.streetName ?? ''}`.trim()
      || listing.community;

  const kicker =
    listing.communityName
    ?? listing.subdivisionDisplay
    ?? listing.city
    ?? '';
  const cityLine = listing.city
    ? `${listing.city}, AZ${listing.postalCode ? ` ${listing.postalCode}` : ''}`
    : '';

  const quickStats: string[] = [];
  if (listing.bedrooms != null) quickStats.push(formatBeds(listing.bedrooms));
  if (listing.bathroomsTotal != null) quickStats.push(formatBaths(listing.bathroomsTotal));
  if (listing.livingArea != null) quickStats.push(formatSqft(listing.livingArea));
  if (listing.lotAcres != null) quickStats.push(formatAcres(listing.lotAcres));

  const openLightbox = (index: number) => {
    track('gallery_open', { listingKey: listing.listingKey, initialIndex: index });
    setLightboxIndex(index);
  };
  const closeLightbox = () => setLightboxIndex(null);

  // Empty fallback — solid hero with overlay only.
  if (photos.length === 0) {
    return (
      <section className="relative w-full h-[65vh] min-h-[480px] overflow-hidden">
        <div className="absolute inset-0 bg-ink-elevated" />
        <HeroOverlay
          kicker={kicker}
          cityRegion={kicker && listing.city && kicker !== listing.city ? `${listing.city}` : ''}
          headline={headline}
          cityLine={cityLine}
          price={formatPrice(listing.listPrice)}
          quickStats={quickStats}
          mlsId={listing.listingId}
        />
      </section>
    );
  }

  const heroPhoto = photos[0];
  // Three regular thumbs (indices 1-3) plus a fourth "+N" tile (index 4) when
  // the gallery has more than 4 photos. If photos.length ≤ 4, the strip just
  // shows whatever thumbs we have.
  const regularThumbs = photos.slice(1, 4);
  const moreTilePhoto = photos.length > 4 ? photos[4] : null;
  const remaining = Math.max(0, photos.length - 4);

  return (
    <>
      <section
        className="relative w-full overflow-hidden"
        style={{ height: '65vh', minHeight: '480px' }}
      >
        {/* Desktop hero photo */}
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="hidden md:block absolute inset-0 w-full h-full cursor-pointer group"
          aria-label="Open photo gallery"
        >
          <Image
            src={heroPhoto}
            alt={headline}
            fill
            priority
            fetchPriority="high"
            quality={70}
            sizes="100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </button>

        {/* Mobile snap gallery (first 5) */}
        <div
          className="md:hidden absolute inset-0 w-full h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory flex"
          aria-label="Photo gallery — swipe to view more"
        >
          {photos.slice(0, 5).map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openLightbox(i)}
              className="w-full h-full flex-shrink-0 snap-center"
              aria-label={`Open photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`${headline} photo ${i + 1}`}
                className="w-full h-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </button>
          ))}
        </div>

        {/* Gradient over hero photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent pointer-events-none" />

        {/* Mobile photo count badge — total only (not "current / total")
         * since the swipe scrollbar already handles position cuing and
         * a static "1 of N" was actively misleading as the user swiped. */}
        {photos.length > 1 ? (
          <div className="md:hidden absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <span className="caps text-stone bg-ink/60 backdrop-blur-sm px-3 py-1.5 text-[10px]">
              {photos.length} photos · swipe
            </span>
          </div>
        ) : null}

        {/* MLS# top-right */}
        <div className="absolute top-24 lg:top-28 right-4 md:right-6 lg:right-12 z-10 pointer-events-none">
          <span className="caps text-stone/40 text-[10px]">MLS# {listing.listingId}</span>
        </div>

        {/* Hero overlay (anchored bottom-left) */}
        <HeroOverlay
          kicker={kicker}
          cityRegion={listing.city && kicker !== listing.city ? listing.city : ''}
          headline={headline}
          cityLine={cityLine}
          price={formatPrice(listing.listPrice)}
          quickStats={quickStats}
          mlsId={null}
        />
      </section>

      {/* Thumbnail strip (desktop only) */}
      {photos.length > 1 ? (
        <div className="hidden md:grid grid-cols-4 gap-px bg-ink">
          {regularThumbs.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openLightbox(i + 1)}
              className="relative aspect-[16/9] overflow-hidden group/thumb cursor-pointer"
              aria-label={`Open photo ${i + 2}`}
            >
              <Image
                src={url}
                alt={`${headline} photo ${i + 2}`}
                fill
                sizes="(min-width: 768px) 25vw, 100vw"
                className="object-cover group-hover/thumb:scale-[1.04] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent pointer-events-none" />
            </button>
          ))}
          {/* "+N photos" overlay tile (4th column) when there are more photos */}
          {moreTilePhoto ? (
            <button
              type="button"
              onClick={() => openLightbox(4)}
              className="relative aspect-[16/9] overflow-hidden cursor-pointer group/more"
              aria-label={`View all ${photos.length} photos`}
            >
              <Image
                src={moreTilePhoto}
                alt=""
                fill
                sizes="(min-width: 768px) 25vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-ink/70 group-hover/more:bg-ink/60 transition-colors flex items-center justify-center">
                <span className="caps text-stone text-sm">+{remaining} photos</span>
              </div>
            </button>
          ) : (
            // Fewer than 5 total photos — fill any empty 4th column for layout
            // parity. (3-photo case: 2 regular thumbs + 2 empties.)
            Array.from({ length: 4 - regularThumbs.length }).map((_, i) => (
              <div key={`empty-${i}`} className="relative aspect-[16/9] bg-ink-elevated" />
            ))
          )}
        </div>
      ) : null}

      {lightboxIndex !== null ? (
        <ListingLightbox
          photos={photos}
          address={headline}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
          listingKey={listing.listingKey}
        />
      ) : null}
    </>
  );
}

function HeroOverlay({
  kicker,
  cityRegion,
  headline,
  cityLine,
  price,
  quickStats,
  mlsId,
}: {
  kicker: string;
  cityRegion: string;
  headline: string;
  cityLine: string;
  price: string;
  quickStats: string[];
  mlsId: string | null;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 pb-12 md:pb-16 z-10 pointer-events-none">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
        {kicker ? (
          <CapsLabel as="div">
            {kicker}{cityRegion ? ` · ${cityRegion}` : ''}
          </CapsLabel>
        ) : null}
        <h1 className="display-xl mt-4 text-stone">
          <em className="font-light">{headline}</em>
        </h1>
        {cityLine ? (
          <p className="text-stone/70 text-sm mt-2">{cityLine}</p>
        ) : null}
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mt-4">
          <span className="font-serif text-2xl md:text-3xl text-stone">{price}</span>
          {quickStats.length > 0 ? (
            <span className="text-stone/60 text-sm">
              {quickStats.join(' · ')}
            </span>
          ) : null}
        </div>
        {mlsId ? (
          <span className="caps text-stone/40 text-[10px] block mt-3">MLS# {mlsId}</span>
        ) : null}
      </div>
    </div>
  );
}
