/**
 * Anonymous visitor ID — used by P2 to stitch a session back to a converted
 * lead (e.g. when someone fills the contact form, the prior pageviews under
 * the same anon id can be linked).
 *
 * Storage rules:
 *   - When `consent.analytics === true` we persist a UUIDv4 in the
 *     `yong2_anon_id` cookie for 365 days.
 *   - When `consent.analytics === false` we return an ephemeral session-only
 *     id (kept in module memory) that is *not* persisted. This keeps the
 *     surface uniform for callers without dropping a tracking cookie.
 */

const ANON_ID_COOKIE = 'yong2_anon_id';
const ANON_ID_MAX_AGE_DAYS = 365;
const SECONDS_PER_DAY = 60 * 60 * 24;

let ephemeralId: string | null = null;

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback — RFC4122 v4 from Math.random. Acceptable for analytics ID;
  // this branch only runs in old browsers without crypto.randomUUID.
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else if (i === 14) {
      out += '4';
    } else if (i === 19) {
      const r = Math.floor(Math.random() * 16);
      out += ((r & 0x3) | 0x8).toString(16);
    } else {
      out += Math.floor(Math.random() * 16).toString(16);
    }
  }
  return out;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const c of cookies) {
    const eq = c.indexOf('=');
    if (eq < 0) continue;
    if (c.slice(0, eq) === name) return c.slice(eq + 1);
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === 'undefined') return;
  const maxAge = maxAgeDays * SECONDS_PER_DAY;
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

function clearCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
}

/**
 * Return the persisted anon id when consent allows it, otherwise an
 * ephemeral per-session id. Generates + persists on first call when needed.
 */
export function getOrCreateAnonId(opts: { analyticsConsent: boolean }): string {
  if (opts.analyticsConsent) {
    const existing = readCookie(ANON_ID_COOKIE);
    if (existing) return existing;
    const fresh = generateUuidV4();
    writeCookie(ANON_ID_COOKIE, fresh, ANON_ID_MAX_AGE_DAYS);
    return fresh;
  }
  if (!ephemeralId) ephemeralId = generateUuidV4();
  return ephemeralId;
}

/** Drop both the persisted anon id and the in-memory ephemeral id. */
export function clearAnonId(): void {
  clearCookie(ANON_ID_COOKIE);
  ephemeralId = null;
}
