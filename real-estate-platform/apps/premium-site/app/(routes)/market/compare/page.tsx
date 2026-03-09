import type { Metadata } from 'next';
import { resolveAgentConfig } from '../../../agent-config/index';
import {
  getCommunityScorecard,
  getCommunityRankings,
  getMarketPulseMonthly,
  getDataPeriod,
} from '../data';
import { CompareClient } from './CompareClient';
import type { CommunityScorecard, MarketPulseRow } from '@platform/shared';

const agent = resolveAgentConfig();

interface ComparePageProps {
  searchParams: Promise<{ communities?: string }>;
}

function unslugify(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const { communities } = await searchParams;
  const names = communities
    ? communities.split(',').map(s => unslugify(s.trim())).slice(0, 4)
    : [];
  const title = names.length > 0
    ? `Compare ${names.join(' vs ')} | Market Analytics`
    : 'Community Comparison | Market Analytics';
  return {
    title,
    description: `Side-by-side community comparison: pricing, features, inventory, and ownership costs for ${names.join(', ') || 'Phoenix luxury communities'}.`,
  };
}

export const revalidate = 3600;

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { communities: communitySlugs } = await searchParams;

  const slugs = communitySlugs
    ? communitySlugs.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4)
    : [];

  // Fetch scorecards + pulse data for each selected community
  const scorecards: CommunityScorecard[] = [];
  const pulseMap: Record<string, MarketPulseRow[]> = {};

  await Promise.all(
    slugs.map(async (slug) => {
      const name = unslugify(slug);
      const filter = { subdivisionName: name };
      const [scorecard, pulse] = await Promise.all([
        getCommunityScorecard(filter),
        getMarketPulseMonthly(filter, 12),
      ]);
      if (scorecard) {
        scorecards.push(scorecard);
        pulseMap[scorecard.subdivisionName] = pulse;
      }
    }),
  );

  // Also fetch top communities for the search/picker
  const allCommunities = await getCommunityRankings({}, 'median_price_per_sqft', 100);

  // Get period from any available pulse data
  const allPulse = Object.values(pulseMap).flat();
  const period = getDataPeriod(allPulse);

  return (
    <CompareClient
      agentId={agent.agentId}
      scorecards={scorecards}
      pulseMap={pulseMap}
      allCommunities={allCommunities}
      periodStart={period.start}
      periodEnd={period.end}
    />
  );
}
