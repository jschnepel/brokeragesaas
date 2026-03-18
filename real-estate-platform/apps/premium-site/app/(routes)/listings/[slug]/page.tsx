import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchListingDetail, fetchListingByMlsId, fetchListingPhotos } from '../actions';
import { resolveAgentConfig } from '../../../agent-config/index';
import { getCalculatedInsights } from './lib/calculated-insights';
import { getLifestyleData } from './lib/enrichment';
import { parseJsonbArray } from './lib/types';
import { HeroGallery } from './components/HeroGallery';
import { ListingHeader } from './components/ListingHeader';
import { ListingDescription } from './components/ListingDescription';
import { PropertyHighlights } from './components/PropertyHighlights';
import { FeaturesAccordion } from './components/FeaturesAccordion';
import { SchoolsSection } from './components/SchoolsSection';
import { PropertyDetails } from './components/PropertyDetails';
import { AgentSidebar } from './components/AgentSidebar';
import { MobileAgentCTA } from './components/MobileAgentCTA';
import { IdxFooter } from './components/IdxFooter';
import { ListingDetailClient } from './components/ListingDetailClient';
import { LocationCommute } from './components/LocationCommute';
import { NearbySection } from './components/NearbySection';

export const revalidate = 900;

const agent = resolveAgentConfig();

interface ListingPageProps {
  params: Promise<{ slug: string }>;
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price Upon Request';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
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
  if (idx > 0) return { listingId: decoded.slice(idx + 1), listingKey: decoded };
  return { listingId: null, listingKey: decoded };
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { listingId, listingKey } = parseListingSlug(slug);
  const listing = listingId ? await fetchListingByMlsId(listingId) : await fetchListingDetail(listingKey);
  if (!listing) return { title: 'Listing Not Found' };

  const address = listing.unparsed_address ?? 'Property';
  const area = listing.subdivision_name ?? listing.city ?? 'Arizona';
  const price = formatPrice(listing.list_price);
  const photos = await fetchListingPhotos(listing.listing_key);
  const primaryPhoto = photos[0]?.media_url;

