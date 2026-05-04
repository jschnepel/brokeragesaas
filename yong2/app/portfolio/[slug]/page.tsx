import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { ListingHeroGallery } from '@/components/portfolio/ListingHeroGallery';
import { ListingFactSheet } from '@/components/portfolio/ListingFactSheet';
import { ListingMap } from '@/components/portfolio/ListingMap';
import { ShareButton } from '@/components/portfolio/ShareButton';
import { ListingDetailTracker } from '@/components/portfolio/ListingDetailTracker';
import { RequestTourCta } from '@/components/portfolio/RequestTourCta';
import { TheRead } from '@/components/listing/TheRead';
import { getListingBySlug, getActiveListings } from '@/lib/listings';
import { getActiveComps } from '@/lib/analytics/comps';
import { getAreaRead } from '@/lib/analytics/area';
import { getListingPace } from '@/lib/analytics/listing-pace';
import { realEstateListingSchema, breadcrumbListSchema } from '@/lib/jsonld';
import { siteUrl } from '@/lib/seo';

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3200';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  // mv_active_listings has ~52K rows; pre-render only the top 24 luxury actives
  // and let the rest render via dynamic ISR (App Router default dynamicParams=true).
  const listings = await getActiveListings({ limit: 24, isLuxury: true }).catch(() => []);
  return listings.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug).catch(() => null);
  if (!listing) return { title: 'Listing' };
  return {
    title: `${listing.unparsedAddress} · ${listing.community}`,
    description: listing.publicRemarks?.slice(0, 160) ?? `${listing.unparsedAddress}.`,
    alternates: { canonical: siteUrl(`/portfolio/${listing.slug}`) },
    openGraph: {
      images: listing.coverPhotoUrl ? [listing.coverPhotoUrl] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug).catch(() => null);
  if (!listing) notFound();

  const listingUrl = `${SITE_URL}/portfolio/${listing.slug}`;
  const tourMessage = `${listing.unparsedAddress}${listing.community ? ` (${listing.community})` : ''}`;
  const tourHref = `/contact?listing=${encodeURIComponent(tourMessage)}&interest=Buying`;
  const hasGeo = listing.latitude !== null && listing.longitude !== null;

  // "The Read" — analytics block. Resolve the scope from the listing row.
  const scopeType: 'community' | 'region' = listing.communitySlug ? 'community' : 'region';
  const scopeKey = listing.communitySlug ?? listing.regionSlug;
  const [comps, area] = await Promise.all([
    getActiveComps(listing.listingId, 5).catch(
      () => ({ comps: [], medianAskingPpsf: null, totalPoolSize: 0, tierUsed: 1, fallbackNote: null }),
    ),
    scopeKey
      ? getAreaRead(scopeType, scopeKey).catch(() => null)
      : Promise.resolve(null),
  ]);
  const pace = area
    ? await getListingPace(listing, comps, area).catch(() => null)
    : null;

  const breadcrumbs = breadcrumbListSchema([
    { name: 'Home', url: siteUrl('/') },
    { name: 'Portfolio', url: siteUrl('/portfolio') },
    ...(listing.communitySlug && listing.community
      ? [{ name: listing.community, url: siteUrl(`/communities/${listing.communitySlug}`) }]
      : []),
    { name: listing.unparsedAddress, url: listingUrl },
  ]);

  return (
    <>
      {/* Per-listing SingleFamilyResidence JSON-LD for rich result eligibility. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(realEstateListingSchema(listing)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <Navigation />
      {/*
       * Tracker is mounted alongside the (server-rendered) listing content.
       * It owns all listing-detail engagement events (view / view_long /
       * scroll observers) and looks up its targets via `[data-track="..."]`
       * attributes on the sections below — that decoupling means a styling
       * refactor can't silently break analytics.
       */}
      <ListingDetailTracker listing={listing} />
      <ListingHeroGallery listing={listing} photos={listing.photos} />
      <SectionFrame className="py-20">
        <div data-track="facts" className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-12">
          <article className="text-stone/90 leading-relaxed space-y-4">
            {listing.publicRemarks ? (
              <p>
                <span className="font-serif text-5xl leading-none float-left mr-2 -mt-1 text-gold">{listing.publicRemarks.charAt(0)}</span>
                {listing.publicRemarks.slice(1)}
              </p>
            ) : <p>Appointment only. Contact Yong for full property narrative.</p>}
          </article>
          <ListingFactSheet listing={listing} />
        </div>
        {hasGeo ? (
          <section className="mt-16" data-track="map">
            <p className="caps text-mute mb-4">Location</p>
            <ListingMap
              latitude={listing.latitude as number}
              longitude={listing.longitude as number}
              address={listing.unparsedAddress}
            />
          </section>
        ) : null}
        {area && pace && (
          <section className="mt-16" data-testid="the-read" data-track="the-read">
            <TheRead listing={listing} pace={pace} comps={comps} area={area} />
          </section>
        )}
        <div className="mt-16 pt-10 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/portfolio" className="caps hover:text-stone">← The Portfolio</Link>
          <div className="flex flex-wrap items-center gap-3">
            <ShareButton url={listingUrl} title={listing.unparsedAddress} listingKey={listing.listingKey} />
            <RequestTourCta href={tourHref} listingKey={listing.listingKey} />
          </div>
        </div>
      </SectionFrame>
      <Footer />
    </>
  );
}
