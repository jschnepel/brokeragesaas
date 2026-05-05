import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { ListingGrid } from '@/components/portfolio/ListingGrid';
import { getYongActiveListings } from '@/lib/spark/listings';
import { siteUrl } from '@/lib/seo';

// Listings come live from the Spark API per-request — see lib/spark.
// In-memory Lambda cache (60s TTL) absorbs traffic spikes without
// hammering Spark's per-token rate limit.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'The Portfolio',
  description: 'Current and recent representations across the Phoenix Metro.',
  alternates: { canonical: siteUrl('/portfolio') },
};

export default async function PortfolioPage() {
  const listings = await getYongActiveListings();
  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/portfolio-az.jpg"
        kicker="The Portfolio"
        headline="Current"
        headlineItalic="representations."
        sub="Hand-curated estates across Scottsdale, Paradise Valley, and Yong's North Phoenix service area."
      />
      <main>
        <SectionFrame className="py-16 md:py-20">
          <ListingGrid listings={listings} />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
