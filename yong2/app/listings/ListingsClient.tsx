'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Listing } from '@/lib/types';
import type { BBox, PinPoint, PolygonGeoJSON, StatusFilter } from '@/lib/listings-search';
import { SearchBar, type SortKey } from '@/components/listings/SearchBar';
import {
  DEFAULT_PRICE_RANGE,
  FilterChips,
  type FilterState,
  priceRangeToBounds,
} from '@/components/listings/FilterChips';
import { ResultsList } from '@/components/listings/ResultsList';
import { MapPanel, type MapPanelHandle } from '@/components/listings/MapPanel';
import { IDXSearchFooter } from '@/components/listings/IDXSearchFooter';
import { track } from '@/lib/analytics/events';

const INITIAL_FILTER: FilterState = {
  status: [],
  priceRange: DEFAULT_PRICE_RANGE,
  bedsMin: 0,
};

type ViewMode = 'split' | 'map' | 'list';

type ListingsClientProps = {
  initialListings: Listing[];
  initialPins: PinPoint[];
  initialTotal: number;
  initialHasMore: boolean;
  initialFetchedAt: string;
};

// Page size for both initial fetch and each Load More click. Kept
// modest (60) so cold-fetch payloads stay small and the visitor sees
// results fast; Load More appends in 60-listing increments until the
// match pool is exhausted.
const PAGE_LIMIT = 60;

/**
 * Owns search/map state, interaction, and the fetch lifecycle. Server
 * pre-renders the default Yong-market viewport; this hydrates with that
 * data and re-fetches when the user pans, types, draws a polygon, or
 * twiddles a filter chip.
 */
