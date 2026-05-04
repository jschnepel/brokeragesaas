import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFeaturedListings,
  getActiveListings,
  getListingByKey,
  getListingBySlug,
  getListingsByCommunity,
  getListingsByRegionSlug,
  listingRowToListing,
  listingSlug,
  parseListingIdFromSlug,
} from './listings';
import { YONG_REGION_SLUGS, YONG_CITIES } from './yong-markets';

vi.mock('./db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

/** A row that mirrors a real mv_active_listings tuple (verified shape). */
const sampleRow = {
  listing_key: '20260305011946141922000000',
  listing_id: '6712940',
  standard_status: 'Active',
  unparsed_address: '10440 E Desert Hills Dr, Scottsdale, AZ 85262',
  street_number: '10440',
  street_name: 'E Desert Hills Dr',
  street_suffix: 'Dr',
  city: 'Scottsdale',
  postal_code: '85262',
  county: 'Maricopa',
  subdivision_display: 'Desert Mountain',
  community_slug: 'desert-mountain',
  community_name: 'Desert Mountain',
  region_slug: 'north-scottsdale',
  region_name: 'North Scottsdale',
  list_price: '8495000.00',
  price_per_sqft: '1083.50',
  bedrooms: 5,
  bathrooms_full: 6,
  bathrooms_half: 1,
  bathrooms_total: '6.5',
  living_area: '7842',
  lot_acres: '1.8500',
  lot_sqft: '80586',
  year_built: 2019,
  days_on_market: 47,
  latitude: '33.8702341',
  longitude: '-111.8743221',
  property_type: 'Residential',
  property_sub_type: 'Single Family - Detached',
  has_pool: true,
  has_fireplace: true,
  has_garage: true,
  is_luxury: true,
  public_remarks: 'An estate.',
  primary_photo_url: 'https://cdn.photos.sparkplatform.com/az/a-o.jpg',
  photo_urls: [
    { url: 'https://cdn.photos.sparkplatform.com/az/a-o.jpg', desc: 'Front' },
    { url: 'https://cdn.photos.sparkplatform.com/az/b-o.jpg', desc: null },
  ],
  list_agent_key: 'M_123',
  list_agent_name: 'Yong Choi',
  modification_timestamp: '2026-04-20T12:00:00.000Z',
};

describe('listingSlug', () => {
  it('produces a URL-safe slug ending in the listing_id', () => {
    const s = listingSlug('10440 E Desert Hills Dr, Scottsdale, AZ 85262', '6712940');
    expect(s).toBe('10440-e-desert-hills-dr-scottsdale-az-85262-6712940');
  });

  it('falls back when address is null', () => {
    expect(listingSlug(null, '6712940')).toBe('listing-6712940');
  });

  it('round-trips through parseListingIdFromSlug', () => {
    const id = '6934738';
    const slug = listingSlug('7545 N Mockingbird Lane, Paradise Valley, AZ 85253', id);
    expect(parseListingIdFromSlug(slug)).toBe(id);
  });
});

describe('parseListingIdFromSlug', () => {
  it('extracts the trailing all-digits token', () => {
    expect(parseListingIdFromSlug('10440-e-desert-hills-dr-scottsdale-az-85262-6712940')).toBe('6712940');
  });

  it('returns null when the slug has no numeric tail', () => {
    expect(parseListingIdFromSlug('not-a-real-slug')).toBeNull();
  });

  it('returns null for an empty slug', () => {
    expect(parseListingIdFromSlug('')).toBeNull();
  });
});

describe('listingRowToListing', () => {
  it('coerces string numerics to numbers', () => {
    const l = listingRowToListing(sampleRow);
    expect(l.listPrice).toBe(8495000);
    expect(l.bathroomsTotal).toBe(6.5);
    expect(l.lotAcres).toBeCloseTo(1.85);
    expect(l.latitude).toBeCloseTo(33.8702341);
    expect(l.pricePerSqft).toBeCloseTo(1083.5);
  });

  it('keeps null prices as null (not 0)', () => {
    const l = listingRowToListing({ ...sampleRow, list_price: null });
    expect(l.listPrice).toBeNull();
  });

  it('uses community_name then subdivision_display then city for the community label', () => {
    expect(listingRowToListing(sampleRow).community).toBe('Desert Mountain');
    expect(
      listingRowToListing({ ...sampleRow, community_name: null }).community,
    ).toBe('Desert Mountain'); // falls back to subdivision_display
    expect(
      listingRowToListing({ ...sampleRow, community_name: null, subdivision_display: null }).community,
    ).toBe('Scottsdale');
  });

  it('exposes community/region slug + name from the MV', () => {
    const l = listingRowToListing(sampleRow);
    expect(l.communitySlug).toBe('desert-mountain');
    expect(l.communityName).toBe('Desert Mountain');
    expect(l.regionSlug).toBe('north-scottsdale');
    expect(l.regionName).toBe('North Scottsdale');
  });

  it('flips boolean feature flags', () => {
    const l = listingRowToListing(sampleRow);
    expect(l.isLuxury).toBe(true);
    expect(l.hasPool).toBe(true);
    expect(listingRowToListing({ ...sampleRow, is_luxury: false, has_pool: null }).isLuxury).toBe(false);
    expect(listingRowToListing({ ...sampleRow, has_pool: null }).hasPool).toBe(false);
  });

  it('normalizes photo_urls jsonb into a string[] and a {url,desc}[]', () => {
    const l = listingRowToListing(sampleRow);
    expect(l.photos).toEqual([
      'https://cdn.photos.sparkplatform.com/az/a-o.jpg',
      'https://cdn.photos.sparkplatform.com/az/b-o.jpg',
    ]);
    expect(l.photoUrls[0]).toEqual({ url: 'https://cdn.photos.sparkplatform.com/az/a-o.jpg', desc: 'Front' });
  });

  it('falls back to first photo when primary_photo_url is missing', () => {
    const l = listingRowToListing({ ...sampleRow, primary_photo_url: null });
    expect(l.coverPhotoUrl).toBe('https://cdn.photos.sparkplatform.com/az/a-o.jpg');
  });

  it('handles MediaURL-shaped photo objects', () => {
    const l = listingRowToListing({
      ...sampleRow,
      // Spark API hands back {MediaURL} objects for some replicators.
      photo_urls: [{ MediaURL: 'https://cdn.example.com/x.jpg' }],
    });
    expect(l.photos).toEqual(['https://cdn.example.com/x.jpg']);
  });
});

describe('getActiveListings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('enforces every IDX clause and supports city/postal/communitySlug filters', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [sampleRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

    await getActiveListings({ limit: 24, city: 'Scottsdale', postalCode: '85262', communitySlug: 'desert-mountain' });

    expect(mockQuery).toHaveBeenCalledOnce();
    const call = mockQuery.mock.calls[0]!;
    const sql = call[0];
    expect(sql).toMatch(/is_deleted\s*=\s*FALSE/i);
    expect(sql).toMatch(/internet_display_yn\s*=\s*TRUE/i);
    expect(sql).toMatch(/standard_status\s+NOT\s+IN/i);
    expect(sql).toMatch(/FROM\s+mv_active_listings/i);
    expect(sql).toMatch(/city\s+ILIKE\s+\$1/);
    expect(sql).toMatch(/postal_code\s*=\s*\$2/);
    expect(sql).toMatch(/community_slug\s*=\s*\$3/);
    // Yong-market filter occupies $4 / $5 (region_slug / city arrays).
    expect(sql).toMatch(/region_slug\s*=\s*ANY\(\$4::text\[\]\)/);
    expect(sql).toMatch(/city\s*=\s*ANY\(\$5::text\[\]\)/);
    expect(call[1]).toEqual(['Scottsdale', '85262', 'desert-mountain', YONG_REGION_SLUGS, YONG_CITIES, 24]);
  });

  it('appends the is_luxury filter when requested', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    await getActiveListings({ limit: 10, isLuxury: true });
    const sql = mockQuery.mock.calls[0]![0];
    expect(sql).toMatch(/is_luxury\s*=\s*TRUE/i);
  });

  it('always restricts to Yong\'s service area via region_slug or city', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    await getActiveListings({ limit: 60 });
    const [sql, params] = mockQuery.mock.calls[0]!;
    expect(sql).toMatch(/region_slug\s*=\s*ANY\(\$1::text\[\]\)/);
    expect(sql).toMatch(/city\s*=\s*ANY\(\$2::text\[\]\)/);
    expect(params).toEqual([YONG_REGION_SLUGS, YONG_CITIES, 60]);
  });
});

