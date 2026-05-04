import { NextResponse, type NextRequest } from 'next/server';
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_TTL_DAYS,
  attributionChanged,
  deriveTouch,
  mergeAttribution,
  parseAttributionCookie,
  serializeAttributionCookie,
} from '@/lib/analytics/attribution';

/**
 * Edge middleware — owns the `yong2_attr` first-touch + last-touch cookie.
 *
 * Why server-side and not client-side:
 *   - Safari ITP caps JS-set first-party cookies at 7 days, so a luxury-buyer
 *     consideration cycle of 1–6 months would lose first-touch attribution
 *     on Safari users without server-set cookies. Set-Cookie from middleware
 *     dodges that cap entirely.
 *   - Server-set cookies are HttpOnly-eligible. We keep this one readable
 *     from JS so the contact form can include attribution in its POST body
 *     even if the network request races the cookie write — but the option
 *     to flip HttpOnly later is preserved.
 *
 * Consent gate:
 *   The `yong2_consent` cookie is set client-side by the cookie banner. If
 *   the user has declined analytics, we skip the touch entirely. We never
 *   write tracking state for visitors who have refused.
 *
 * Performance:
 *   - Skips static asset paths via the `matcher` config below — Next/image,
 *     /_next/static, public/* are excluded.
 *   - Only writes Set-Cookie when the merged attribution differs from the
 *     existing cookie. Internal navigations on a returning visitor are a
 *     pure passthrough.
 */
export function middleware(req: NextRequest): NextResponse {
  const consentRaw = req.cookies.get('yong2_consent')?.value;
  if (!hasAnalyticsConsent(consentRaw)) {
    return NextResponse.next();
  }

  const url = new URL(req.url);
  const referrer = req.headers.get('referer');
  const now = Date.now();
  const touch = deriveTouch({ url, referrer, nowMs: now });

  const prev = parseAttributionCookie(req.cookies.get(ATTRIBUTION_COOKIE)?.value);
  const next = mergeAttribution(prev, touch);
  if (!attributionChanged(prev, next)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  res.cookies.set({
    name: ATTRIBUTION_COOKIE,
    value: serializeAttributionCookie(next),
    maxAge: ATTRIBUTION_TTL_DAYS * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    secure: true,
    httpOnly: false,
  });
  return res;
}

function hasAnalyticsConsent(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as { analytics?: boolean; version?: number };
    return parsed.version === 1 && parsed.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Match every request EXCEPT:
 *   - /_next/* (build assets, image optimizer, HMR)
 *   - /api/* (API routes — no need to set cookies on machine-to-machine paths;
 *            the contact route reads the existing cookie via req.cookies)
 *   - Static assets with file extensions
 *   - favicon, robots, sitemap
 */
export const config = {
  matcher: ['/((?!_next/|api/|favicon|robots|sitemap|opengraph-image|.*\\..*).*)'],
};
