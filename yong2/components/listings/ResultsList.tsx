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

  if (loading && listings.length === 0) {
    return (
      <div className="p-6">
        <SkeletonGrid />
      </div>
    );
  }

  if (!loading && listings.length === 0) {
    return (
      <div className="p-12 text-center">
        <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mx-auto mb-6" />
        <p className="font-serif italic text-stone text-xl md:text-2xl mb-3">
          Yong's curated inventory may not match these filters today.
        </p>
        <p className="text-sm text-mute mb-8 max-w-sm mx-auto">
          Try widening the price band, clearing your shape, or panning the map. Or browse the full portfolio.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onResetFilters}
            className="cta-ghost"
          >
            <span>Reset filters</span>
            <span aria-hidden="true">→</span>
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

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-ink-elevated border border-white/5">
          <div className="aspect-[4/3] bg-ink-surface" />
          <div className="p-3 space-y-2">
            <div className="h-2 w-1/3 bg-white/10" />
            <div className="h-3 w-3/4 bg-white/10" />
            <div className="h-3 w-1/2 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
