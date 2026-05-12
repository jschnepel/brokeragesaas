/**
 * GET /api/listings/[slug]/detail-meta — combined endpoint for the
 * detail-page sections that used to be awaited server-side: nearby
 * comparable listings + market-read aggregates. Both are below-the-
 * fold and non-blocking for first paint, so the listing-detail page
 * now ships its hero immediately and the client lazy-loads this
 * payload after mount.
 *
 * Combined into a single endpoint (rather than two parallel) so the
 * client makes ONE fetch with one DB cache hit; the two underlying
 * data sources happen to share Lambda warm-state and the parallel
 * resolution inside the route handler is cheap.
 *
 * Cached at the CDN edge for 5 min (matches the page's revalidate)
 * since both data sources have the same staleness tolerance.
 */
import { NextResponse } from 'next/server';
import {
  getListingBySlug,
  getNearbyListings,
} from '@/lib/spark/search';
import { getListingReadData } from '@/lib/listing-analytics';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: RouteContext): Promise<Response> {
  const { slug } = await ctx.params;
  // We need the listing to scope nearby (geo + price band) and the
  // market read (community/region match). getListingBySlug is wrapped
  // in React cache() so this round-trip is shared with any concurrent
  // server-render of the same page.
  const listing = await getListingBySlug(slug).catch(() => null);
  if (!listing) {
    return NextResponse.json({ nearby: [], readData: null }, {
      headers: { 'Cache-Control': 'public, s-maxage=60' },
    });
  }

  const [nearby, readData] = await Promise.all([
    listing.latitude != null && listing.longitude != null
      ? getNearbyListings({
          excludeListingId: listing.listingId,
          latitude: listing.latitude,
          longitude: listing.longitude,
          listPrice: listing.listPrice,
          limit: 4,
        }).catch(() => [])
      : Promise.resolve([]),
    getListingReadData(listing).catch(() => null),
  ]);

  return NextResponse.json(
    { nearby, readData },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
      },
    },
  );
}
