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
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
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
  hasMore,
  loadingMore,
  onLoadMore,
}: ResultsListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Lazy-load on scroll: when the sentinel below the last card enters
  // the scroll container's viewport, fire onLoadMore. Falls back to
  // the explicit Load More button rendered below the sentinel for
  // accessibility and for visitors who prefer click-driven pagination.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    if (!hasMore || loadingMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onLoadMore();
            break;
          }
        }
      },
      { rootMargin: '600px 0px' }, // trigger ~600px before reach
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

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
      {/* Load More — sentinel for IntersectionObserver-driven lazy
       *  loading + an explicit button. The button is the keyboard
       *  affordance and a fallback for browsers/devices that don't
       *  fire the observer reliably (older Safari, some embedded
       *  webviews). */}
      <div ref={sentinelRef} aria-hidden="true" className="h-4 mt-6" />
      {hasMore ? (
        <div className="flex flex-col items-center gap-2 mt-2 mb-6">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="caps text-[10px] tracking-[0.32em] px-5 py-3 bg-ink-elevated border border-stone/20 text-stone hover:border-gold hover:text-gold disabled:opacity-50 disabled:cursor-wait transition-colors"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
          <p className="caps text-[10px] tracking-widest text-stone/40 tabular-nums">
            Showing {listings.length.toLocaleString('en-US')}
            {total > listings.length
              ? ` of ${formatTotal(total)} listings`
              : ' listings'}
          </p>
        </div>
      ) : (
        <p className="text-center caps text-[10px] tracking-widest text-stone/35 mt-6 mb-4 tabular-nums">
          Showing all {listings.length.toLocaleString('en-US')} of {formatTotal(total)} listings
        </p>
      )}
    </div>
  );
}

/**
 * Total is sourced from the pin universe (Spark search caps at 2 pages
 * x 1000 = 2000). When the count reaches that ceiling, suffix a "+"
 * since the true count may be higher than what we sampled in-viewport.
 * Below the cap the value is exact.
 */
const PIN_UNIVERSE_CAP = 2000;
function formatTotal(n: number): string {
  if (n >= PIN_UNIVERSE_CAP) return `${PIN_UNIVERSE_CAP.toLocaleString('en-US')}+`;
  return n.toLocaleString('en-US');
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
