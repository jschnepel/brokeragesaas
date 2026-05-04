/**
 * GET /api/health — liveness probe for external uptime monitors.
 * Returns 200 with `{ ok: true, ... }` when RDS is reachable, 503 otherwise.
 * Includes DB latency and a representative MV freshness timestamp so the
 * monitor can also alert on stale aggregates, not just process liveness.
 */

import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const start = performance.now();
  let dbLatencyMs: number | null = null;
  let dbOk = false;
  let mvFreshness: string | null = null;

  try {
    const pool = getPool();
    const dbStart = performance.now();
    await pool.query('SELECT 1');
    dbLatencyMs = Math.round(performance.now() - dbStart);
    dbOk = true;

    // MV freshness — pick a representative MV. Skip if not present.
    try {
      const r = await pool.query<{ latest: string | null }>(
        `SELECT to_char(MAX(month), 'YYYY-MM-DD') as latest FROM mv_market_pulse`,
      );
      mvFreshness = r.rows[0]?.latest ?? null;
    } catch {
      /* MV may be unavailable; not fatal */
    }
  } catch (err) {
    const totalMs = Math.round(performance.now() - start);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'unknown',
        uptimeSec: Math.round(process.uptime()),
        latencyMs: totalMs,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Server-Timing': `total;dur=${totalMs}`,
        },
      },
    );
  }

  const totalMs = Math.round(performance.now() - start);
  return NextResponse.json(
    {
      ok: true,
      db: { ok: dbOk, latencyMs: dbLatencyMs },
      mvFreshness,
      uptimeSec: Math.round(process.uptime()),
      latencyMs: totalMs,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Server-Timing': `db;dur=${dbLatencyMs ?? 0}, total;dur=${totalMs}`,
      },
    },
  );
}
