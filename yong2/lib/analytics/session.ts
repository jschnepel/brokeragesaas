/**
 * Session-path tracking — every visitor's journey from landing to exit.
 *
 * A "session" is a single browsing burst. We open one when the visitor lands
 * with no live session, and close it after 30 minutes of total inactivity (no
 * pageviews, no interactions, no visibility-change-to-visible). Every event
 * the site fires inherits the current session_id and the running step counter,
 * so PostHog's path/funnel/sankey reports light up automatically and we can
 * reconstruct any visitor's exact route after the fact.
 *
 * Sessions are per-tab (matches GA4 semantics — opening yong2 in a new tab
 * is a new "arrival" worth tracking as its own journey). Cross-tab continuity
 * is preserved at the visitor level via `yong2_anon_id`; the session is the
 * narrower unit.
 *
 * Storage
 * -------
 *   - Cookie `yong2_sess` (90-day TTL, server-readable): a snapshot of the
 *     most-recent session's id + startedAt + landing. Server-side route
 *     handlers (e.g. /api/contact) read this so a form submission can be
 *     correlated to the visitor's current session without trusting the
 *     client to send it. The cookie is NOT a resume source — opening a new
 *     tab always starts a new session, even when the cookie is fresh.
 *   - sessionStorage `yong2_sess_state` (per-tab): the live session state —
 *     id, startedAt, landing, stepN, pageviewCount, lastActivityAt, activeMs,
 *     activeUpdatedAt, maxScrollPct, exitPathname. This is the source of
 *     truth within a tab. Cleared on tab close (browser owns the lifecycle).
 *
 * Active-time accounting
 * ----------------------
 * `activeMs` excludes idle gaps and background-tab time. Algorithm:
 *   on every activity tick (mousemove/keydown/scroll/click/touchstart/visible):
 *     gap = now - activeUpdatedAt
 *     if document.visibilityState === 'visible' AND gap < IDLE_THRESHOLD_MS:
 *       activeMs += gap
 *     activeUpdatedAt = now
 * That treats any pause longer than 30s, or any time the tab was backgrounded,
 * as not-active. Total elapsed (now − startedAt) is reported separately.
 *
 * Consent
 * -------
 * Persistence is gated on `analyticsConsent`. When consent is denied we still
 * return an in-memory session id so the rest of the tracking surface keeps a
 * stable handle within the page lifetime, but no cookie or sessionStorage
 * writes happen and the session evaporates on tab close.
 */

const SESSION_COOKIE = 'yong2_sess';
const SESSION_STATE_KEY = 'yong2_sess_state';
const SESSION_TTL_DAYS = 90;
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const IDLE_THRESHOLD_MS = 30 * 1000;
const SECONDS_PER_DAY = 60 * 60 * 24;

export type SessionLanding = {
  pathname: string;
  search: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
};

export type SessionDurable = {
  id: string;
  startedAt: number;
  landing: SessionLanding;
};

export type SessionState = {
  pageviewCount: number;
  stepN: number;
  lastActivityAt: number;
  activeMs: number;
  activeUpdatedAt: number;
  maxScrollPct: number;
  exitPathname: string;
};

export type Session = SessionDurable & SessionState;

let inMemorySession: Session | null = null;

function nowMs(): number {
  return Date.now();
}

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
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
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

function clearCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
}

function readDurableFromCookie(): SessionDurable | null {
  const raw = readCookie(SESSION_COOKIE);
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as Partial<SessionDurable>;
    if (!parsed.id || typeof parsed.startedAt !== 'number' || !parsed.landing) return null;
    return parsed as SessionDurable;
  } catch {
    return null;
  }
}

function writeState(session: Session): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage may throw under quota or private-mode constraints — the
    // tracker keeps working from `inMemorySession` even when persistence fails.
  }
}

function clearState(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_STATE_KEY);
  } catch {
    // No-op — see writeState for why we swallow.
  }
}

