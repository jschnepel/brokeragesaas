import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
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
      <Navigation />
      <main className="pt-24">
        <SectionFrame className="py-12">
          <ListingGrid listings={listings} />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
