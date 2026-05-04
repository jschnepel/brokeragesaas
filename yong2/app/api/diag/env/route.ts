import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic — returns the *names* of env vars visible to the SSR runtime
 * (and a redacted indicator of whether RDS_DATABASE_URL has a value).
 * Also probes MV inventory + listings trial query so we can pinpoint why
 * /api/listings/search 500s. No values are leaked.
 */
export async function GET(): Promise<Response> {
  const keys = Object.keys(process.env).sort();
  const interesting = keys.filter((k) =>
    /^(RDS_|NEXT_PUBLIC_|AMPLIFY_|AWS_|NODE_|RESEND_|CONTACT_)/.test(k),
  );
  const rdsHasValue = !!process.env.RDS_DATABASE_URL;
  const rdsPrefix = rdsHasValue
    ? (process.env.RDS_DATABASE_URL ?? '').slice(0, 12)
    : null;

  let mvList: string[] | null = null;
  let mvActiveExists: boolean | null = null;
  let listingsTrialError: string | null = null;
  try {
    const pool = getPool();
    const mvs = await pool.query<{ relname: string }>(
      "SELECT relname FROM pg_class WHERE relkind='m' AND relname LIKE 'mv_%' ORDER BY relname",
    );
    mvList = mvs.rows.map((r) => r.relname);
    mvActiveExists = mvList.includes('mv_active_listings');
    try {
      await pool.query('SELECT 1 FROM mv_active_listings LIMIT 1');
    } catch (e) {
      listingsTrialError = e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 240) : String(e);
    }
  } catch (e) {
    listingsTrialError = `pool: ${e instanceof Error ? e.message : String(e)}`.slice(0, 240);
  }

  return NextResponse.json(
    {
      totalKeys: keys.length,
      interesting,
      rdsHasValue,
      rdsPrefix,
      mvList,
      mvActiveExists,
      listingsTrialError,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
