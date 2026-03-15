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

      {/* Hero placeholder */}
      <section className="relative w-full" style={{ height: '50vh', minHeight: 400 }}>
        {data.heroImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.heroImage})` }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-navy/10" />
        )}
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-3">
            {data.name}
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            {data.city}{data.zipCode ? ` · ${data.zipCode}` : ''} · {data.regionName}
          </p>
        </div>
      </section>

      {/* Placeholder content */}
      <main className="mx-auto max-w-7xl px-4 py-12 space-y-16">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">
            {data.regionName}
          </p>
          <h2 className="font-serif text-3xl font-semibold text-gray-900 mb-4">
            {data.name}
          </h2>
          {data.narrative.tagline && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {data.narrative.tagline}
            </p>
          )}
        </div>

        {/* Summary stats */}
        {data.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Median Price" value={data.stats.avgPrice} />
            <StatCard label="Price/Sq Ft" value={data.stats.avgPpsf} />
            <StatCard label="Avg DOM" value={`${data.stats.avgDom} days`} />
            <StatCard label="Inventory" value={String(data.stats.inventory)} />
          </div>
        )}

        {/* Component sections — coming next */}
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 text-sm">
            Components coming soon — {listings.length} listings loaded,{' '}
            {similarCommunities.length} similar communities,{' '}
            {amenities.length} amenities
          </p>
        </div>
      </main>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-6 text-center">
      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-serif text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
