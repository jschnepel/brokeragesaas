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
import { notFound } from 'next/navigation';
import { getListingBySlug } from '@/lib/spark/search';
import { buildFeatureGroups } from '@/lib/spark/listing-features';
import { matchCuratedCommunity } from '@/lib/community-match';
import { computeDistances } from '@/lib/distances';
import { siteUrl } from '@/lib/seo';
import { ListingDetailClient } from './ListingDetailClient';

// 5-minute ISR — Spark refreshes hourly; 5min staleness is well within
// tolerance and gives every visitor sub-100ms TTFB after the cache warms.
export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3200';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug).catch(() => null);
  if (!listing) return { title: 'Listing' };
  return {
    title: `${listing.unparsedAddress} · ${listing.community}`,
    description:
      listing.publicRemarks?.slice(0, 160) ?? `${listing.unparsedAddress}.`,
    alternates: { canonical: siteUrl(`/listings/${listing.slug}`) },
    openGraph: {
      images: listing.coverPhotoUrl ? [listing.coverPhotoUrl] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug).catch(() => null);
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
