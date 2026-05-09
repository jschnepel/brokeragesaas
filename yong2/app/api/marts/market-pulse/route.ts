/**
 * GET /api/marts/market-pulse?scope_type=region&scope_key=north-scottsdale&segment=all&month=2026-04-01
 *
 * Returns one fct_market_pulse row (or 404 if not found). Reads the dbt
 * mart Parquet from S3, filters by scope dimensions, and returns the row
 * as JSON.
 *
 * Defaults: scope=metro/phoenix_metro, segment=all, month=current month.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  filterScope,
  readMartByScope,
  type MarketPulseRow,
  type PropertySegment,
  type ScopeType,
} from '@/lib/marts';

const VALID_SCOPES: ScopeType[] = ['metro', 'region', 'community', 'subdivision', 'zipcode'];
const VALID_SEGMENTS: PropertySegment[] = ['all', 'residential', 'land'];

// 1h ISR aligned with dbt schedule. CloudFront edge-caches the upstream
// Parquet bytes; Next.js edge-caches this JSON response. Two-tier cache
// → sub-100ms warm even on cold Lambda hits.
export const revalidate = 3600;

function currentMonthFirst(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope_type = (searchParams.get('scope_type') ?? 'metro') as ScopeType;
  const scope_key = searchParams.get('scope_key') ?? 'phoenix_metro';
  const segment = (searchParams.get('segment') ?? 'all') as PropertySegment;
  const month = searchParams.get('month') ?? currentMonthFirst();

  if (!VALID_SCOPES.includes(scope_type)) {
    return NextResponse.json({ error: `invalid scope_type "${scope_type}"` }, { status: 400 });
  }
  if (!VALID_SEGMENTS.includes(segment)) {
    return NextResponse.json({ error: `invalid segment "${segment}"` }, { status: 400 });
  }

  // Parquet DATE columns come back as JS Date objects from hyparquet.
  // Normalize to YYYY-MM-DD for comparison.
  const isoMonth = (m: unknown): string => {
    if (m instanceof Date) return m.toISOString().slice(0, 10);
    if (typeof m === 'string') return m.slice(0, 10);
    if (typeof m === 'number') return new Date(m).toISOString().slice(0, 10);
    return String(m);
  };
  const monthPrefix = month.slice(0, 7); // YYYY-MM

  try {
    const rows = await readMartByScope<MarketPulseRow>('fct_market_pulse', scope_type);
    const filtered = filterScope(rows, { scope_type, scope_key, property_segment: segment });
    const match = filtered.find((r) => isoMonth(r.month).startsWith(monthPrefix));
    if (!match) {
      return NextResponse.json(
        {
          error: 'no row',
          query: { scope_type, scope_key, segment, month },
          rows_in_scope: filtered.length,
          most_recent_month: filtered.length
            ? filtered.map((r) => isoMonth(r.month)).sort().slice(-1)[0]
            : null,
        },
        {
          status: 404,
          // 404 also cacheable — same input, same answer until next dbt run.
          headers: {
            'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
          },
        },
      );
    }
    // Serialize Date columns to ISO strings; hyparquet returns Decimals as BigInt.
    const serializable: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(match)) {
      if (v instanceof Date) serializable[k] = v.toISOString();
      else if (typeof v === 'bigint') serializable[k] = Number(v);
      else serializable[k] = v;
    }
    // Explicit Cache-Control so Amplify's CDN edge-caches the JSON response.
    // s-maxage=3600 → CDN stores 1h. stale-while-revalidate=86400 → CDN can
    // serve stale for up to 24h while it re-fetches in the background, so
    // even the dbt refresh window stays sub-100ms TTFB for users.
    return NextResponse.json(
      {
        query: { scope_type, scope_key, segment, month },
        data: serializable,
        meta: { rows_in_mart: rows.length, rows_in_scope: filtered.length },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
          'CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'server error', message: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
