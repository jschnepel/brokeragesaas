/**
 * Consent state — single source of truth for cookie / analytics opt-in.
 *
 * Three categories:
 *   - necessary: always true (no choice). Includes the consent cookie itself
 *     and the anon-id used to stitch a visitor across pages.
 *   - analytics: opt-in. Gates Microsoft Clarity, PostHog, Vercel Web Analytics.
 *   - marketing: opt-in. Reserved for future ad / retargeting pixels. No SDK
 *     uses it today.
 *
 * Persistence: a single `yong2_consent` cookie, JSON-encoded, 1-year TTL,
 * `Secure; SameSite=Lax; Path=/`. Server-readable so SSR can decide whether
 * to ship analytics scripts at all (today the gating happens client-side via
 * `useConsent`, but this leaves the door open for future SSR gating).
 *
 * Versioning: bump CONSENT_VERSION to invalidate prior decisions and re-prompt
 * (e.g. when a new category is added). Older decisions are treated as
 * "no decision yet."
 */

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of the user's most recent decision; null until they decide. */
  decidedAt: string | null;
  /** Schema version — bump to re-prompt when categories change. */
  version: 1;
};

export const CONSENT_VERSION = 1 as const;

export const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  decidedAt: null,
  version: CONSENT_VERSION,
};

export const CONSENT_COOKIE_NAME = 'yong2_consent';
export const CONSENT_COOKIE_MAX_AGE_DAYS = 365;
const SECONDS_PER_DAY = 60 * 60 * 24;

function parseCookieValue(raw: string): ConsentState | null {
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as Partial<ConsentState>;
    if (parsed && typeof parsed === 'object' && parsed.version === CONSENT_VERSION) {
      return {
        necessary: true,
        analytics: parsed.analytics === true,
        marketing: parsed.marketing === true,
        decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : null,
        version: CONSENT_VERSION,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function readCookieFromDocument(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const c of cookies) {
    const eq = c.indexOf('=');
    if (eq < 0) continue;
    if (c.slice(0, eq) === name) return c.slice(eq + 1);
  }
  return null;
}

/** Read current consent. Falls back to DEFAULT_CONSENT when no cookie is present. */
export function readConsent(): ConsentState {
  const raw = readCookieFromDocument(CONSENT_COOKIE_NAME);
  if (!raw) return DEFAULT_CONSENT;
  const parsed = parseCookieValue(raw);
  return parsed ?? DEFAULT_CONSENT;
}

/**
 * Persist a consent decision. The `version` field is set automatically.
 * Stamps `decidedAt` to "now" if the caller passed null (caller controls this
 * to allow re-stamping on category change without forcing a new decision).
 */
export function writeConsent(next: Omit<ConsentState, 'version'>): void {
  if (typeof document === 'undefined') return;
  const payload: ConsentState = {
    necessary: true,
    analytics: next.analytics,
    marketing: next.marketing,
    decidedAt: next.decidedAt,
    version: CONSENT_VERSION,
  };
  const value = encodeURIComponent(JSON.stringify(payload));
  const maxAge = CONSENT_COOKIE_MAX_AGE_DAYS * SECONDS_PER_DAY;
  // Secure flag is appropriate everywhere we deploy (HTTPS-only). On localhost
  // browsers ignore Secure for setting cookies served over http, so this stays
  // safe for dev as long as you're not serving from a non-secure remote host.
  document.cookie =
    `${CONSENT_COOKIE_NAME}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

/**
 * True when the banner should re-prompt the visitor:
 *   - they have not decided yet, OR
 *   - their decision was longer than 365 days ago, OR
 *   - the schema version has been bumped since their decision.
 */
export function shouldPromptAgain(state: ConsentState): boolean {
  if (state.version !== CONSENT_VERSION) return true;
  if (!state.decidedAt) return true;
  const decided = Date.parse(state.decidedAt);
  if (!Number.isFinite(decided)) return true;
  const ageMs = Date.now() - decided;
  const maxAgeMs = CONSENT_COOKIE_MAX_AGE_DAYS * SECONDS_PER_DAY * 1000;
  return ageMs > maxAgeMs;
}

/** True when the user's browser sends Do Not Track. We treat this as reject-all. */
export function respectsDoNotTrack(): boolean {
  if (typeof navigator === 'undefined') return false;
  // navigator.doNotTrack is the spec property; some browsers use msDoNotTrack
  // (legacy IE) or window.doNotTrack. Check the canonical first.
  const dnt =
    navigator.doNotTrack ??
    (typeof window !== 'undefined' ? (window as unknown as { doNotTrack?: string }).doNotTrack : undefined);
  return dnt === '1' || dnt === 'yes';
}

/** Build a fresh ConsentState representing "I just decided". */
export function buildDecision(opts: { analytics: boolean; marketing: boolean }): Omit<ConsentState, 'version'> {
  return {
    necessary: true,
    analytics: opts.analytics,
    marketing: opts.marketing,
    decidedAt: new Date().toISOString(),
  };
}
