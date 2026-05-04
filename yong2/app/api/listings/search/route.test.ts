import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/listings-search', () => ({
  searchListings: vi.fn(),
}));
vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit');
  return actual;
});

function makeReq(body: unknown, ip = '9.9.9.9'): Request {
  return new Request('http://localhost/api/listings/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

describe('POST /api/listings/search', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { __resetRateLimit } = await import('@/lib/rate-limit');
    __resetRateLimit();
  });

  it('returns 200 + { listings, pins, total } on a valid empty body', async () => {
    const { POST } = await import('./route');
    const { searchListings } = await import('@/lib/listings-search');
    vi.mocked(searchListings).mockResolvedValue({ listings: [], pins: [], total: 0 });
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ listings: [], pins: [], total: 0 });
    expect(searchListings).toHaveBeenCalledOnce();
  });

  it('passes through bbox + q + filters to searchListings', async () => {
    const { POST } = await import('./route');
    const { searchListings } = await import('@/lib/listings-search');
    vi.mocked(searchListings).mockResolvedValue({ listings: [], pins: [], total: 0 });
    const body = {
      q: 'silverleaf',
      bbox: { minLng: -112, minLat: 33, maxLng: -111, maxLat: 34 },
      status: ['Active'],
      priceMin: 1_000_000,
      bedsMin: 4,
      limit: 30,
    };
    await POST(makeReq(body));
    expect(searchListings).toHaveBeenCalledWith(expect.objectContaining(body));
  });

  it('rejects unknown status values with 400', async () => {
    const { POST } = await import('./route');
    const res = await POST(makeReq({ status: ['Sold'] }));
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON body with 400', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/listings/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.1.1.1' },
      body: '{not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects limit > 200 with 400', async () => {
    const { POST } = await import('./route');
    const res = await POST(makeReq({ limit: 9999 }));
    expect(res.status).toBe(400);
  });

  it('returns 429 once the per-IP rate limit is exhausted', async () => {
    const { POST } = await import('./route');
    const { searchListings } = await import('@/lib/listings-search');
    vi.mocked(searchListings).mockResolvedValue({ listings: [], pins: [], total: 0 });

    const ip = '5.5.5.5';
    // 60 reqs allowed; the 61st should 429.
    for (let i = 0; i < 60; i += 1) {
      const r = await POST(makeReq({}, ip));
      expect(r.status).toBe(200);
    }
    const blocked = await POST(makeReq({}, ip));
    expect(blocked.status).toBe(429);
  });

  it('sets a short Cache-Control header on success', async () => {
    const { POST } = await import('./route');
    const { searchListings } = await import('@/lib/listings-search');
    vi.mocked(searchListings).mockResolvedValue({ listings: [], pins: [], total: 0 });
    const res = await POST(makeReq({}));
    expect(res.headers.get('cache-control')).toMatch(/s-maxage=30/);
  });
});