export function ListingsClient({
  initialListings,
  initialPins,
  initialTotal,
  initialHasMore,
  initialFetchedAt,
}: ListingsClientProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [pins, setPins] = useState<PinPoint[]>(initialPins);
  const [total, setTotal] = useState<number>(initialTotal);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [fetchedAt, setFetchedAt] = useState<string>(initialFetchedAt);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState('');
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [polygon, setPolygon] = useState<PolygonGeoJSON | null>(null);
  const [drawingActive, setDrawingActive] = useState(false);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [scrollToKey, setScrollToKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split'); // for mobile
  const [sort, setSort] = useState<SortKey>('newest');

  // Client-side sort over the loaded listings — keeps the UI affordance
  // working today against whatever set the API returned. When the data
  // layer is rewritten, sort can be pushed into the search request.
  const sortedListings = useMemo(() => {
    const arr = [...listings];
    switch (sort) {
      case 'price-asc':
        arr.sort((a, b) => (a.listPrice ?? 0) - (b.listPrice ?? 0));
        break;
      case 'price-desc':
        arr.sort((a, b) => (b.listPrice ?? 0) - (a.listPrice ?? 0));
        break;
      case 'newest':
      default:
        arr.sort((a, b) => {
          const ad = a.modificationTimestamp ? new Date(a.modificationTimestamp).getTime() : 0;
          const bd = b.modificationTimestamp ? new Date(b.modificationTimestamp).getTime() : 0;
          return bd - ad;
        });
    }
    return arr;
  }, [listings, sort]);

  const mapRef = useRef<MapPanelHandle | null>(null);

  // Wrap setQ so we can fire `search_query` / `search_query_clear` events
  // as the visitor types. SearchBar already debounces — by the time we get
  // here, the input has stabilized for ~250ms, which is the window we want
  // to count as "the user actually searched."
  const handleQChange = useCallback((next: string) => {
    setQ((prev) => {
      const trimmed = next.trim();
      const prevTrimmed = prev.trim();
      if (trimmed.length === 0 && prevTrimmed.length > 0) {
        track('search_query_clear', {});
      } else if (trimmed.length > 0 && trimmed !== prevTrimmed) {
        // results_count fires from the search result effect; we record
        // the query length here (proxy for intent depth) and pair it
        // post-fetch via a separate event when the count lands.
        track('search_query', { query_length: trimmed.length, results_count: -1 });
      }
      return next;
    });
  }, []);

  // Mobile view switcher with analytics. The catalog enum is { both | map | list };
  // ListingsClient's internal name is 'split' for "both," so map at the call site.
  const setViewModeTracked = useCallback((next: ViewMode) => {
    setViewMode((prev) => {
      if (prev === next) return prev;
      const view = next === 'split' ? 'both' : next;
      track('mobile_view_switch', { view });
      return next;
    });
  }, []);

  // Last-fired AbortController so a slow request never overwrites a faster
  // newer one. Without this, dragging the map past several intermediate
  // viewports could flash stale results when an earlier request resolves
  // after the latest one.
  const abortRef = useRef<AbortController | null>(null);

  // Compose the SearchOpts payload — memoized so an effect can depend on it
  // without triggering churn from object identity alone.
  const searchOpts = useMemo(() => {
    const { priceMin, priceMax } = priceRangeToBounds(filters.priceRange);
    const opts: Record<string, unknown> = {};
    if (q.trim()) opts.q = q.trim();
    if (polygon) {
      opts.polygonGeoJSON = polygon;
    } else if (bbox) {
      opts.bbox = bbox;
    }
    if (filters.status.length > 0) opts.status = filters.status as StatusFilter[];
    if (priceMin != null) opts.priceMin = priceMin;
    if (priceMax != null) opts.priceMax = priceMax;
    if (filters.bedsMin > 0) opts.bedsMin = filters.bedsMin;
    opts.limit = PAGE_LIMIT;
    return opts;
  }, [q, polygon, bbox, filters]);

  // Skip the initial render's fetch (server gave us hydration data already).
  const isFirstRunRef = useRef(true);
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    let cancelled = false;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch('/api/listings/search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(searchOpts),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const json = (await res.json()) as {
          listings: Listing[];
          pins: PinPoint[];
          total: number;
          hasMore?: boolean;
          fetchedAt?: string;
        };
        if (cancelled) return;
        setListings(json.listings);
        setPins(json.pins);
        setTotal(json.total);
        setHasMore(Boolean(json.hasMore));
        if (json.fetchedAt) setFetchedAt(json.fetchedAt);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // eslint-disable-next-line no-console
        console.warn('Search request failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [searchOpts]);

  // ── Handlers ───────────────────────────────────────

  const handleViewportChange = useCallback((next: BBox) => {
    // Polygon takes precedence — ignore viewport pans while a shape is set.
    if (polygon) return;
    setBbox(next);
  }, [polygon]);

  const handlePolygonComplete = useCallback((poly: PolygonGeoJSON) => {
    setPolygon(poly);
    setDrawingActive(false);
  }, []);

  const handleClearShape = useCallback(() => {
    setPolygon((prev) => {
      if (prev) track('map_polygon_clear', {});
      return null;
    });
    setDrawingActive(false);
  }, []);

  const handleToggleDrawing = useCallback(() => {
    setDrawingActive((v) => {
      if (v) return false;
      // Entering draw mode discards any active polygon so the user can
      // draw a fresh one without first clicking "Clear shape".
      setPolygon(null);
      return true;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setQ('');
    setPolygon(null);
    setFilters(INITIAL_FILTER);
    setDrawingActive(false);
  }, []);

  const handlePinHover = useCallback((key: string | null) => {
    setHighlightedKey(key);
    mapRef.current?.setHighlight(key);
  }, []);

  const handlePinClick = useCallback((key: string) => {
    track('map_pin_click', { listingKey: key });
    setHighlightedKey(key);
    mapRef.current?.setHighlight(key);
    setScrollToKey(key);
    // Mobile: surface the list when the user picks a pin.
    setViewMode((v) => (v === 'map' ? 'split' : v));
  }, []);

  // Debounced result_card_hover — fire only after a key sticks for 300ms so
  // a fast cursor sweep doesn't flood the event stream.
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCardHover = useCallback((key: string | null) => {
    setHighlightedKey(key);
    mapRef.current?.setHighlight(key);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (key) {
      hoverTimerRef.current = setTimeout(() => {
        track('result_card_hover', { listingKey: key });
      }, 300);
    }
  }, []);

  // Load More — append the next PAGE_LIMIT listings to the visible set.
  // Uses the same searchOpts as the active query, only changes the
  // offset. Pins/total are not refetched (they cover the full match pool
  // already from the initial query).
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch('/api/listings/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...searchOpts, offset: listings.length }),
      });
      if (!res.ok) throw new Error(`Load more failed: ${res.status}`);
      const json = (await res.json()) as {
        listings: Listing[];
        hasMore?: boolean;
      };
      track('results_load_more', {
        results_count: listings.length + json.listings.length,
      });
      setListings((prev) => [...prev, ...json.listings]);
      setHasMore(Boolean(json.hasMore));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Load more failed', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, searchOpts, listings.length]);

  const handleCardClick = useCallback((key: string) => {
    // Position is the listing's index in the current results array — useful
    // for understanding how far down the list the visitor scrolled.
    const position = listings.findIndex((l) => l.listingKey === key);
    track('result_card_click', { listingKey: key, position: position >= 0 ? position : 0 });
    mapRef.current?.flyToListing(key);
    setHighlightedKey(key);
    mapRef.current?.setHighlight(key);
    setViewMode((v) => (v === 'list' ? 'split' : v));
  }, [listings]);

  // IDX freshness reflects when WE last fetched from the upstream
  // data source, not the newest modificationTimestamp in the visible
  // result set. Slow-churn luxury inventory routinely has
  // modificationTimestamps days/weeks old even when the feed is live.
  // Using fetchedAt keeps the >12h staleness warning meaningful (it
  // only trips when the feed is genuinely down or cached for too long).

  // ── Layout ─────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Mobile-only view switcher. >= md keeps the split view. */}
      <div className="md:hidden flex border-b border-white/10 bg-ink-elevated">
        <ModeTab active={viewMode === 'split'} onClick={() => setViewModeTracked('split')}>Both</ModeTab>
        <ModeTab active={viewMode === 'map'} onClick={() => setViewModeTracked('map')}>Map</ModeTab>
        <ModeTab active={viewMode === 'list'} onClick={() => setViewModeTracked('list')}>List</ModeTab>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Map */}
        <div
          className={`relative md:w-3/5 lg:w-[62%] md:h-full ${
            viewMode === 'list' ? 'hidden md:block' : viewMode === 'map' ? 'h-[calc(100vh-112px)]' : 'h-[50vh]'
          } md:border-r md:border-white/10`}
        >
          <MapPanel
            ref={mapRef}
            pins={pins}
            drawingActive={drawingActive}
            onPolygonComplete={handlePolygonComplete}
            onClearShape={handleClearShape}
            onPinClick={handlePinClick}
            onPinHover={handlePinHover}
            onViewportChange={handleViewportChange}
          />
        </div>

        {/* Right results panel (or stacked on mobile). */}
        <aside
          className={`md:w-2/5 lg:w-[38%] md:h-full flex flex-col min-h-0 bg-ink ${
            viewMode === 'map' ? 'hidden md:flex' : ''
          }`}
        >
          <SearchBar
            initialValue={q}
            onChange={handleQChange}
            drawingActive={drawingActive}
            onToggleDrawing={handleToggleDrawing}
            onClearShape={polygon ? handleClearShape : undefined}
            hasShape={!!polygon}
            loading={loading}
            resultCount={total}
            sort={sort}
            onSortChange={setSort}
          />
          <FilterChips value={filters} onChange={setFilters} />
          <p className="px-4 md:px-6 py-2 text-[0.65rem] uppercase tracking-wider text-mute border-b border-white/5">
            Active &amp; pending listings across the full ARMLS
          </p>
          <div className="flex-1 overflow-y-auto min-h-0">
            <ResultsList
              listings={sortedListings}
              highlightedKey={highlightedKey}
              loading={loading}
              total={total}
              onCardHover={handleCardHover}
              onCardClick={handleCardClick}
              onResetFilters={handleResetFilters}
              scrollToKey={scrollToKey}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={handleLoadMore}
            />
            {/* IDX compliance footer — required on every IDX search
             *  surface (ARMLS rules + docs/compliance/idx-compliance.md).
             *  Renders inside the scroll container so it's always reachable
             *  without breaking the full-height map+list layout. Lastsync
             *  uses the newest modificationTimestamp in the result set. */}
            <IDXSearchFooter
              lastSyncISO={fetchedAt}
              brokerage="Russ Lyon Sotheby's International Realty"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 caps py-2 text-xs ${active ? 'text-gold border-b border-gold' : 'text-stone/70'}`}
    >
      {children}
    </button>
  );
}
