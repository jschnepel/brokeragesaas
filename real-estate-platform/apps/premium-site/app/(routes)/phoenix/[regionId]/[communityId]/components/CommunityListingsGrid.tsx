'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, BedDouble, ShowerHead, Maximize2 } from 'lucide-react';
import type { ListingRecord } from '@platform/database/src/queries/listings';
import { generateListingSlug } from '@platform/shared';

const ITEMS_PER_PAGE = 3;

interface CommunityListingsGridProps {
  listings: ListingRecord[];
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price on Request';
  return `$${price.toLocaleString()}`;
}

function statusBadgeClass(status: string): string {
  if (status === 'Active') return 'bg-white/95 text-navy';
  if (status === 'Pending') return 'bg-gold text-white';
  return 'bg-navy text-white';
}

export function CommunityListingsGrid({ listings }: CommunityListingsGridProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = Math.max(1, Math.ceil(listings.length / ITEMS_PER_PAGE));

  const currentListings = listings.slice(
    currentSlide * ITEMS_PER_PAGE,
    (currentSlide + 1) * ITEMS_PER_PAGE
  );

  const prevSlide = () => setCurrentSlide((p) => (p > 0 ? p - 1 : totalSlides - 1));
  const nextSlide = () => setCurrentSlide((p) => (p < totalSlides - 1 ? p + 1 : 0));

  if (listings.length === 0) return null;

  return (
    <section className="py-24 bg-cream-alt">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 md:mb-16">
          <div>
            <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">
              Available Properties
            </span>
            <h2 className="text-3xl font-serif text-navy">Current Inventory</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">
              {currentSlide + 1} / {totalSlides}
            </span>
            <button
              onClick={prevSlide}
              className="p-4 bg-white border border-gray-200 hover:border-navy hover:bg-navy hover:text-white transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextSlide}
              className="p-4 bg-white border border-gray-200 hover:border-navy hover:bg-navy hover:text-white transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentListings.map((listing) => {
            const slug = generateListingSlug(listing);
            return (
              <Link
                key={listing.listing_key}
                href={`/listings/${slug}`}
                className="bg-white group cursor-pointer transition-all duration-500 hover:shadow-xl hover:-translate-y-1 block"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  {listing.primary_photo_url ? (
                    <img
                      src={listing.primary_photo_url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={listing.unparsed_address ?? ''}
                    />
                  ) : (
                    <div className="w-full h-full bg-cream flex items-center justify-center">
                      <span className="text-[10px] uppercase tracking-widest text-gray-400">
                        No Photo
                      </span>
                    </div>
                  )}
                  <div
                    className={`absolute top-4 right-4 backdrop-blur px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${statusBadgeClass(listing.standard_status)}`}
                  >
                    {listing.standard_status}
                  </div>
                </div>

                <div className="p-5 md:p-8">
                  <div className="mb-6">
                    <p className="text-2xl font-serif text-navy mb-1">
                      {formatPrice(listing.list_price)}
                    </p>
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-800 mb-6 truncate group-hover:text-gold transition-colors">
                    {listing.unparsed_address}
                  </h4>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 border-t border-gray-100 pt-6">
                    <span className="flex items-center gap-2">
                      <BedDouble size={14} className="text-gold" /> {listing.bedrooms_total ?? '—'}
                    </span>
                    <span className="flex items-center gap-2">
                      <ShowerHead size={14} className="text-gold" />{' '}
                      {listing.bathrooms_total_integer ?? '—'}
                    </span>
                    <span className="flex items-center gap-2">
                      <Maximize2 size={14} className="text-gold" />{' '}
                      {listing.living_area?.toLocaleString() ?? '—'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Slide dots */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-3 md:h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? 'w-8 bg-navy'
                    : 'w-3 md:w-2 bg-gray-300 hover:bg-gray-400'
                } min-h-[12px] min-w-[12px]`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
