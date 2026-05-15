/**
 * POST /api/listings/search — body matches SearchOpts. Returns
 * { listings, pins, total } scoped to Yong's market with IDX clauses
 * preserved (enforced inside searchListings/searchListingPins).
 *
 * Caching: short s-maxage to keep panning/typing snappy without hammering
 * RDS. Rate limit reuses the existing in-memory bucket from /api/contact;
 * 60 reqs / IP / minute is generous for a debounced UI but blocks abuse.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
// Use the Spark-backed searchListings — matches the SSR /listings page
// (app/listings/page.tsx imports from lib/spark/search). The RDS-backed
// path in lib/listings-search points at mv_active_listings, which has
// been dropped from the analytics MV set; keeping the API on the same
// data source as the SSR initial fetch avoids divergent behavior on map
// pans / Load More.
import { searchListings } from '@/lib/spark/search';
import { checkRateLimit } from '@/lib/rate-limit';

const bboxSchema = z.object({
  minLng: z.number(),
  minLat: z.number(),
  maxLng: z.number(),
  maxLat: z.number(),
});

const polygonSchema = z.object({
  type: z.literal('Polygon'),
  // Ring(s) of [lng, lat] pairs. We don't enforce ring closure here — Postgres
  // will reject a malformed polygon and bubble up as a 500, which is acceptable
  // since the client always closes the ring before submitting.
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

const bodySchema = z.object({
  q: z.string().max(200).optional(),
  qField: z.enum(['any', 'address', 'community', 'city', 'zip']).optional(),
  bbox: bboxSchema.optional(),
  polygonGeoJSON: polygonSchema.optional(),
  status: z.array(z.enum(['Active', 'Coming Soon', 'Pending'])).optional(),
  homeTypes: z.array(z.enum(['house', 'condo', 'multi', 'land'])).optional(),
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
  bedsMin: z.number().int().nonnegative().optional(),
  bathsMin: z.number().int().nonnegative().optional(),
  sqftMin: z.number().nonnegative().optional(),
  sqftMax: z.number().nonnegative().optional(),
  lotAcresMin: z.number().nonnegative().optional(),
  lotAcresMax: z.number().nonnegative().optional(),
  yearBuiltMin: z.number().int().min(1700).max(2100).optional(),
  yearBuiltMax: z.number().int().min(1700).max(2100).optional(),
  garageMin: z.number().int().nonnegative().optional(),
  hasPool: z.boolean().optional(),
  hasSpa: z.boolean().optional(),
  hasWaterfront: z.boolean().optional(),
  hasHorse: z.boolean().optional(),
  singleStory: z.boolean().optional(),
  newConstruction: z.boolean().optional(),
  priceReduced: z.boolean().optional(),
  limit: z.number().int().positive().max(200).optional(),
  offset: z.number().int().nonnegative().optional(),
  sort: z
    .enum(['newest', 'price-asc', 'price-desc', 'sqft-desc', 'lot-desc', 'year-desc', 'dom-asc'])
    .optional(),
  cursor: z.string().max(256).optional(),
});

export async function POST(req: Request): Promise<Response> {
  const reqStart = performance.now();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = checkRateLimit(`listings-search:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.flatten() }, { status: 400 });
  }

  // Text-query override: when the visitor types in the search bar, the
  // text match wins over every attribute filter (price, beds, sqft, lot,
  // year, pool, etc.). Geographic scope (bbox / drawn polygon) and
  // listing status are preserved because the visitor is implicitly
  // saying "show me anything matching this within the area I'm looking
  // at." Without the override, a query like `silverleaf` while a $5M
  // price filter is active would return empty even though Silverleaf
  // homes exist above $5M.
  const data = parsed.data;
  const qTrimmed = (data.q ?? '').trim();
  const searchOpts = qTrimmed.length > 0
    ? {
        q: data.q,
        qField: data.qField,
        bbox: data.bbox,
        polygonGeoJSON: data.polygonGeoJSON,
        status: data.status,
        limit: data.limit,
        offset: data.offset,
        sort: data.sort,
        cursor: data.cursor,
      }
    : data;

  try {
    const dbStart = performance.now();
    const result = await searchListings(searchOpts);
    const dbMs = Math.round(performance.now() - dbStart);
    const totalMs = Math.round(performance.now() - reqStart);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
        'Server-Timing': `db;dur=${dbMs}, total;dur=${totalMs}`,
        // Signal whether the override fired so the client can surface a
        // "filters bypassed by search" hint if it wants to.
        'X-Search-Override': qTrimmed.length > 0 ? 'q-priority' : 'none',
      },
    });
  } catch (err) {
    console.error('listings.search.failed', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
