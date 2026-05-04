import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic — returns the *names* of env vars visible to the SSR runtime
 * (and a redacted indicator of whether RDS_DATABASE_URL has a value).
 * No values are leaked. Intended to be removed once env wiring is verified.
 */
export async function GET(): Promise<Response> {
  const keys = Object.keys(process.env).sort();
  const interesting = keys.filter((k) =>
    /^(RDS_|NEXT_PUBLIC_|AMPLIFY_|AWS_|NODE_|RESEND_|CONTACT_|NEXT_PUBLIC_)/.test(k),
  );
  const rdsHasValue = !!process.env.RDS_DATABASE_URL;
  const rdsPrefix = rdsHasValue
    ? (process.env.RDS_DATABASE_URL ?? '').slice(0, 12)
    : null;
  return NextResponse.json(
    {
      totalKeys: keys.length,
      interesting,
      rdsHasValue,
      rdsPrefix,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
