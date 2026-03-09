import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchListingDetail, fetchListingByMlsId, fetchListingPhotos } from '../actions';
import { resolveAgentConfig } from '../../../agent-config/index';

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
  const a = acres != null ? Number(acres) : 0;
  const s = sqft != null ? Number(sqft) : 0;
  if (a >= 1) return `${a.toFixed(2)} ac`;
  if (s > 0) return `${formatNumber(s)} SF`;
  return '';
}

function parseListingSlug(slug: string): { listingId: string | null; listingKey: string } {
  const decoded = decodeURIComponent(slug);
  const idx = decoded.lastIndexOf('_');
  if (idx > 0) {
    return { listingId: decoded.slice(idx + 1), listingKey: decoded };
  }
  return { listingId: null, listingKey: decoded };
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
  const { listingId, listingKey } = parseListingSlug(slug);
  const listing = listingId
    ? await fetchListingByMlsId(listingId)
    : await fetchListingDetail(listingKey);
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
  const { listingId, listingKey } = parseListingSlug(slug);

  const listing = listingId
    ? await fetchListingByMlsId(listingId)
    : await fetchListingDetail(listingKey);

  if (!listing) notFound();

  const photos = await fetchListingPhotos(listing.listing_key);

  const address = listing.unparsed_address ?? `MLS# ${listing.listing_id}`;
  const area = listing.subdivision_name ?? listing.city ?? 'Arizona';
  const price = formatPrice(listing.list_price);
  const gallery = photos.map((p) => p.media_url);

  // Collect all feature arrays — merge small sections
  const allFeatures: { label: string; items: string[] }[] = [];
  const trySection = (label: string, raw: unknown) => {
    const items = parseJsonbArray(raw);
    if (items.length > 0) allFeatures.push({ label, items });
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

  // Quick stats inline
  const quickStats = [
    listing.bedrooms_total != null ? `${listing.bedrooms_total} Bed` : null,
    listing.bathrooms_total_integer != null ? `${listing.bathrooms_total_integer} Bath` : null,
    listing.living_area ? `${formatNumber(listing.living_area)} SF` : null,
    listing.year_built ? `Built ${listing.year_built}` : null,
    listing.stories_total ? `${listing.stories_total} Story` : null,
    listing.garage_spaces ? `${listing.garage_spaces}-Car Garage` : null,
    formatLotSize(listing.lot_size_acres, listing.lot_size_square_feet) || null,
  ].filter(Boolean) as string[];

  // Property details for the table
  const details = [
    { label: 'MLS #', value: listing.listing_id },
    { label: 'Type', value: listing.property_type },
    { label: 'SubType', value: listing.property_sub_type },
    { label: 'Status', value: listing.standard_status },
    {
      label: 'HOA',
      value:
        listing.association_yn && listing.association_fee
          ? `$${formatNumber(listing.association_fee)}/${listing.association_fee_frequency ?? 'mo'}`
          : listing.association_yn
            ? 'Yes'
            : null,
    },
    { label: 'County', value: listing.county_or_parish },
    {
      label: 'Tax',
      value: listing.tax_annual_amount
        ? `$${formatNumber(listing.tax_annual_amount)}/yr`
        : null,
    },
    { label: 'Parcel', value: listing.parcel_number },
    { label: 'Pool', value: listing.pool_private_yn ? 'Private' : null },
  ].filter((d) => d.value);

  const schools = [
    { label: 'Elementary', value: listing.elementary_school },
    { label: 'Middle', value: listing.middle_or_junior_school },
    { label: 'HS District', value: listing.high_school_district },
  ].filter((d) => d.value);

  return (
    <main className="bg-white">
      {/* ── Hero: Gallery or Compact Header ── */}
      {gallery.length > 0 ? (
        <section className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5 max-h-[65vh] overflow-hidden">
            <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[0]}
                alt={address}
                className="w-full h-full object-cover min-h-[280px] lg:min-h-[450px]"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-navy/85 backdrop-blur-sm text-white px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold">
                  {listing.standard_status}
                </span>
              </div>
              {gallery.length > 5 && (
                <div className="absolute bottom-4 right-4">
                  <span className="bg-white/90 backdrop-blur-sm text-navy px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-white transition-colors">
                    +{gallery.length - 5} Photos
                  </span>
                </div>
              )}
            </div>
            {gallery.slice(1, 5).map((img, i) => (
              <div key={i} className="hidden lg:block relative group/photo overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`${address} photo ${i + 2}`}
                  className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* No photos — compact status-only banner */
        <div className="bg-cream-alt border-b border-navy/10 py-3">
          <div className="mx-auto max-w-content-lg px-6 lg:px-16 flex items-center justify-between">
            <Link
              href="/listings"
              className="text-xs text-navy/40 hover:text-gold transition-colors duration-300 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Listings
            </Link>
            <div className="flex items-center gap-3">
              <span className="bg-navy/85 text-white px-3 py-1 text-[9px] uppercase tracking-widest font-bold">
                {listing.standard_status}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-navy/30">
                MLS# {listing.listing_id}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Back bar (only when photos exist — otherwise already shown above) ── */}
      {gallery.length > 0 && (
        <div className="bg-cream-alt border-b border-navy/10 py-3">
          <div className="mx-auto max-w-content-lg px-6 lg:px-16 flex items-center justify-between">
            <Link
              href="/listings"
              className="text-xs text-navy/40 hover:text-gold transition-colors duration-300 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Listings
            </Link>
            <span className="text-[10px] uppercase tracking-widest text-navy/30">
              MLS# {listing.listing_id}
            </span>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <section className="mx-auto max-w-content-lg px-6 lg:px-16 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="lg:col-span-8">
            {/* Address + Price + Stats — consolidated header */}
            <div className="mb-6">
              <span className="text-label uppercase tracking-xl text-gold font-bold">{area}</span>
              <h1 className="text-2xl lg:text-4xl font-serif text-navy mt-1 tracking-tight">
                {address}
              </h1>
              <p className="text-xs text-navy/40 mt-1">
                {listing.city}
                {listing.state_or_province ? `, ${listing.state_or_province}` : ''}
                {listing.postal_code ? ` ${listing.postal_code}` : ''}
              </p>
            </div>

            {/* Price + Quick Stats row */}
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pb-6 border-b border-navy/10 mb-6">
              <span className="text-2xl lg:text-3xl font-serif text-navy">{price}</span>
              {listing.days_on_market != null && (
                <span className="text-xs text-navy/30">{listing.days_on_market} DOM</span>
              )}
              <div className="w-full" />
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {quickStats.map((stat) => (
                  <span key={stat} className="text-sm text-navy/60">
                    {stat}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            {listing.public_remarks && (
              <div className="mb-6">
                <p className="text-sm text-navy/55 leading-relaxed">
                  {listing.public_remarks}
                </p>
              </div>
            )}

            {/* Features — chip/tag layout grouped by category */}
            {allFeatures.length > 0 && (
              <div className="mb-6">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-navy/30 mb-3">
                  Features &amp; Amenities
                </h2>
                <div className="space-y-3">
                  {allFeatures.map((section) => (
                    <div key={section.label} className="flex flex-wrap items-start gap-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-gold font-bold py-1 pr-2 shrink-0">
                        {section.label}
                      </span>
                      {section.items.map((feature) => (
                        <span
                          key={feature}
                          className="inline-block bg-cream-alt border border-navy/8 text-[11px] text-navy/60 px-2.5 py-1"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Agent + Attribution */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              {/* Agent Card */}
              <div className="border border-navy/10 bg-cream p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/30 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={agent.photoUrl}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-navy">{agent.name}</h3>
                    <p className="text-[9px] uppercase tracking-widest text-navy/35">
                      {agent.title}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <a
                    href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`}
                    className="block w-full text-center bg-gold text-white px-5 py-3 text-label uppercase tracking-md font-bold hover:bg-navy transition-colors duration-300"
                  >
                    Call {agent.contact.phone}
                  </a>
                  <Link
                    href="/contact"
                    className="block w-full text-center border border-navy/20 text-navy px-5 py-3 text-label uppercase tracking-md font-bold hover:bg-navy hover:text-white transition-colors duration-300"
                  >
                    Schedule Showing
                  </Link>
                </div>

                <p className="text-[10px] text-navy/25 text-center mt-4">
                  {agent.brokerage}
                </p>
              </div>

              {/* Property Details Card */}
              {details.length > 0 && (
                <div className="border border-navy/10 p-5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-3">
                    Property Details
                  </h3>
                  <div className="space-y-0">
                    {details.map((d) => (
                      <div key={d.label} className="flex justify-between py-1.5 border-b border-navy/5 last:border-0">
                        <span className="text-[11px] text-navy/35">{d.label}</span>
                        <span className="text-[11px] text-navy font-medium">{d.value}</span>
                      </div>
                    ))}
                    {schools.map((d) => (
                      <div key={d.label} className="flex justify-between py-1.5 border-b border-navy/5 last:border-0">
                        <span className="text-[11px] text-navy/35">{d.label}</span>
                        <span className="text-[11px] text-navy font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* @compliance IDX: Listing agent/office attribution — ≥12px, WCAG AA contrast, contact info required */}
              <div className="border border-navy/10 p-4 text-xs text-navy/70">
                <p>
                  <span className="font-bold text-navy">Listed by</span>{' '}
                  {listing.list_agent_full_name ?? 'Agent'}, {listing.list_office_name}
                </p>
                {(listing.agent_cell_phone || listing.list_office_phone) && (
                  <p className="mt-1">
                    {listing.agent_cell_phone && (
                      <span>Agent: {listing.agent_cell_phone}</span>
                    )}
                    {listing.list_office_phone && (
                      <span>{listing.agent_cell_phone ? ' · ' : ''}Office: {listing.list_office_phone}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* @compliance IDX: MLS logo, data source attribution, broker reciprocity notice, last updated — all ≥12px */}
      <footer className="border-t border-navy/10 py-6 bg-cream-alt">
        <div className="mx-auto max-w-content-lg px-6 lg:px-16 space-y-4">
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/armls-idx-logo.png"
              alt="ARMLS IDX"
              className="h-10 w-auto shrink-0"
            />
            <div className="space-y-2">
              <p className="text-xs text-navy/60">
                Listing information &copy; {new Date().getFullYear()} Arizona Regional Multiple Listing Service (ARMLS). All rights reserved.
                Last updated: {new Date(listing.modification_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
              </p>
              <p className="text-xs text-navy/60">
                Broker Reciprocity: The data relating to real estate for sale on this website comes in part from the
                Arizona Regional Multiple Listing Service. Real estate listings held by brokerage firms other than {agent.brokerage} are
                marked with the ARMLS IDX logo. All information is believed accurate but is not guaranteed and should be
                independently verified. IDX information is provided exclusively for personal, non-commercial use
                and may not be used for any purpose other than to identify prospective properties consumers may be interested in purchasing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-navy/8">
            <Link
              href="/listings"
              className="text-xs text-navy/40 hover:text-gold transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Listings
            </Link>
            <Link
              href="/contact"
              className="text-xs text-navy/40 hover:text-gold transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
