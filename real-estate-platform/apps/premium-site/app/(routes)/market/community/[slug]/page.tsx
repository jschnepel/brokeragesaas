import type { Metadata } from 'next';
import { resolveAgentConfig } from '../../../../agent-config/index';
import {
  getMarketPulseMonthly,
  getCommunityRankings,
  getCommunityScorecard,
  getPriceBands,
  getFeaturePriceImpact,
  getHeatmapPoints,
  getDataPeriod,
  computeKpis,
} from '../../data';
import { getRegionByCommunityName } from '../../../phoenix/data';
import { CommunityClient } from './CommunityClient';

const agent = resolveAgentConfig();

interface CommunityPageProps {
  params: Promise<{ slug: string }>;
}

function unslugify(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = unslugify(slug);
  return {
    title: `${name} Market Report | Luxury Real Estate Analytics`,
    description: `Comprehensive market analytics for ${name}: pricing, inventory, features, and community comparisons.`,
  };
}

export const revalidate = 3600;

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { slug } = await params;
  const communityName = unslugify(slug);
  const geoFilter = { subdivisionName: communityName };

  const [pulse, scorecard, similarCommunities, priceBands, featureImpact, heatmapPoints] =
    await Promise.all([
      getMarketPulseMonthly(geoFilter, 240),
      getCommunityScorecard(geoFilter),
      getCommunityRankings({}, 'median_price_per_sqft', 50),
      getPriceBands(geoFilter),
      getFeaturePriceImpact(geoFilter),
      getHeatmapPoints(geoFilter),
    ]);

  const kpis = computeKpis(pulse);
  const period = getDataPeriod(pulse);

  // Find similar communities (same zip, similar price range)
  const similar = scorecard
    ? similarCommunities
        .filter(c =>
          c.subdivisionName !== communityName &&
          (c.postalCode === scorecard.postalCode ||
           Math.abs(c.medianPricePerSqft - scorecard.medianPricePerSqft) < scorecard.medianPricePerSqft * 0.3)
        )
        .slice(0, 4)
    : [];

  const regionInfo = getRegionByCommunityName(communityName);

  return (
    <CommunityClient
      agentId={agent.agentId}
      communityName={communityName}
      slug={slug}
      kpis={kpis}
      pulse={pulse}
      scorecard={scorecard}
      similarCommunities={similar}
      periodStart={period.start}
      periodEnd={period.end}
      priceBands={priceBands}
      featureImpact={featureImpact}
      heatmapPoints={heatmapPoints}
      heroImage={regionInfo?.heroImage ?? null}
      regionId={regionInfo?.regionId ?? null}
      communityId={regionInfo?.communityId ?? null}
    />
  );
}
