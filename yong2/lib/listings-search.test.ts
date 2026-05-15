/**
 * Unit tests for `getDistinctActiveCities` — the one remaining RDS-backed
 * function in this module. The legacy `searchListings`/`searchListingPins`
 * paths were removed when the search engine migrated to Spark
 * (see lib/spark/search.ts); their tests live alongside that module now.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./db', () => ({
  query: vi.fn(),
}));

// `unstable_cache` would normally memoize; in unit tests we want to see
// every call land in the underlying query. Mocking next/cache returns
// the original function so each test gets a fresh DB hit.
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getDistinctActiveCities', () => {
  it('runs the active-IDX aggregation against listing_records and parses count to int', async () => {
    const { query } = await import('./db');
    const { getDistinctActiveCities } = await import('./listings-search');
    vi.mocked(query).mockResolvedValue({
      rows: [
        { city: 'Phoenix', count: 5532 },
        { city: 'Scottsdale', count: '3232' }, // pg can return COUNT as string
      ],
      rowCount: 2,
      command: 'SELECT',
      oid: 0,
      fields: [],
    });
    const result = await getDistinctActiveCities();
    expect(vi.mocked(query)).toHaveBeenCalledOnce();
    const [sql] = vi.mocked(query).mock.calls[0]!;
    expect(sql).toMatch(/FROM\s+listing_records/);
    expect(sql).toMatch(/is_deleted\s*=\s*FALSE/);
    expect(sql).toMatch(/internet_entire_listing_display_yn\s*=\s*TRUE/);
    expect(sql).toMatch(/standard_status\s+IN/);
    expect(sql).toMatch(/property_type\s*<>\s*'Residential Lease'/);
    expect(sql).toMatch(/GROUP BY city/);
    expect(result).toEqual([
      { city: 'Phoenix', count: 5532 },
      { city: 'Scottsdale', count: 3232 },
    ]);
  });

  it('returns an empty list when there are no matching rows', async () => {
    const { query } = await import('./db');
    const { getDistinctActiveCities } = await import('./listings-search');
    vi.mocked(query).mockResolvedValue({
      rows: [],
      rowCount: 0,
      command: 'SELECT',
      oid: 0,
      fields: [],
    });
    const result = await getDistinctActiveCities();
    expect(result).toEqual([]);
  });
});
