import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QueryResult, QueryResultRow } from 'pg';
import { getListingPace } from './listing-pace';
import type { Listing } from '../types';
import type { CompResult } from './comps';
import type { AreaRead } from './area';

vi.mock('../db', () => ({ query: vi.fn() }));

function mockResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

beforeEach(() => vi.clearAllMocks());

const baseListing: Listing = {
  listingKey: 'KEY1',
  listingId: '6934738',
  slug: 'addr-6934738',
  status: 'Active',
  unparsedAddress: '21018 N 104th',
  streetNumber: '21018', streetName: '104th', streetSuffix: 'ST',
  city: 'Scottsdale', postalCode: '85255', county: 'Maricopa',
  subdivisionDisplay: null,
  communitySlug: 'silverleaf-at-dc-ranch', communityName: 'Silverleaf',
  regionSlug: 'north-scottsdale', regionName: 'North Scottsdale',
  community: 'Silverleaf',
  listPrice: 48000000,
  pricePerSqft: 1667,
  bedrooms: 5, bathroomsFull: 7, bathroomsHalf: 0, bathroomsTotal: 7,
  livingArea: 12000, lotAcres: 2.0, lotSqft: 87000,
  yearBuilt: 2020, daysOnMarket: 87,
  latitude: 33.65, longitude: -111.85,
  propertyType: 'Residential', propertySubType: 'Single Family',
  hasPool: true, hasFireplace: true, hasGarage: true, isLuxury: true,
  publicRemarks: null, coverPhotoUrl: null, photos: [], photoUrls: [],
  listAgentKey: null, listAgentName: null, modificationTimestamp: null,
};

const baseArea: AreaRead = {
  scopeType: 'community',
  scopeKey: 'silverleaf-at-dc-ranch',
  scopeLabel: 'Silverleaf',
  trend: [],
  currentPpsf: 1050,
  yoyPriceChangePct: 6.3,
  closesPerMonth: 2.4,
  listToSaleRatio: 98.5,
  medianDom: 42,
};

const baseComps: CompResult = {
  comps: [],
  medianAskingPpsf: 1420,
  totalPoolSize: 5,
  tierUsed: 1,
  fallbackNote: '5 of 5 in Silverleaf',
};

describe('getListingPace', () => {
  it('composes a pace KPI struct from target + comp + area data', async () => {
    const { query } = await import('../db');
    const mockQuery = vi.mocked(query);
    // analytics_base reduction lookup
    mockQuery.mockResolvedValueOnce(mockResult([{ has_price_reduction: true }]));
    // mv_community_scorecard months_of_supply lookup
    mockQuery.mockResolvedValueOnce(mockResult([{ months_of_supply: '4.1' }]));

    const pace = await getListingPace(baseListing, baseComps, baseArea);
    expect(pace.daysOnMarket).toBe(87);
    expect(pace.communityMedianDom).toBe(42);
    expect(pace.pricePerSqft).toBe(1667);
    // (1667 - 1420) / 1420 ≈ 0.174
    expect(pace.vsCompMedianPctDelta).toBeCloseTo(0.174, 2);
    expect(pace.monthsOfSupply).toBe(4.1);
    expect(pace.hasPriceReduction).toBe(true);
    expect(pace.yoyPriceChangePct).toBe(6.3);
  });

  it('handles no comp median gracefully', async () => {
    const { query } = await import('../db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce(mockResult([])); // no analytics_base row
    mockQuery.mockResolvedValueOnce(mockResult([{ months_of_supply: '3.4' }]));

    const pace = await getListingPace(
      baseListing,
      { ...baseComps, medianAskingPpsf: null },
      baseArea,
    );
    expect(pace.vsCompMedianPctDelta).toBeNull();
    expect(pace.hasPriceReduction).toBe(false);
    expect(pace.monthsOfSupply).toBe(3.4);
  });
});
