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
import { searchListings } from '@/lib/listings-search';
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
  bbox: bboxSchema.optional(),
  polygonGeoJSON: polygonSchema.optional(),
  status: z.array(z.enum(['Active', 'Coming Soon', 'Pending'])).optional(),
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
  bedsMin: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(200).optional(),
  offset: z.number().int().nonnegative().optional(),
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

  try {
    const dbStart = performance.now();
    const result = await searchListings(parsed.data);
    const dbMs = Math.round(performance.now() - dbStart);
    const totalMs = Math.round(performance.now() - reqStart);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
        'Server-Timing': `db;dur=${dbMs}, total;dur=${totalMs}`,
      },
    });
  } catch (err) {
    console.error('listings.search.failed', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
