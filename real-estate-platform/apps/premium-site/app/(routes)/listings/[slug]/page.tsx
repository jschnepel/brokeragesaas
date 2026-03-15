import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchListingDetail, fetchListingByMlsId, fetchListingPhotos } from '../actions';
import { resolveAgentConfig } from '../../../agent-config/index';
import { getCalculatedInsights } from './lib/calculated-insights';
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
import { LifestyleIntel } from './components/LifestyleIntel';
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

  const [photos, insights] = await Promise.all([
    fetchListingPhotos(listing.listing_key),
    getCalculatedInsights(listing),
  ]);

  const address = listing.unparsed_address ?? `MLS# ${listing.listing_id}`;
  const area = listing.subdivision_name ?? listing.city ?? 'Arizona';
  const price = formatPrice(listing.list_price);
  const gallery = photos.map((p) => p.media_url);

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
  const hasCoordinates = listing.latitude != null && listing.longitude != null;

  return (
    <main className="bg-white">
      <ListingDetailClient gallery={gallery} address={address}>
        <HeroGallery
          listing={listing}
          gallery={gallery}
          address={address}
          area={area}
          price={price}
          quickStats={quickStats}
        />
      </ListingDetailClient>

      <ListingHeader insights={insights} />

      <section className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-20 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8">
            <ListingDescription remarks={listing.public_remarks} />
            <PropertyHighlights listing={listing} />
            <SchoolsSection listing={listing} />
            <FeaturesAccordion sections={featureSections} />

            {hasCoordinates && (
              <Suspense fallback={<div className="mb-8 h-64 bg-cream-alt animate-pulse" />}>
                <LocationCommute
                  listingKey={listing.listing_key}
                  lat={listing.latitude!}
                  lng={listing.longitude!}
                  address={address}
                />
              </Suspense>
            )}

            {hasCoordinates && (
              <Suspense fallback={<div className="mb-8 h-32 bg-cream-alt animate-pulse" />}>
                <LifestyleIntel
                  listingKey={listing.listing_key}
                  lat={listing.latitude!}
                  lng={listing.longitude!}
                />
              </Suspense>
            )}

            <Suspense fallback={<div className="mb-8 h-32 bg-cream-alt animate-pulse" />}>
              <NearbySection
                listingKey={listing.listing_key}
                lat={listing.latitude}
                lng={listing.longitude}
              />
            </Suspense>

            <PropertyDetails listing={listing} />
          </div>

          <AgentSidebar agent={agent} contactHref={contactHref} />
        </div>
      </section>

      <IdxFooter listing={listing} brokerageName={agent.brokerage} />
      <MobileAgentCTA phone={agent.contact.phone} contactHref={contactHref} />
      <div className="lg:hidden h-14" />
    </main>
  );
}