function deriveLanding(opts: { pathname: string; search: string; referrer: string }): SessionLanding {
  const params = new URLSearchParams(opts.search);
  const land: SessionLanding = {
    pathname: opts.pathname,
    search: opts.search,
    referrer: opts.referrer,
  };
  const utmSource = params.get('utm_source');
  if (utmSource) land.utmSource = utmSource;
  const utmMedium = params.get('utm_medium');
  if (utmMedium) land.utmMedium = utmMedium;
  const utmCampaign = params.get('utm_campaign');
  if (utmCampaign) land.utmCampaign = utmCampaign;
  const utmTerm = params.get('utm_term');
  if (utmTerm) land.utmTerm = utmTerm;
  const utmContent = params.get('utm_content');
  if (utmContent) land.utmContent = utmContent;
  const gclid = params.get('gclid');
  if (gclid) land.gclid = gclid;
  const fbclid = params.get('fbclid');
  if (fbclid) land.fbclid = fbclid;
  const msclkid = params.get('msclkid');
  if (msclkid) land.msclkid = msclkid;
  const ttclid = params.get('ttclid');
  if (ttclid) land.ttclid = ttclid;
  return land;
}

function freshState(now: number, pathname: string): SessionState {
  return {
    pageviewCount: 0,
    stepN: 0,
    lastActivityAt: now,
    activeMs: 0,
    activeUpdatedAt: now,
    maxScrollPct: 0,
    exitPathname: pathname,
  };
}

/**
 * Read the live session, or open a new one. Called by the SessionTracker on
 * each pageview. Returns `isNew: true` exactly once per session — the caller
 * uses that to fire `session_started`.
 *
 * A new session opens when:
 *   - no cookie + no in-memory id, OR
 *   - the previous session's lastActivityAt is older than the idle timeout.
 */
export function getOrCreateSession(opts: {
  analyticsConsent: boolean;
  pathname: string;
  search: string;
  referrer: string;
}): { session: Session; isNew: boolean } {
  const now = nowMs();
  const live = readLiveSessionInternal();
  if (live && now - live.lastActivityAt < SESSION_IDLE_TIMEOUT_MS) {
    live.lastActivityAt = now;
    persist(live, opts.analyticsConsent);
    inMemorySession = live;
    return { session: live, isNew: false };
  }

  const landing = deriveLanding(opts);
  const session: Session = {
    id: uuidv4(),
    startedAt: now,
    landing,
    ...freshState(now, opts.pathname),
  };
  persist(session, opts.analyticsConsent);
  inMemorySession = session;
  return { session, isNew: true };
}

function readLiveSessionInternal(): Session | null {
  // Per-tab semantic: sessionStorage is the source of truth within a tab.
  // The cookie is a server-readable snapshot, not a resume source — a new
  // tab without sessionStorage state is treated as a fresh arrival even
  // when the cookie is warm.
  const stored = readFullSessionFromStorage();
  if (stored) {
    inMemorySession = stored;
    return stored;
  }
  if (inMemorySession) return inMemorySession;
  return null;
}

function readFullSessionFromStorage(): Session | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (
      !parsed.id ||
      typeof parsed.startedAt !== 'number' ||
      !parsed.landing ||
      typeof parsed.stepN !== 'number' ||
      typeof parsed.pageviewCount !== 'number' ||
      typeof parsed.lastActivityAt !== 'number'
    ) {
      return null;
    }
    return parsed as Session;
  } catch {
    return null;
  }
}

function persist(session: Session, analyticsConsent: boolean): void {
  inMemorySession = session;
  if (!analyticsConsent) return;
  // Cookie holds only the durable snapshot — what a server route handler
  // needs to correlate a request to a session. Server reads the cookie;
  // server never writes the live mutable state back.
  const durable: SessionDurable = {
    id: session.id,
    startedAt: session.startedAt,
    landing: session.landing,
  };
  writeCookie(SESSION_COOKIE, JSON.stringify(durable), SESSION_TTL_DAYS);
  // sessionStorage holds the full live record. One write per state change.
  writeState(session);
}

