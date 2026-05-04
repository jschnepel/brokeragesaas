/**
 * MOCK PREVIEW — DELETE WHEN DATA + NARRATIVE WORKFLOWS LAND
 *
 * v4 layout — 7 sections (was 16): hero / story+sidebar / features /
 * the read / location / action row / IDX footer.
 *
 * Two pieces of mock data:
 *   1. `mockListing` — shaped like the real `Listing` type.
 *   2. `MOCK_NARRATIVE` (lib/listing-narrative.ts) — shaped like
 *      `ListingNarrative`. Replaced by the workflow's per-listing
 *      output when that workflow ships.
 *
 * Real `/portfolio/[slug]` route should mirror this layout —
 * components are reusable across both. The cleanup checklist is in
 * MEMORY.md → project_yong2_mock_listing_cleanup.md.
 */
'use client';

import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { ListingHeroGallery } from '@/components/portfolio/ListingHeroGallery';
import { HeroTopBar, useSavedListing } from '@/components/portfolio/HeroTopBar';
import { ListingStory } from '@/components/portfolio/ListingStory';
import { AgentMiniCard } from '@/components/portfolio/AgentMiniCard';
import { KeyFactsCard } from '@/components/portfolio/KeyFactsCard';
import { KeyFeaturesGrid } from '@/components/portfolio/KeyFeaturesGrid';
import { TheReadVisualized } from '@/components/portfolio/TheReadVisualized';
import { LocationIntelligence } from '@/components/portfolio/LocationIntelligence';
import { ShareButton } from '@/components/portfolio/ShareButton';
import { RequestTourCta } from '@/components/portfolio/RequestTourCta';
import { StickyContact } from '@/components/portfolio/StickyContact';
import { IDXComplianceFooter } from '@/components/portfolio/IDXComplianceFooter';
import { MOCK_NARRATIVE } from '@/lib/listing-narrative';
import { yongBio } from '@/content/yong';
import { siteContent } from '@/content/site';
import type { Listing } from '@/lib/types';

const MOCK_PHOTOS = [
  '/mock-listing/mock-3.jpg',
  '/mock-listing/mock-5.jpg',
  '/mock-listing/mock-4.jpg',
  '/mock-listing/mock-1.jpg',
  '/mock-listing/mock-2.jpg',
];

const mockListing: Listing = {
  listingKey: '20250504000000-PREVIEW-001',
  listingId: '6900001',
  slug: 'preview-mock-listing',
  status: 'Active',
  unparsedAddress: '10845 E Silverleaf Ridge Way',
  streetNumber: '10845',
  streetName: 'E Silverleaf Ridge Way',
  streetSuffix: 'Way',
  city: 'Scottsdale',
  postalCode: '85255',
  county: 'Maricopa',
  subdivisionDisplay: 'Silverleaf at DC Ranch',
  communitySlug: 'silverleaf-at-dc-ranch',
  communityName: 'Silverleaf',
  regionSlug: 'north-scottsdale',
  regionName: 'North Scottsdale',
  community: 'Silverleaf',
  listPrice: 8_950_000,
  pricePerSqft: 1_242,
  bedrooms: 6,
  bathroomsFull: 6,
  bathroomsHalf: 2,
  bathroomsTotal: 7,
  livingArea: 7_206,
  lotAcres: 1.18,
  lotSqft: 51_400,
  yearBuilt: 2022,
  daysOnMarket: 18,
  latitude: 33.6712,
  longitude: -111.8519,
  propertyType: 'Residential',
  propertySubType: 'Single Family Residence',
  hasPool: true,
  hasFireplace: true,
  hasGarage: true,
  isLuxury: true,
  publicRemarks: null,
  coverPhotoUrl: MOCK_PHOTOS[0],
  photos: MOCK_PHOTOS,
  photoUrls: MOCK_PHOTOS.map((url, i) => ({
    url,
    desc: i === 0 ? 'Architectural exterior at dusk' : null,
  })),
  listAgentKey: 'YONG-CHOI-ARMLS',
  listAgentName: 'Yong Choi',
  modificationTimestamp: '2026-04-29T17:42:00Z',
};

// Mock comp distribution + monthly trend — analytics-layer outputs the
// real version. Numbers chosen to demonstrate the visualizations:
// subject sits between median and P75, area trending positive over 12mo.
const MOCK_COMPS = { p25: 920, p50: 1_085, p75: 1_310, count: 9 };
const MOCK_MONTHLY = [1_018, 1_032, 1_041, 1_058, 1_064, 1_073, 1_079, 1_085, 1_092, 1_098, 1_103, 1_112];

// Distance-to rows — pre-computed at narrative time via Google
// Distance Matrix; mock here.
const MOCK_DISTANCES = [
  { label: 'Sky Harbor Airport', value: '28 mi · 32 min' },
  { label: 'Old Town Scottsdale', value: '6 mi · 11 min' },
  { label: 'Hwy 101', value: '2 mi · 4 min' },
];

