/**
 * Listing detail — Spark-backed, IDX-compliant, fully enriched.
 *
 * Resolves slug via Spark API direct lookup (lib/spark/search →
 * getListingBySlug, $expand=Media included), enforces IDX opt-out
 * filter at the source. The IDXComplianceFooter at the bottom carries
 * the mandatory attribution (logo, agent, office, contact ≥12px,
 * last-updated, broker reciprocity).
 *
 * Surfaces all rich Spark fields (heating, cooling, view, pool, spa,
 * appliances, HOA, taxes, schools, parcel) via:
 *   - ListingHeroGallery (cover + photos array)
 *   - ListingFactSheet (price + br/ba/sqft/lot/year)
 *   - KeyFeaturesGrid (feature groups built from RESO arrays)
 *   - KeyFactsCard (HOA + taxes + parcel + schools + county)
 *   - ListingMap (lat/lng → embedded map)
 *
 * @compliance IDX (ARMLS): The footer below the listing body is
 *   mandatory on every IDX listing display. The InternetEntireListing-
 *   DisplayYN opt-out filter is enforced at the search layer
 *   (lib/spark/search.ts → getListingBySlug). Removing either is a
 *   rules violation (~$21K/occurrence).
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { ListingHeroGallery } from '@/components/portfolio/ListingHeroGallery';
import { ListingFactSheet } from '@/components/portfolio/ListingFactSheet';
import { KeyFeaturesGrid } from '@/components/portfolio/KeyFeaturesGrid';
import { KeyFactsCard } from '@/components/portfolio/KeyFactsCard';
import { ListingMap } from '@/components/portfolio/ListingMap';
import { ShareButton } from '@/components/portfolio/ShareButton';
import { RequestTourCta } from '@/components/portfolio/RequestTourCta';
import { IDXComplianceFooter } from '@/components/portfolio/IDXComplianceFooter';
import { getListingBySlug } from '@/lib/spark/search';
import { buildFeatureGroups } from '@/lib/spark/listing-features';
import { siteUrl } from '@/lib/seo';

// 5-minute ISR — Spark refreshes hourly so 5min staleness is safe.
// Pairs with /listings ISR; first cold visitor in each window pays
// Spark fetch, all subsequent visitors hit CDN-cached HTML.
export const revalidate = 300;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3200';

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

const DOLLAR = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug).catch(() => null);
  if (!listing) notFound();

  const tourMessage = `${listing.unparsedAddress}${listing.community ? ` (${listing.community})` : ''}`;
  const tourHref = `/contact?listing=${encodeURIComponent(tourMessage)}&interest=Buying`;
  const listingUrl = `${SITE_URL}/listings/${listing.slug}`;

  const featureGroups = buildFeatureGroups(listing);

  // Price-drop indicator — only when the listing actually has a
  // recorded original price greater than the current list price.
  const priceDropAmount =
    listing.originalListPrice != null &&
    listing.listPrice != null &&
    listing.originalListPrice > listing.listPrice
      ? listing.originalListPrice - listing.listPrice
      : null;

  const hoaProp =
    listing.associationFee != null && listing.associationFeeFrequency
      ? {
          fee: listing.associationFee,
          frequency: listing.associationFeeFrequency.toLowerCase(),
        }
      : null;

  const hasGeo = listing.latitude != null && listing.longitude != null;

  return (
    <>
      <Navigation initialTransparent />

      <ListingHeroGallery listing={listing} photos={listing.photos} />

      <main className="bg-ink text-stone">
        {/* ── HEADER ─────────────────────────────────── */}
        <SectionFrame className="pt-16 md:pt-20 pb-10 md:pb-14">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-12 md:gap-16">
            <div>
              <p className="caps text-[10px] tracking-[0.32em] text-stone/55">
                {listing.community || 'ARMLS Listing'}
                {listing.daysOnMarket != null
                  ? ` · ${listing.daysOnMarket} day${listing.daysOnMarket === 1 ? '' : 's'} on market`
                  : ''}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl text-stone leading-tight mt-3 tracking-[-0.005em]">
                {listing.unparsedAddress}
              </h1>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <p className="text-2xl md:text-3xl text-gold font-serif tabular-nums">
                  {listing.listPrice ? DOLLAR(listing.listPrice) : 'Price upon request'}
                </p>
                {priceDropAmount ? (
                  <p className="caps text-[10px] tracking-[0.3em] text-[#E0A06A] tabular-nums">
                    Reduced {DOLLAR(priceDropAmount)} from{' '}
                    {DOLLAR(listing.originalListPrice ?? 0)}
                  </p>
                ) : null}
                {listing.pricePerSqft ? (
                  <p className="text-sm text-stone/55 tabular-nums">
                    {DOLLAR(listing.pricePerSqft)} / sf
                  </p>
                ) : null}
              </div>
              {listing.publicRemarks ? (
                <p className="mt-10 text-base md:text-lg leading-relaxed text-mute max-w-2xl whitespace-pre-line">
                  {listing.publicRemarks}
                </p>
              ) : null}
            </div>
            <aside className="md:sticky md:top-24 self-start space-y-6">
              <ListingFactSheet listing={listing} />
              <div className="flex flex-wrap items-center gap-4">
                <RequestTourCta href={tourHref} listingKey={listing.listingKey} />
                <ShareButton
                  url={listingUrl}
                  title={listing.unparsedAddress}
                  listingKey={listing.listingKey}
                />
              </div>
            </aside>
          </div>
        </SectionFrame>

        {/* ── FEATURES ───────────────────────────────── */}
        {featureGroups.length > 0 ? (
          <SectionFrame className="py-14 md:py-16 border-t border-white/10">
            <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
            <p className="caps text-[10px] tracking-[0.32em] text-stone/70 mb-8">
              Property features
            </p>
            <KeyFeaturesGrid groups={featureGroups} visibleCount={6} />
          </SectionFrame>
        ) : null}

        {/* ── KEY FACTS ──────────────────────────────── */}
        {(hoaProp ||
          listing.taxAnnualAmount != null ||
          listing.county ||
          listing.parcelNumber ||
          listing.elementarySchool ||
          listing.middleOrJuniorSchool ||
          listing.highSchool ||
          listing.highSchoolDistrict) && (
          <SectionFrame className="py-14 md:py-16 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16">
              <div>
                <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
                <p className="caps text-[10px] tracking-[0.32em] text-stone/70">
                  Key facts
                </p>
                <h2 className="font-serif text-2xl md:text-3xl text-stone mt-4 leading-tight tracking-[-0.005em]">
                  Financial details &amp; schools.
                </h2>
              </div>
              <KeyFactsCard
                hoa={hoaProp}
                taxAnnualAmount={listing.taxAnnualAmount ?? null}
                county={listing.county}
                parcelNumber={listing.parcelNumber ?? null}
                schools={{
                  elementary: listing.elementarySchool ?? null,
                  middle: listing.middleOrJuniorSchool ?? null,
                  highSchoolDistrict:
                    listing.highSchoolDistrict ?? listing.highSchool ?? null,
                }}
              />
            </div>
          </SectionFrame>
        )}

        {/* ── LOCATION ───────────────────────────────── */}
        {hasGeo ? (
          <SectionFrame className="py-14 md:py-16 border-t border-white/10">
            <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
            <p className="caps text-[10px] tracking-[0.32em] text-stone/70 mb-8">
              Location
            </p>
            <ListingMap
              latitude={listing.latitude as number}
              longitude={listing.longitude as number}
              address={listing.unparsedAddress}
            />
          </SectionFrame>
        ) : null}

        {/* ── ACTION ROW ─────────────────────────────── */}
        <SectionFrame className="py-10 md:py-12 border-t border-white/10">
          <Link
            href="/listings"
            className="caps text-[10px] tracking-[0.32em] text-stone/75 hover:text-gold transition-colors"
          >
            ← Back to all listings
          </Link>
        </SectionFrame>
      </main>

      <IDXComplianceFooter
        lastUpdatedISO={listing.modificationTimestamp}
        listAgentName={listing.listAgentName}
        listOfficeName={listing.listOfficeName ?? null}
        agentCellPhone={listing.listAgentDirectPhone ?? null}
        listOfficePhone={listing.listOfficePhone ?? null}
        brokerage="Russ Lyon Sotheby's International Realty"
      />
    </>
  );
}
