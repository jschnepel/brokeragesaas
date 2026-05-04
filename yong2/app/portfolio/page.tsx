import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { ListingGrid } from '@/components/portfolio/ListingGrid';
import { getActiveListings } from '@/lib/listings';
import { siteUrl } from '@/lib/seo';

export const revalidate = 1800;
export const metadata: Metadata = {
  title: 'The Portfolio',
  description: 'Current and recent representations across the Phoenix Metro.',
  alternates: { canonical: siteUrl('/portfolio') },
};

export default async function PortfolioPage() {
  const listings = await getActiveListings({ limit: 60 }).catch(() => []);
  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/portfolio.jpg"
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