describe('getFeaturedListings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('queries luxury actives ordered by price desc with the requested limit', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce({ rows: [sampleRow, sampleRow, sampleRow], rowCount: 3, command: 'SELECT', oid: 0, fields: [] });

    const result = await getFeaturedListings(3);

    expect(mockQuery).toHaveBeenCalledOnce();
    const sql = mockQuery.mock.calls[0]![0];
    expect(sql).toMatch(/is_luxury\s*=\s*TRUE/i);
    expect(sql).toMatch(/ORDER BY list_price DESC NULLS LAST/i);
    expect(sql).toMatch(/region_slug\s*=\s*ANY\(\$2::text\[\]\)/);
    expect(sql).toMatch(/city\s*=\s*ANY\(\$3::text\[\]\)/);
    expect(mockQuery.mock.calls[0]![1]).toEqual([3, YONG_REGION_SLUGS, YONG_CITIES]);
    expect(result).toHaveLength(3);
    expect(result[0].listingKey).toBe('20260305011946141922000000');
  });

  it('falls back to the IDX-active set when luxury query is undersupplied', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    mockQuery.mockResolvedValueOnce({ rows: [sampleRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });
    const r = await getFeaturedListings(6);
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(r).toHaveLength(1);
  });
});

describe('getListingByKey', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns null when no row matches', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    expect(await getListingByKey('L_NOPE')).toBeNull();
  });
});

