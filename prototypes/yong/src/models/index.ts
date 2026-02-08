// Bootstrap the Market Registry with all config data
import { MarketRegistry } from './MarketRegistry';
import { REGION_CONFIGS, ZIPCODE_CONFIGS, COMMUNITY_CONFIGS } from '../data/marketConfigs';

// Initialize the singleton registry
MarketRegistry.initialize(REGION_CONFIGS, ZIPCODE_CONFIGS, COMMUNITY_CONFIGS);

// Re-export everything for convenient imports
export { MarketRegistry } from './MarketRegistry';
export { MarketScope } from './MarketScope';
export { MarketOverview } from './MarketOverview';
export { RegionScope } from './RegionScope';
export { ZipcodeScope } from './ZipcodeScope';
export { CommunityScope } from './CommunityScope';
export { ScopeFactory } from './ScopeFactory';
export type * from './types';
