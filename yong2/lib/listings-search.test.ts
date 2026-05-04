import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchListings, searchListingPins } from './listings-search';
import { YONG_REGION_SLUGS, YONG_CITIES } from './yong-markets';

vi.mock('./db', () => ({
  query: vi.fn(),
}));

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
  photo_urls: [{ url: 'https://cdn.photos.sparkplatform.com/az/a-o.jpg', desc: null }],
  list_agent_key: 'M_123',
  list_agent_name: 'Yong Choi',
  modification_timestamp: '2026-04-20T12:00:00.000Z',
  total_count: '1',
};

const samplePinRow = {
  listing_key: '20260305011946141922000000',
  listing_id: '6712940',
  unparsed_address: '10440 E Desert Hills Dr, Scottsdale, AZ 85262',
  latitude: '33.8702341',
  longitude: '-111.8743221',
  list_price: '8495000.00',
  standard_status: 'Active',
};

beforeEach(() => { vi.clearAllMocks(); });

describe('searchListings — base query', () => {
  it('always emits IDX clauses + Yong-market filter + ORDER BY price DESC + LIMIT/OFFSET', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [sampleRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

    await searchListings({ limit: 60, offset: 0 });

    // First call is the listings SQL; second call is the pins SQL.
    expect(mockQuery).toHaveBeenCalledTimes(2);
    const [listingSql, listingParams] = mockQuery.mock.calls[0]!;
    expect(listingSql).toMatch(/FROM\s+mv_active_listings/i);
    expect(listingSql).toMatch(/is_deleted\s*=\s*FALSE/i);
    expect(listingSql).toMatch(/internet_display_yn\s*=\s*TRUE/i);
    expect(listingSql).toMatch(/standard_status\s+NOT\s+IN/i);
    expect(listingSql).toMatch(/region_slug\s*=\s*ANY\(\$1::text\[\]\)/);
    expect(listingSql).toMatch(/city\s*=\s*ANY\(\$2::text\[\]\)/);
    expect(listingSql).toMatch(/ORDER BY list_price DESC NULLS LAST/i);
    expect(listingSql).toMatch(/LIMIT \$3 OFFSET \$4/);
    expect(listingSql).toMatch(/COUNT\(\*\) OVER\(\) AS total_count/i);
    expect(listingParams).toEqual([YONG_REGION_SLUGS, YONG_CITIES, 60, 0]);
  });

  it('honors pagination opts (limit/offset)', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });

    await searchListings({ limit: 24, offset: 48 });
    const params = mockQuery.mock.calls[0]![1]!;
    expect(params[params.length - 2]).toBe(24);
    expect(params[params.length - 1]).toBe(48);
  });

  it('caps limit at 200', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    await searchListings({ limit: 9999 });
    const params = mockQuery.mock.calls[0]![1]!;
    expect(params[params.length - 2]).toBe(200);
  });

  it('returns total from the COUNT() OVER() window column', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...sampleRow, total_count: '347' }],
      rowCount: 1, command: 'SELECT', oid: 0, fields: [],
    });
    mockQuery.mockResolvedValueOnce({ rows: [samplePinRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });
    const r = await searchListings({});
    expect(r.total).toBe(347);
    expect(r.listings).toHaveLength(1);
    expect(r.pins).toHaveLength(1);
  });
});

describe('searchListings — fuzzy text', () => {
  it('adds a plainto_tsquery FTS clause when q is provided', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });

    await searchListings({ q: 'silverleaf' });
    const [sql, params] = mockQuery.mock.calls[0]!;
    expect(sql).toMatch(/search_vector\s+@@\s+plainto_tsquery\('english',\s*\$1\)/i);
    expect(params![0]).toBe('silverleaf');
  });

  it('skips FTS when q is whitespace-only', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    await searchListings({ q: '   ' });
    expect(mockQuery.mock.calls[0]![0]).not.toMatch(/plainto_tsquery/);
  });
});

describe('searchListings — bbox viewport', () => {
  it('emits ST_MakeEnvelope when bbox is set and no polygon is provided', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });

    await searchListings({ bbox: { minLng: -112.5, minLat: 33.0, maxLng: -111.5, maxLat: 34.0 } });
    const [sql, params] = mockQuery.mock.calls[0]!;
    expect(sql).toMatch(/ST_MakeEnvelope\(\$1,\s*\$2,\s*\$3,\s*\$4,\s*4326\)/);
    expect(params!.slice(0, 4)).toEqual([-112.5, 33.0, -111.5, 34.0]);
  });

  it('omits the bbox clause when a polygon is provided (polygon wins)', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });

    await searchListings({
      bbox: { minLng: -112.5, minLat: 33.0, maxLng: -111.5, maxLat: 34.0 },
      polygonGeoJSON: { type: 'Polygon', coordinates: [[[-112,33],[-111,33],[-111,34],[-112,33]]] },
    });
    const [sql] = mockQuery.mock.calls[0]!;
    expect(sql).not.toMatch(/ST_MakeEnvelope/);
    expect(sql).toMatch(/ST_Intersects/);
  });
});

describe('searchListings — polygon geofence', () => {
  it('emits ST_Intersects + ST_GeomFromGeoJSON with the JSON-encoded polygon', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });

    const poly = { type: 'Polygon' as const, coordinates: [[[-112,33],[-111,33],[-111,34],[-112,33]]] };
    await searchListings({ polygonGeoJSON: poly });
    const [sql, params] = mockQuery.mock.calls[0]!;
    expect(sql).toMatch(/ST_Intersects\(geometry,\s*ST_SetSRID\(ST_GeomFromGeoJSON\(\$1\),\s*4326\)\)/);
    expect(params![0]).toBe(JSON.stringify(poly));
  });
});

describe('searchListings — status / price / beds filters', () => {
  it('expands "Pending" to include Active Under Contract', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });

    await searchListings({ status: ['Pending'] });
    const params = mockQuery.mock.calls[0]![1]!;
    expect(params[0]).toEqual(['Pending', 'Active Under Contract']);
  });

  it('emits price min/max and beds clauses', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });

    await searchListings({ priceMin: 1_000_000, priceMax: 5_000_000, bedsMin: 4 });
    const sql = mockQuery.mock.calls[0]![0];
    expect(sql).toMatch(/list_price\s*>=\s*\$1/);
    expect(sql).toMatch(/list_price\s*<=\s*\$2/);
    expect(sql).toMatch(/bedrooms\s*>=\s*\$3/);
  });
});

describe('searchListingPins', () => {
  it('returns minimal pin shape with derived slug and parsed numerics', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [samplePinRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

    const pins = await searchListingPins({});
    expect(pins).toHaveLength(1);
    expect(pins[0].listingKey).toBe('20260305011946141922000000');
    expect(pins[0].listingId).toBe('6712940');
    expect(pins[0].latitude).toBeCloseTo(33.8702341);
    expect(pins[0].longitude).toBeCloseTo(-111.8743221);
    expect(pins[0].listPrice).toBe(8495000);
    expect(pins[0].slug).toMatch(/-6712940$/);
  });

  it('caps the pin set at 2000', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    await searchListingPins({});
    const params = mockQuery.mock.calls[0]![1]!;
    expect(params[params.length - 1]).toBe(2000);
  });

  it('only returns rows with non-null lat/lng', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    await searchListingPins({});
    const sql = mockQuery.mock.calls[0]![0];
    expect(sql).toMatch(/latitude\s+IS\s+NOT\s+NULL/);
    expect(sql).toMatch(/longitude\s+IS\s+NOT\s+NULL/);
  });
});
