import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchListings } from './actions';
import type { ListingSearchFilters } from './actions';

export const metadata: Metadata = {
  title: 'Luxury Listings | Scottsdale & Paradise Valley',
  description:
    'Browse luxury homes for sale in Scottsdale, Paradise Valley, and the Greater Phoenix area. Updated daily from ARMLS.',
};

function formatPrice(price: number | null): string {
  if (!price) return 'Price TBD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatNumber(n: number | null): string {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

interface SearchParams {
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  sort?: string;
  page?: string;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const perPage = 24;

  const filters: ListingSearchFilters = {
    status: ['Active', 'Active Under Contract', 'Coming Soon'],
    limit: perPage,
    offset: (page - 1) * perPage,
    sortBy: (params.sort as ListingSearchFilters['sortBy']) ?? 'price_desc',
  };

  if (params.city) filters.city = params.city;
  if (params.minPrice) filters.minPrice = parseInt(params.minPrice, 10);
  if (params.maxPrice) filters.maxPrice = parseInt(params.maxPrice, 10);
  if (params.minBeds) filters.minBeds = parseInt(params.minBeds, 10);

  const { listings, total } = await fetchListings(filters);
  const totalPages = Math.ceil(total / perPage);

  return (
    <main className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-navy text-white py-16 lg:py-20">
        <div className="mx-auto max-w-content-lg px-8 lg:px-24">
          <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
            Property Search
          </span>
          <h1 className="text-4xl lg:text-5xl font-serif mb-4">
            Luxury Listings
          </h1>
          <p className="text-white/50 text-sm">
            {total.toLocaleString()} properties available
          </p>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="border-b border-navy/10 py-6">
        <div className="mx-auto max-w-content-lg px-8 lg:px-24">
          <form className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-meta uppercase tracking-widest text-navy/40 font-bold block mb-2">
                City
              </label>
              <select
                name="city"
                defaultValue={params.city ?? ''}
                className="border border-navy/20 bg-white px-4 py-2.5 text-sm text-navy min-w-[160px]"
              >
                <option value="">All Cities</option>
                <option value="Scottsdale">Scottsdale</option>
                <option value="Paradise Valley">Paradise Valley</option>
                <option value="Phoenix">Phoenix</option>
                <option value="Cave Creek">Cave Creek</option>
                <option value="Carefree">Carefree</option>
                <option value="Fountain Hills">Fountain Hills</option>
                <option value="Mesa">Mesa</option>
                <option value="Tempe">Tempe</option>
                <option value="Chandler">Chandler</option>
                <option value="Gilbert">Gilbert</option>
              </select>
            </div>

            <div>
              <label className="text-meta uppercase tracking-widest text-navy/40 font-bold block mb-2">
                Min Price
              </label>
              <select
                name="minPrice"
                defaultValue={params.minPrice ?? ''}
                className="border border-navy/20 bg-white px-4 py-2.5 text-sm text-navy min-w-[140px]"
              >
                <option value="">No Min</option>
                <option value="500000">$500K</option>
                <option value="1000000">$1M</option>
                <option value="2000000">$2M</option>
                <option value="3000000">$3M</option>
                <option value="5000000">$5M</option>
              </select>
            </div>

            <div>
              <label className="text-meta uppercase tracking-widest text-navy/40 font-bold block mb-2">
                Max Price
              </label>
              <select
                name="maxPrice"
                defaultValue={params.maxPrice ?? ''}
                className="border border-navy/20 bg-white px-4 py-2.5 text-sm text-navy min-w-[140px]"
              >
                <option value="">No Max</option>
                <option value="1000000">$1M</option>
                <option value="2000000">$2M</option>
                <option value="5000000">$5M</option>
                <option value="10000000">$10M</option>
                <option value="25000000">$25M</option>
              </select>
            </div>

            <div>
              <label className="text-meta uppercase tracking-widest text-navy/40 font-bold block mb-2">
                Beds
              </label>
              <select
                name="minBeds"
                defaultValue={params.minBeds ?? ''}
                className="border border-navy/20 bg-white px-4 py-2.5 text-sm text-navy min-w-[100px]"
              >
                <option value="">Any</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>

            <div>
              <label className="text-meta uppercase tracking-widest text-navy/40 font-bold block mb-2">
                Sort
              </label>
              <select
                name="sort"
                defaultValue={params.sort ?? 'price_desc'}
                className="border border-navy/20 bg-white px-4 py-2.5 text-sm text-navy min-w-[140px]"
              >
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="newest">Newest</option>
                <option value="sqft">Largest</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-gold text-white px-6 py-2.5 text-label uppercase tracking-md font-bold hover:bg-navy transition-colors duration-300"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Results Grid */}
      <section className="mx-auto max-w-[1800px] px-8 lg:px-24 py-16">
        {listings.length === 0 ? (
          <div className="text-center py-24">
            <h2 className="text-2xl font-serif text-navy mb-4">
              No Properties Found
            </h2>
            <p className="text-sm text-navy/50 mb-8">
              Try adjusting your search criteria.
            </p>
            <Link
              href="/listings"
              className="text-label uppercase tracking-md font-bold text-gold hover:text-navy transition-colors"
            >
              Clear Filters
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
              {listings.map((listing) => {
                return (
                  <Link
                    key={listing.listing_key}
                    href={`/listings/${listing.listing_key}`}
                    className="group"
                  >
                    <div className="aspect-[4/3] overflow-hidden relative mb-6 bg-navy/5">
                      <div className="w-full h-full flex items-center justify-center text-navy/20">
                        <svg
                          className="w-16 h-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                      </div>
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2">
                        <span className="font-serif text-navy text-lg">
                          {formatPrice(listing.list_price)}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className="bg-navy/80 text-white px-3 py-1 text-xs uppercase tracking-wider">
                          {listing.standard_status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-meta uppercase tracking-widest text-navy/40 mb-2">
                        {listing.subdivision_name ?? listing.city ?? 'Arizona'}
                      </p>
                      <h3 className="text-lg font-serif text-navy mb-2 group-hover:text-gold transition-colors duration-300">
                        {listing.unparsed_address ?? `MLS# ${listing.listing_id}`}
                      </h3>
                      <p className="text-xs text-navy/50 mb-3">
                        {listing.city}
                        {listing.state_or_province
                          ? `, ${listing.state_or_province}`
                          : ''}
                        {listing.postal_code ? ` ${listing.postal_code}` : ''}
                      </p>
                      <div className="h-px w-8 bg-navy/20 my-3 group-hover:w-16 group-hover:bg-gold transition-all duration-500" />
                      <div className="flex items-center gap-6 text-xs text-navy">
                        {listing.bedrooms_total && (
                          <span>{listing.bedrooms_total} Beds</span>
                        )}
                        {listing.bathrooms_total_integer && (
                          <span>{listing.bathrooms_total_integer} Baths</span>
                        )}
                        {listing.living_area && (
                          <span>{formatNumber(listing.living_area)} SF</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-16">
                {page > 1 && (
                  <Link
                    href={`/listings?${new URLSearchParams({
                      ...(params.city ? { city: params.city } : {}),
                      ...(params.minPrice ? { minPrice: params.minPrice } : {}),
                      ...(params.maxPrice ? { maxPrice: params.maxPrice } : {}),
                      ...(params.minBeds ? { minBeds: params.minBeds } : {}),
                      ...(params.sort ? { sort: params.sort } : {}),
                      page: String(page - 1),
                    }).toString()}`}
                    className="border border-navy/20 px-6 py-3 text-label uppercase tracking-md font-bold text-navy hover:bg-navy hover:text-white transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-navy/50">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/listings?${new URLSearchParams({
                      ...(params.city ? { city: params.city } : {}),
                      ...(params.minPrice ? { minPrice: params.minPrice } : {}),
                      ...(params.maxPrice ? { maxPrice: params.maxPrice } : {}),
                      ...(params.minBeds ? { minBeds: params.minBeds } : {}),
                      ...(params.sort ? { sort: params.sort } : {}),
                      page: String(page + 1),
                    }).toString()}`}
                    className="border border-navy/20 px-6 py-3 text-label uppercase tracking-md font-bold text-navy hover:bg-navy hover:text-white transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* IDX Attribution — ARMLS Compliance Required */}
      {/* @compliance IDX: Must display data source attribution */}
      <section className="border-t border-navy/10 py-8">
        <div className="mx-auto max-w-content-lg px-8 lg:px-24 text-center">
          <p className="text-xs text-navy/30">
            Listing data provided by Arizona Regional Multiple Listing Service
            (ARMLS). IDX information is provided exclusively for personal,
            non-commercial use, and may not be used for any purpose other than to
            identify prospective properties consumers may be interested in
            purchasing. Data last updated{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            .
          </p>
        </div>
      </section>
    </main>
  );
}
