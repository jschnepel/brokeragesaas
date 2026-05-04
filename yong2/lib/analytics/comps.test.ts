import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QueryResult, QueryResultRow } from 'pg';
import { getActiveComps } from './comps';

vi.mock('../db', () => ({ query: vi.fn() }));

function mockResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

beforeEach(() => vi.clearAllMocks());

describe('getActiveComps', () => {
  it('returns empty result when target listing has no row', async () => {
    const { query } = await import('../db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce(mockResult([])); // target lookup
    const r = await getActiveComps('99999999');
    expect(r.comps).toEqual([]);
    expect(r.totalPoolSize).toBe(0);
    expect(r.fallbackNote).toBeNull();
  });

  it('returns empty result when target has no living_area', async () => {
    const { query } = await import('../db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce(
      mockResult([
        {
          listing_id: '6934738',
          listing_key: 'k',
          community_slug: 'silverleaf-at-dc-ranch',
          community_name: 'Silverleaf',
          region_slug: 'north-scottsdale',
          region_name: null,
          list_price: '48000000',
          living_area: null,
          bedrooms: 5,
          bathrooms_total: '7',
          year_built: 2020,
          property_type: 'Residential',
          city: 'Scottsdale',
          lon: -111.85,
          lat: 33.65,
        },
      ]),
    );
    const r = await getActiveComps('6934738');
    expect(r.comps).toEqual([]);
  });

  it('scores in-community comps highest and computes a median ppsf', async () => {
    const { query } = await import('../db');
    const mockQuery = vi.mocked(query);
    // Target row.
    mockQuery.mockResolvedValueOnce(
      mockResult([
        {
          listing_id: '6934738',
          listing_key: 'k1',
          community_slug: 'silverleaf-at-dc-ranch',
          community_name: 'Silverleaf',
          region_slug: 'north-scottsdale',
          region_name: 'North Scottsdale',
          list_price: '48000000',
          living_area: '12000',
          bedrooms: 5,
          bathrooms_total: '7',
          year_built: 2020,
          property_type: 'Residential',
          city: 'Scottsdale',
          lon: -111.85,
          lat: 33.65,
        },
      ]),
    );
    // Comp pool — 4 in tier 1, 1 in tier 4 (further out).
    mockQuery.mockResolvedValueOnce(
      mockResult([
        // Tier-1 candidates
        {
          listing_key: 'a', listing_id: '111',
          unparsed_address: '11200 E WHISPER RIDGE',
          city: 'Scottsdale', bedrooms: 5, bathrooms_total: '7',
          living_area: '11500', list_price: '52000000', price_per_sqft: '4521',
          standard_status: 'Active', days_on_market: 45,
          primary_photo_url: null, year_built: 2019,
          distance_meters: '500', tier: 1,
        },
        {
          listing_key: 'b', listing_id: '112',
          unparsed_address: '10440 E DESERT HILLS',
          city: 'Scottsdale', bedrooms: 5, bathrooms_total: '6.5',
          living_area: '10800', list_price: '42000000', price_per_sqft: '3889',
          standard_status: 'Active', days_on_market: 22,
          primary_photo_url: null, year_built: 2021,
          distance_meters: '900', tier: 1,
        },
        {
          listing_key: 'c', listing_id: '113',
          unparsed_address: '9820 E THOMPSON PEAK',
          city: 'Scottsdale', bedrooms: 6, bathrooms_total: '7',
          living_area: '13000', list_price: '38000000', price_per_sqft: '2923',
          standard_status: 'Active Under Contract', days_on_market: 60,
          primary_photo_url: null, year_built: 2018,
          distance_meters: '1500', tier: 1,
        },
        {
          listing_key: 'd', listing_id: '114',
          unparsed_address: '11025 E FEATHERSONG',
          city: 'Scottsdale', bedrooms: 5, bathrooms_total: '6',
          living_area: '11200', list_price: '35000000', price_per_sqft: '3125',
          standard_status: 'Active', days_on_market: 90,
          primary_photo_url: null, year_built: 2017,
          distance_meters: '700', tier: 1,
        },
        // Tier 4 — further out
        {
          listing_key: 'e', listing_id: '115',
          unparsed_address: '5555 E PARADISE LN',
          city: 'Paradise Valley', bedrooms: 5, bathrooms_total: '7',
          living_area: '12500', list_price: '60000000', price_per_sqft: '4800',
          standard_status: 'Pending', days_on_market: 180,
          primary_photo_url: null, year_built: 2015,
          distance_meters: '6500', tier: 4,
        },
      ]),
    );
    const r = await getActiveComps('6934738', 5);
    // Should pull tier 1 only (4 candidates ≥ 4 threshold).
    expect(r.comps.length).toBe(4);
    expect(r.tierUsed).toBe(1);
    expect(r.fallbackNote).toContain('Silverleaf');
    expect(r.medianAskingPpsf).not.toBeNull();
    expect(typeof r.medianAskingPpsf).toBe('number');
    // First comp should be highest scored.
    expect(r.comps[0].similarityScore).toBeGreaterThanOrEqual(r.comps[3].similarityScore);
    expect(r.totalPoolSize).toBe(5);
  });

  it("escalates to wider tier when same-community pool < 4", async () => {
    const { query } = await import('../db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce(
      mockResult([
        {
          listing_id: '6934738', listing_key: 'k',
          community_slug: 'silverleaf-at-dc-ranch', community_name: 'Silverleaf',
          region_slug: 'north-scottsdale', region_name: 'North Scottsdale',
          list_price: '15000000', living_area: '6000',
          bedrooms: 4, bathrooms_total: '5', year_built: 2018,
          property_type: 'Residential', city: 'Scottsdale',
          lon: -111.85, lat: 33.65,
        },
      ]),
    );
    mockQuery.mockResolvedValueOnce(
      mockResult([
        // Tier 1: only 1 candidate
        { listing_key: 'a', listing_id: '111', unparsed_address: 'A',
          city: 'Scottsdale', bedrooms: 4, bathrooms_total: '5',
          living_area: '6200', list_price: '14500000', price_per_sqft: '2339',
          standard_status: 'Active', days_on_market: 30, primary_photo_url: null,
          year_built: 2019, distance_meters: '500', tier: 1 },
        // Tier 3: 4 more
        { listing_key: 'b', listing_id: '112', unparsed_address: 'B',
          city: 'Scottsdale', bedrooms: 4, bathrooms_total: '5',
          living_area: '5800', list_price: '13000000', price_per_sqft: '2241',
          standard_status: 'Active', days_on_market: 60, primary_photo_url: null,
          year_built: 2020, distance_meters: '2200', tier: 3 },
        { listing_key: 'c', listing_id: '113', unparsed_address: 'C',
          city: 'Scottsdale', bedrooms: 5, bathrooms_total: '6',
          living_area: '6500', list_price: '17000000', price_per_sqft: '2615',
          standard_status: 'Active', days_on_market: 12, primary_photo_url: null,
          year_built: 2022, distance_meters: '2500', tier: 3 },
        { listing_key: 'd', listing_id: '114', unparsed_address: 'D',
          city: 'Scottsdale', bedrooms: 4, bathrooms_total: '5',
          living_area: '6100', list_price: '14000000', price_per_sqft: '2295',
          standard_status: 'Active', days_on_market: 22, primary_photo_url: null,
          year_built: 2017, distance_meters: '2800', tier: 3 },
      ]),
    );
    const r = await getActiveComps('6934738');
    expect(r.comps.length).toBe(4);
    expect(r.tierUsed).toBeGreaterThan(1);
    // Mixed-tier note should mention community and nearby.
    expect(r.fallbackNote).not.toBeNull();
  });
});
