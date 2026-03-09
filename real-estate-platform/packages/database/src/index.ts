export { pool, query, queryOne, getClient } from './client';
export { rdsPool, rdsQuery, rdsQueryOne, getRdsClient } from './rds-client';
export { getSSMParameter, resolveDatabaseUrl, SSM_PARAMS } from './ssm';
export type { QueryResult, PoolClient } from 'pg';

// Analytics queries
export {
  getMarketPulseMonthly,
  getPriceBands,
  getSupplyDemand,
  getInventoryAge,
  getCommunityScorecard,
  getCommunityRankings,
  getHeatmapPoints,
  getAvailableLocations,
  getPortfolioTrends,
  getFeaturePriceImpact,
} from './queries/analytics';
