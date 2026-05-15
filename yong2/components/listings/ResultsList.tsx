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

  // Lazy-load on scroll: when the sentinel below the last card nears
  // the scroll container's edge, fire onLoadMore. Critically, the
  // observer's root must be the inner overflow-y-auto container (the
  // right pane scroll surface) — NOT the page viewport. The cards
  // live inside a flex column that doesn't grow with the page, so a
  // viewport-rooted observer sees the sentinel as either always-in-
  // viewport or never-in-viewport depending on initial layout, and
  // the auto-load never fires past the first batch.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    if (!hasMore || loadingMore) return;
    // Walk up from the sentinel to find the nearest scrollable ancestor.
    // matches() check on computedStyle is the only reliable way — Tailwind's
    // overflow-y-auto applies overflow-y not overflow.
    let scrollRoot: Element | null = sentinel.parentElement;
    while (scrollRoot && scrollRoot !== document.body) {
      const style = window.getComputedStyle(scrollRoot);
      const oy = style.overflowY;
      if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') break;
      scrollRoot = scrollRoot.parentElement;
    }
    const observerRoot =
      scrollRoot && scrollRoot !== document.body ? scrollRoot : null;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onLoadMore();
            break;
          }
        }
      },
      {
        root: observerRoot,
        rootMargin: '600px 0px', // trigger ~600px before reach
      },
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

  // Two-branch empty state:
  //   1. listings empty + loading=true  → SkeletonGrid + "Searching…"
  //      The visitor's in-flight search hasn't resolved yet. Render the
  //      shimmer with a status caption.
  //   2. listings empty + loading=false → "No matches" empty state with
  //      a Reset filters CTA. The search came back with zero hits;
  //      showing a perpetual shimmer here is misleading.
  if (listings.length === 0) {
    if (loading) {
      return (
        <div className="p-3 md:p-4">
          <SkeletonGrid />
          <p className="caps text-stone/50 text-[10px] text-center mt-6 tracking-widest">
            Searching…
          </p>
        </div>
      );
    }
    return (
      <div className="p-6 md:p-10 flex flex-col items-center text-center">
        <svg
          aria-hidden
          className="h-10 w-10 text-stone/30 mb-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.5-3.5" />
        </svg>
        <h3 className="caps text-[0.7rem] tracking-[0.32em] text-stone mb-2">No matches</h3>
        <p className="text-sm text-mute max-w-xs mb-5 leading-relaxed">
          Nothing in the active inventory matches the current filters. Widen the area on the map,
          clear a city, or remove a price/bed constraint.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="caps text-[10px] tracking-[0.32em] px-5 py-3 bg-ink-elevated border border-stone/20 text-stone hover:border-gold hover:text-gold transition-colors"
        >
          Reset filters
        </button>
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
 * Total comes from `@odata.count` on the Spark response — it's the true
 * matching-pool size, not the pin-universe cap. So we render the exact
 * value and trust the upstream. Pinning to a 2,000 ceiling here would
 * mislead users into thinking inventory tops out below the actual feed
 * (we routinely see 28K+ active listings in the Phoenix metro).
 */
function formatTotal(n: number): string {
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
