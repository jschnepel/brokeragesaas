'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Listing } from '@/lib/types';
import type { BBox, PinPoint, PolygonGeoJSON, StatusFilter } from '@/lib/listings-search';
import { SearchBar, type SortKey } from '@/components/listings/SearchBar';
import {
  DEFAULT_ADVANCED_FILTERS,
  DEFAULT_HOME_TYPES,
  DEFAULT_PRICE_RANGE,
  FilterChips,
  type FilterState,
  priceRangeToBounds,
} from '@/components/listings/FilterChips';
import { ResultsList } from '@/components/listings/ResultsList';
import { MapPanel, type MapPanelHandle } from '@/components/listings/MapPanel';
import { IDXSearchFooter } from '@/components/listings/IDXSearchFooter';
import { track } from '@/lib/analytics/events';
import {
  parseListingsUrl,
  serializeListingsState,
  urlHasUserState,
} from '@/lib/listings-url';

const INITIAL_FILTER: FilterState = {
  status: [],
  homeTypes: DEFAULT_HOME_TYPES,
  priceRange: DEFAULT_PRICE_RANGE,
  bedsMin: 0,
  bathsMin: 0,
  advanced: DEFAULT_ADVANCED_FILTERS,
};

type ViewMode = 'split' | 'map' | 'list';

