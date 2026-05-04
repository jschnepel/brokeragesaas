import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { CommunityIndex } from '@/components/communities/CommunityIndex';
import { getCuratedCommunities, getAllCommunityScorecards } from '@/lib/communities';
import { communitiesContent, communitySlugs } from '@/content/communities';
import { siteUrl } from '@/lib/seo';

export const revalidate = 3600;
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
      <Navigation />
      <main className="pt-24">
        <SectionFrame className="py-12">
          <h1 className="display-xl italic border-b border-white/10 pb-6 mb-10">The Communities</h1>
          <CommunityIndex communities={communities} kpisByKey={kpisByKey} slugToKey={slugToKey} />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