  return {
    title: `${address} | ${area} | ${agent.name}`,
    description: `${listing.bedrooms_total ?? '—'} bed, ${listing.bathrooms_total_integer ?? '—'} bath, ${formatNumber(listing.living_area)} SF home in ${area}. ${price}. Listed by ${listing.list_agent_full_name ?? 'Agent'}, ${listing.list_office_name}.`,
    openGraph: {
      title: `${address} | ${area}`,
      description: `${price} — ${listing.bedrooms_total ?? '—'} bed, ${listing.bathrooms_total_integer ?? '—'} bath in ${area}`,
      type: 'website',
      ...(primaryPhoto ? { images: [{ url: primaryPhoto }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      ...(primaryPhoto ? { images: [primaryPhoto] } : {}),
    },
  };
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const { slug } = await params;
  const { listingId, listingKey } = parseListingSlug(slug);

  const listing = listingId ? await fetchListingByMlsId(listingId) : await fetchListingDetail(listingKey);
  if (!listing) notFound();

  const hasCoordinates = listing.latitude != null && listing.longitude != null;

  const [insights, lifestyleData] = await Promise.all([
    getCalculatedInsights(listing),
    hasCoordinates ? getLifestyleData(listing.listing_key, listing.latitude!, listing.longitude!) : Promise.resolve(null),
  ]);

  // Photos come from listing_records.photo_urls (JSONB), fallback to listing_photos table
  const photoUrlsRaw = listing.photo_urls;
  const photoUrls = Array.isArray(photoUrlsRaw) ? photoUrlsRaw : [];
  // If photo_urls is empty, fall back to the legacy listing_photos table
  const legacyPhotos = photoUrls.length === 0 ? await fetchListingPhotos(listing.listing_key) : [];

  const address = listing.unparsed_address ?? `MLS# ${listing.listing_id}`;
  const streetAddress = [
    listing.street_number,
    listing.street_dir_prefix,
    listing.street_name,
    listing.street_suffix,
    listing.unit_number ? `#${listing.unit_number}` : null,
  ].filter(Boolean).join(' ') || address;
  const cityStateZip = [
    listing.city,
    listing.state_or_province ? `, ${listing.state_or_province}` : null,
    listing.postal_code ? ` ${listing.postal_code}` : null,
  ].filter(Boolean).join('');
  const area = listing.subdivision_name ?? listing.city ?? 'Arizona';
  const price = formatPrice(listing.list_price);
  // Prefer photo_urls (new JSONB column), fall back to legacy listing_photos table
  const gallery = photoUrls.length > 0
    ? photoUrls.map((p) => p.url)
    : legacyPhotos.map((p) => p.media_url);

  const quickStats = [
    listing.bedrooms_total != null ? `${listing.bedrooms_total} Bed` : null,
    listing.bathrooms_total_integer != null ? `${listing.bathrooms_total_integer} Bath` : null,
    listing.living_area ? `${formatNumber(listing.living_area)} SF` : null,
    listing.year_built ? `Built ${listing.year_built}` : null,
    listing.garage_spaces ? `${listing.garage_spaces}-Car Garage` : null,
    formatLotSize(listing.lot_size_acres, listing.lot_size_square_feet) || null,
  ].filter((s): s is string => s != null);

  const featureSections: { label: string; items: string[] }[] = [];
  const trySection = (label: string, ...sources: unknown[]) => {
    const items = sources.flatMap((s) => parseJsonbArray(s));
    if (items.length > 0) featureSections.push({ label, items });
  };
  trySection('Interior', listing.interior_features);
  trySection('Exterior', listing.exterior_features);
  trySection('Pool', listing.pool_features);
  trySection('Community', listing.community_features);
  trySection('Appliances', listing.appliances);
  trySection('Flooring', listing.flooring);
  trySection('Cooling & Heating', listing.cooling, listing.heating);
  trySection('Construction & Roof', listing.construction_materials, listing.roof);
  trySection('Lot & Fencing', listing.lot_features, listing.fencing);
  trySection('View', listing.view_features);
  trySection('Patio & Porch', listing.patio_and_porch_features);
  trySection('Sewer', listing.sewer);

  const contactHref = `/contact?listing=${listing.listing_id}&address=${encodeURIComponent(address)}`;

  return (
    <>
      {/* Hero */}
      <ListingDetailClient gallery={gallery} address={address}>
        <HeroGallery
          listing={listing}
          gallery={gallery}
          streetAddress={streetAddress}
          cityStateZip={cityStateZip}
          area={area}
          price={price}
          quickStats={quickStats}
        />
      </ListingDetailClient>

      {/* KPI Cards — lifestyle intelligence */}
      <ListingHeader lifestyleData={lifestyleData} />

      {/* Narrative + Sidebar (8/4 grid) */}
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-20 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left column — narrative content */}
          <div className="lg:col-span-8">
            <div className="bg-white p-6 md:p-10 shadow-lg shadow-black/5">
              <ListingDescription remarks={listing.public_remarks} />
              <PropertyHighlights listing={listing} />
              <SchoolsSection listing={listing} />
              <FeaturesAccordion sections={featureSections} />
            </div>
          </div>

          {/* Right column — sidebar */}
          <div className="lg:col-span-4">
            <AgentSidebar
              agent={agent}
              contactHref={contactHref}
              listing={listing}
              gallery={gallery}
              insights={insights}
            />
          </div>
        </div>
      </div>

      {/* Full-width: Location & Commute */}
      {hasCoordinates && (
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-20 space-y-6 pb-12 lg:pb-16">
          <Suspense fallback={<div className="h-64 bg-cream-alt animate-pulse shadow-lg shadow-black/5" />}>
            <LocationCommute
              listingKey={listing.listing_key}
              lat={listing.latitude!}
              lng={listing.longitude!}
              address={address}
            />
          </Suspense>
        </div>
      )}

      {/* Full-width: Info cards grid */}
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-20 pb-12 lg:pb-16">
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Nearby Amenities */}
          <Suspense fallback={<div className="col-span-12 lg:col-span-6 h-48 bg-cream-alt animate-pulse shadow-lg shadow-black/5" />}>
            <NearbySection
              listingKey={listing.listing_key}
              lat={listing.latitude}
              lng={listing.longitude}
            />
          </Suspense>

          {/* Property Details — navy card */}
          <PropertyDetails listing={listing} />
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-navy">
        <div className="max-w-[800px] mx-auto px-4 md:px-8 text-center">
          <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Interested in This Property?</span>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">
            Schedule a <span className="italic font-light">Private Showing</span>
          </h2>
          <p className="text-white/60 mb-8">
            Let {agent.name} arrange a personal tour and answer any questions about this property.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`}
              className="bg-gold text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-navy transition-all"
            >
              Call {agent.contact.phone}
            </a>
            <a
              href={contactHref}
              className="border border-white/30 text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-navy transition-all"
            >
              Schedule Showing
            </a>
          </div>
        </div>
      </section>

      {/* IDX Compliance */}
      <IdxFooter listing={listing} brokerageName={agent.brokerage} />
      <MobileAgentCTA phone={agent.contact.phone} contactHref={contactHref} />
      <div className="lg:hidden h-14" />
    </>
  );
}
