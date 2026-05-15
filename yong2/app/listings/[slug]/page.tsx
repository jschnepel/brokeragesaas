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

  // RealEstateListing JSON-LD — emit a Product+Offer-shaped record so
  // Google can build a rich result for the listing (price, beds, baths,
  // sqft, address all available in the SERP card). Without this, the
  // listing-detail page surfaces only as a plain blue-link result and
  // misses the Real-Estate Vertical's enhanced presentation.
  //
  // Schema reference: schema.org/RealEstateListing (and the underlying
  // Product/Offer mix Google's docs recommend for real-estate inventory).
  const listingSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.unparsedAddress,
    url: listingUrl,
    description: listing.publicRemarks ?? `${listing.unparsedAddress}, ${listing.community ?? listing.city ?? 'Arizona'}`,
    datePosted: listing.modificationTimestamp ?? undefined,
    image: listing.coverPhotoUrl ? [listing.coverPhotoUrl] : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.unparsedAddress?.split(',')[0]?.trim(),
      addressLocality: listing.city ?? undefined,
      addressRegion: 'AZ',
      postalCode: listing.postalCode ?? undefined,
      addressCountry: 'US',
    },
    geo: listing.latitude != null && listing.longitude != null
      ? {
          '@type': 'GeoCoordinates',
          latitude: listing.latitude,
          longitude: listing.longitude,
        }
      : undefined,
    offers: listing.listPrice != null
      ? {
          '@type': 'Offer',
          price: listing.listPrice,
          priceCurrency: 'USD',
          availability: listing.status === 'Active'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/LimitedAvailability',
          url: listingUrl,
        }
      : undefined,
    numberOfRooms: listing.bedrooms ?? undefined,
    numberOfBedrooms: listing.bedrooms ?? undefined,
    numberOfBathroomsTotal: listing.bathroomsTotal ?? undefined,
    floorSize: listing.livingArea != null
      ? { '@type': 'QuantitativeValue', value: listing.livingArea, unitCode: 'FTK' }
      : undefined,
    // @compliance ARMLS IDX — explicit broker attribution in schema so
    // the SERP card shows the listing brokerage alongside the price.
    broker: listing.listOfficeName
      ? { '@type': 'RealEstateAgent', name: listing.listOfficeName }
      : undefined,
  };

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
  // Serialize + defang any `<` characters so a malicious string in
  // Spark data could never close the surrounding <script> tag. JSON-LD
  // is the standard Next.js pattern; the body is server-rendered JSON,
  // not user-supplied HTML. Same pattern as app/layout.tsx websiteSchema.
  const listingSchemaJson = JSON.stringify(listingSchema).replace(/</g, '\\u003c');

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- server-rendered JSON-LD is the canonical Next.js pattern
        dangerouslySetInnerHTML={{ __html: listingSchemaJson }}
      />
      <ListingDetailClient
        listing={listing}
        featureGroups={featureGroups}
        curatedCommunity={curatedCommunity}
        distances={distances}
        listingUrl={listingUrl}
      />
    </>
  );
}
