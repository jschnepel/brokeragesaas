import { NextResponse } from 'next/server';
import { z } from 'zod';
import { type EnrichedContext, sendContactMessage } from '@/lib/contact';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  ATTRIBUTION_COOKIE,
  parseAttributionCookie,
} from '@/lib/analytics/attribution';
import { type Behavior, scoreLead } from '@/lib/analytics/lead-score';
import { CONTACT_DISCLOSURE } from '@/content/legal';

const sessionSchema = z
  .object({
    id: z.string().nullable().optional(),
    pageCount: z.number().int().nonnegative().optional(),
    stepN: z.number().int().nonnegative().optional(),
    activeMs: z.number().int().nonnegative().optional(),
    totalMs: z.number().int().nonnegative().optional(),
    maxScrollPct: z.number().int().min(0).max(100).optional(),
    landingPath: z.string().max(2048).nullable().optional(),
    exitPath: z.string().max(2048).nullable().optional(),
  })
  .optional();

const behaviorSchema = z
  .object({
    sessionCount: z.number().int().nonnegative().optional(),
    spanDays: z.number().nonnegative().optional(),
    uniqueListingViews: z.number().int().nonnegative().optional(),
    maxListingPrice: z.number().nonnegative().optional(),
    minPriceFilter: z.number().nonnegative().optional(),
    favoritedAny: z.boolean().optional(),
  })
  .optional();

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(1).max(40),
  interest: z.enum(['Buying', 'Selling', 'Both']),
  message: z.string().min(1).max(4000),
  website: z.string().optional(), // honeypot
  // Optional enrichment posted from the client. Server falls back to safe
  // defaults when these are absent so the route stays compatible with simple
  // POST tests and any future caller that doesn't send them.
  session: sessionSchema,
  behavior: behaviorSchema,
  // Compliance metadata. The visitor sees CONTACT_DISCLOSURE on the form;
  // we capture their submission timestamp and any SMS opt-in. The server
  // re-attaches the canonical disclosure text from content/legal.ts so a
  // tampered client cannot misreport what the visitor agreed to.
  smsConsent: z.boolean().optional(),
  consentTimestamp: z.string().optional(),
});

export async function POST(req: Request): Promise<Response> {
  const reqStart = performance.now();
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    const totalMs = Math.round(performance.now() - reqStart);
    return NextResponse.json(
      { ok: true },
      { headers: { 'Server-Timing': `total;dur=${totalMs}` } },
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = req.headers.get('user-agent') ?? 'unknown';
  const rl = checkRateLimit(ip, 10, 3600_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Read attribution + identity from request cookies. The middleware sets
  // yong2_attr server-side; yong2_anon_id is set client-side after consent.
  const cookieHeader = req.headers.get('cookie') ?? '';
  const cookies = parseCookieHeader(cookieHeader);
  const attribution = parseAttributionCookie(cookies.get(ATTRIBUTION_COOKIE));
  const anonId = cookies.get('yong2_anon_id') ?? null;

  // Score the lead. The schemas above default missing pieces to zero so the
  // rubric still produces a reasonable signal even when the form posts a
  // bare body.
  const sess = parsed.data.session ?? {};
  const beh = parsed.data.behavior ?? {};
  const behavior: Behavior = {
    sessionCount: beh.sessionCount ?? 1,
    spanDays: beh.spanDays ?? 0,
    uniqueListingViews: beh.uniqueListingViews ?? 0,
    maxListingPrice: beh.maxListingPrice ?? 0,
    minPriceFilter: beh.minPriceFilter ?? 0,
    favoritedAny: beh.favoritedAny ?? false,
    activeMs: sess.activeMs ?? 0,
  };
  const score = scoreLead({
    form: {
      email: parsed.data.email,
      phone: parsed.data.phone,
      interest: parsed.data.interest,
      message: parsed.data.message,
    },
    attribution,
    behavior,
  });

  const ctx: EnrichedContext = {
    score,
    attribution,
    session: {
      id: sess.id ?? null,
      pageCount: sess.pageCount ?? 0,
      stepN: sess.stepN ?? 0,
      activeMs: sess.activeMs ?? 0,
      totalMs: sess.totalMs ?? 0,
      maxScrollPct: sess.maxScrollPct ?? 0,
      landingPath: sess.landingPath ?? null,
      exitPath: sess.exitPath ?? null,
    },
    anonId,
    consent: {
      // Canonical disclosure text — re-attached server-side so tampered
      // clients can't misreport what the visitor saw.
      disclosureText: CONTACT_DISCLOSURE,
      smsOptIn: parsed.data.smsConsent === true,
      capturedAt: parsed.data.consentTimestamp ?? new Date().toISOString(),
      ip,
      userAgent,
    },
  };

  const sendStart = performance.now();
  try {
    await sendContactMessage(
      {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        interest: parsed.data.interest,
        message: parsed.data.message,
      },
      ctx,
    );
  } catch (err) {
    console.error('contact.send_failed', err);
    return NextResponse.json({ error: 'Unable to send' }, { status: 500 });
  }

  const sendMs = Math.round(performance.now() - sendStart);
  const totalMs = Math.round(performance.now() - reqStart);
  return NextResponse.json(
    { ok: true, score: score.total, band: score.band },
    {
      headers: {
        'Server-Timing': `send;dur=${sendMs}, total;dur=${totalMs}`,
      },
    },
  );
}

function parseCookieHeader(header: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!header) return out;
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (k) out.set(k, v);
  }
  return out;
}
