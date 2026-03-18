'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ListingDetail } from '@platform/database/src/queries/listings';
import type { CalculatedInsights } from '../lib/types';

interface AgentSidebarProps {
  agent: {
    name: string;
    title: string;
    photoUrl: string;
    brokerage: string;
    contact: { phone: string };
  };
  contactHref: string;
  listing: ListingDetail;
  gallery: string[];
  insights: CalculatedInsights;
}

function formatNumber(n: number | null | undefined): string {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

function formatLotSize(acres: number | null, sqft: number | null): string {
  const a = acres != null ? Number(acres) : 0;
  const s = sqft != null ? Number(sqft) : 0;
  if (a >= 1) return `${a.toFixed(2)} ac`;
  if (s > 0) return `${formatNumber(s)} SF`;
  return '';
}

export function AgentSidebar({ agent, contactHref, listing, gallery, insights }: AgentSidebarProps) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  // Skip first photo (used in hero), show remaining
  const sidebarPhotos = gallery.slice(1);

  // Build "At a Glance" stats — includes old KPI card items
  const stats: { label: string; value: string }[] = [];
  if (insights.pricePerSqFt != null) stats.push({ label: 'Price / SF', value: `$${insights.pricePerSqFt.toLocaleString()}` });
  if (insights.domListing != null) stats.push({ label: 'Days on Market', value: String(insights.domListing) });
  if (listing.bedrooms_total != null) stats.push({ label: 'Bedrooms', value: String(listing.bedrooms_total) });
  if (listing.bathrooms_total_integer != null) stats.push({ label: 'Bathrooms', value: String(listing.bathrooms_total_integer) });
  if (listing.living_area) stats.push({ label: 'Living Area', value: `${formatNumber(listing.living_area)} SF` });
  if (listing.year_built) stats.push({ label: 'Year Built', value: String(listing.year_built) });
  const lot = formatLotSize(listing.lot_size_acres, listing.lot_size_square_feet);
  if (lot) stats.push({ label: 'Lot Size', value: lot });
  if (listing.garage_spaces) stats.push({ label: 'Garage', value: `${listing.garage_spaces}-Car` });
  if (listing.stories_total) stats.push({ label: 'Stories', value: String(listing.stories_total) });

  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      {/* Photo Gallery */}
      {sidebarPhotos.length > 0 && (
        <div className="relative h-[320px] overflow-hidden bg-cream-alt">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sidebarPhotos[galleryIndex]}
            alt={`Property photo ${galleryIndex + 2}`}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Photo navigation */}
          {sidebarPhotos.length > 1 && (
            <>
              <button
                onClick={() => setGalleryIndex((prev) => (prev - 1 + sidebarPhotos.length) % sidebarPhotos.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/30 text-white/70 hover:bg-black/50 hover:text-white transition-all"
                aria-label="Previous photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setGalleryIndex((prev) => (prev + 1) % sidebarPhotos.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/30 text-white/70 hover:bg-black/50 hover:text-white transition-all"
                aria-label="Next photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Counter + caption */}
          <div className="absolute bottom-4 left-4 text-white z-10">
            <span className="text-[9px] uppercase tracking-widest text-gold font-bold block">
              {listing.standard_status}
            </span>
            <span className="text-[10px] text-white/60">
              {galleryIndex + 2} / {gallery.length}
            </span>
          </div>
        </div>
      )}

      {/* At a Glance — navy card */}
      <div className="bg-navy p-6">
        <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">
          At a Glance
        </span>
        <div className="space-y-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex justify-between items-center ${
                i < stats.length - 1 ? 'pb-3 border-b border-white/10' : ''
              }`}
            >
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{stat.label}</span>
              <span className="text-xl font-serif text-white">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="mt-5 space-y-3">
          <a
            href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`}
            className="w-full bg-gold text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2"
          >
            Contact {agent.name.split(' ')[0]}
          </a>
          <Link
            href={contactHref}
            className="w-full border border-white/20 text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2"
          >
            Schedule Showing
          </Link>
        </div>
      </div>
    </div>
  );
}
