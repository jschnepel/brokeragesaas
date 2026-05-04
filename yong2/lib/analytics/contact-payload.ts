/**
 * Build the enrichment payload that the contact form posts alongside the
 * usual fields. Lives separately from `events.ts` so it's tree-shaken out
 * of pages that don't render the form.
 *
 * What we send:
 *   session  — id, page count, step counter, active/total ms, max scroll,
 *              landing path, exit path. Pulled from the live session
 *              (sessionStorage) populated by SessionTracker.
 *   behavior — sessionCount, spanDays, uniqueListingViews, maxListingPrice,
 *              minPriceFilter, favoritedAny. These accumulate across visits;
 *              we keep them in localStorage under `yong2_behavior` so a
 *              return visitor's history feeds into the lead score.
 *
 * Anything we can't recover (e.g. visitor never enabled analytics consent)
 * is omitted — the server fills in safe zeroes via Zod defaults so the
 * scoring still runs.
 */

const BEHAVIOR_LS_KEY = 'yong2_behavior';

type StoredBehavior = {
  v: 1;
  firstSeenAt: number; // ms epoch
  lastSeenAt: number;
  sessionCount: number;
  uniqueListingViews: number;
  maxListingPrice: number;
  minPriceFilter: number;
  favoritedAny: boolean;
  listingsViewed: string[]; // listingKey set
};

export type SessionPayload = {
  session?: {
    id: string | null;
    pageCount: number;
    stepN: number;
    activeMs: number;
    totalMs: number;
    maxScrollPct: number;
    landingPath: string | null;
    exitPath: string | null;
  };
  behavior?: {
    sessionCount: number;
    spanDays: number;
    uniqueListingViews: number;
    maxListingPrice: number;
    minPriceFilter: number;
    favoritedAny: boolean;
  };
};

function safeRead<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / private mode — fail open.
  }
}

function readSessionFromStorage(): {
  id: string | null;
  pageCount: number;
  stepN: number;
  activeMs: number;
  totalMs: number;
  maxScrollPct: number;
  landingPath: string | null;
  exitPath: string | null;
} | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('yong2_sess_state');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      id?: string;
      startedAt?: number;
      pageviewCount?: number;
      stepN?: number;
      activeMs?: number;
      maxScrollPct?: number;
      landing?: { pathname?: string };
      exitPathname?: string;
    };
    if (!parsed.id) return null;
    const totalMs = parsed.startedAt ? Date.now() - parsed.startedAt : 0;
    return {
      id: parsed.id,
      pageCount: parsed.pageviewCount ?? 0,
      stepN: parsed.stepN ?? 0,
      activeMs: parsed.activeMs ?? 0,
      totalMs,
      maxScrollPct: parsed.maxScrollPct ?? 0,
      landingPath: parsed.landing?.pathname ?? null,
      exitPath: parsed.exitPathname ?? null,
    };
  } catch {
    return null;
  }
}

function readBehavior(): StoredBehavior | null {
  return safeRead<StoredBehavior>(BEHAVIOR_LS_KEY);
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Build the payload to post with the contact form. Read-only — does not
 * mutate the stored behavior state. Returns an empty object when nothing
 * is available so the spread merge in ContactForm.tsx is safe.
 */
export function getSessionEnrichment(): SessionPayload {
  const session = readSessionFromStorage();
  const stored = readBehavior();

  const out: SessionPayload = {};
  if (session) out.session = session;

  if (stored) {
    const spanDays = Math.max(0, (stored.lastSeenAt - stored.firstSeenAt) / ONE_DAY_MS);
    out.behavior = {
      sessionCount: stored.sessionCount,
      spanDays,
      uniqueListingViews: stored.uniqueListingViews,
      maxListingPrice: stored.maxListingPrice,
      minPriceFilter: stored.minPriceFilter,
      favoritedAny: stored.favoritedAny,
    };
  }
  return out;
}

/**
 * Update accumulated behavior signal. Call from event call sites that imply
 * a meaningful interaction worth feeding into the score:
 *
 *   - bumpSessionStart(now)            — once per new session_started
 *   - recordListingView(listingKey,    — on each listing_view event with a
 *                       listPrice)        price attached
 *   - recordPriceFilter(minPrice)      — on filter_chip_toggle / price-band
 *                                        change for $ filters
 *   - recordFavorite()                 — on save/favorite events
 *
 * All writes coerce to a versioned StoredBehavior; if the schema bumps in
 * the future, readBehavior() will null out the old shape and the next
 * write will reseed.
 */
export function bumpSessionStart(nowMs: number): void {
  const cur = readBehavior();
  const next: StoredBehavior = cur
    ? { ...cur, sessionCount: cur.sessionCount + 1, lastSeenAt: nowMs }
    : {
        v: 1,
        firstSeenAt: nowMs,
        lastSeenAt: nowMs,
        sessionCount: 1,
        uniqueListingViews: 0,
        maxListingPrice: 0,
        minPriceFilter: 0,
        favoritedAny: false,
        listingsViewed: [],
      };
  safeWrite(BEHAVIOR_LS_KEY, next);
}

export function recordListingView(listingKey: string, listPrice: number | null): void {
  const cur = readBehavior() ?? emptyBehavior(Date.now());
  if (!cur.listingsViewed.includes(listingKey)) {
    cur.listingsViewed.push(listingKey);
    cur.uniqueListingViews = cur.listingsViewed.length;
  }
  if (listPrice && listPrice > cur.maxListingPrice) {
    cur.maxListingPrice = listPrice;
  }
  cur.lastSeenAt = Date.now();
  safeWrite(BEHAVIOR_LS_KEY, cur);
}

export function recordPriceFilter(minPrice: number): void {
  const cur = readBehavior() ?? emptyBehavior(Date.now());
  if (minPrice > cur.minPriceFilter) {
    cur.minPriceFilter = minPrice;
  }
  cur.lastSeenAt = Date.now();
  safeWrite(BEHAVIOR_LS_KEY, cur);
}

export function recordFavorite(): void {
  const cur = readBehavior() ?? emptyBehavior(Date.now());
  cur.favoritedAny = true;
  cur.lastSeenAt = Date.now();
  safeWrite(BEHAVIOR_LS_KEY, cur);
}

function emptyBehavior(now: number): StoredBehavior {
  return {
    v: 1,
    firstSeenAt: now,
    lastSeenAt: now,
    sessionCount: 1,
    uniqueListingViews: 0,
    maxListingPrice: 0,
    minPriceFilter: 0,
    favoritedAny: false,
    listingsViewed: [],
  };
}
