import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchListingDetail, fetchListingPhotos } from '../actions';
import { resolveAgentConfig } from '../../../agent-config';

const agent = resolveAgentConfig();

interface ListingPageProps {
  params: Promise<{ slug: string }>;
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price Upon Request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatNumber(n: number | null | undefined): string {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

function formatLotSize(acres: number | null, sqft: number | null): string {
  if (acres && acres >= 1) return `${acres.toFixed(2)} acres`;
  if (sqft) return `${formatNumber(sqft)} SF lot`;
  return '—';
}

function parseJsonbArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await fetchListingDetail(slug);
  if (!listing) return { title: 'Listing Not Found' };

  const address = listing.unparsed_address ?? 'Property';
  const area = listing.subdivision_name ?? listing.city ?? 'Arizona';
  const price = formatPrice(listing.list_price);

  return {
    title: `${address} | ${area} | ${agent.name}`,
    description: `${listing.bedrooms_total ?? '—'} bed, ${listing.bathrooms_total_integer ?? '—'} bath, ${formatNumber(listing.living_area)} SF home in ${area}. ${price}. Listed by ${listing.list_agent_full_name ?? 'Agent'}, ${listing.list_office_name}.`,
  };
}

export default async function ListingDetailPage({
  params,
}: ListingPageProps) {
  const { slug } = await params;

  const [listing, photos] = await Promise.all([
    fetchListingDetail(slug),
    fetchListingPhotos(slug),
  ]);

  if (!listing) notFound();

  const address = listing.unparsed_address ?? `MLS# ${listing.listing_id}`;
  const area = listing.subdivision_name ?? listing.city ?? 'Arizona';
  const price = formatPrice(listing.list_price);
  const gallery = photos.map((p) => p.media_url);

  // Collect all feature arrays for display
  const featureSections: { label: string; items: string[] }[] = [];
  const trySection = (label: string, raw: unknown) => {
    const items = parseJsonbArray(raw);
    if (items.length > 0) featureSections.push({ label, items });
  };
  trySection('Interior', listing.interior_features);
  trySection('Exterior', listing.exterior_features);
  trySection('Appliances', listing.appliances);
  trySection('Flooring', listing.flooring);
  trySection('Cooling', listing.cooling);
  trySection('Heating', listing.heating);
  trySection('Pool', listing.pool_features);
  trySection('Parking', listing.parking_features);
  trySection('Architecture', listing.architectural_style);
  trySection('Construction', listing.construction_materials);
  trySection('Roof', listing.roof);
  trySection('Community', listing.community_features);
  trySection('View', listing.view_features);

  return (
    <main className="bg-white">
      {/* Gallery Hero */}
      <section className="relative">
        {gallery.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 max-h-[70vh] overflow-hidden">
            {/* Primary image */}
            <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[0]}
                alt={address}
                className="w-full h-full object-cover min-h-[300px] lg:min-h-[500px]"
              />
              <div className="absolute top-6 left-6">
                <span className="bg-white/95 backdrop-blur-sm text-navy px-4 py-2 text-meta uppercase tracking-widest font-bold">
                  {listing.standard_status}
                </span>
              </div>
              {gallery.length > 4 && (
                <div className="absolute bottom-6 right-6">
                  <span className="bg-black/60 text-white px-4 py-2 text-xs">
                    {gallery.length} Photos
                  </span>
                </div>
              )}
            </div>
            {/* Secondary images */}
            {gallery.slice(1, 5).map((img, i) => (
              <div key={i} className="hidden lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`${address} photo ${i + 2}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-navy/5 h-[40vh] flex items-center justify-center">
            <div className="text-center text-navy/20">
              <svg
                className="w-20 h-20 mx-auto mb-4"
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
              <span className="text-meta uppercase tracking-widest font-bold">
                {listing.standard_status}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Listing Content */}
      <section className="mx-auto max-w-content-lg px-8 lg:px-24 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-navy/40 mb-8">
              <Link href="/" className="hover:text-gold transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link
                href="/listings"
                className="hover:text-gold transition-colors"
              >
                Listings
              </Link>
              <span>/</span>
              <span className="text-navy/60">{address}</span>
            </nav>

            {/* Address & Price */}
            <div className="mb-8">
              <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">
                {area}
              </span>
              <h1 className="text-3xl lg:text-5xl font-serif text-navy mb-4 tracking-tight">
                {address}
              </h1>
              <p className="text-sm text-navy/50">
                {listing.city}
                {listing.state_or_province
                  ? `, ${listing.state_or_province}`
                  : ''}
                {listing.postal_code ? ` ${listing.postal_code}` : ''}
              </p>
            </div>

            {/* Price */}
            <div className="mb-10">
              <span className="text-3xl lg:text-4xl font-serif text-navy">
                {price}
              </span>
              {listing.days_on_market !== null && listing.days_on_market !== undefined && (
                <span className="text-sm text-navy/40 ml-4">
                  {listing.days_on_market} days on market
                </span>
              )}
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-8 py-6 border-y border-navy/10 mb-12">
              {[
                { value: listing.bedrooms_total, label: 'Bedrooms' },
                { value: listing.bathrooms_total_integer, label: 'Bathrooms' },
                {
                  value: listing.living_area
                    ? formatNumber(listing.living_area)
                    : null,
                  label: 'Sq Ft',
                },
                { value: listing.year_built, label: 'Year Built' },
                {
                  value: formatLotSize(
                    listing.lot_size_acres,
                    listing.lot_size_square_feet
                  ),
                  label: 'Lot Size',
                },
                { value: listing.stories_total, label: 'Stories' },
              ]
                .filter((s) => s.value && s.value !== '—')
                .map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-serif text-navy">{stat.value}</p>
                    <p className="text-meta uppercase tracking-widest text-navy/40 mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
            </div>

            {/* Description */}
            {listing.public_remarks && (
              <div className="mb-16">
                <h2 className="text-xl font-serif text-navy mb-6">
                  About This Property
                </h2>
                <p className="text-sm text-navy/60 leading-relaxed">
                  {listing.public_remarks}
                </p>
              </div>
            )}

            {/* Features */}
            {featureSections.length > 0 && (
              <div className="mb-16">
                <h2 className="text-xl font-serif text-navy mb-6">
                  Property Features
                </h2>
                <div className="space-y-8">
                  {featureSections.map((section) => (
                    <div key={section.label}>
                      <h3 className="text-meta uppercase tracking-widest text-navy/40 font-bold mb-4">
                        {section.label}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                        {section.items.map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center gap-3"
                          >
                            <div className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
                            <span className="text-sm text-navy/70">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Details Table */}
            <div className="mb-16">
              <h2 className="text-xl font-serif text-navy mb-6">
                Property Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                {[
                  { label: 'MLS #', value: listing.listing_id },
                  { label: 'Property Type', value: listing.property_type },
                  { label: 'Property SubType', value: listing.property_sub_type },
                  { label: 'Status', value: listing.standard_status },
                  {
                    label: 'Garage',
                    value: listing.garage_spaces
                      ? `${listing.garage_spaces} spaces`
                      : null,
                  },
                  {
                    label: 'Pool',
                    value: listing.pool_private_yn ? 'Yes' : null,
                  },
                  {
                    label: 'HOA',
                    value:
                      listing.association_yn && listing.association_fee
                        ? `$${formatNumber(listing.association_fee)}/${listing.association_fee_frequency ?? 'month'}`
                        : listing.association_yn
                          ? 'Yes'
                          : null,
                  },
                  { label: 'County', value: listing.county_or_parish },
                  {
                    label: 'Tax Amount',
                    value: listing.tax_annual_amount
                      ? `$${formatNumber(listing.tax_annual_amount)}/yr`
                      : null,
                  },
                  { label: 'Parcel #', value: listing.parcel_number },
                ]
                  .filter((d) => d.value)
                  .map((detail) => (
                    <div
                      key={detail.label}
                      className="flex justify-between py-2 border-b border-navy/5"
                    >
                      <span className="text-navy/40">{detail.label}</span>
                      <span className="text-navy font-medium">
                        {detail.value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Schools */}
            {(listing.elementary_school || listing.middle_or_junior_school || listing.high_school_district) && (
              <div className="mb-16">
                <h2 className="text-xl font-serif text-navy mb-6">Schools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                  {[
                    { label: 'Elementary', value: listing.elementary_school },
                    { label: 'Middle School', value: listing.middle_or_junior_school },
                    { label: 'High School District', value: listing.high_school_district },
                    { label: 'Elementary District', value: listing.elementary_school_district },
                  ]
                    .filter((d) => d.value)
                    .map((detail) => (
                      <div
                        key={detail.label}
                        className="flex justify-between py-2 border-b border-navy/5"
                      >
                        <span className="text-navy/40">{detail.label}</span>
                        <span className="text-navy font-medium">
                          {detail.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Agent Card */}
          <aside className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              {/* Agent Card */}
              <div className="border border-navy/10 bg-cream p-8">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-gold/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={agent.photoUrl}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-serif text-lg text-navy">{agent.name}</h3>
                  <p className="text-meta uppercase tracking-widest text-navy/40 mt-1">
                    {agent.title}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <a
                    href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`}
                    className="block w-full text-center bg-gold text-white px-6 py-4 text-label uppercase tracking-md font-bold hover:bg-navy transition-colors duration-300"
                  >
                    Call {agent.contact.phone}
                  </a>
                  <Link
                    href="/contact"
                    className="block w-full text-center border border-navy/20 text-navy px-6 py-4 text-label uppercase tracking-md font-bold hover:bg-navy hover:text-white transition-colors duration-300"
                  >
                    Schedule Showing
                  </Link>
                </div>

                <p className="text-xs text-navy/40 text-center">
                  {agent.brokerage}
                </p>
              </div>

              {/* @compliance IDX: Must display listing office attribution */}
              {/* Listing Attribution */}
              <div className="border border-navy/10 p-6 text-xs text-navy/40">
                <p className="mb-2">
                  <span className="font-bold text-navy/50">Listed by:</span>{' '}
                  {listing.list_agent_full_name ?? 'Agent'},{' '}
                  {listing.list_office_name}
                </p>
                {listing.list_office_phone && (
                  <p className="mb-2">Office: {listing.list_office_phone}</p>
                )}
                <p>MLS# {listing.listing_id}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* IDX Attribution — ARMLS Compliance Required */}
      {/* @compliance IDX: Must display data source attribution on every detail page */}
      <section className="border-t border-navy/10 py-8">
        <div className="mx-auto max-w-content-lg px-8 lg:px-24">
          <p className="text-xs text-navy/30 mb-4">
            Listing data provided by Arizona Regional Multiple Listing Service
            (ARMLS). IDX information is provided exclusively for personal,
            non-commercial use, and may not be used for any purpose other than to
            identify prospective properties consumers may be interested in
            purchasing. All information should be verified independently.
          </p>
          <p className="text-xs text-navy/30">
            Last updated:{' '}
            {new Date(listing.modification_timestamp).toLocaleDateString(
              'en-US',
              { month: 'long', day: 'numeric', year: 'numeric' }
            )}
          </p>
        </div>
      </section>

      {/* Navigation */}
      <section className="border-t border-navy/10 py-12">
        <div className="mx-auto max-w-content-lg px-8 lg:px-24 flex justify-between items-center">
          <Link
            href="/listings"
            className="text-sm text-navy/50 hover:text-gold transition-colors"
          >
            ← Back to Listings
          </Link>
          <Link
            href="/contact"
            className="text-label uppercase tracking-md font-bold text-navy hover:text-gold transition-colors"
          >
            Schedule a Showing →
          </Link>
        </div>
      </section>
    </main>
  );
}