/**
 * Bump the step counter and pageview count. Called on each `$pageview`.
 * Returns the post-bump session, or null if no session exists (e.g. the
 * caller forgot to seed via getOrCreateSession first — defensive).
 */
export function bumpStep(opts: { analyticsConsent: boolean; pathname: string }): Session | null {
  const live = readLiveSessionInternal();
  if (!live) return null;
  const now = nowMs();
  live.stepN += 1;
  live.pageviewCount += 1;
  live.lastActivityAt = now;
  live.exitPathname = opts.pathname;
  persist(live, opts.analyticsConsent);
  return live;
}

/**
 * Record a user-interaction tick (mousemove/click/scroll/keydown/touchstart
 * or visibilityState→visible). Updates active-time accumulator and slides the
 * idle timeout forward. Cheap — does not write the cookie unless the active
 * accumulator changed by ≥1s, to avoid Set-Cookie thrashing on every pixel of
 * mousemove.
 */
export function recordActivity(opts: { analyticsConsent: boolean; visible: boolean }): void {
  const live = readLiveSessionInternal();
  if (!live) return;
  const now = nowMs();
  const gap = now - live.activeUpdatedAt;
  let bumped = false;
  if (opts.visible && gap < IDLE_THRESHOLD_MS && gap > 0) {
    live.activeMs += gap;
    bumped = gap >= 1000;
  }
  live.activeUpdatedAt = now;
  live.lastActivityAt = now;
  if (bumped) persist(live, opts.analyticsConsent);
  else inMemorySession = live;
}

/** Update max scroll percentage (used by EngagementTracker). */
export function recordScrollPct(pct: number, opts: { analyticsConsent: boolean }): void {
  const live = readLiveSessionInternal();
  if (!live) return;
  if (pct <= live.maxScrollPct) return;
  live.maxScrollPct = pct;
  persist(live, opts.analyticsConsent);
}

/**
 * Build the session-context blob attached to every event. Shape kept small —
 * only what's needed for path-stitching at query time. Returns an empty
 * object when no session is live (SSR, pre-consent, etc.) so the calling
 * track() can spread it unconditionally.
 */
export function getCurrentSessionContext(): {
  session_id?: string;
  step_n?: number;
  session_age_ms?: number;
} {
  const live = inMemorySession ?? readLiveSessionInternal();
  if (!live) return {};
  return {
    session_id: live.id,
    step_n: live.stepN,
    session_age_ms: nowMs() - live.startedAt,
  };
}

/**
 * Snapshot the session for a `session_ended` event. Caller fires the event
 * via posthog.capture (PostHog uses sendBeacon under the hood on pagehide).
 * After this returns, the in-memory + persisted state is wiped — a return
 * visit will open a fresh session unless the cookie's still warm.
 */
export function endSession(opts: { exitPathname: string; analyticsConsent: boolean }): {
  session_id: string;
  total_ms: number;
  active_ms: number;
  page_count: number;
  step_n: number;
  max_scroll_pct: number;
  exit_pathname: string;
  landing: SessionLanding;
} | null {
  const live = readLiveSessionInternal();
  if (!live) return null;
  const now = nowMs();
  const summary = {
    session_id: live.id,
    total_ms: now - live.startedAt,
    active_ms: live.activeMs,
    page_count: live.pageviewCount,
    step_n: live.stepN,
    max_scroll_pct: live.maxScrollPct,
    exit_pathname: opts.exitPathname,
    landing: live.landing,
  };
  // We deliberately don't clear the cookie — a return visit within the idle
  // window should resume the same session for path continuity. The cookie's
  // 90-day TTL cap is enforced by getOrCreateSession's idle check.
  inMemorySession = null;
  if (opts.analyticsConsent) {
    clearState();
  }
  return summary;
}

/** Test helper — drop everything, including cookie. */
export function _resetForTest(): void {
  inMemorySession = null;
  clearState();
  clearCookie(SESSION_COOKIE);
}
