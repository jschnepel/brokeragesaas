import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { CommunityIndex } from '@/components/communities/CommunityIndex';
import { getCuratedCommunities, getAllCommunityScorecards } from '@/lib/communities';
import { communitiesContent, communitySlugs } from '@/content/communities';
import { siteUrl } from '@/lib/seo';

// Per-request render — Amplify build budget (60s) trips when this
// page is prerendered against RDS. Match /communities/[slug] +
// /market-reports/* which are all force-dynamic for the same reason.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'The Communities',
  description: "The enclaves Yong Choi represents across the Phoenix Metro.",
  alternates: { canonical: siteUrl('/communities') },
};

export default async function CommunitiesPage() {
  const communities = getCuratedCommunities();
  const kpisByKey = await getAllCommunityScorecards().catch(() => ({}));
  const slugToKey: Record<string, string> = Object.fromEntries(
    communitySlugs.map((s) => [s, communitiesContent[s].scopeKey])
  );
  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/communities.jpg"
        kicker="The Communities"
        headline="Where buyers"
        headlineItalic="choose to live."
        sub="A handful of enclaves carry most of the Valley's top-tier inventory. These are the addresses Yong represents."
      />
      <main>
        <SectionFrame className="py-16 md:py-20">
          <CommunityIndex communities={communities} kpisByKey={kpisByKey} slugToKey={slugToKey} />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
