/**
 * Listing detail — Spark-backed, IDX-compliant.
 *
 * Resolves the slug via Spark API direct lookup (lib/spark/search →
 * getListingBySlug), enforces the IDX opt-out filter at the source.
 * The IDXComplianceFooter at the bottom carries the mandatory
 * attribution (logo, agent, office, contact ≥12px, last-updated,
 * broker reciprocity) — see docs/compliance/idx-compliance.md in
 * the platform repo.
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
import Image from 'next/image';
import { Navigation } from '@/components/chrome/Navigation';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { ListingHeroGallery } from '@/components/portfolio/ListingHeroGallery';
import { ListingFactSheet } from '@/components/portfolio/ListingFactSheet';
import { ShareButton } from '@/components/portfolio/ShareButton';
import { RequestTourCta } from '@/components/portfolio/RequestTourCta';
import { IDXComplianceFooter } from '@/components/portfolio/IDXComplianceFooter';
import { getListingBySlug } from '@/lib/spark/search';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

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

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug).catch(() => null);
  if (!listing) notFound();

  const tourMessage = `${listing.unparsedAddress}${listing.community ? ` (${listing.community})` : ''}`;
  const tourHref = `/contact?listing=${encodeURIComponent(tourMessage)}&interest=Buying`;
  const listingUrl = `${SITE_URL}/listings/${listing.slug}`;

  return (
    <>
      <Navigation initialTransparent />

      <ListingHeroGallery listing={listing} photos={listing.photos} />

      <main className="bg-ink text-stone">
        <SectionFrame className="py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-12 md:gap-16">
            <div>
              <p className="caps text-[10px] tracking-[0.32em] text-stone/55">
                {listing.community || 'ARMLS Listing'}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl text-stone leading-tight mt-3 tracking-[-0.005em]">
                {listing.unparsedAddress}
              </h1>
              <p className="mt-4 text-2xl md:text-3xl text-gold font-serif tabular-nums">
                {listing.listPrice
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(listing.listPrice)
                  : 'Price upon request'}
              </p>
              {listing.publicRemarks ? (
                <p className="mt-10 text-base md:text-lg leading-relaxed text-mute max-w-2xl">
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
        listOfficeName={null}
        agentCellPhone={null}
        listOfficePhone={null}
        brokerage="Russ Lyon Sotheby's International Realty"
      />
    </>
  );
}

// Suppress unused-import warning for Image (kept for future hero
// fallback when ListingHeroGallery is unavailable).
void Image;