type ListingsClientProps = {
  initialListings: Listing[];
  initialPins: PinPoint[];
  initialTotal: number;
  initialHasMore: boolean;
  initialFetchedAt: string;
  initialNextCursor: string | null;
  /**
   * Bbox the SSR fetch ran with. Seeded into client state on mount so
   * the right pane is scoped to the visible map viewport from first
   * paint — without this the client's `bbox` would start null and the
   * displayed list would include the whole metro even though the map
   * is centered on a smaller area.
   */
  initialBbox: BBox;
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
  initialNextCursor,
  initialBbox,
}: ListingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Parse the URL ONCE on the first render. We don't want to re-derive
  // state from `searchParams` on every render — the URL is the source
  // of truth only at mount; thereafter state changes drive the URL via
  // router.replace. Wrapping useSearchParams() reads in useState's
  // lazy initializer keeps the parse off the hot render path.
  const initialUrlState = useMemo(
    () => parseListingsUrl(new URLSearchParams(searchParams?.toString() ?? '')),
    // Intentional one-shot read — useSearchParams() is stable in App
    // Router unless the URL actually changes externally, and we drive
    // those changes ourselves below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [pins, setPins] = useState<PinPoint[]>(initialPins);
  const [total, setTotal] = useState<number>(initialTotal);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [fetchedAt, setFetchedAt] = useState<string>(initialFetchedAt);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState(initialUrlState.q ?? '');
  // Bbox seeding precedence: URL → SSR default. The client's bbox
  // state must reflect a real viewport from the first render so the
  // right pane is already scoped to the visible map area; otherwise
  // the initial list would span the entire ARMLS feed even though the
  // map is centered on, say, Scottsdale.
  const [bbox, setBbox] = useState<BBox | null>(initialUrlState.bbox ?? initialBbox);
  // Has the user moved the map since mount? Drives URL serialization:
  // we don't want the SSR default bbox polluting clean URLs, but we do
  // want pans/zooms (or a URL-supplied bbox on landing) to show up
  // in the shareable URL. Initialized true when the URL already had a
  // bbox — that means the user landed on a deep-link and we should
  // keep echoing the value back to the URL on subsequent changes.
  const userMovedMapRef = useRef<boolean>(initialUrlState.bbox != null);
  const [polygon, setPolygon] = useState<PolygonGeoJSON | null>(initialUrlState.polygon ?? null);
  const [drawingActive, setDrawingActive] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialUrlState.filters ?? INITIAL_FILTER);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [scrollToKey, setScrollToKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split'); // for mobile
  const [sort, setSort] = useState<SortKey>(initialUrlState.sort ?? 'price-desc');
  // Cursor for the next Load More request — surfaced by the API on
  // every response. Null when there's no next page. Replaces the
  // offset-based paginator: cursors stay valid even if pool ordering
  // shifts slightly between requests.
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);

  const mapRef = useRef<MapPanelHandle | null>(null);

  // Index loaded listings by listingKey so the map's hover popup can
  // look up the cover photo + spec strip without any extra fetch.
  // Pins outside this map (beyond pagination) fall back to a minimal
  // popup with just price + status from the pin record itself.
  const listingsByKey = useMemo(() => {
    const m = new Map<string, Listing>();
    for (const l of listings) m.set(l.listingKey, l);
    return m;
  }, [listings]);

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
    if (filters.homeTypes.length > 0) opts.homeTypes = filters.homeTypes;
    if (priceMin != null) opts.priceMin = priceMin;
    if (priceMax != null) opts.priceMax = priceMax;
    if (filters.bedsMin > 0) opts.bedsMin = filters.bedsMin;
    if (filters.bathsMin > 0) opts.bathsMin = filters.bathsMin;

    // Advanced filters — translate string-form input to numbers, drop
    // empties so the API doesn't see NaN. Booleans pass through only
    // when true.
    const adv = filters.advanced;
    const num = (v: string) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : undefined;
    };
    if (num(adv.sqftMin) != null) opts.sqftMin = num(adv.sqftMin);
    if (num(adv.sqftMax) != null) opts.sqftMax = num(adv.sqftMax);
    if (num(adv.lotAcresMin) != null) opts.lotAcresMin = num(adv.lotAcresMin);
    if (num(adv.lotAcresMax) != null) opts.lotAcresMax = num(adv.lotAcresMax);
    if (num(adv.yearBuiltMin) != null) opts.yearBuiltMin = Math.round(num(adv.yearBuiltMin)!);
    if (num(adv.yearBuiltMax) != null) opts.yearBuiltMax = Math.round(num(adv.yearBuiltMax)!);
    if (num(adv.garageMin) != null) opts.garageMin = Math.round(num(adv.garageMin)!);
    if (adv.hasPool) opts.hasPool = true;
    if (adv.hasSpa) opts.hasSpa = true;
    if (adv.hasWaterfront) opts.hasWaterfront = true;
    if (adv.hasHorse) opts.hasHorse = true;
    if (adv.singleStory) opts.singleStory = true;
    if (adv.newConstruction) opts.newConstruction = true;
    if (adv.priceReduced) opts.priceReduced = true;

    // Sort is pushed server-side so "Price · Low → High" means the
    // cheapest match in the entire pool, not the cheapest of 60.
    opts.sort = sort;
    opts.limit = PAGE_LIMIT;
    return opts;
  }, [q, polygon, bbox, filters, sort]);

  // Push every user-visible state change into the URL. Refresh, back/
  // forward, and shared links all preserve filter intent. router.replace
  // does a shallow update in App Router — no re-render, no scroll jump.
  //
  // BBox is included in this sync but the value is rounded to ~1m
  // precision in serializeListingsState, so sub-meter map jitter
  // doesn't churn the URL. Polygon is encoded as a flattened ring.
  useEffect(() => {
    // bbox is suppressed from URL serialization until the user
    // actually moves the map (or arrived via a URL that included
    // bbox). Without this gate, the SSR default would land in every
    // fresh URL and clutter shareable links.
    const sp = serializeListingsState({
      q,
      filters,
      sort,
      bbox: userMovedMapRef.current ? bbox : null,
      polygon,
    });
    const next = sp.toString();
    const current = searchParams?.toString() ?? '';
    if (next === current) return;
    const target = next ? `${pathname}?${next}` : pathname;
    router.replace(target, { scroll: false });
    // pathname/router/searchParams identities are stable from Next's
    // routing context; including them in deps keeps the linter happy
    // without causing extra runs.
  }, [q, filters, sort, bbox, polygon, pathname, router, searchParams]);

  // Skip the initial render's fetch (server gave us hydration data already).
  // EXCEPT:
  //   1. SSR pins came back empty (stale ISR cache / transient Spark hiccup)
  //   2. The URL has user-state filters that don't match the SSR defaults
  // In either case we eagerly re-fetch on mount so the map and result set
  // reflect what the visitor actually asked for.
  const initialUrlHasState = useMemo(
    () => urlHasUserState(new URLSearchParams(searchParams?.toString() ?? '')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const isFirstRunRef = useRef(initialPins.length > 0 && !initialUrlHasState);
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
          nextCursor?: string | null;
        };
        if (cancelled) return;
        setListings(json.listings);
        setPins(json.pins);
        setTotal(json.total);
        setHasMore(Boolean(json.hasMore));
        setNextCursor(json.nextCursor ?? null);
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
    userMovedMapRef.current = true;
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

  const handlePinClick = useCallback((key: string, slug: string) => {
    track('map_pin_click', { listingKey: key });
    // Navigate to the listing detail page. router.push triggers Next
    // App Router's client transition, prefetched if the slug was
    // hovered or scrolled into view recently. We don't bother with
    // highlight/scroll side-effects here — the user is leaving this
    // page so the visual feedback would be wasted.
    router.push(`/listings/${slug}`);
  }, [router]);

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

  // Load More — append the next PAGE_LIMIT listings to the visible set,
  // and grow the pin universe so the map reflects every listing the
  // visitor has actually scrolled to. The server's pin set is sorted
  // by ListPrice desc and capped at ~1000; as the visitor pages past
  // that depth, new listings would otherwise lack pins on the map.
  // Merging server pins + every loaded listing's coord (deduped by key)
  // keeps the map honest as the result set grows.
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      // Cursor pagination — pass the previous response's `nextCursor`
      // (when available) rather than an offset count. Cursors stay
      // stable across small pool reorderings between requests, so
      // Load More can't skip or duplicate records the way offset can
      // if a listing's price/status shifted mid-session.
      const body = nextCursor
        ? { ...searchOpts, cursor: nextCursor }
        : { ...searchOpts, offset: listings.length };
      const res = await fetch('/api/listings/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Load more failed: ${res.status}`);
      const json = (await res.json()) as {
        listings: Listing[];
        pins?: PinPoint[];
        hasMore?: boolean;
        nextCursor?: string | null;
      };
      track('results_load_more', {
        results_count: listings.length + json.listings.length,
      });
      setListings((prev) => [...prev, ...json.listings]);
      setHasMore(Boolean(json.hasMore));
      setNextCursor(json.nextCursor ?? null);
      // Merge pin universe — keep existing pins, fold in the server's
      // current pin set (might shift slightly across requests), and
      // ensure every newly-loaded listing has a pin even if it sits
      // below the server's top-1000 pin window.
      setPins((prev) => {
        const merged = new Map<string, PinPoint>();
        for (const p of prev) merged.set(p.listingKey, p);
        for (const p of json.pins ?? []) merged.set(p.listingKey, p);
        for (const l of json.listings) {
          if (
            l.latitude != null &&
            l.longitude != null &&
            !merged.has(l.listingKey)
          ) {
            merged.set(l.listingKey, {
              listingKey: l.listingKey,
              listingId: l.listingId,
              slug: l.slug,
              latitude: l.latitude,
              longitude: l.longitude,
              listPrice: l.listPrice,
              status: l.status,
            });
          }
        }
        return Array.from(merged.values());
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Load more failed', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, searchOpts, listings.length, nextCursor]);

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

  // Prefetch the first ~40 pin cover photos so map hover popups
  // render with no network flicker. The browser's image cache
  // honors the same URL when the Popup later mounts an <img src>.
  // Capped at 40 to keep bandwidth modest on cellular — most users
  // hover a handful of pins before either clicking or moving on.
  useEffect(() => {
    if (typeof window === 'undefined' || pins.length === 0) return;
    const cancelled = { v: false };
    const seen = new Set<string>();
    let i = 0;
    let queued = 0;
    const tick = () => {
      if (cancelled.v) return;
      while (i < pins.length && queued < 40) {
        const url = pins[i].coverPhotoUrl;
        i += 1;
        if (!url || seen.has(url)) continue;
        seen.add(url);
        queued += 1;
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = url;
      }
    };
    // Defer to next idle frame so the prefetch never delays the
    // first paint after pins arrive.
    const handle = (window.requestIdleCallback ?? window.requestAnimationFrame)(tick);
    return () => {
      cancelled.v = true;
      (window.cancelIdleCallback ?? window.cancelAnimationFrame)(handle as number);
    };
  }, [pins]);

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
            initialBbox={bbox}
            listingsByKey={listingsByKey}
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
              listings={listings}
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
