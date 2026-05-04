/**
 * First-touch + last-touch attribution.
 *
 * One cookie (`yong2_attr`) carries two touches as JSON:
 *   - first: the original landing — written once, never overwritten.
 *   - last:  the most recent campaign-flagged landing — overwritten when a
 *            visitor lands again with utm params, a click id (gclid/fbclid/
 *            msclkid/ttclid), OR a non-direct referrer. Direct loads (typed
 *            URL, bookmark, internal nav) do NOT replace `last` — that would
 *            wipe the most recent ad-platform attribution every time someone
 *            re-opens the tab.
 *
 * The cookie is written server-side from Next.js middleware on the apex
 * domain. That side-steps Safari ITP's 7-day cap on JS-set first-party
 * cookies and lets the cookie outlive the typical luxury consideration cycle
 * (180 days).
 *
 * Attribution math (first/last/multi-touch weighting) happens at query time
 * over event data, not here. This module only preserves the raw touches —
 * single-model attribution welded to your storage layer is a one-way trip
 * we explicitly avoid.
 *
 * Channel taxonomy (kept narrow on purpose):
 *   paid_search    — gclid or msclkid present, or utm_medium=cpc|paid|sem
 *   paid_social    — fbclid or ttclid present, or utm_medium=paid_social
 *   organic_search — referrer host is a known search engine
 *   social         — referrer host is a known social network (no click id)
 *   referral       — any other off-site referrer
 *   email          — utm_medium=email
 *   direct         — no referrer, no utm, no click id
 *   unknown        — everything else (e.g. utm with unrecognized medium)
 */

export const ATTRIBUTION_COOKIE = 'yong2_attr';
export const ATTRIBUTION_TTL_DAYS = 180;
export const ATTRIBUTION_VERSION = 1 as const;

export type Channel =
  | 'paid_search'
  | 'paid_social'
  | 'organic_search'
  | 'social'
  | 'referral'
  | 'email'
  | 'direct'
  | 'unknown';

export type Touch = {
  ts: number;
  channel: Channel;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  referrer: string | null;
  landing: string;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  ttclid: string | null;
};

export type Attribution = {
  v: typeof ATTRIBUTION_VERSION;
  first: Touch;
  last: Touch;
};

const SEARCH_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'bing.com',
  'www.bing.com',
  'duckduckgo.com',
  'www.duckduckgo.com',
  'search.yahoo.com',
  'yahoo.com',
  'baidu.com',
  'www.baidu.com',
  'ecosia.org',
  'kagi.com',
  'startpage.com',
]);

const SOCIAL_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'l.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'l.instagram.com',
  'linkedin.com',
  'www.linkedin.com',
  'lnkd.in',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  't.co',
  'reddit.com',
  'www.reddit.com',
  'pinterest.com',
  'www.pinterest.com',
  'tiktok.com',
  'www.tiktok.com',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
]);

