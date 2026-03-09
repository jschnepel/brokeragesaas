'use client';

import { memo } from 'react';
import Link from 'next/link';
import { generateListingSlug } from '@platform/shared';
import type { ListingRecord } from '@platform/database/src/queries/listings';

function formatPrice(price: number | null): string {
  if (!price) return 'Price Upon Request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatNumber(n: number | null): string {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

/** Strip city, state, zip from full address since they're shown separately */
function streetOnly(address: string, city: string | null): string {
  if (!city) return address;
  // Try to cut at the city name (case-insensitive)
  const idx = address.toLowerCase().lastIndexOf(city.toLowerCase());
  if (idx > 0) {
    // Remove trailing comma/space before the city
    return address.slice(0, idx).replace(/[,\s]+$/, '');
  }
  return address;
}

interface ListingCardProps {
  listing: ListingRecord;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const ListingCard = memo(function ListingCard({
  listing,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: ListingCardProps) {
  const slug = generateListingSlug(listing);

  const statusLabel =
    listing.standard_status === 'Active Under Contract'
      ? 'Under Contract'
      : listing.standard_status === 'Coming Soon'
      ? 'Coming Soon'
      : listing.standard_status;

  const statusStyle =
    listing.standard_status === 'Active'
      ? 'bg-navy/80 text-white'
      : listing.standard_status === 'Active Under Contract'
      ? 'bg-gold/90 text-white'
      : listing.standard_status === 'Coming Soon'
      ? 'bg-navy text-gold'
      : 'bg-navy/60 text-white';

  return (
    <Link
      href={`/listings/${slug}`}
      className={`group block bg-white border transition-all duration-300 ${
        isHovered
          ? 'border-gold/40 shadow-lg shadow-gold/10'
          : 'border-navy/8 hover:border-navy/15 hover:shadow-md hover:shadow-black/5'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-navy/5">
        {listing.primary_photo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={listing.primary_photo_url}
            alt={listing.unparsed_address ?? 'Property photo'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream to-cream-alt">
            <svg className="w-12 h-12 text-navy/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/15 transition-colors duration-500" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`${statusStyle} backdrop-blur-sm px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold`}>
            {statusLabel}
          </span>
        </div>

        {/* Photo count */}
        {listing.photos_count && listing.photos_count > 1 && (
          <div className="absolute bottom-3 right-3">
            <span className="bg-black/40 backdrop-blur-sm text-white px-2 py-1 text-[9px] flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {listing.photos_count}
            </span>
          </div>
        )}

        {/* Price — overlaid on image bottom-left */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 shadow-sm">
            <span className="font-serif text-navy text-base">
              {formatPrice(listing.list_price)}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pt-4 pb-3">
        {/* Address — street only, city/state/zip shown below */}
        <h3 className="font-serif text-base lg:text-lg leading-tight text-navy group-hover:text-gold transition-colors duration-300">
          {listing.unparsed_address
            ? streetOnly(listing.unparsed_address, listing.city)
            : `MLS# ${listing.listing_id}`}
        </h3>

        {/* City / Location */}
        <p className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mt-1">
          {listing.city}
          {listing.state_or_province ? `, ${listing.state_or_province}` : ''}
          {listing.postal_code ? ` ${listing.postal_code}` : ''}
        </p>

        {/* Gold divider */}
        <div className={`h-px my-3 transition-all duration-500 ${
          isHovered ? 'w-12 bg-gold' : 'w-8 bg-navy/15'
        }`} />

        {/* Specs */}
        <div className="flex items-center gap-4 text-xs text-navy/60">
          {listing.bedrooms_total != null && (
            <span className="flex items-center gap-1">
              <span className="font-semibold text-navy">{listing.bedrooms_total}</span> Beds
            </span>
          )}
          {listing.bathrooms_total_integer != null && (
            <span className="flex items-center gap-1">
              <span className="font-semibold text-navy">{listing.bathrooms_total_integer}</span> Baths
            </span>
          )}
          {listing.living_area != null && (
            <span className="flex items-center gap-1">
              <span className="font-semibold text-navy">{formatNumber(listing.living_area)}</span> SF
            </span>
          )}
        </div>

        {/* Subdivision */}
        {listing.subdivision_name && (
          <p className="text-[9px] uppercase tracking-widest text-navy/25 mt-2 truncate">
            {listing.subdivision_name}
          </p>
        )}

        {/* @compliance IDX: Listing office attribution required on each search result card */}
        <p className="text-[10px] text-navy/35 mt-1 truncate">
          {listing.list_office_name}
        </p>
      </div>
    </Link>
  );
});
