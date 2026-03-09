import type { Metadata } from 'next';
import { resolveAgentConfig } from '../../../../agent-config/index';
import {
  getMarketPulseMonthly,
  getPriceBands,
  getSupplyDemand,
  getInventoryAge,
  getCommunityRankings,
  computeKpis,
  getDataPeriod,
} from '../../data';
import { DEFAULT_MARKET_HERO } from '../../../phoenix/data';
import { ZipCodeClient } from './ZipCodeClient';

const agent = resolveAgentConfig();

interface ZipCodePageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: ZipCodePageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `${code} Market Report | Luxury Real Estate Analytics`,
    description: `Market statistics, price trends, and community rankings for zip code ${code} in Greater Phoenix.`,
  };
}

export const revalidate = 3600;

export default async function ZipCodePage({ params }: ZipCodePageProps) {
  const { code } = await params;
  const geoFilter = { postalCode: code };

  const [pulse, priceBands, supplyDemand, inventoryAge, communities] =
    await Promise.all([
      getMarketPulseMonthly(geoFilter, 240),
      getPriceBands(geoFilter),
      getSupplyDemand(geoFilter, 240),
      getInventoryAge(geoFilter),
      getCommunityRankings(geoFilter, 'median_price_per_sqft', 30),
    ]);

  const kpis = computeKpis(pulse);
  const period = getDataPeriod(pulse);

  return (
    <ZipCodeClient
      agentId={agent.agentId}
      zipCode={code}
      kpis={kpis}
      pulse={pulse}
      priceBands={priceBands}
      supplyDemand={supplyDemand}
      inventoryAge={inventoryAge}
      communities={communities}
      periodStart={period.start}
      periodEnd={period.end}
      heroImage={DEFAULT_MARKET_HERO}
    />
  );
}
