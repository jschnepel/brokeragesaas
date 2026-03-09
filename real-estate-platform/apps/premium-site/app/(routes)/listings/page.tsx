import { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchListings } from './actions';
import type { ListingSearchFilters } from '@platform/database/src/queries/listings';
import { ListingsSearchClient } from './ListingsSearchClient';

interface SearchParams {
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  minBaths?: string;
  minSqft?: string;
  propertyType?: string;
  sortBy?: string;
  hasPool?: string;
  hasGarage?: string;
  minYearBuilt?: string;
  subdivisionName?: string;
  page?: string;
  swLat?: string;
  swLng?: string;
  neLat?: string;
  neLng?: string;
  polygon?: string;
}

function formatPriceLabel(price: string): string {
  const n = parseInt(price, 10);
  if (isNaN(n)) return '';
  if (n >= 1_000_000) return `$${(n / 1_000_000)}M`;
  return `$${Math.round(n / 1000)}K`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;

  const parts: string[] = [];
  if (params.city) parts.push(params.city);
  if (params.minPrice) parts.push(`Over ${formatPriceLabel(params.minPrice)}`);
  if (params.maxPrice && !params.minPrice) parts.push(`Under ${formatPriceLabel(params.maxPrice)}`);

  const title = parts.length > 0
    ? `${parts.join(' ')} Luxury Listings | Yong Choi`
    : 'Luxury Listings | Scottsdale & Paradise Valley';

  return {
    title,
    description:
      'Browse luxury homes for sale in Scottsdale, Paradise Valley, and the Greater Phoenix area. Updated daily from ARMLS.',
  };
}

function ListingsSkeleton() {
  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 h-[calc(100vh-var(--nav-height))] flex flex-col">
      {/* Filter bar skeleton */}
      <div className="hidden md:block shrink-0 bg-white border-b border-navy/10 shadow-sm">
        <div className="px-4 py-2.5 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-28 bg-navy/5 animate-pulse" />
          ))}
        </div>
      </div>
      {/* Split pane skeleton */}
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block w-1/2 bg-navy/5 animate-pulse" />
        <div className="w-full md:w-1/2 bg-cream px-5 py-4 grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-navy/8 animate-pulse">
              <div className="aspect-[16/10] bg-navy/5" />
              <div className="px-4 pt-4 pb-3 space-y-2">
                <div className="h-4 w-3/4 bg-navy/8 rounded" />
                <div className="h-3 w-1/2 bg-navy/5 rounded" />
                <div className="h-px w-8 bg-navy/10 my-3" />
                <div className="flex gap-4">
                  <div className="h-3 w-12 bg-navy/5 rounded" />
                  <div className="h-3 w-12 bg-navy/5 rounded" />
                  <div className="h-3 w-16 bg-navy/5 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  // Parse polygon from URL: "lng,lat;lng,lat;..."
  let polygonPoints: [number, number][] | undefined;
  if (params.polygon) {
    const pts = params.polygon.split(';').map((pair) => {
      const [lng, lat] = pair.split(',').map(Number);
      return [lng, lat] as [number, number];
    });
    if (pts.length >= 3 && pts.every(([lng, lat]) => !isNaN(lng) && !isNaN(lat))) {
      polygonPoints = pts;
    }
  }

  const hasBounds =
    !polygonPoints && params.swLat && params.swLng && params.neLat && params.neLng;
  const perPage = polygonPoints ? 200 : hasBounds ? 100 : 24;

  const filters: ListingSearchFilters = {
    status: ['Active', 'Active Under Contract', 'Coming Soon'],
    limit: perPage,
    offset: (polygonPoints || hasBounds) ? 0 : (page - 1) * perPage,
    sortBy: (params.sortBy as ListingSearchFilters['sortBy']) ?? 'price_desc',
  };

  if (params.city) filters.city = params.city;
  if (params.minPrice) filters.minPrice = parseInt(params.minPrice, 10);
  if (params.maxPrice) filters.maxPrice = parseInt(params.maxPrice, 10);
  if (params.minBeds) filters.minBeds = parseInt(params.minBeds, 10);
  if (params.minBaths) filters.minBaths = parseInt(params.minBaths, 10);
  if (params.minSqft) filters.minSqft = parseInt(params.minSqft, 10);
  if (params.propertyType) filters.propertyType = params.propertyType;
  if (params.hasPool === 'true') filters.hasPool = true;
  if (params.hasGarage === 'true') filters.hasGarage = true;
  if (params.minYearBuilt) filters.minYearBuilt = parseInt(params.minYearBuilt, 10);
  if (params.subdivisionName) filters.subdivisionName = params.subdivisionName;

  if (polygonPoints) {
    filters.polygon = polygonPoints;
  } else if (hasBounds) {
    filters.swLat = parseFloat(params.swLat!);
    filters.swLng = parseFloat(params.swLng!);
    filters.neLat = parseFloat(params.neLat!);
    filters.neLng = parseFloat(params.neLng!);
  }

  const { listings, total } = await fetchListings(filters);

  return (
    <main className="pt-24 lg:pt-28">
      <Suspense fallback={<ListingsSkeleton />}>
        <ListingsSearchClient
          initialListings={listings}
          initialTotal={total}
        />
      </Suspense>
    </main>
  );
}
