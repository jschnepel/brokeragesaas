import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityAmenities,
  getCommunitiesByRegion,
  getAllCommunities,
  getCommunityListingFilters,
} from '@platform/database/src/queries/communities';
import { getCommunityScorecard, getMarketPulseMonthly } from '@platform/database/src/queries/analytics';
import { searchListingsWithPhotos } from '@platform/database/src/queries/listings';
import type { ListingSearchFilters } from '@platform/database/src/queries/listings';
import { adaptCommunityData } from './lib/adapter';
import { buildPlaceSchema, buildBreadcrumbSchema } from './structured-data';
import { CommunityHero } from './components/CommunityHero';
import { CommunityKpiCards } from './components/CommunityKpiCards';
import { CommunityNarrative } from './components/CommunityNarrative';
import { CommunitySidebar } from './components/CommunitySidebar';
import { CommunityExploreMap } from './components/CommunityExploreMap';
import { CommunitySignatureAmenity } from './components/CommunitySignatureAmenity';
import { CommunityTransportation } from './components/CommunityTransportation';
import { CommunityQualityOfLife } from './components/CommunityQualityOfLife';
import { CommunitySchools } from './components/CommunitySchools';
import { CommunityDining } from './components/CommunityDining';
import { CommunityEconomy } from './components/CommunityEconomy';
import { CommunityFeaturedListing } from './components/CommunityFeaturedListing';
import { CommunityListingsGrid } from './components/CommunityListingsGrid';
import { CommunityCta } from './components/CommunityCta';
import { CommunitySimilar } from './components/CommunitySimilar';

// ── ISR: revalidate every hour ──────────────────────
export const revalidate = 3600;

// ── Static Params ───────────────────────────────────
export async function generateStaticParams() {
  const communities = await getAllCommunities();
  return communities.map((c) => ({
    regionId: c.region_id,
    communityId: c.id,
  }));
}

// ── Metadata ────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ regionId: string; communityId: string }>;
}): Promise<Metadata> {
  const { communityId } = await params;
  const community = await getCommunityBySlug(communityId);

  if (!community) {
    return { title: 'Community Not Found' };
  }

  const title = `${community.name} | ${community.city ?? 'Phoenix'} Luxury Community`;
  const description = `Explore homes for sale in ${community.name}, ${community.city ?? 'Arizona'}. View market data, amenities, and lifestyle details for this ${community.gating ?? ''} community.`.trim();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(community.hero_image ? { images: [{ url: community.hero_image }] } : {}),
    },
  };
}

// ── Page Component ──────────────────────────────────
export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ regionId: string; communityId: string }>;
}) {
  const { communityId } = await params;

  // 1. Fetch community by slug
  const community = await getCommunityBySlug(communityId);
  if (!community) notFound();

  // 2. Resolve listing filters
  const listingFilter = await getCommunityListingFilters(community);

  // 3. Parallel data fetching
  const [amenities, listingsResult, similarCommunities, scorecard, pulseData] =
    await Promise.all([
      getCommunityAmenities(community.id),
      fetchListings(listingFilter),
      getCommunitiesByRegion(community.region_id, community.id),
      getCommunityScorecard({ subdivisionName: community.name }),
      getMarketPulseMonthly({ subdivisionName: community.name }, 24),
    ]);

  // 4. Adapt raw DB data into component-ready shape
  const data = adaptCommunityData(
    community,
    amenities,
    scorecard ?? null,
    pulseData.length > 0 ? pulseData : null,
  );

  const listings = listingsResult.listings;

  // 5. Structured data
  const placeSchema = buildPlaceSchema(data);
  const breadcrumbSchema = buildBreadcrumbSchema(data);
  const structuredDataHtml = JSON.stringify([placeSchema, breadcrumbSchema]);

  return (
    <>
      {/* eslint-disable-next-line -- JSON-LD is server-generated, not user input */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataHtml }}
      />

      {/* Hero */}
      <CommunityHero
        name={data.name}
        city={data.city}
        zipCode={data.zipCode}
        elevation={data.elevation}
        heroImage={data.heroImage}
        regionId={data.regionId}
        regionName={data.regionName}
        tagline={data.narrative.tagline}
      />

      {/* KPI Cards */}
      {data.metrics.length > 0 && (
        <CommunityKpiCards metrics={data.metrics} />
      )}

      {/* Bento Layout: Narrative (8 cols) + Sidebar (4 cols) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column — narrative + explore + signature */}
          <div className="lg:col-span-8 space-y-12">
            <CommunityNarrative
              narrative={data.narrative}
              features={data.tags}
              communityId={data.id}
            />

            <CommunityExploreMap
              exploreData={data.exploreData}
              boundaryGeoJson={data.boundaryGeoJson}
            />

            <CommunitySignatureAmenity
              signatureAmenity={data.signatureAmenity}
            />
          </div>

          {/* Right column — sidebar */}
          <div className="lg:col-span-4">
            <CommunitySidebar
              gallery={data.gallery}
              demographics={data.demographics}
              stats={data.stats}
              communityId={data.id}
              communityName={data.name}
              inventory={data.stats?.inventory ?? 0}
            />
          </div>
        </div>
      </div>

      {/* Full-width sections */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pb-12">
        <div className="grid grid-cols-12 gap-6">
          <CommunityTransportation
            airports={data.airports}
            keyDistances={data.keyDistances}
          />

          <CommunityQualityOfLife qualityOfLife={data.qualityOfLife} />

          <CommunitySchools schools={data.schools} />

          <CommunityDining restaurants={data.restaurants} />

          <CommunityEconomy
            employers={data.employers}
            economicStats={data.economicStats}
          />
        </div>
      </div>

      {/* Featured Listing */}
      {listings.length > 0 && (
        <CommunityFeaturedListing listing={listings[0]} />
      )}

      {/* Listings Grid */}
      {listings.length > 1 && (
        <CommunityListingsGrid listings={listings.slice(1)} />
      )}

      {/* CTA */}
      <CommunityCta
        communityName={data.name}
        communityId={data.id}
      />

      {/* Similar Communities */}
      {similarCommunities.length > 0 && (
        <CommunitySimilar
          communities={similarCommunities}
          regionId={data.regionId}
          regionName={data.regionName}
        />
      )}
    </>
  );
}

// ── Helpers ─────────────────────────────────────────

async function fetchListings(
  filter: { city?: string; subdivisionNames?: string[] } | null,
) {
  if (!filter) {
    return { listings: [], total: 0 };
  }

  const searchFilters: ListingSearchFilters = {
    sortBy: 'newest',
    limit: 12,
  };

  if ('subdivisionNames' in filter && filter.subdivisionNames && filter.subdivisionNames.length > 0) {
    searchFilters.subdivisionName = filter.subdivisionNames[0];
  } else if ('city' in filter && filter.city) {
    searchFilters.cities = [filter.city];
  }

  return searchListingsWithPhotos(searchFilters);
}

