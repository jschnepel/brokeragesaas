'use client';

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { useListingsSearch, filtersToSearchFilters } from './useListingsSearch';
import type { MapBounds } from './useListingsSearch';
import { FilterBar, MobileFilterButton, MobileFilterDrawer } from './FilterBar';
import { ListingsMap } from './ListingsMap';
import { ListingCard } from './ListingCard';
import { fetchListings } from './actions';
import type { ListingRecord } from '@platform/database/src/queries/listings';

interface ListingsSearchClientProps {
  initialListings: ListingRecord[];
  initialTotal: number;
}

function getPaginationPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-navy/8 animate-pulse">
      <div className="aspect-[16/10] bg-navy/5" />
      <div className="px-4 pt-4 pb-3 space-y-2">
        <div className="h-4 w-3/4 bg-navy/8 rounded" />
        <div className="h-3 w-1/2 bg-navy/5 rounded" />
        <div className="h-px w-8 bg-navy/10 my-3" />
        <div className="flex gap-4">
          <div className="h-3 w-12 bg-navy/5 rounded" />
          <div className="h-3 w-12 bg-navy/5 rounded" />
          <div className="h-3 w-16 bg-navy/5 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ListingsSearchClient({
  initialListings,
  initialTotal,
}: ListingsSearchClientProps) {
  const {
    filterState,
    mapBounds,
    pendingBounds,
    polygon,
    hasActiveFilters,
    activeFilterCount,
    setFilters,
    setMapBounds,
    applyMapBounds,
    setPolygon,
    clearPolygon,
    clearFilters,
    clearMapBounds,
    setPage,
  } = useListingsSearch();

  const [listings, setListings] = useState<ListingRecord[]>(initialListings);
  const [total, setTotal] = useState(initialTotal);
  const [hoveredListingKey, setHoveredListingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Re-fetch when filters, committed bounds, or polygon change (skip first render — SSR data is already loaded)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const filters = filtersToSearchFilters(filterState, mapBounds, polygon);
    startTransition(async () => {
      const result = await fetchListings(filters);
      setListings(result.listings);
      setTotal(result.total);
    });
  }, [filterState, mapBounds, polygon]);

  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      setMapBounds(bounds);
    },
    [setMapBounds]
  );

  // Scroll to hovered card
  useEffect(() => {
    if (!hoveredListingKey || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-listing-key="${hoveredListingKey}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hoveredListingKey]);

  const currentPage = Math.max(1, parseInt(filterState.page || '1', 10));
  const perPage = polygon ? 200 : mapBounds ? 100 : 24;
  const totalPages = (polygon || mapBounds) ? 1 : Math.ceil(total / perPage);
  const paginationPages = getPaginationPages(currentPage, totalPages);

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 h-[calc(100vh-var(--nav-height))] flex flex-col">
      {/* Desktop Filter Bar */}
      <div className="hidden md:block shrink-0">
        <FilterBar
          filterState={filterState}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Mobile/Tablet Top Bar — visible below md breakpoint */}
      <div className="md:hidden flex items-center justify-between px-4 sm:px-6 py-2 bg-white border-b border-navy/10 shrink-0">
        <MobileFilterButton
          activeFilterCount={activeFilterCount}
          onClick={() => setMobileFilterOpen(true)}
        />
        <div className="flex border border-navy/15 overflow-hidden">
          <button
            onClick={() => setMobileView('list')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
              mobileView === 'list'
                ? 'bg-navy text-white'
                : 'bg-white text-navy/50'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
              mobileView === 'map'
                ? 'bg-navy text-white'
                : 'bg-white text-navy/50'
            }`}
          >
            Map
          </button>
        </div>
        <span className="text-xs text-navy/40">
          {total.toLocaleString()} results
        </span>
      </div>

      {/* Main split pane */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map Panel — md+ always visible, mobile toggle */}
        <div
          className={`${
            mobileView === 'map' ? 'flex' : 'hidden'
          } md:flex w-full md:w-1/2 lg:w-1/2 h-full`}
        >
          <ListingsMap
            listings={listings}
            hoveredListingKey={hoveredListingKey}
            onHoverListing={setHoveredListingKey}
            onBoundsChange={handleBoundsChange}
            onSearchArea={applyMapBounds}
            mapBounds={mapBounds}
            hasPendingBounds={pendingBounds !== null}
            polygon={polygon}
            onPolygonComplete={setPolygon}
            onPolygonClear={clearPolygon}
          />
        </div>

        {/* List Panel */}
        <div
          ref={listRef}
          className={`${
            mobileView === 'list' ? 'flex' : 'hidden'
          } md:flex flex-col w-full md:w-1/2 lg:w-1/2 h-full overflow-y-auto bg-cream`}
        >
          {/* Results header */}
          <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm px-5 py-4 sm:px-6 lg:px-8 border-b border-navy/10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-navy/40 font-bold">
                  {polygon
                    ? 'Drawn Area'
                    : mapBounds
                    ? 'Map Area'
                    : 'All Properties'}
                </span>
                <p className="text-sm text-navy mt-0.5">
                  <span className="font-serif text-base font-semibold">{total.toLocaleString()}</span>
                  <span className="text-navy/50 ml-1.5">
                    {total === 1 ? 'result' : 'results'}
                    {currentPage > 1 && !polygon && !mapBounds && ` · Page ${currentPage}`}
                  </span>
                </p>
              </div>
              {polygon && (
                <button
                  onClick={clearPolygon}
                  className="text-[10px] uppercase tracking-widest font-bold text-navy/30 hover:text-gold transition-colors"
                >
                  Clear Area
                </button>
              )}
              {!polygon && mapBounds && (
                <button
                  onClick={clearMapBounds}
                  className="text-[10px] uppercase tracking-widest font-bold text-navy/30 hover:text-gold transition-colors"
                >
                  Remove Boundary
                </button>
              )}
            </div>
          </div>

          {/* Listing cards or skeletons */}
          {isPending ? (
            <div className="flex-1 px-5 py-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-6 lg:px-8">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-navy/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-navy/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl text-navy mb-3">
                  No Properties Found
                </h3>
                <p className="text-sm text-navy/40 mb-6 leading-relaxed">
                  We couldn&apos;t find properties matching your criteria. Try adjusting your filters or exploring a different area.
                </p>
                <button
                  onClick={clearFilters}
                  className="border border-navy/20 px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold text-navy hover:bg-navy hover:text-white transition-colors duration-300"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 px-5 py-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
              {listings.map((listing) => (
                <div
                  key={listing.listing_key}
                  data-listing-key={listing.listing_key}
                >
                  <ListingCard
                    listing={listing}
                    isHovered={listing.listing_key === hoveredListingKey}
                    onMouseEnter={() => setHoveredListingKey(listing.listing_key)}
                    onMouseLeave={() => setHoveredListingKey(null)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pagination — only when no map bounds */}
          {!mapBounds && totalPages > 1 && (
            <nav
              className="flex justify-center items-center gap-1 py-6 border-t border-navy/10"
              aria-label="Pagination"
            >
              {currentPage > 1 && (
                <button
                  onClick={() => setPage(currentPage - 1)}
                  className="px-3 py-2 text-sm text-navy/50 hover:text-navy transition-colors"
                >
                  &lsaquo;
                </button>
              )}
              {paginationPages.map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-navy/30">
                    &hellip;
                  </span>
                ) : p === currentPage ? (
                  <span
                    key={p}
                    className="px-3 py-2 text-sm font-bold text-gold border-b-2 border-gold"
                  >
                    {p}
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="px-3 py-2 text-sm text-navy/50 hover:text-navy transition-colors"
                  >
                    {p}
                  </button>
                )
              )}
              {currentPage < totalPages && (
                <button
                  onClick={() => setPage(currentPage + 1)}
                  className="px-3 py-2 text-sm text-navy/50 hover:text-navy transition-colors"
                >
                  &rsaquo;
                </button>
              )}
            </nav>
          )}

          {/* @compliance IDX: MLS logo, data source attribution, broker reciprocity — ≥12px, WCAG AA contrast */}
          <div className="px-4 py-6 sm:px-6 lg:px-8 border-t border-navy/10 bg-cream-alt">
            <div className="flex items-start gap-3 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/armls-idx-logo.png" alt="ARMLS IDX" className="h-8 w-auto shrink-0" />
              <p className="text-xs text-navy/60">
                Listing information &copy; {new Date().getFullYear()} Arizona Regional Multiple Listing Service (ARMLS).
                All rights reserved. IDX information is provided exclusively for personal, non-commercial use
                and may not be used for any purpose other than to identify prospective properties consumers may be
                interested in purchasing. Data last updated{' '}
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilterOpen && (
        <MobileFilterDrawer
          filterState={filterState}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
          onClose={() => setMobileFilterOpen(false)}
        />
      )}
    </div>
  );
}
