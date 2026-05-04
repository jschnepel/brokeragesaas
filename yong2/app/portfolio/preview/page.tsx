/**
 * MOCK PREVIEW — DELETE WHEN DATA + NARRATIVE WORKFLOWS LAND
 *
 * Hardcoded sample listing + narrative so the polished detail page
 * can be reviewed without the (currently broken) data layer or the
 * (not-yet-built) automated narrative workflow.
 *
 * Two pieces of mock data:
 *   1. `mockListing`   — shaped like the real `Listing` type.
 *                        Replaced by getListingBySlug(slug) when the
 *                        S3 active-snapshot data layer ships.
 *   2. `MOCK_NARRATIVE` (from lib/listing-narrative.ts)
 *                      — shaped like `ListingNarrative`. Replaced by
 *                        the narrative workflow's per-listing output
 *                        when that workflow ships.
 *
 * Cleanup:
 *   - Delete this directory (yong2/app/portfolio/preview)
 *   - Delete yong2/public/mock-listing/
 *   - Strip MOCK_NARRATIVE from lib/listing-narrative.ts (keep types)
 *   - Strip MEMORY.md backlog entry
 *
 * Spec for the narrative workflow: yong2/docs/listing-narrative-workflow.md
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { ListingHeroGallery } from '@/components/portfolio/ListingHeroGallery';
import { ListingFactSheet } from '@/components/portfolio/ListingFactSheet';
import { ListingMap } from '@/components/portfolio/ListingMap';
import { ShareButton } from '@/components/portfolio/ShareButton';
import { RequestTourCta } from '@/components/portfolio/RequestTourCta';
import { StickyContact } from '@/components/portfolio/StickyContact';
import { ListingStory } from '@/components/portfolio/ListingStory';
import { KeyFeaturesGrid } from '@/components/portfolio/KeyFeaturesGrid';
import { ListingEditorial } from '@/components/portfolio/ListingEditorial';
import { ListingSchoolsBlock } from '@/components/portfolio/ListingSchoolsBlock';
import { ListingFinancialDetails } from '@/components/portfolio/ListingFinancialDetails';
import { MockTheRead } from '@/components/portfolio/MockTheRead';
import { SimilarListingsStrip } from '@/components/portfolio/SimilarListingsStrip';
import { IDXComplianceFooter } from '@/components/portfolio/IDXComplianceFooter';
import { MOCK_NARRATIVE } from '@/lib/listing-narrative';
import type { Listing } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Preview · Listing Detail',
  description: MOCK_NARRATIVE.summary,
  robots: { index: false, follow: false },
};

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
  /**
   * publicRemarks intentionally null on the preview — the narrative
   * workflow's `story` is the source of truth for prose. ARMLS
   * public_remarks is preserved on the underlying Listing for
   * compliance / fallback display, but the page consumes the
   * structured narrative.
   */
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

const MOCK_SIMILAR = [
  {
    slug: 'preview-mock-listing-2',
    address: '10220 E Whisper Rock Trail',
    community: 'Whisper Rock Estates',
    price: 7_400_000,
    imageUrl: '/mock-listing/mock-5.jpg',
    beds: 5,
    baths: 6,
    livingArea: 6_840,
  },
  {
    slug: 'preview-mock-listing-3',
    address: '37210 N Cave Creek Road',
    community: 'Desert Mountain',
    price: 9_950_000,
    imageUrl: '/mock-listing/mock-4.jpg',
    beds: 6,
    baths: 7,
    livingArea: 8_120,
  },
  {
    slug: 'preview-mock-listing-4',
    address: '6045 N 47th Street',
    community: 'Paradise Valley',
    price: 11_500_000,
    imageUrl: '/mock-listing/mock-3.jpg',
    beds: 7,
    baths: 9,
    livingArea: 9_450,
  },
];

export default function PreviewListingPage() {
  const listing = mockListing;
  const narrative = MOCK_NARRATIVE;
  const tourMessage = `${listing.unparsedAddress} (${listing.community})`;
  const tourHref = `/contact?listing=${encodeURIComponent(tourMessage)}&interest=Buying`;
  const listingUrl = `https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com/portfolio/preview`;

  return (
    <>
      <Navigation />
      <div className="fixed top-16 left-0 right-0 z-40 bg-gold/95 text-ink text-center py-2 text-[11px] tracking-[0.3em] uppercase font-medium">
        Preview · Mock Listing · Not Live Inventory
      </div>
      <StickyContact listingKey={listing.listingKey} tourHref={tourHref} />
      <div className="pt-10">
        <ListingHeroGallery listing={listing} photos={listing.photos} />
      </div>

      {/* ── Story (narrative.story) + Sidebar (FactSheet + Financial + Schools) ── */}
      <SectionFrame className="py-16 md:py-20">
        <div data-track="facts" className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-12">
          <div>
            {/* Summary lede — workflow-produced 1-sentence summary, large
             * italic-serif. Reads as the editorial hook; the four-paragraph
             * story below carries the long-form. */}
            <p className="font-serif italic text-stone text-2xl md:text-3xl leading-snug mb-8 max-w-2xl">
              {narrative.summary}
            </p>
            <ListingStory story={narrative.story} />
          </div>
          <div className="space-y-4">
            <ListingFactSheet listing={listing} />
            <ListingFinancialDetails
              taxAnnualAmount={28_400}
              associationYn={true}
              associationFee={985}
              associationFeeFrequency="mo"
              parcelNumber="217-65-014"
              county={listing.county}
            />
            <ListingSchoolsBlock
              elementary="Copper Ridge Elementary"
              middle="Copper Ridge Middle"
              highSchoolDistrict="Scottsdale Unified District"
            />
          </div>
        </div>

        {/* ── Features (narrative.featureGroups) ── */}
        <div className="mt-16">
          <KeyFeaturesGrid groups={narrative.featureGroups} />
        </div>

        {/* ── Editorial sub-sections (narrative.editorial) ── */}
        <div className="mt-16">
          <ListingEditorial editorial={narrative.editorial} />
        </div>

        {/* ── The Read (numerical + narrative.theRead commentary) ── */}
        <div className="mt-16">
          <MockTheRead
            subjectPpsf={listing.pricePerSqft!}
            compMedianPpsf={1_085}
            compPoolSize={9}
            areaMedianDom={42}
            areaMonthsOfSupply={3.8}
            areaYoYPriceChangePct={0.082}
            areaLabel="Silverleaf · last 12 months"
            compsCommentary={narrative.theRead.compsCommentary}
            areaCommentary={narrative.theRead.areaCommentary}
          />
        </div>

        <section className="mt-16" data-track="map">
          <p className="caps text-mute mb-4">Location</p>
          <ListingMap
            latitude={listing.latitude as number}
            longitude={listing.longitude as number}
            address={listing.unparsedAddress}
          />
          <p className="text-xs text-stone/55 mt-3 max-w-md">
            Precise address shared with qualified buyers following inquiry. Showings by appointment only.
          </p>
        </section>

        <div className="mt-16">
          <SimilarListingsStrip listings={MOCK_SIMILAR} />
        </div>

        <div className="mt-16 pt-10 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/portfolio" className="caps hover:text-gold transition-colors">← The Portfolio</Link>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="tel:+14805551234"
              className="caps hover:text-gold transition-colors"
              aria-label="Call Yong Choi at (480) 555-1234"
            >
              Call Yong
            </a>
            <ShareButton url={listingUrl} title={listing.unparsedAddress} listingKey={listing.listingKey} />
            <RequestTourCta href={tourHref} listingKey={listing.listingKey} />
          </div>
        </div>
      </SectionFrame>

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
