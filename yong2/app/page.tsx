import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { HeroCinematic } from '@/components/hero/HeroCinematic';
import { HomeIntro } from '@/components/home/HomeIntro';
import { FeaturedPortfolio } from '@/components/home/FeaturedPortfolio';
import { SyndicationMarquee } from '@/components/home/SyndicationMarquee';
import { HomeCommunities } from '@/components/home/HomeCommunities';
import { AboutSnippet } from '@/components/home/AboutSnippet';
import { MarketBlurb } from '@/components/home/MarketBlurb';
import { ContactCTA } from '@/components/home/ContactCTA';
import { getFeaturedListings } from '@/lib/listings';
import { getCuratedCommunities } from '@/lib/communities';
import { siteUrl } from '@/lib/seo';

export const revalidate = 1800;

export const metadata: Metadata = {
  alternates: { canonical: siteUrl('/') },
};

export default async function Home() {
  const [listings, communities] = await Promise.all([
    getFeaturedListings(3).catch(() => []),
    Promise.resolve(getCuratedCommunities()),
  ]);

  const featured = listings.map((l) => ({
    slug: l.slug,
    listingKey: l.listingKey,
    address: l.unparsedAddress || `${l.streetNumber ?? ''} ${l.streetName ?? ''}`.trim(),
    community: l.community,
    price: l.listPrice,
    imageUrl: l.coverPhotoUrl,
    tag: l.status === 'Coming Soon' ? 'Coming Soon' : undefined,
  }));

  return (
    <>
      <Navigation initialTransparent />
      <HeroCinematic />
      <HomeIntro />
      <FeaturedPortfolio listings={featured} />
      <SyndicationMarquee />
      <HomeCommunities communities={communities} />
      <AboutSnippet />
      <MarketBlurb />
      <ContactCTA />
      <Footer />
    </>
  );
}
