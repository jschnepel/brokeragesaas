/**
 * MOCK PREVIEW — DELETE WHEN DATA LAYER LANDS
 *
 * Hardcoded sample listing so the polished detail page can be
 * reviewed without the (currently broken) data layer. Renders the
 * same components the real /portfolio/[slug] route will use, fed by
 * an in-file `mockListing` object shaped like the real `Listing`
 * type plus extra mock data (key features, editorial sub-sections,
 * The Read analytics, similar listings).
 *
 * When the S3 active-snapshot data layer ships and /portfolio/[slug]
 * starts returning real listings:
 *   1. Delete this directory (yong2/app/portfolio/preview)
 *   2. Delete yong2/public/mock-listing/
 *   3. Re-evaluate which extras (KeyFeaturesGrid, ListingEditorial,
 *      MockTheRead, SimilarListingsStrip, IDXComplianceFooter) to
 *      promote into the real /portfolio/[slug] route. Spec is in
 *      yong2/docs/listing-detail-spec.md.
 *   4. Strip the corresponding entry from MEMORY.md backlog.
 *
 * The gold ribbon at the top is intentional — preview pages should
 * never be confused with production output.
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
import { KeyFeaturesGrid } from '@/components/portfolio/KeyFeaturesGrid';
import { ListingEditorial } from '@/components/portfolio/ListingEditorial';
import { ListingSchoolsBlock } from '@/components/portfolio/ListingSchoolsBlock';
import { ListingFinancialDetails } from '@/components/portfolio/ListingFinancialDetails';
import { MockTheRead } from '@/components/portfolio/MockTheRead';
import { SimilarListingsStrip } from '@/components/portfolio/SimilarListingsStrip';
import { IDXComplianceFooter } from '@/components/portfolio/IDXComplianceFooter';
import type { Listing } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Preview · Listing Detail',
  robots: { index: false, follow: false },
};

const MOCK_PHOTOS = [
  '/mock-listing/mock-3.jpg', // exterior modern white architecture (hero)
  '/mock-listing/mock-5.jpg', // aerial perspective
  '/mock-listing/mock-4.jpg', // poolside
  '/mock-listing/mock-1.jpg', // living room interior
  '/mock-listing/mock-2.jpg', // kitchen
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
  publicRemarks:
    "A study in restrained modernism on one of Silverleaf's most coveted Horseshoe Canyon parcels. Designed by an award-winning Scottsdale studio in collaboration with the original owners, this 7,206-square-foot residence pairs glass-and-stone exteriors with interiors that read as gallery, not showpiece. Walls of folding glass dissolve the boundary between the great room and a 70-foot infinity-edge pool oriented to capture both Pinnacle Peak and the McDowell ridge at sunset. The primary suite occupies its own wing — a private courtyard, dual baths, and a dressing room scaled for a serious wardrobe. Five additional ensuite bedrooms, a temperature-controlled wine room for 1,800 bottles, a chef's kitchen with adjacent catering pantry, and a separate guest casita complete the program. Offered furnished with selected pieces by Holly Hunt and Christian Liaigre.",
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

// ── Mock data for the extended sections (not on the Listing type) ──

const MOCK_FEATURE_GROUPS = [
  { label: 'Architecture', items: ['Contemporary', 'Glass + Stone', 'Single-Story Wing'] },
  { label: 'Interior', items: ['12-Foot Ceilings', 'Heated Limestone Floors', 'Folding Glass Walls', 'Wet Bar', 'Wine Room (1,800 bottle)', 'Catering Pantry', 'Smart Home (Crestron)'] },
  { label: 'Kitchen', items: ['Gaggenau Suite', 'Dual Subzero Refrigeration', 'Wolf 6-Burner', 'Marble Waterfall Island'] },
  { label: 'Primary Suite', items: ['Private Courtyard', 'Dual Baths', 'Dressing Room', 'Steam Shower', 'Soaking Tub'] },
  { label: 'Exterior', items: ['Infinity-Edge Pool (70ft)', 'Outdoor Kitchen', 'Fire Feature', 'Bocce Court', 'Putting Green'] },
  { label: 'Views', items: ['Pinnacle Peak', 'McDowell Mountains', 'City Lights', 'Sunset Western Exposure'] },
  { label: 'Garage', items: ['4-Car Climate-Controlled', 'EV Charging × 2', 'Epoxy Floors'] },
  { label: 'Guest', items: ['Detached Casita (1 BR / 1 BA)', 'Private Entrance'] },
  { label: 'Community', items: ['24/7 Manned Gates', 'Member-Only Trails', 'Silverleaf Club Eligible'] },
];

const MOCK_EDITORIAL = [
  {
    heading: 'A measured horseshoe site',
    body: 'Sited at the back of one of the most discreet cul-de-sacs in Horseshoe Canyon — a 1.18-acre parcel chosen for its unobstructed western exposure to the McDowell ridge. The build steps down with the topography rather than fighting it; every principal room captures the mountain face.',
  },
  {
    heading: 'Materials, applied once',
    body: 'Limestone flooring sourced from a single European quarry. Walnut millwork by a Salt Lake atelier. Board-formed concrete walls poured in place. Patina bronze hardware throughout. The brief was to choose well, then commit — a vocabulary that holds together across 7,000 square feet without repeating itself.',
  },
  {
    heading: 'A program for the way one actually lives',
    body: 'The primary suite occupies its own wing with a private entrance courtyard. Five additional ensuite bedrooms — three for family, two configured as guest. A separate casita provides genuine privacy for extended visitors. The wine room is climate-zoned in two stages; the catering pantry is sized for events, not just storage.',
  },
  {
    heading: 'Shown by appointment',
    body: 'Yong personally accompanies every qualified showing. Inquiries reviewed within 24 hours; tours typically scheduled within the week.',
  },
];

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
  const tourMessage = `${listing.unparsedAddress} (${listing.community})`;
  const tourHref = `/contact?listing=${encodeURIComponent(tourMessage)}&interest=Buying`;
  const listingUrl = `https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com/portfolio/preview`;

  return (
    <>
      <Navigation />
      {/* Preview ribbon — never let this page be mistaken for prod. */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-gold/95 text-ink text-center py-2 text-[11px] tracking-[0.3em] uppercase font-medium">
        Preview · Mock Listing · Not Live Inventory
      </div>
      <StickyContact listingKey={listing.listingKey} tourHref={tourHref} />
      <div className="pt-10">
        <ListingHeroGallery listing={listing} photos={listing.photos} />
      </div>

      {/* ── Story + Fact sheet sidebar ── */}
      <SectionFrame className="py-16 md:py-20">
        <div data-track="facts" className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-12">
          <article className="text-stone/90 leading-relaxed space-y-4">
            <p>
              <span className="font-serif text-5xl leading-none float-left mr-2 -mt-1 text-gold">
                {listing.publicRemarks!.charAt(0)}
              </span>
              {listing.publicRemarks!.slice(1)}
            </p>
          </article>
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

        {/* ── Key features grid ── */}
        <div className="mt-16">
          <KeyFeaturesGrid groups={MOCK_FEATURE_GROUPS} />
        </div>

        {/* ── Editorial sub-sections ── */}
        <div className="mt-16">
          <ListingEditorial entries={MOCK_EDITORIAL} />
        </div>

        {/* ── The Read analytics ── */}
        <div className="mt-16">
          <MockTheRead
            subjectPpsf={listing.pricePerSqft!}
            compMedianPpsf={1_085}
            compPoolSize={9}
            areaMedianDom={42}
            areaMonthsOfSupply={3.8}
            areaYoYPriceChangePct={0.082}
            areaLabel="Silverleaf · last 12 months"
          />
        </div>

        {/* ── Map ── */}
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

        {/* ── Similar listings ── */}
        <div className="mt-16">
          <SimilarListingsStrip listings={MOCK_SIMILAR} />
        </div>

        {/* ── Action row ── */}
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

      {/* ── IDX compliance footer (mandatory for ARMLS) ── */}
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
