import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Navigation } from '@/components/chrome/Navigation';
import { ListingsClient } from './ListingsClient';
// Listings search is now Spark-backed — full ARMLS Active+Pending
// inventory, no RDS dependency. See lib/spark/search.ts.
import { searchListings } from '@/lib/spark/search';
import { siteUrl } from '@/lib/seo';

// Default to a Phoenix-metro bbox centered on Yong's service area (zoom ~9).
// The client will refit on the data once mounted.
const DEFAULT_BBOX = { minLng: -112.5, minLat: 33.0, maxLng: -111.3, maxLat: 34.1 };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Discover Listings · Search the Valley',
  description:
    'Search the full active inventory across Scottsdale, Paradise Valley, Arcadia, and the rest of Yong Choi’s North Phoenix service area. Fuzzy text search or draw a custom geofence on the map.',
  alternates: { canonical: siteUrl('/listings') },
};

/**
 * Async sub-component — the initial RDS round-trip lives here so that
 * the parent page can flush its static shell (Navigation, skeleton)
 * to the wire while this is still resolving. Streaming SSR via
 * <Suspense> means TTFB drops from ~600ms (with DB wait) to ~80ms
 * (just the shell) and the user sees the chrome immediately.
 */
async function ListingsResults() {
  const initial = await searchListings({ bbox: DEFAULT_BBOX, limit: 60 }).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn('listings.page.initial_fetch_failed', err);
    return { listings: [], pins: [], total: 0 };
  });
  return (
    <ListingsClient
      initialListings={initial.listings}
      initialPins={initial.pins}
      initialTotal={initial.total}
    />
  );
}

function ListingsSkeleton() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col" aria-hidden="true">
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Map shimmer */}
        <div className="relative md:w-3/5 lg:w-[62%] md:h-full h-[50vh] md:border-r md:border-white/10">
          <div className="absolute inset-0 bg-ink-elevated animate-pulse" />
        </div>
        {/* Right results panel */}
        <aside className="md:w-2/5 lg:w-[38%] md:h-full flex flex-col min-h-0 bg-ink">
          <div className="px-4 md:px-6 py-4 border-b border-white/10">
            <div className="h-9 bg-ink-elevated animate-pulse" />
          </div>
          <div className="px-4 md:px-6 py-3 flex gap-2 border-b border-white/5">
            <div className="h-6 w-20 bg-ink-elevated animate-pulse" />
            <div className="h-6 w-24 bg-ink-elevated animate-pulse" />
            <div className="h-6 w-16 bg-ink-elevated animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            <ul className="divide-y divide-white/5">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="p-4 flex gap-4">
                  <div className="w-24 h-24 bg-ink-elevated animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-ink-elevated animate-pulse" />
                    <div className="h-4 w-2/3 bg-ink-elevated animate-pulse" />
                    <div className="h-3 w-1/2 bg-ink-elevated animate-pulse" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <>
      <Navigation />
      <main className="pt-16">
        {/*
         * Footer is intentionally omitted — the split-view fills the
         * viewport beneath the nav and a footer here would compete with
         * the fullscreen map for vertical space.
         *
         * Visually-hidden h1 satisfies heading-hierarchy + SEO without
         * adding a banner the cinematic split-view doesn't need.
         */}
        <h1 className="sr-only">Discover listings across the Valley</h1>
        <Suspense fallback={<ListingsSkeleton />}>
          <ListingsResults />
        </Suspense>
      </main>
    </>
  );
}
