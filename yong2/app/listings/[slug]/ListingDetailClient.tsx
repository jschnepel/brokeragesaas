/**
 * Canonical listing-detail layout. Mirrors the editorial preview at
 * /portfolio/preview but degrades gracefully when narrative-only data
 * (ListingStory paragraphs, comp distribution, area aggregates,
 * distance-to rows) isn't available yet.
 *
 * Rendered sections in order:
 *   1. Hero gallery + HeroTopBar overlay (status, DOM, MLS, save toggle)
 *   2. Story + sidebar — publicRemarks fall back for ListingStory; sidebar
 *      pairs AgentMiniCard + KeyFactsCard.
 *   3. Features — KeyFeaturesGrid built from RESO arrays.
 *   4. Location — LocationIntelligence when a curated community matches,
 *      else a plain ListingMap.
 *   5. Action row — Back / Share / Request Tour.
 *   6. IDX compliance footer.
 *
 * StickyContact pill anchors bottom-right, appearing once the visitor
 * scrolls past the hero.
 *
 * @compliance IDX (ARMLS): footer is mandatory; opt-out filter handled
 *   server-side in lib/spark/search.ts → getListingBySlug.
 */
'use client';

import Link from 'next/link';
import { Footer } from '@/components/chrome/Footer';
import { Navigation } from '@/components/chrome/Navigation';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { ListingHeroGallery } from '@/components/portfolio/ListingHeroGallery';
import { HeroTopBar, useSavedListing } from '@/components/portfolio/HeroTopBar';
import { AgentMiniCard } from '@/components/portfolio/AgentMiniCard';
import { KeyFactsCard } from '@/components/portfolio/KeyFactsCard';
import { KeyFeaturesGrid } from '@/components/portfolio/KeyFeaturesGrid';
import { LocationIntelligence } from '@/components/portfolio/LocationIntelligence';
import { ListingMap } from '@/components/portfolio/ListingMap';
import { MountOnView } from '@/components/shared/MountOnView';
import { ShareButton } from '@/components/portfolio/ShareButton';
import { RequestTourCta } from '@/components/portfolio/RequestTourCta';
import { StickyContact } from '@/components/portfolio/StickyContact';
import { SimilarListingsStrip } from '@/components/portfolio/SimilarListingsStrip';
import { IDXComplianceFooter } from '@/components/portfolio/IDXComplianceFooter';
import { yongBio } from '@/content/yong';
import { siteContent } from '@/content/site';
import type { Listing } from '@/lib/types';
import type { FeatureGroup } from '@/lib/listing-narrative';
import type { CuratedCommunity } from '@/content/communities';
import type { DistanceRow } from '@/lib/distances';

type ListingDetailClientProps = {
  listing: Listing;
  featureGroups: ReadonlyArray<FeatureGroup>;
  curatedCommunity: CuratedCommunity | null;
  /** Pre-computed straight-line miles to curated Phoenix-metro POIs. */
  distances: ReadonlyArray<DistanceRow>;
  /** Up to 4 nearby Active residentials in a similar price band. */
  nearby: Listing[];
  listingUrl: string;
};

const DOLLAR = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

