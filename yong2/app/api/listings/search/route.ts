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
import { SparkApiError, SparkTimeoutError } from '@/lib/spark/client';
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
  qField: z.enum(['any', 'address', 'community', 'city', 'zip', 'mls']).optional(),
  bbox: bboxSchema.optional(),
  polygonGeoJSON: polygonSchema.optional(),
  status: z.array(z.enum(['Active', 'Coming Soon', 'Pending'])).optional(),
  homeTypes: z.array(z.enum(['house', 'condo', 'multi', 'land'])).optional(),
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
  bedsMin: z.number().int().nonnegative().optional(),
  bathsMin: z.number().int().nonnegative().optional(),
  // City allowlist from the autocomplete dropdown. Up to 40 — the
  // picker UI multi-selects against ~200 known cities; >40 is a clear
  // no-op, cap to stay defensive.
  cities: z.array(z.string().min(1).max(80)).max(40).optional(),
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

  // Scoping-intent override: when the visitor expresses an explicit
  // scope (text query OR a hand-drawn polygon), the scope wins over
  // every attribute filter (price, beds, sqft, lot, year, pool,
  // home-types, etc.). The intent in both cases is the same — "show
  // me anything inside this scope" — so the API treats them
  // identically.
  //
  // Bbox alone is NOT a scoping intent: bbox is the implicit "current
  // viewport" that arrives with every map pan, so respecting filters
  // inside bbox is the expected default. Listing status is always
  // preserved because Active/Coming Soon/Pending is the inventory
  // contract, not an attribute filter.
  //
  // Without the override, drawing a circle while default home-types
  // = [house, condo] is active would silently exclude land and multi-
  // family inside the shape; and typing `silverleaf` with a $5M price
  // ceiling would return empty even though Silverleaf homes exist
  // above $5M.
  const data = parsed.data;
  const qTrimmed = (data.q ?? '').trim();
  const hasTextQuery = qTrimmed.length > 0;
  const hasPolygon = data.polygonGeoJSON != null;
  const hasScopingIntent = hasTextQuery || hasPolygon;

  // When scoping intent is present we also lift the default 60-row
  // page cap to the schema max (200), because the visitor's
  // expectation is "every match in this scope" — pagination cards
  // truncating to 60 reads as missing inventory. Pins are already
  // capped at 1000 inside searchListings, so the map experience
  // stays honest.
  const searchOpts = hasScopingIntent
    ? {
        q: data.q,
        qField: data.qField,
        bbox: data.bbox,
        polygonGeoJSON: data.polygonGeoJSON,
        status: data.status,
        limit: Math.max(data.limit ?? 60, 200),
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
    const overrideTag = hasTextQuery && hasPolygon
      ? 'q+polygon'
      : hasTextQuery
        ? 'q-priority'
        : hasPolygon
          ? 'polygon-priority'
          : 'none';
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
        'Server-Timing': `db;dur=${dbMs}, total;dur=${totalMs}`,
        // Signal whether the override fired so the client can surface a
        // "filters bypassed by search" hint if it wants to.
        'X-Search-Override': overrideTag,
      },
    });
  } catch (err) {
    // Distinguish Spark timeouts from generic failures. 503 lets the
    // client render "Search is taking longer than usual" instead of a
    // generic error — and tells caches not to memoize the failure.
    if (err instanceof SparkTimeoutError) {
      console.warn('listings.search.timeout', err.message);
      return NextResponse.json(
        { error: 'search_timeout' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (err instanceof SparkApiError) {
      console.warn('listings.search.spark_error', { status: err.status, message: err.message });
      // Bubble Spark's 5xx/429 status to the caller untranslated; 4xx
      // payload errors collapse to a 502 since they indicate a server-
      // side bug, not a client problem.
      const status = err.status >= 500 || err.status === 429 ? err.status : 502;
      return NextResponse.json(
        { error: 'spark_error', upstream_status: err.status },
        { status, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    console.error('listings.search.failed', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
