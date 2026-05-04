/**
 * MOCK PREVIEW — DELETE WHEN DATA LAYER LANDS
 *
 * Hardcoded sample listing so the polished detail page can be
 * reviewed without the (currently broken) data layer. Renders the
 * exact same components the real /portfolio/[slug] route uses,
 * fed by an in-file `mockListing` object shaped like the real
 * `Listing` type.
 *
 * When the S3 active-snapshot data layer ships and /portfolio/[slug]
 * starts returning real listings:
 *   1. Delete this directory (yong2/app/portfolio/preview).
 *   2. Delete yong2/public/mock-listing/.
 *   3. Remove the entry from sitemap exclusions if added.
 *   4. Strip the corresponding entry from MEMORY.md backlog.
 *
 * The yellow ribbon at the top is intentional — preview pages should
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
  // Centered on Silverleaf at DC Ranch
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
      <SectionFrame className="py-20">
        <div data-track="facts" className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-12">
          <article className="text-stone/90 leading-relaxed space-y-4">
            {listing.publicRemarks ? (
              <p>
                <span className="font-serif text-5xl leading-none float-left mr-2 -mt-1 text-gold">
                  {listing.publicRemarks.charAt(0)}
                </span>
                {listing.publicRemarks.slice(1)}
              </p>
            ) : null}
          </article>
          <ListingFactSheet listing={listing} />
        </div>
        <section className="mt-16" data-track="map">
          <p className="caps text-mute mb-4">Location</p>
          <ListingMap
            latitude={listing.latitude as number}
            longitude={listing.longitude as number}
            address={listing.unparsedAddress}
          />
        </section>
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
      <Footer />
    </>
  );
}
