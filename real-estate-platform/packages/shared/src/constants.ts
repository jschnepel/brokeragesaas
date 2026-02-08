import type { PropertyStatus } from './types/property';
import type { LeadStatus } from './types/lead';
import type { AgentTier } from './types/agent';

export const PROPERTY_STATUSES: PropertyStatus[] = [
  'Active',
  'Pending',
  'Sold',
  'Off Market',
];

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
];

export const AGENT_TIERS: AgentTier[] = ['premium', 'template'];

export const MLS_DATA_SOURCES = ['armls', 'crmls', 'bridge', 'manual'] as const;

export const DEFAULT_PAGINATION = {
  limit: 24,
  offset: 0,
} as const;

export const CACHE_TTL = {
  agent: 5 * 60 * 1000, // 5 minutes
  properties: 2 * 60 * 1000, // 2 minutes
  features: 10 * 60 * 1000, // 10 minutes
} as const;

export const API_RATE_LIMITS = {
  default: {
    requests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  authenticated: {
    requests: 1000,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 200 },
  medium: { width: 600, height: 400 },
  large: { width: 1200, height: 800 },
  full: { width: 1920, height: 1280 },
} as const;
