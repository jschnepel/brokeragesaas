import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { HeroCinematic } from '@/components/hero/HeroCinematic';
import { StatsBand } from '@/components/home/StatsBand';
import { HomeIntro } from '@/components/home/HomeIntro';
import { MarketSnapshot } from '@/components/home/MarketSnapshot';
import { FeaturedPortfolio } from '@/components/home/FeaturedPortfolio';
import { SyndicationMarquee } from '@/components/home/SyndicationMarquee';
import { HomeCommunities } from '@/components/home/HomeCommunities';
import { AboutSnippet } from '@/components/home/AboutSnippet';
import { TestimonialsSection } from '@/components/testimonials/TestimonialsSection';
import { PrivateInventoryCta } from '@/components/home/PrivateInventoryCta';
import { MarketBlurb } from '@/components/home/MarketBlurb';
import { ContactCTA } from '@/components/home/ContactCTA';
import { searchListings } from '@/lib/spark/search';
import { getCuratedCommunities } from '@/lib/communities';
import { siteUrl } from '@/lib/seo';

export const revalidate = 1800;

export const metadata: Metadata = {
  alternates: { canonical: siteUrl('/') },
};

/**
 * Yong's home-page feature pool — top of the active luxury market.
 * Pulls 3 highest-priced ARMLS Active residential listings within
 * Yong's bbox via Spark (the curated / agent-owned portfolio query
 * stays in /portfolio; this section is the public-facing top-of-
 * market teaser). RDS getFeaturedListings was retired with
 * mv_active_listings; Spark is the unified source now.
 */
const HOME_BBOX = { minLng: -112.5, minLat: 33.0, maxLng: -111.3, maxLat: 34.1 };

export default async function Home() {
  const [searchResult, communities] = await Promise.all([
    searchListings({
      bbox: HOME_BBOX,
      homeTypes: ['house', 'condo'],
      priceMin: 3_000_000,
      limit: 3,
    }).catch(() => ({ listings: [], pins: [], total: 0, hasMore: false, fetchedAt: '' })),
    Promise.resolve(getCuratedCommunities()),
  ]);

  const featured = searchResult.listings
    .slice(0, 3)
    .map((l) => ({
      slug: l.slug,
      listingKey: l.listingKey,
      address: l.unparsedAddress || `${l.streetNumber ?? ''} ${l.streetName ?? ''}`.trim(),
      community: l.community,
      price: l.listPrice,
      imageUrl: l.coverPhotoUrl,
      tag: l.status === 'Coming Soon' ? 'Coming Soon' : undefined,
      // ARMLS audit F6 / F5 — DOM line + IDX-badge gate on each
      // FeaturedPortfolio card. Both are no-ops when the field is
      // null on the Spark side (DOM not backfilled, or office name
      // absent), so the card still renders.
      daysOnMarket: l.daysOnMarket,
      listOfficeName: l.listOfficeName ?? null,
    }));

  return (
    <>
      <Navigation initialTransparent />
      <HeroCinematic />
      <StatsBand />
      <HomeIntro />
      <MarketSnapshot />
      <FeaturedPortfolio listings={featured} />
      <SyndicationMarquee />
      <HomeCommunities communities={communities} />
      <AboutSnippet />
      <TestimonialsSection />
      <PrivateInventoryCta />
      <MarketBlurb />
      <ContactCTA />
      <Footer />
    </>
  );
}
