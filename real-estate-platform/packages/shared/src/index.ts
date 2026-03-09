// Types
export type {
  Agent,
  AgentTier,
  AgentSiteConfig,
  AgentContact,
  AgentSocial,
  AgentBrandColors,
  AgentNavItem,
  AgentStat,
} from './types/agent';
export type { StandardProperty, PropertyFilters, MLSAdapter } from './types/mls';
export type { Lead, LeadStatus } from './types/lead';
export type { Property, PropertyStatus, PropertyType } from './types/property';

// Analytics types
export type {
  GeoFilter,
  PortfolioFilter,
  PortfolioTrendRow,
  TimeWindow,
  AnalyticsQuery,
  TimeSeriesPoint,
  MultiSeriesPoint,
  MarketPulseKpis,
  MarketPulseRow,
  PriceBandRow,
  SupplyDemandRow,
  InventoryAgeRow,
  CommunityScorecard,
  HeatmapPoint,
  FeaturePriceImpact,
  HeatmapMetricId,
  ColorScaleType,
  HeatmapMetricDef,
  HexCellMetrics,
  HexCell,
  ArmlsAttributionData,
} from './types/analytics';

// Utilities
export { formatCurrency, formatNumber, formatDate, slugify, generateListingSlug } from './utils';
export { aggregateToHexCells } from './utils/h3-aggregate';

// Constants
export { PROPERTY_STATUSES, LEAD_STATUSES, AGENT_TIERS } from './constants';
