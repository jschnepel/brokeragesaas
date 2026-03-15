'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ListingRecord } from '@platform/database/src/queries/listings';
import { generateListingSlug } from '@platform/shared';

interface CommunityFeaturedListingProps {
  listing: ListingRecord;
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price on Request';
  return `$${price.toLocaleString()}`;
}

function formatLot(acres: number | null): string {
  if (!acres) return '—';
  return `${acres.toFixed(2)} Acres`;
}

export function CommunityFeaturedListing({ listing }: CommunityFeaturedListingProps) {
  const slug = generateListingSlug(listing);
  const detailHref = `/listings/${slug}`;

  return (
    <section className="py-16 md:py-32 max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
      <div className="flex flex-col lg:flex-row shadow-2xl shadow-black/5">
        {/* Image */}
        <div className="lg:w-7/12 h-[350px] md:h-[500px] lg:h-[700px] relative overflow-hidden group">
          {listing.primary_photo_url ? (
            <img
              src={listing.primary_photo_url}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              alt={listing.unparsed_address ?? 'Featured listing'}
            />
          ) : (
            <div className="w-full h-full bg-cream-alt flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                No Photo Available
              </span>
            </div>
          )}
          <div className="absolute top-6 left-6 flex gap-2">
            <span className="bg-navy text-white px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold">
              Featured Listing
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="lg:w-5/12 bg-navy text-white p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8 text-gold text-[10px] uppercase tracking-[0.3em] font-bold">
            <div className="w-8 h-px bg-gold" />
            Primary Offering
          </div>

          <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-6 leading-tight">
            {listing.unparsed_address ?? 'Address Withheld'}
          </h3>

          <div className="grid grid-cols-2 gap-y-8 gap-x-4 border-t border-white/10 pt-8 mb-12">
            <div>
              <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">
                List Price
              </span>
              <span className="text-2xl font-serif">{formatPrice(listing.list_price)}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">
                Interior
              </span>
              <span className="text-2xl font-serif">
                {listing.living_area ? `${listing.living_area.toLocaleString()} SF` : '—'}
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">
                Lot Size
              </span>
              <span className="text-2xl font-serif">{formatLot(listing.lot_size_acres)}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1">
                Config
              </span>
              <span className="text-2xl font-serif">
                {listing.bedrooms_total ?? '—'}BD / {listing.bathrooms_total_integer ?? '—'}BA
              </span>
            </div>
          </div>

          <Link
            href={detailHref}
            className="bg-white text-navy py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-gold hover:text-white transition-all flex justify-between px-6 items-center group"
          >
            View Full Details
            <ArrowUpRight
              className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              size={16}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
