/**
 * /listings/sitemap.xml — emits an XML sitemap of the canonical listing
 * detail URLs under /listings/{slug}.
 *
 * Why this file exists: previously /listings/sitemap.xml was matching the
 * `[slug]` dynamic segment as if "sitemap.xml" were a listing slug,
 * rendering the listing-loading skeleton with `<meta name="robots"
 * content="noindex">`. Crawlers fetching the path got an unindexable HTML
 * page instead of XML — the individual listing URLs never made it into
 * Google's discovery surface.
 *
 * Volume: capped at 200 to match the SSR'd inline inventory on
 * /listings (every URL here is already present in the page HTML for the
 * crawler-readable ListingsSeoList). Future enhancement: paginate the
 * full active universe via multiple sitemap files.
 */

import type { MetadataRoute } from 'next';
import { searchListings } from '@/lib/spark/search';
import { siteUrl } from '@/lib/seo';

const SITEMAP_LIMIT = 200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result = await searchListings({
    limit: SITEMAP_LIMIT,
    sort: 'newest',
    homeTypes: ['house', 'condo'],
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn('listings.sitemap.fetch_failed', err);
    return {
      listings: [],
      pins: [],
      total: 0,
      hasMore: false,
      fetchedAt: '',
      nextCursor: null,
    };
  });

  return result.listings.map((l) => ({
    url: siteUrl(`/listings/${l.slug}`),
    lastModified: l.modificationTimestamp ? new Date(l.modificationTimestamp) : new Date(),
    changeFrequency: 'daily' as const,
    // Active listings turn over fast and are the deepest content layer —
    // pump priority slightly above the page-level URLs in the root sitemap.
    priority: 0.7,
  }));
}
