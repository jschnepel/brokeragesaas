/**
 * Listing detail — Spark-backed, IDX-compliant.
 *
 * Server-side: resolve slug via Spark direct lookup (lib/spark/search →
 * getListingBySlug, $expand=Media), enforce IDX opt-out at the source,
 * generate metadata, build feature groups, match a curated community
 * narrative if one applies, then delegate UI to ListingDetailClient.
 *
 * The client renders the canonical editorial layout — same shape the
 * /portfolio/preview mock established (HeroTopBar, AgentMiniCard,
 * KeyFactsCard sidebar, KeyFeaturesGrid, LocationIntelligence, sticky
 * contact pill, IDX footer) — with graceful fallback for sections that
 * depend on narrative/comp data that isn't wired yet.
 *
 * @compliance IDX (ARMLS): The footer at the bottom of the body is
 *   mandatory. The InternetEntireListingDisplayYN opt-out filter is
 *   enforced at the search layer.
 */
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getListingBySlug } from '@/lib/spark/search';
import { buildFeatureGroups } from '@/lib/spark/listing-features';
import { matchCuratedCommunity } from '@/lib/community-match';
import { computeDistances } from '@/lib/distances';
import { siteUrl, truncateMetaDescription } from '@/lib/seo';
import { ListingDetailClient } from './ListingDetailClient';

// 5-minute ISR — Spark refreshes hourly; 5min staleness is well within
// tolerance and gives every visitor sub-100ms TTFB after the cache warms.
export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3200';

// Audit item 2.10 — request-scoped dedupe. Next 13+ calls
// generateMetadata and the page default export as TWO separate
// function invocations within a single request. Without
// `cache()` each invocation hit Spark independently, so an
// intermittent Spark response (null on one call, listing on the
// other) shipped a generic "Listing · Yong Choi" <title> on a
// page whose body rendered fine. Wrapping the lookup in
// `cache()` makes both invocations share the first result —
// either both succeed with the listing data, or both fall back
// (and the slug-derived title fallback below recovers from that
// branch).
const getCachedListing = cache(async (slug: string) => {
  return getListingBySlug(slug).catch(() => null);
});

/**
 * Slug-derived fallback title — only fires when Spark can't return
 * the listing on the metadata pass. Parses
 * "5531-e-mockingbird-lane-paradise-valley-az-85253-7018849" into
 * "5531 E Mockingbird Lane · Paradise Valley · Yong Choi" so the
 * rendered <title> is meaningful even on the failed branch.
 */
function fallbackTitleFromSlug(slug: string): string {
  const m = slug.match(/^(.+?)-([a-z]{2})-(\d{5})-(\d+)$/i);
  if (!m) return 'Listing';
  const beforeState = m[1].replace(/-/g, ' ');
  const tokens = beforeState.split(' ');
  const state = m[2].toUpperCase();
  // Heuristic: most addresses have the city after a multi-token
  // street ("e mockingbird lane paradise valley"). Splitting on the
  // last 2 tokens is a reasonable guess for the city — not perfect
  // for one-word cities like Phoenix, but acceptable since this
  // path only fires when the canonical metadata call has failed.
  if (tokens.length >= 4) {
    const city = tokens.slice(-2).map(titleCase).join(' ');
    const street = tokens.slice(0, -2).map(titleCase).join(' ');
    return `${street} · ${city}, ${state} · Yong Choi`;
  }
  return `${beforeState.split(' ').map(titleCase).join(' ')}, ${state} · Yong Choi`;
}

function titleCase(s: string): string {
  if (s.length === 0) return s;
  if (s.length <= 2) return s.toUpperCase(); // "E", "N", "AZ"
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getCachedListing(slug);
  if (!listing) {
    // Audit 2.10 — meaningful title even when Spark misses on the
    // metadata pass. Page body still renders correctly (via the
    // dedup'd cache, the default export will reuse the same null
    // and `notFound()`); this fallback only matters when the
    // metadata call lost the race and the page-render call won
    // (intermittent Spark response). Edge case but visible to
    // crawlers when it happens.
    return { title: { absolute: fallbackTitleFromSlug(slug) } };
  }
  const address = listing.unparsedAddress;
  const community = listing.community ?? listing.city ?? 'Scottsdale';
  const titleFull = `${address} | ${community} | Yong Choi`;
  const description = listing.publicRemarks
    ? truncateMetaDescription(listing.publicRemarks, 155)
    : `${address}, ${community}. Luxury Arizona real estate represented by Yong Choi.`;
  const canonical = siteUrl(`/listings/${listing.slug}`);
  const image = listing.coverPhotoUrl;
  return {
    // `title.absolute` opts out of the root layout's `template`
    // ("%s · Yong Choi") so we don't double-stamp the brand on
    // listing-detail titles.
    title: { absolute: titleFull },
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title: titleFull,
      description,
      url: canonical,
      siteName: 'Yong Choi',
      images: image ? [{ url: image, alt: address }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: titleFull,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getCachedListing(slug);
  if (!listing) notFound();

  const featureGroups = buildFeatureGroups(listing);
  const curatedCommunity = matchCuratedCommunity({
    community: listing.community,
    subdivisionDisplay: listing.subdivisionDisplay,
    city: listing.city,
  });
  const distances = computeDistances(listing.latitude, listing.longitude);
  const listingUrl = `${SITE_URL}/listings/${listing.slug}`;

  // Nearby listings + market read fetch were previously awaited here
  // and added ~1s to TTFB on every detail-page load. Both are
  // below-the-fold and non-essential to first paint — the hero,
  // story, features, and location sections all render fine without
  // them. ListingDetailClient now lazy-fetches both client-side
  // after mount; the SSR HTML ships as soon as getListingBySlug
  // resolves, which is the only round-trip the hero actually needs.
  //
  // Trade-off: no-JS / crawler views won't see Nearby / The Read in
  // the initial HTML. Acceptable for these sections — the primary
  // listing content (address, price, photos, attribution) is all
  // server-rendered.
  return (
    <ListingDetailClient
      listing={listing}
      featureGroups={featureGroups}
      curatedCommunity={curatedCommunity}
      distances={distances}
      listingUrl={listingUrl}
    />
  );
}
