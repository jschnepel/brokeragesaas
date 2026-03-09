import type { Metadata } from 'next';
import { resolveAgentConfig } from '../../agent-config/index';
import {
  getMarketPulseMonthly,
  getPriceBands,
  getSupplyDemand,
  getInventoryAge,
  getCommunityRankings,
  getHeatmapPoints,
  getAvailableLocations,
  getPortfolioTrends,
  computeKpis,
  getDataPeriod,
} from './data';
import type { GeoFilter, PortfolioFilter } from './data';
import { getHeroImageByCity, DEFAULT_MARKET_HERO } from '../phoenix/data';
import { MarketOverviewClient } from './MarketOverviewClient';

const agent = resolveAgentConfig();

export const metadata: Metadata = {
  title: 'Market Overview | Phoenix Luxury Real Estate Analytics',
  description: 'Real-time market statistics, price trends, and supply/demand analysis for Greater Phoenix luxury real estate. Powered by ARMLS data.',
};

export const revalidate = 3600; // ISR: revalidate hourly

interface MarketOverviewPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MarketOverviewPage({ searchParams }: MarketOverviewPageProps) {
  const params = await searchParams;

  // Build geo filter from search params
  const geoFilter: GeoFilter = {};
  if (typeof params.city === 'string' && params.city) geoFilter.city = params.city;
  if (typeof params.zip === 'string' && params.zip) geoFilter.postalCode = params.zip;

  // Build portfolio filter (feature-level filters for raw listing queries)
  const portfolio: PortfolioFilter = { ...geoFilter };
  const hasPool = params.pool === 'true';
  const bedsMin = typeof params.beds === 'string' && params.beds ? parseInt(params.beds, 10) : 0;
  const bathsMin = typeof params.baths === 'string' && params.baths ? parseInt(params.baths, 10) : 0;
  const priceMin = typeof params.priceMin === 'string' && params.priceMin ? parseInt(params.priceMin, 10) * 1000 : 0;
  const priceMax = typeof params.priceMax === 'string' && params.priceMax ? parseInt(params.priceMax, 10) * 1000 : 0;

  if (hasPool) portfolio.pool = true;
  if (bedsMin > 0) portfolio.bedsMin = bedsMin;
  if (bathsMin > 0) portfolio.bathsMin = bathsMin;
  if (priceMin > 0) portfolio.priceMin = priceMin;
  if (priceMax > 0) portfolio.priceMax = priceMax;

  const hasPortfolioFilters = hasPool || bedsMin > 0 || bathsMin > 0 || priceMin > 0 || priceMax > 0;

  const [pulse, priceBands, supplyDemand, inventoryAge, communities, heatmapPoints, locations, portfolioTrends] =
    await Promise.all([
      getMarketPulseMonthly(geoFilter, 240),
      getPriceBands(geoFilter),
      getSupplyDemand(geoFilter, 240),
      getInventoryAge(geoFilter),
      getCommunityRankings(geoFilter, 'median_price_per_sqft', 50),
      getHeatmapPoints(geoFilter),
      getAvailableLocations(),
      hasPortfolioFilters ? getPortfolioTrends(portfolio, 240) : Promise.resolve(null),
    ]);

  const kpis = computeKpis(pulse);
  const period = getDataPeriod(pulse);

  // Resolve hero image: city-specific if filtered, otherwise default
  const heroImage = (typeof params.city === 'string' && params.city)
    ? (getHeroImageByCity(params.city) ?? DEFAULT_MARKET_HERO)
    : DEFAULT_MARKET_HERO;

  return (
    <MarketOverviewClient
      agentId={agent.agentId}
      kpis={kpis}
      pulse={pulse}
      priceBands={priceBands}
      supplyDemand={supplyDemand}
      inventoryAge={inventoryAge}
      communities={communities}
      heatmapPoints={heatmapPoints}
      periodStart={period.start}
      periodEnd={period.end}
      availableCities={locations.cities}
      availableZipCodes={locations.zipCodes}
      portfolioTrends={portfolioTrends}
      hasPortfolioFilters={hasPortfolioFilters}
      heroImage={heroImage}
    />
  );
}