export function ListingDetailClient({
  listing,
  featureGroups,
  curatedCommunity,
  distances,
  nearby,
  listingUrl,
}: ListingDetailClientProps) {
  const tourMessage = `${listing.unparsedAddress}${listing.community ? ` (${listing.community})` : ''}`;
  const tourHref = `/contact?listing=${encodeURIComponent(tourMessage)}&interest=Buying`;

  const { isSaved, toggle } = useSavedListing(listing.listingKey);

  const hoaProp =
    listing.associationFee != null && listing.associationFeeFrequency
      ? {
          fee: listing.associationFee,
          frequency: listing.associationFeeFrequency.toLowerCase(),
        }
      : null;

  const hasGeo = listing.latitude != null && listing.longitude != null;

  const priceDropAmount =
    listing.originalListPrice != null &&
    listing.listPrice != null &&
    listing.originalListPrice > listing.listPrice
      ? listing.originalListPrice - listing.listPrice
      : null;

  const showKeyFactsCard =
    hoaProp != null ||
    listing.taxAnnualAmount != null ||
    listing.county != null ||
    listing.parcelNumber != null ||
    listing.elementarySchool != null ||
    listing.middleOrJuniorSchool != null ||
    listing.highSchoolDistrict != null ||
    listing.highSchool != null;

  return (
    <>
      <Navigation initialTransparent />
      <StickyContact listingKey={listing.listingKey} tourHref={tourHref} />

      {/* ── 1. HERO ─────────────────────────────────── */}
      <ListingHeroGallery
        listing={listing}
        photos={listing.photos}
        topOverlay={
          <HeroTopBar
            status={listing.status}
            daysOnMarket={listing.daysOnMarket}
            listingId={listing.listingId}
            mediaTabs={[
              { key: 'photos', label: 'Photos', count: listing.photos.length },
            ]}
            activeTab="photos"
            isSaved={isSaved}
            onToggleSave={toggle}
          />
        }
      />

      {/* ── 2. STORY + SIDEBAR ─────────────────────── */}
      <SectionFrame className="py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-12 md:gap-16">
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

            {/*
             * Story slot — until the narrative workflow ships, fall back
             * to ARMLS publicRemarks rendered as a single editorial
             * paragraph. When narrative lands, swap to <ListingStory />.
             */}
            {listing.publicRemarks ? (
              <p className="mt-10 text-base md:text-lg leading-relaxed text-mute max-w-2xl whitespace-pre-line">
                {listing.publicRemarks}
              </p>
            ) : null}
          </div>

          <aside className="space-y-4 md:sticky md:top-24 self-start">
            <AgentMiniCard
              name={yongBio.name}
              brokerage={yongBio.brokerage}
              photoUrl={yongBio.photoUrl}
              phoneHref={siteContent.contact.mobileHref}
              tourHref={tourHref}
            />
            {showKeyFactsCard ? (
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
            ) : null}
          </aside>
        </div>
      </SectionFrame>

      {/* ── 3. FEATURES ─────────────────────────────── */}
      {featureGroups.length > 0 ? (
        <SectionFrame className="py-16 md:py-20 border-t border-white/5">
          <KeyFeaturesGrid groups={featureGroups} visibleCount={6} />
        </SectionFrame>
      ) : null}

      {/* ── 4. LOCATION ─────────────────────────────── */}
      {/*
       * Below-the-fold MapLibre mount is deferred until the section is
       * roughly one viewport away from visible. Keeps the hero/story
       * critical path cheap and progressively loads the map as the
       * visitor scrolls.
       */}
      {hasGeo ? (
        <SectionFrame className="py-16 md:py-20">
          <MountOnView className="min-h-[400px]">
            {curatedCommunity ? (
              <LocationIntelligence
                latitude={listing.latitude as number}
                longitude={listing.longitude as number}
                address={listing.unparsedAddress}
                community={curatedCommunity.name}
                communityNarrative={curatedCommunity.narrative[0] ?? ''}
                distances={distances}
              />
            ) : (
              <>
                <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
                <p className="caps text-[10px] tracking-[0.32em] text-stone/70 mb-8">
                  Location
                </p>
                <ListingMap
                  latitude={listing.latitude as number}
                  longitude={listing.longitude as number}
                  address={listing.unparsedAddress}
                />
                {distances.length > 0 ? (
                  <dl className="mt-8 max-w-md">
                    <p className="caps text-[10px] tracking-widest text-stone/55 mb-3">
                      Distance to
                    </p>
                    {distances.map((d, i) => (
                      <div
                        key={d.label}
                        className={`flex justify-between items-baseline py-2.5 text-sm ${
                          i === distances.length - 1 ? '' : 'border-b border-white/5'
                        }`}
                      >
                        <dt className="text-stone/75">{d.label}</dt>
                        <dd className="text-stone tabular-nums">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </>
            )}
          </MountOnView>
        </SectionFrame>
      ) : null}

      {/* ── 5. NEARBY LISTINGS ───────────────────────── */}
      {nearby.length > 0 ? (
        <SectionFrame className="py-16 md:py-20">
          <SimilarListingsStrip
            listings={nearby.map((l) => ({
              slug: l.slug,
              address: l.unparsedAddress,
              community: l.community,
              price: l.listPrice,
              imageUrl: l.coverPhotoUrl ?? '/hero/silverleaf.jpg',
              beds: l.bedrooms ?? 0,
              baths: typeof l.bathroomsTotal === 'number' ? l.bathroomsTotal : 0,
              livingArea: l.livingArea ?? 0,
            }))}
          />
        </SectionFrame>
      ) : null}

      {/* ── 6. ACTION ROW ───────────────────────────── */}
      <SectionFrame className="py-12 md:py-16 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Link
            href="/listings"
            className="caps text-[10px] tracking-[0.3em] text-stone/75 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-4 focus-visible:ring-offset-ink transition-colors"
          >
            ← Back to all listings
          </Link>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <ShareButton
              url={listingUrl}
              title={listing.unparsedAddress}
              listingKey={listing.listingKey}
            />
            <RequestTourCta href={tourHref} listingKey={listing.listingKey} />
          </div>
        </div>
      </SectionFrame>

      {/* ── 6. IDX COMPLIANCE FOOTER ───────────────── */}
      <IDXComplianceFooter
        lastUpdatedISO={listing.modificationTimestamp}
        listAgentName={listing.listAgentName}
        listOfficeName={listing.listOfficeName ?? null}
        agentCellPhone={listing.listAgentDirectPhone ?? null}
        listOfficePhone={listing.listOfficePhone ?? null}
        brokerage="Russ Lyon Sotheby's International Realty"
      />

      <Footer />
    </>
  );
}