describe('getListingBySlug', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('parses the trailing listing_id and queries WHERE listing_id = $1', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [sampleRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

    const r = await getListingBySlug('10440-e-desert-hills-dr-scottsdale-az-85262-6712940');
    expect(r?.listingId).toBe('6712940');
    const [sql, params] = mockQuery.mock.calls[0]!;
    expect(sql).toMatch(/listing_id\s*=\s*\$1/i);
    expect(sql).toMatch(/LIMIT 1/i);
    expect(params).toEqual(['6712940']);
  });

  it('returns null when the slug has no numeric tail', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    expect(await getListingBySlug('no-numeric-tail')).toBeNull();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns null when no row matches the listing_id', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    expect(await getListingBySlug('some-address-9999999')).toBeNull();
  });
});

describe('getListingsByCommunity', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('filters by exact community_slug, residential property_type, and Yong\'s market', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [sampleRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });
    await getListingsByCommunity('desert-mountain');
    const [sql, params] = mockQuery.mock.calls[0]!;
    expect(sql).toMatch(/community_slug\s*=\s*\$1/i);
    expect(sql).toMatch(/property_type\s*=\s*'Residential'/);
    expect(sql).toMatch(/region_slug\s*=\s*ANY\(\$3::text\[\]\)/);
    expect(sql).toMatch(/city\s*=\s*ANY\(\$4::text\[\]\)/);
    expect(params).toEqual(['desert-mountain', 60, YONG_REGION_SLUGS, YONG_CITIES]);
  });

  it('skips the property_type filter when segment is "all"', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    await getListingsByCommunity('desert-mountain', 60, 'all');
    const sql = mockQuery.mock.calls[0]![0];
    expect(sql).not.toMatch(/property_type\s*=/);
  });
});

describe('getListingsByRegionSlug', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('filters by region_slug + residential property_type for region-scoped community pages', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [sampleRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });
    await getListingsByRegionSlug('paradise-valley');
    const [sql, params] = mockQuery.mock.calls[0]!;
    expect(sql).toMatch(/FROM\s+mv_active_listings/i);
    expect(sql).toMatch(/is_deleted\s*=\s*FALSE/i);
    expect(sql).toMatch(/internet_display_yn\s*=\s*TRUE/i);
    expect(sql).toMatch(/region_slug\s*=\s*\$1/i);
    expect(sql).toMatch(/property_type\s*=\s*'Residential'/);
    expect(sql).toMatch(/region_slug\s*=\s*ANY\(\$3::text\[\]\)/);
    expect(sql).toMatch(/city\s*=\s*ANY\(\$4::text\[\]\)/);
    expect(params).toEqual(['paradise-valley', 12, YONG_REGION_SLUGS, YONG_CITIES]);
  });

  it('honors a custom limit', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    await getListingsByRegionSlug('north-scottsdale', 25);
    expect(mockQuery.mock.calls[0]![1]![1]).toBe(25);
  });
});