const MOCK_COMMUNITY_NARRATIVE =
  "A handful of enclaves carry most of the Valley's top-tier inventory. Silverleaf is the most measured of them — gated, architecturally committed, member-driven.";

export function PreviewListingClient() {
  const listing = mockListing;
  const narrative = MOCK_NARRATIVE;
  const tourMessage = `${listing.unparsedAddress} (${listing.community})`;
  const tourHref = `/contact?listing=${encodeURIComponent(tourMessage)}&interest=Buying`;
  const listingUrl = `https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com/portfolio/preview`;

  const { isSaved, toggle } = useSavedListing(listing.listingKey);

  return (
    <>
      <Navigation initialTransparent />
      <div className="fixed top-16 left-0 right-0 z-40 bg-gold/95 text-ink text-center py-2 text-[11px] tracking-[0.3em] uppercase font-medium">
        Preview · Mock Listing · Not Live Inventory
      </div>
      <StickyContact listingKey={listing.listingKey} tourHref={tourHref} />

      {/* ── 1. HERO ── */}
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

      {/* ── 2. STORY + SIDEBAR ── */}
      <SectionFrame className="py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-12 md:gap-16">
          <div>
            <p className="font-serif italic text-stone text-2xl md:text-3xl leading-snug mb-10 max-w-2xl">
              {narrative.summary}
            </p>
            <ListingStory story={narrative.story} />
          </div>

          <aside className="space-y-4 md:sticky md:top-24 self-start">
            <AgentMiniCard
              name={yongBio.name}
              brokerage={yongBio.brokerage}
              photoUrl={yongBio.photoUrl}
              phoneHref={siteContent.contact.mobileHref}
              tourHref={tourHref}
            />
            <KeyFactsCard
              hoa={{ fee: 985, frequency: 'mo' }}
              taxAnnualAmount={28_400}
              county={listing.county}
              parcelNumber="217-65-014"
              schools={{
                elementary: 'Copper Ridge Elementary',
                middle: 'Copper Ridge Middle',
                highSchoolDistrict: 'Scottsdale Unified District',
              }}
            />
            {/* Tour request lives on the AgentMiniCard 'Tour ↗' link,
             * the bottom action row's RequestTourCta, and the sticky
             * contact pill — no inline sidebar form here. */}
          </aside>
        </div>
      </SectionFrame>

      {/* ── 3. FEATURES (compact) ── */}
      <SectionFrame className="py-16 md:py-20 border-t border-white/5">
        <KeyFeaturesGrid groups={narrative.featureGroups} visibleCount={5} />
      </SectionFrame>

      {/* ── 4. THE READ (visualized) ── */}
      <SectionFrame className="py-16 md:py-20">
        <TheReadVisualized
          subjectPpsf={listing.pricePerSqft!}
          comps={MOCK_COMPS}
          area={{
            label: 'Silverleaf · last 12 months',
            medianDom: 42,
            monthsOfSupply: 3.8,
            yoyMedianPriceChangePct: 0.082,
            monthlyMedianPpsf: MOCK_MONTHLY,
          }}
          compsCommentary={narrative.theRead.compsCommentary}
          areaCommentary={narrative.theRead.areaCommentary}
        />
      </SectionFrame>

      {/* ── 5. LOCATION ── */}
      <SectionFrame className="py-16 md:py-20">
        <LocationIntelligence
          latitude={listing.latitude!}
          longitude={listing.longitude!}
          address={listing.unparsedAddress}
          community={listing.community}
          communityNarrative={MOCK_COMMUNITY_NARRATIVE}
          distances={MOCK_DISTANCES}
        />
      </SectionFrame>

      {/* ── 6. ACTION ROW ── */}
      <SectionFrame className="py-12 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/portfolio" className="caps hover:text-gold transition-colors text-[10px] tracking-widest">
            ← The Portfolio
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="caps text-[10px] tracking-widest text-stone/65 hover:text-gold transition-colors"
              aria-label="Documents available — request to view"
            >
              📄 Documents on request →
            </button>
            <ShareButton
              url={listingUrl}
              title={listing.unparsedAddress}
              listingKey={listing.listingKey}
            />
            <RequestTourCta href={tourHref} listingKey={listing.listingKey} />
          </div>
        </div>
      </SectionFrame>

      {/* ── 7. IDX COMPLIANCE FOOTER ── */}
      <IDXComplianceFooter
        lastUpdatedISO={listing.modificationTimestamp}
        listAgentName={listing.listAgentName}
        listOfficeName="Russ Lyon Sotheby's International Realty"
        agentCellPhone="(480) 555-1234"
        listOfficePhone="(480) 287-5200"
        brokerage="Russ Lyon Sotheby's International Realty"
      />

      <Footer />
    </>
  );
}