function strOrNull(v: string | null | undefined): string | null {
  if (!v) return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hostFromReferrer(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Parse a landing URL + referrer into a Touch. Pure function — no I/O.
 *
 * Order of precedence for channel inference:
 *   1. Click IDs (paid platforms send these even when utm is missing)
 *   2. utm_medium (advertiser declared the channel)
 *   3. Referrer host (known search/social mappings)
 *   4. Direct (no signal)
 */
export function deriveTouch(opts: { url: URL; referrer: string | null; nowMs: number }): Touch {
  const params = opts.url.searchParams;
  const gclid = strOrNull(params.get('gclid'));
  const fbclid = strOrNull(params.get('fbclid'));
  const msclkid = strOrNull(params.get('msclkid'));
  const ttclid = strOrNull(params.get('ttclid'));
  const utmSource = strOrNull(params.get('utm_source'));
  const utmMedium = strOrNull(params.get('utm_medium'));
  const utmCampaign = strOrNull(params.get('utm_campaign'));
  const utmTerm = strOrNull(params.get('utm_term'));
  const utmContent = strOrNull(params.get('utm_content'));

  const referrer = strOrNull(opts.referrer);
  const refHost = hostFromReferrer(referrer);
  const reqHost = opts.url.hostname.toLowerCase();
  // Strip same-origin referrers — internal navs aren't touches.
  const externalReferrer = refHost && refHost !== reqHost ? referrer : null;
  const externalRefHost = externalReferrer ? hostFromReferrer(externalReferrer) : null;

  let channel: Channel;
  let source: string | null;
  let medium: string | null = utmMedium;

  if (gclid) {
    channel = 'paid_search';
    source = utmSource ?? 'google';
    medium = utmMedium ?? 'cpc';
  } else if (msclkid) {
    channel = 'paid_search';
    source = utmSource ?? 'bing';
    medium = utmMedium ?? 'cpc';
  } else if (fbclid) {
    channel = 'paid_social';
    source = utmSource ?? 'facebook';
    medium = utmMedium ?? 'paid_social';
  } else if (ttclid) {
    channel = 'paid_social';
    source = utmSource ?? 'tiktok';
    medium = utmMedium ?? 'paid_social';
  } else if (utmMedium === 'email') {
    channel = 'email';
    source = utmSource ?? 'email';
  } else if (utmMedium === 'cpc' || utmMedium === 'paid' || utmMedium === 'sem') {
    channel = 'paid_search';
    source = utmSource ?? null;
  } else if (utmMedium === 'paid_social' || utmMedium === 'social_paid') {
    channel = 'paid_social';
    source = utmSource ?? null;
  } else if (utmSource) {
    // Advertiser declared a source but no channel-specific medium — best
    // guess from the source name + referrer.
    if (externalRefHost && SEARCH_HOSTS.has(externalRefHost)) {
      channel = 'organic_search';
      source = utmSource;
    } else if (externalRefHost && SOCIAL_HOSTS.has(externalRefHost)) {
      channel = 'social';
      source = utmSource;
    } else {
      channel = 'unknown';
      source = utmSource;
    }
  } else if (externalRefHost && SEARCH_HOSTS.has(externalRefHost)) {
    channel = 'organic_search';
    source = externalRefHost.replace(/^www\./, '').split('.')[0] ?? 'search';
    medium = medium ?? 'organic';
  } else if (externalRefHost && SOCIAL_HOSTS.has(externalRefHost)) {
    channel = 'social';
    source = externalRefHost.replace(/^www\./, '').split('.')[0] ?? 'social';
    medium = medium ?? 'social';
  } else if (externalRefHost) {
    channel = 'referral';
    source = externalRefHost;
    medium = medium ?? 'referral';
  } else {
    channel = 'direct';
    source = null;
  }

  return {
    ts: opts.nowMs,
    channel,
    source,
    medium,
    campaign: utmCampaign,
    term: utmTerm,
    content: utmContent,
    referrer: externalReferrer,
    landing: opts.url.pathname + (opts.url.search || ''),
    gclid,
    fbclid,
    msclkid,
    ttclid,
  };
}

/**
 * True when the touch carries advertiser-declared signal (utm) or a paid
 * click ID. Used by the merge rule — a campaign touch always replaces `last`,
 * a non-campaign direct/internal touch never does.
 */
export function isCampaignTouch(touch: Touch): boolean {
  return Boolean(
    touch.gclid ||
      touch.fbclid ||
      touch.msclkid ||
      touch.ttclid ||
      touch.source ||
      touch.campaign ||
      touch.medium,
  );
}

export function isDirect(touch: Touch): boolean {
  return touch.channel === 'direct';
}

/**
 * Merge a fresh touch into the visitor's running attribution state.
 *
 * Rules:
 *   - prev null → seed both first and last with the new touch.
 *   - prev exists but version mismatch or first.ts > 180d old → reseed
 *     (treat as a brand-new visitor — old attribution has expired).
 *   - prev exists and fresh:
 *       * first stays (immutable for the cookie's lifetime).
 *       * last is replaced when the new touch is a campaign touch (utm
 *         params or a click id) OR when the new touch is non-direct (a
 *         known off-site referrer is more attributable than nothing).
 *       * pure direct loads (no signal at all) leave last alone.
 */
export function mergeAttribution(prev: Attribution | null, next: Touch): Attribution {
  const ttlMs = ATTRIBUTION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const expired = !prev || prev.v !== ATTRIBUTION_VERSION || next.ts - prev.first.ts > ttlMs;
  if (expired) {
    return { v: ATTRIBUTION_VERSION, first: next, last: next };
  }
  const shouldReplaceLast = isCampaignTouch(next) || !isDirect(next);
  return {
    v: ATTRIBUTION_VERSION,
    first: prev.first,
    last: shouldReplaceLast ? next : prev.last,
  };
}

/**
 * Parse a `yong2_attr` cookie value. Tries raw JSON first (Next's
 * `req.cookies.get(...).value` returns values URL-decoded already), falls
 * back to a single decodeURIComponent pass for callers that read the raw
 * `Cookie:` header. Returns null on any shape mismatch.
 */
export function parseAttributionCookie(raw: string | null | undefined): Attribution | null {
  if (!raw) return null;
  const candidates = [raw];
  try {
    candidates.push(decodeURIComponent(raw));
  } catch {
    // raw contained an invalid escape sequence — try the bare value only.
  }
  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c) as Partial<Attribution>;
      if (
        parsed &&
        parsed.v === ATTRIBUTION_VERSION &&
        parsed.first &&
        typeof parsed.first.ts === 'number' &&
        parsed.last &&
        typeof parsed.last.ts === 'number'
      ) {
        return parsed as Attribution;
      }
    } catch {
      // fall through to the next candidate
    }
  }
  return null;
}

/**
 * Serialize an Attribution for storage. Returns plain JSON — the caller is
 * expected to use Next's response.cookies API, which URL-encodes the value
 * for the wire automatically. Manual encoding here would double-encode.
 */
export function serializeAttributionCookie(attr: Attribution): string {
  return JSON.stringify(attr);
}

/**
 * True when the merged result differs materially from the previous state —
 * used by middleware to skip Set-Cookie when nothing changed (avoids spamming
 * response headers on every internal nav).
 */
export function attributionChanged(prev: Attribution | null, next: Attribution): boolean {
  if (!prev) return true;
  if (prev.first.ts !== next.first.ts) return true;
  if (prev.last.ts !== next.last.ts) return true;
  return false;
}
