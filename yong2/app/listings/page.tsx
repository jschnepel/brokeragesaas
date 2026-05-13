import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { ListingsClient } from './ListingsClient';
import { ListingsSeoList } from '@/components/listings/ListingsSeoList';
// Listings search is now Spark-backed — full ARMLS Active+Pending
// inventory, no RDS dependency. See lib/spark/search.ts.
import { searchListings } from '@/lib/spark/search';
import { siteUrl } from '@/lib/seo';

// Default to a Phoenix-metro bbox centered on Yong's service area (zoom ~9).
// The client will refit on the data once mounted.
const DEFAULT_BBOX = { minLng: -112.5, minLat: 33.0, maxLng: -111.3, maxLat: 34.1 };

// ISR with 5-minute cache — Spark refreshes hourly, so 5min staleness
// is well within tolerance. The Lambda warmer cron pings every 5min
// so the page stays continuously warm even during low-traffic periods.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Discover Listings · Search the Valley',
  description:
    'Search the full active inventory across Scottsdale, Paradise Valley, Arcadia, and the rest of Yong Choi’s North Phoenix service area. Fuzzy text search or draw a custom geofence on the map.',
  alternates: { canonical: siteUrl('/listings') },
};

export default async function ListingsPage() {
  // SSR fetch — used for BOTH the crawler-readable SeoList (rendered
  // to HTML inline below) and the interactive ListingsClient's
  // initial state. We deliberately do NOT wrap this in <Suspense>:
  //
  //   - Audit item 2.1 requires the inventory to be present in the
  //     first HTML chunk so curl / AI summarisers / older crawlers
  //     see real addresses + prices without executing JS. Suspense'd
  //     children during ISR prerender render into the RSC payload as
  //     the resolved branch, not as HTML markup, which leaves
  //     non-JS clients with only the skeleton fallback.
  //
  //   - The page is ISR-cached at `revalidate = 300`, so the
  //     fetch+render cost is amortised across hundreds of cached
  //     hits between revalidations. The "streamed shell while data
  //     loads" pattern was a TTFB win on a cold cache only; with the
  //     5-min ISR window and Lambda warmer ping, cold cache is rare.
  //
  // Default home-type filter mirrors the client's INITIAL_FILTER and
  // sort default mirrors ListingsClient initial state so the
  // post-hydration re-fetch doesn't re-order the SSR result set.
  const initial = await searchListings({
    bbox: DEFAULT_BBOX,
    homeTypes: ['house', 'condo'],
    sort: 'price-desc',
    limit: 60,
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn('listings.page.initial_fetch_failed', err);
    return {
      listings: [],
      pins: [],
      total: 0,
      hasMore: false,
      fetchedAt: new Date().toISOString(),
      nextCursor: null,
    };
  });

  return (
    <>
      <Navigation />
      <main className="pt-16">
        {/*
         * Footer is intentionally omitted — the split-view fills the
         * viewport beneath the nav and a footer here would compete
         * with the fullscreen map for vertical space.
         *
         * Visually-hidden h1 satisfies heading-hierarchy + SEO
         * without adding a banner the cinematic split-view doesn't
         * need.
         */}
        <h1 className="sr-only">Discover listings across the Valley</h1>
        {/* Crawler-readable inventory list — rendered to HTML at the
         *  page level so it lives in the initial response chunk.
         *  Visually hidden via sr-only + aria-hidden=true so JS users
         *  see the interactive ListingsClient below as the canonical
         *  search surface.
         */}
        <ListingsSeoList listings={initial.listings} total={initial.total} />
        <ListingsClient
          initialListings={initial.listings}
          initialPins={initial.pins}
          initialTotal={initial.total}
          initialHasMore={initial.hasMore}
          initialFetchedAt={initial.fetchedAt}
          initialNextCursor={initial.nextCursor ?? null}
          initialBbox={DEFAULT_BBOX}
        />
      </main>
    </>
  );
}
