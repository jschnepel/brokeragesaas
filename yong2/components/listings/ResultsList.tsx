'use client';

import { useEffect, useRef } from 'react';
import type { Listing } from '@/lib/types';
import { ResultCard } from './ResultCard';

type ResultsListProps = {
  listings: Listing[];
  highlightedKey: string | null;
  loading: boolean;
  total: number;
  onCardHover: (key: string | null) => void;
  onCardClick: (key: string) => void;
  onResetFilters: () => void;
  scrollToKey: string | null;
};

/**
 * 2-column results grid. Plain CSS grid (no virtualization) — pinned
 * to a 200-row server cap so total DOM stays well under any threshold
 * where virtualization would actually help.
 */
export function ResultsList({
  listings,
  highlightedKey,
  loading,
  total,
  onCardHover,
  onCardClick,
  onResetFilters,
  scrollToKey,
}: ResultsListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // When the map asks us to scroll a card into view, find it by
  // data-listing-key and ease it center-ward.
  useEffect(() => {
    if (!scrollToKey || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-listing-key="${CSS.escape(scrollToKey)}"]`,
    );
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [scrollToKey]);

  // Single empty branch: always show the skeleton when there are no
  // results — covers both the "data layer in flight" loading window
  // (real users hitting search) and today's pre-data state where the
  // S3 listings pipeline isn't wired yet. When data flows, the
  // skeleton appears only briefly during the loading round-trip.
  // The 'Reset filters' affordance still surfaces if the user has
  // applied filters that cause the empty result.
  if (listings.length === 0) {
    return (
      <div className="p-3 md:p-4">
        <SkeletonGrid />
        <p className="caps text-stone/50 text-[10px] text-center mt-6 tracking-widest">
          {loading ? 'Searching…' : 'Loading curated inventory…'}
        </p>
        <div className="flex justify-center mt-3">
          <button
            type="button"
            onClick={onResetFilters}
            className="caps text-stone/40 hover:text-gold transition-colors text-[10px]"
          >
            Reset filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-3 md:p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {listings.map((l) => (
          <ResultCard
            key={l.listingKey}
            listing={l}
            highlighted={highlightedKey === l.listingKey}
            onHover={onCardHover}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      {total > listings.length ? (
        <p className="text-center text-xs text-mute mt-6">
          Showing {listings.length.toLocaleString('en-US')} of {total.toLocaleString('en-US')} listings.
          Pan or zoom the map to refine.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Ghost loaders shaped like ResultCards — staggered animation so they
 * read as a wave loading the panel, not eight identical pulsing
 * blocks. Count = 10 so the grid fills the right panel at a typical
 * viewport (5 rows × 2 cols at md+, 10 rows × 1 col on mobile).
 */
function SkeletonGrid() {
  const count = 10;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-ink-elevated border border-white/5 animate-pulse"
          // Stagger the pulse so cards don't tick in unison — reads as
          // a loading wave instead of eight strobes.
          style={{ animationDelay: `${(i % 5) * 120}ms` }}
        >
          <div className="aspect-[4/3] bg-ink-surface" />
          <div className="p-3 space-y-2">
            <div className="h-2 w-1/3 bg-white/10" />
            <div className="h-3 w-3/4 bg-white/10" />
            <div className="flex items-baseline justify-between gap-3">
              <div className="h-3 w-1/2 bg-white/10" />
              <div className="h-3 w-1/4 bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
