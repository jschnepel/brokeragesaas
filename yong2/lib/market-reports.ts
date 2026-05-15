/**
 * Market Reports — period-aware data layer (weekly + monthly).
 *
 * Replaces the legacy MV-based composer (which used dropped relations
 * `analytics_base`, `mv_market_pulse`, `mv_community_scorecard`,
 * `mv_supply_demand`, `mv_inventory_age` and produced quarter-keyed
 * `MarketReport` objects). All data now comes from CloudFront dbt
 * parquet files (the same feed `/phoenix/*` consumes).
 *
 * Data depth at the parquet level (Path 1 decision — surfaced to the
 * user before this rewrite):
 *
 *   - Weekly granularity exists ONLY in `fct_listing_pace`
 *     (new_listings_count + 4wk / 52wk rolling averages). No weekly
 *     medianPpsf, no weekly DOM, no weekly closed volume.
 *   - Monthly granularity in `fct_market_pulse_*` is the full stat
 *     suite (medianPpsf, medianDom, totalVolume, closingCount).
 *   - Snapshot-only marts (`fct_active_inventory`,
 *     `fct_months_of_supply`, `fct_active_by_pricetier`,
 *     `fct_active_dom_distribution`) have no historical depth — they
 *     report current state. They surface on the monthly detail page
 *     as "context" rather than "for this month".
 *
 * The weekly detail page is therefore explicitly framed as a
 * "supply pulse" (new-listing cadence) — the only weekly-granular
 * stat the parquet exposes. The monthly detail page carries the full
 * stat suite + Yong's editorial prose.
 *
 * Publish gating (America/Phoenix, no DST):
 *   - Week becomes "published" at 00:00 Tue of the following week,
 *     i.e. ~32 hours after the ISO week's Sunday close.
 *   - Month becomes "published" on the 15th of the following calendar
 *     month, no earlier than 00:00 AZ.
 *
 * Phoenix is UTC-7 year-round (no DST observed), so the gating math
 * is a fixed offset from UTC — no `Intl.DateTimeFormat({ timeZone })`
 * round-trip required.
 */

import {
  filterScope,
  readMart,
  type MarketPulseRow,
  type ScopeType,
} from './marts';

// ─────────────────────────────────────────────────────────────────
// Period type + slug parsing
// ─────────────────────────────────────────────────────────────────

export type Period =
  | { kind: 'week'; iso: string }   // "2026-w19"
  | { kind: 'month'; iso: string }; // "2026-05"

const WEEK_SLUG_RE = /^(\d{4})-w(\d{2})$/;
const MONTH_SLUG_RE = /^(\d{4})-(\d{2})$/;

/**
 * Parse a slug into a Period. Returns null for anything that doesn't
 * match either weekly or monthly form.
 */
export function parsePeriodSlug(slug: string): Period | null {
  const wm = slug.match(WEEK_SLUG_RE);
  if (wm) {
    const week = parseInt(wm[2], 10);
    if (week >= 1 && week <= 53) return { kind: 'week', iso: slug };
    return null;
  }
  const mm = slug.match(MONTH_SLUG_RE);
  if (mm) {
    const month = parseInt(mm[2], 10);
    if (month >= 1 && month <= 12) return { kind: 'month', iso: slug };
    return null;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
// AZ time + ISO week math (no DST observed in Phoenix)
// ─────────────────────────────────────────────────────────────────

/**
 * Fixed AZ offset in milliseconds. Phoenix is MST year-round —
 * Arizona is the only US state outside Hawaii that does not observe
 * daylight saving time, so UTC-7 holds 365 days a year.
 *
 * Guard rail: if Arizona ever adopts DST (the legislature has tried
 * twice in the last decade and failed both times, but it's a live
 * political question), this constant becomes wrong twice a year by
 * one hour. The fallout is that the weekly Tuesday-00:00 AZ gate
 * fires either 1h early or 1h late for the publish window — a
 * 4%-of-a-day error that nobody downstream will notice for at least
 * a build cycle. Switching to
 * `Intl.DateTimeFormat({ timeZone: 'America/Phoenix' })` is the fix
 * if DST adoption ever lands; the round-trip is more expensive than
 * a fixed offset, which is why we don't pay it pre-emptively.
 */
const AZ_OFFSET_MS = -7 * 60 * 60 * 1000;

/** Current wall-clock time as if the server were in Phoenix. */
function nowAZ(): Date {
  return new Date(Date.now() + AZ_OFFSET_MS);
}

/** Convert an AZ wall-clock instant back to true UTC ms for comparison. */
function azWallToUtcMs(year: number, month0: number, day: number, hour = 0): number {
  return Date.UTC(year, month0, day, hour) - AZ_OFFSET_MS;
}

/** ISO 8601 week start (Monday) for a given year + week-of-year. */
function isoWeekStart(year: number, week: number): Date {
  // Jan 4 is always in ISO week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7; // Sun=0→7
  const week1Mon = new Date(Date.UTC(year, 0, 4 - (jan4Dow - 1)));
  return new Date(week1Mon.getTime() + (week - 1) * 7 * 86400000);
}

/** ISO week + year from a Date. */
function isoWeekOf(d: Date): { year: number; week: number } {
  // Thursday of the same week determines the ISO year.
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + (4 - dow));
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: t.getUTCFullYear(), week };
}

/** "2026-w19" given a Date inside that ISO week. */
function isoWeekSlug(d: Date): string {
  const { year, week } = isoWeekOf(d);
  return `${year}-w${String(week).padStart(2, '0')}`;
}

/** "2026-05" given a Date inside that calendar month. */
function monthSlug(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Has the ISO week beginning at `weekStart` been "published" yet?
 *  Publishing window opens 00:00 AZ on the Tuesday following the week
 *  (i.e. ~32h after the Sunday close). */
function isWeekPublished(weekStart: Date, now: number): boolean {
  const sunday = new Date(weekStart.getTime() + 6 * 86400000);
  // Tuesday after the Sunday close, at 00:00 AZ.
  const tuesday = new Date(sunday.getTime() + 2 * 86400000);
  const publishUtc = azWallToUtcMs(
    tuesday.getUTCFullYear(),
    tuesday.getUTCMonth(),
    tuesday.getUTCDate(),
    0,
  );
  return now >= publishUtc;
}

/** Has the calendar month identified by "YYYY-MM" been published?
 *  Publishing window opens 00:00 AZ on the 15th of the following month. */
function isMonthPublished(yearMonth: string, now: number): boolean {
  const mm = yearMonth.match(MONTH_SLUG_RE);
  if (!mm) return false;
  const year = parseInt(mm[1], 10);
  const month = parseInt(mm[2], 10);
  // 15th of the FOLLOWING month at 00:00 AZ.
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth0 = month === 12 ? 0 : month; // 1-based month → 0-based next
  const publishUtc = azWallToUtcMs(nextYear, nextMonth0, 15, 0);
  return now >= publishUtc;
}

// ─────────────────────────────────────────────────────────────────
// Period framing helpers (display-friendly labels)
// ─────────────────────────────────────────────────────────────────

const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "Week of May 4-10, 2026". */
export function weekRangeLabel(period: Period & { kind: 'week' }): string {
  const m = period.iso.match(WEEK_SLUG_RE);
  if (!m) return period.iso;
  const start = isoWeekStart(parseInt(m[1], 10), parseInt(m[2], 10));
  const end = new Date(start.getTime() + 6 * 86400000);
  const mo1 = MONTH_LONG[start.getUTCMonth()];
  const mo2 = MONTH_LONG[end.getUTCMonth()];
  if (mo1 === mo2) {
    return `Week of ${mo1} ${start.getUTCDate()}-${end.getUTCDate()}, ${end.getUTCFullYear()}`;
  }
  return `Week of ${mo1} ${start.getUTCDate()} – ${mo2} ${end.getUTCDate()}, ${end.getUTCFullYear()}`;
}

/** Mon/Sun ISO dates for a weekly period. */
export function weekBounds(period: Period & { kind: 'week' }): { start: string; end: string } | null {
  const m = period.iso.match(WEEK_SLUG_RE);
  if (!m) return null;
  const start = isoWeekStart(parseInt(m[1], 10), parseInt(m[2], 10));
  const end = new Date(start.getTime() + 6 * 86400000);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

/** "April 2026". */
export function monthLabel(period: Period & { kind: 'month' }): string {
  const m = period.iso.match(MONTH_SLUG_RE);
  if (!m) return period.iso;
  const month = parseInt(m[2], 10) - 1;
  return `${MONTH_LONG[month]} ${m[1]}`;
}

/** Short label for chart axes: "May '26" or "May 5". */
function monthChartLabel(yearMonth: string): string {
  const m = yearMonth.match(MONTH_SLUG_RE);
  if (!m) return yearMonth;
  return `${MONTH_SHORT[parseInt(m[2], 10) - 1]} '${m[1].slice(2)}`;
}
function weekChartLabel(weekStart: Date): string {
  return `${MONTH_SHORT[weekStart.getUTCMonth()]} ${weekStart.getUTCDate()}`;
}

// ─────────────────────────────────────────────────────────────────
// Parquet schemas + helpers
// ─────────────────────────────────────────────────────────────────

interface PaceMartRow {
  scope_type?: string;
  scope_key?: string;
  property_segment?: string;
  week: string | Date;
  new_listings_count: number | bigint | null;
  new_listings_4wk_avg: number | null;
  new_listings_52wk_avg: number | null;
  pct_change_vs_52wk: number | null;
}

interface PriceTierMartRow {
  scope_type?: string;
  scope_key?: string;
  property_segment?: string;
  price_band: string;
  active_count: number | bigint | null;
  median_dom: number | null;
  median_ppsf: number | null;
  mean_list_price: number | null;
}

interface ActiveInventoryMartRow {
  scope_type?: string;
  scope_key?: string;
  property_segment?: string;
  active_count: number | bigint | null;
  strict_active_count: number | bigint | null;
  pending_count: number | bigint | null;
  coming_soon_count: number | bigint | null;
}

interface MonthsSupplyMartRow {
  scope_type?: string;
  scope_key?: string;
  property_segment?: string;
  active_count: number | bigint | null;
  months_of_supply_3mo: number | null;
  months_of_supply_12mo: number | null;
  market_classification: string | null;
}

const METRO_FILTER = {
  scope_type: 'metro' as const,
  scope_key: 'phoenix_metro',
  property_segment: 'all' as const,
};

const METRO_RESIDENTIAL_FILTER = {
  scope_type: 'metro' as const,
  scope_key: 'phoenix_metro',
  property_segment: 'residential' as const,
};

function asNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** YYYY-MM key from a YYYY-MM-DD or Date value. */
function monthKey(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 7);
  return String(value).slice(0, 7);
}

function pctDelta(latest: number | null, prior: number | null): number | null {
  if (latest == null || prior == null || prior === 0) return null;
  return ((latest - prior) / prior) * 100;
}

// ─────────────────────────────────────────────────────────────────
// listAvailablePeriods — manifest of published periods
// ─────────────────────────────────────────────────────────────────

export interface PeriodManifest {
  /** Weekly slugs, descending, capped at 52. */
  weeks: string[];
  /** Monthly slugs, descending, capped at 24. */
  months: string[];
  /** Most recently published period across both cadences, or null
   *  when the parquet feed is empty. */
  latest: Period | null;
}

/**
 * Inspect the parquet feed and return every weekly + monthly slug
 * that has both (a) a row in the appropriate mart and (b) passed
 * the AZ publish-gating window (Tue 00:00 AZ for weeks; 15th 00:00
 * AZ for months). Slugs are descending; manifest caps at 52 weeks
 * and 24 months to match the spec's archive depth.
 */
export async function listAvailablePeriods(): Promise<PeriodManifest> {
  const now = Date.now();
  const [paceRows, pulseRows] = await Promise.all([
    readMart<PaceMartRow>('fct_listing_pace').catch(() => []),
    readMart<MarketPulseRow>('fct_market_pulse_metro').catch(() => []),
  ]);

  // Weekly — collect distinct ISO weeks from metro listing-pace rows
  // whose Mon-start date pre-dates the publish window.
  const weekSet = new Set<string>();
  let latestWeekStart: Date | null = null;
  for (const r of paceRows) {
    if (r.scope_type !== 'metro' || r.scope_key !== 'phoenix_metro') continue;
    if (r.property_segment !== 'all') continue;
    const start = r.week instanceof Date ? r.week : new Date(String(r.week));
    if (Number.isNaN(start.getTime())) continue;
    if (!isWeekPublished(start, now)) continue;
    weekSet.add(isoWeekSlug(start));
    if (!latestWeekStart || start.getTime() > latestWeekStart.getTime()) {
      latestWeekStart = start;
    }
  }
  const weeks = Array.from(weekSet).sort().reverse().slice(0, 52);

  // Monthly — distinct YYYY-MM from metro market-pulse rows whose
  // calendar month has been published per the 15th-of-next-month rule.
  const monthSet = new Set<string>();
  let latestMonthIso: string | null = null;
  const metroPulse = filterScope(pulseRows, METRO_FILTER);
  // Some pipelines key market_pulse on property_segment='all' (which
  // METRO_FILTER captures); fall back to residential if all-segment
  // is empty so the manifest never silently goes dark.
  const sourcePulse = metroPulse.length > 0
    ? metroPulse
    : filterScope(pulseRows, METRO_RESIDENTIAL_FILTER);
  for (const r of sourcePulse) {
    const key = monthKey(r.month);
    if (!key.match(MONTH_SLUG_RE)) continue;
    if (!isMonthPublished(key, now)) continue;
    monthSet.add(key);
    if (!latestMonthIso || key > latestMonthIso) latestMonthIso = key;
  }
  const months = Array.from(monthSet).sort().reverse().slice(0, 24);

  // Pick "latest" = whichever cadence has the more recently-published
  // window. Tie-break to weekly (publishes more often).
  let latest: Period | null = null;
  if (latestWeekStart && latestMonthIso) {
    // Use the publish-instant timestamp of each candidate.
    const weekPubInstant = (() => {
      const tuesday = new Date(latestWeekStart.getTime() + 8 * 86400000);
      return azWallToUtcMs(tuesday.getUTCFullYear(), tuesday.getUTCMonth(), tuesday.getUTCDate(), 0);
    })();
    const monthPubInstant = (() => {
      const mm = latestMonthIso.match(MONTH_SLUG_RE) as RegExpMatchArray;
      const year = parseInt(mm[1], 10);
      const month = parseInt(mm[2], 10);
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonth0 = month === 12 ? 0 : month;
      return azWallToUtcMs(nextYear, nextMonth0, 15, 0);
    })();
    latest =
      weekPubInstant >= monthPubInstant
        ? { kind: 'week', iso: isoWeekSlug(latestWeekStart) }
        : { kind: 'month', iso: latestMonthIso };
  } else if (latestWeekStart) {
    latest = { kind: 'week', iso: isoWeekSlug(latestWeekStart) };
  } else if (latestMonthIso) {
    latest = { kind: 'month', iso: latestMonthIso };
  }

  return { weeks, months, latest };
}

// ─────────────────────────────────────────────────────────────────
// Weekly stats — listing-pace only (Path 1)
// ─────────────────────────────────────────────────────────────────

export interface WeeklyStats {
  period: Period & { kind: 'week' };
  weekStart: string;
  weekEnd: string;
  newListings: number;
  newListings4wAvg: number | null;
  newListings52wAvg: number | null;
  /** Pct change vs the immediately prior ISO week (same year-1 week
   *  if the manifest depth allows). */
  wow: { newListings: number | null } | null;
  /** Pct change vs the same ISO week one year prior. Null when the
   *  parquet history doesn't reach back. */
  yoy: { newListings: number | null } | null;
}

async function getWeeklyStatsInternal(
  period: Period & { kind: 'week' },
  rows: PaceMartRow[],
): Promise<WeeklyStats | null> {
  const m = period.iso.match(WEEK_SLUG_RE);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const week = parseInt(m[2], 10);
  const targetStart = isoWeekStart(year, week);
  const targetMs = targetStart.getTime();

  // Filter to Phoenix-metro pace rows; normalise the week field.
  type Norm = { start: Date; raw: PaceMartRow };
  const normalised: Norm[] = [];
  for (const r of rows) {
    if (r.scope_type !== 'metro' || r.scope_key !== 'phoenix_metro') continue;
    if (r.property_segment !== 'all') continue;
    const start = r.week instanceof Date ? r.week : new Date(String(r.week));
    if (Number.isNaN(start.getTime())) continue;
    normalised.push({ start, raw: r });
  }

  const target = normalised.find((n) => n.start.getTime() === targetMs);
  if (!target) return null;

  // Sort once for delta lookups.
  normalised.sort((a, b) => a.start.getTime() - b.start.getTime());
  const idx = normalised.findIndex((n) => n.start.getTime() === targetMs);
  const prior = idx > 0 ? normalised[idx - 1] : null;
  // YoY anchor: prior-year same ISO week. Slug-match (handles 52/53
  // boundaries cleanly via the WEEK_SLUG comparison.)
  const yoySlug = `${year - 1}-w${m[2]}`;
  const yoyRow = normalised.find((n) => isoWeekSlug(n.start) === yoySlug);

  const countRaw = target.raw.new_listings_count;
  const newListings =
    typeof countRaw === 'bigint' ? Number(countRaw) : (asNumber(countRaw) ?? 0);
  const priorCount = prior
    ? (typeof prior.raw.new_listings_count === 'bigint'
        ? Number(prior.raw.new_listings_count)
        : (asNumber(prior.raw.new_listings_count) ?? 0))
    : null;
  const yoyCount = yoyRow
    ? (typeof yoyRow.raw.new_listings_count === 'bigint'
        ? Number(yoyRow.raw.new_listings_count)
        : (asNumber(yoyRow.raw.new_listings_count) ?? 0))
    : null;

  return {
    period,
    weekStart: targetStart.toISOString().slice(0, 10),
    weekEnd: new Date(targetMs + 6 * 86400000).toISOString().slice(0, 10),
    newListings,
    newListings4wAvg: asNumber(target.raw.new_listings_4wk_avg),
    newListings52wAvg: asNumber(target.raw.new_listings_52wk_avg),
    wow: prior ? { newListings: pctDelta(newListings, priorCount) } : null,
    yoy: yoyRow ? { newListings: pctDelta(newListings, yoyCount) } : null,
  };
}

export async function getWeeklyStats(
  period: Period & { kind: 'week' },
): Promise<WeeklyStats | null> {
  const rows = await readMart<PaceMartRow>('fct_listing_pace').catch(() => []);
  return getWeeklyStatsInternal(period, rows);
}

// ─────────────────────────────────────────────────────────────────
// Monthly stats — full suite (market_pulse + snapshots)
// ─────────────────────────────────────────────────────────────────

export interface MonthlyStats {
  period: Period & { kind: 'month' };
  monthLabel: string;
  medianPpsf: number | null;
  medianDom: number | null;
  totalVolume: number | null;
  closingCount: number;
  /** Sum of weekly new-listings within the calendar month. Best-effort
   *  derivation from fct_listing_pace; null when the month's weeks
   *  aren't all in the pace mart. */
  newListings: number | null;
  /** Current snapshot at render time — not historical. */
  activeInventory: number | null;
  monthsSupply3mo: number | null;
  monthsSupply12mo: number | null;
  marketClassification: string | null;
  mom: {
    medianPpsf: number | null;
    medianDom: number | null;
    totalVolume: number | null;
    closingCount: number | null;
  } | null;
  yoy: {
    medianPpsf: number | null;
    medianDom: number | null;
    totalVolume: number | null;
    closingCount: number | null;
  } | null;
}

async function getMonthlyStatsInternal(
  period: Period & { kind: 'month' },
  pulseRows: MarketPulseRow[],
  paceRows: PaceMartRow[],
  invRows: ActiveInventoryMartRow[],
  mosRows: MonthsSupplyMartRow[],
): Promise<MonthlyStats | null> {
  const targetMonth = period.iso;

  // Pulse — prefer all-segment, fall back to residential.
  const metroAll = filterScope(pulseRows, METRO_FILTER);
  const metroPulse = metroAll.length > 0
    ? metroAll
    : filterScope(pulseRows, METRO_RESIDENTIAL_FILTER);
  const target = metroPulse.find((r) => monthKey(r.month) === targetMonth);
  if (!target) return null;

  // Prior month (MoM) — substract one calendar month from targetMonth.
  const [yStr, mStr] = targetMonth.split('-');
  const y = parseInt(yStr, 10);
  const mo = parseInt(mStr, 10); // 1-based
  const priorY = mo === 1 ? y - 1 : y;
  const priorM = mo === 1 ? 12 : mo - 1;
  const priorKey = `${priorY}-${String(priorM).padStart(2, '0')}`;
  const priorMonth = metroPulse.find((r) => monthKey(r.month) === priorKey);

  // YoY — same calendar month one year prior.
  const yoyKey = `${y - 1}-${String(mo).padStart(2, '0')}`;
  const yoyMonth = metroPulse.find((r) => monthKey(r.month) === yoyKey);

  // newListings = sum of pace weeks inside the calendar month.
  const newListings = (() => {
    const metroRows = paceRows.filter(
      (r) =>
        r.scope_type === 'metro' &&
        r.scope_key === 'phoenix_metro' &&
        r.property_segment === 'all',
    );
    const sum = metroRows.reduce((acc, r) => {
      const start = r.week instanceof Date ? r.week : new Date(String(r.week));
      if (Number.isNaN(start.getTime())) return acc;
      if (monthKey(start) !== targetMonth) return acc;
      const c = r.new_listings_count;
      const n = typeof c === 'bigint' ? Number(c) : (asNumber(c) ?? 0);
      return acc + n;
    }, 0);
    return sum > 0 ? sum : null;
  })();

  // Snapshot marts — current state, no historical depth.
  const inv = invRows.find(
    (r) =>
      r.scope_type === 'metro' &&
      r.scope_key === 'phoenix_metro' &&
      r.property_segment === 'all',
  );
  const mos = mosRows.find(
    (r) =>
      r.scope_type === 'metro' &&
      r.scope_key === 'phoenix_metro' &&
      r.property_segment === 'all',
  );

  const targetPpsf = asNumber(target.median_ppsf);
  const targetDom = asNumber(target.median_dom);
  const targetVol = asNumber(target.total_volume);
  const targetCount = (() => {
    const c = target.closing_count;
    return typeof c === 'bigint' ? Number(c) : (asNumber(c) ?? 0);
  })();

  return {
    period,
    monthLabel: monthLabel(period),
    medianPpsf: targetPpsf,
    medianDom: targetDom,
    totalVolume: targetVol,
    closingCount: targetCount,
    newListings,
    activeInventory: inv
      ? (typeof inv.strict_active_count === 'bigint'
          ? Number(inv.strict_active_count)
          : asNumber(inv.strict_active_count))
      : null,
    monthsSupply3mo: asNumber(mos?.months_of_supply_3mo),
    monthsSupply12mo: asNumber(mos?.months_of_supply_12mo),
    marketClassification: mos?.market_classification ?? null,
    mom: priorMonth
      ? {
          medianPpsf: pctDelta(targetPpsf, asNumber(priorMonth.median_ppsf)),
          medianDom: pctDelta(targetDom, asNumber(priorMonth.median_dom)),
          totalVolume: pctDelta(targetVol, asNumber(priorMonth.total_volume)),
          closingCount: pctDelta(
            targetCount,
            (() => {
              const c = priorMonth.closing_count;
              return typeof c === 'bigint' ? Number(c) : asNumber(c);
            })(),
          ),
        }
      : null,
    yoy: yoyMonth
      ? {
          medianPpsf: pctDelta(targetPpsf, asNumber(yoyMonth.median_ppsf)),
          medianDom: pctDelta(targetDom, asNumber(yoyMonth.median_dom)),
          totalVolume: pctDelta(targetVol, asNumber(yoyMonth.total_volume)),
          closingCount: pctDelta(
            targetCount,
            (() => {
              const c = yoyMonth.closing_count;
              return typeof c === 'bigint' ? Number(c) : asNumber(c);
            })(),
          ),
        }
      : null,
  };
}

export async function getMonthlyStats(
  period: Period & { kind: 'month' },
): Promise<MonthlyStats | null> {
  const [pulseRows, paceRows, invRows, mosRows] = await Promise.all([
    readMart<MarketPulseRow>('fct_market_pulse_metro').catch(() => []),
    readMart<PaceMartRow>('fct_listing_pace').catch(() => []),
    readMart<ActiveInventoryMartRow>('fct_active_inventory').catch(() => []),
    readMart<MonthsSupplyMartRow>('fct_months_of_supply').catch(() => []),
  ]);
  return getMonthlyStatsInternal(period, pulseRows, paceRows, invRows, mosRows);
}

// ─────────────────────────────────────────────────────────────────
// Tier breakdown — luxury bands from fct_active_by_pricetier
// ─────────────────────────────────────────────────────────────────

export interface TierRow {
  /** Display label, e.g. "$3M – $5M". */
  label: string;
  /** Raw mart band key for downstream filtering. */
  bandKey: string;
  active: number;
  medianPpsf: number | null;
  medianDom: number | null;
  /** Auto-generated 1-line read of the band (for weekly cadence).
   *  Monthly templates can override with MDX prose. */
  commentary: string;
}

export interface TierBreakdown {
  period: Period;
  /** Generated server-side; "Snapshot as of {ISO date}" — the
   *  fct_active_by_pricetier mart is a current snapshot, not a
   *  per-period aggregate, so the same numbers ship on every period
   *  detail page until the mart gains historical depth. */
  asOf: string;
  tiers: TierRow[];
}

// Display bands the UI surfaces. Source bands come from the dbt mart
// `fct_active_by_pricetier` which currently emits the keys: 200K-400K,
// 400K-600K, 600K-800K, 800K-1M, 1M-2M, 2M-5M, 5M-10M, 10M+. The
// /listings audience cares about the luxury cuts only; the "$5M+"
// tier is derived from the union of 5M-10M and 10M+.
//
// Previous code looked for synthetic keys ('3m_5m', '5m_plus') that
// the mart has never emitted, so every detail page rendered "0
// active · — · —" for both bands — verified empirically against the
// live parquet (174 actives at 2M-5M, 48 at 5M-10M, 12 at 10M+).
interface DisplayBand {
  key: string;
  label: string;
  /** Source mart bands that roll up into this display band. */
  sourceKeys: string[];
}

const LUXURY_BANDS: DisplayBand[] = [
  { key: '2m_5m', label: '$2M – $5M', sourceKeys: ['2M-5M'] },
  { key: '5m_plus', label: '$5M+', sourceKeys: ['5M-10M', '10M+'] },
];

function tierCommentary(band: DisplayBand, active: number, medianDom: number | null): string {
  const domTxt = medianDom != null ? `${Math.round(medianDom)} days` : '—';
  if (band.key === '2m_5m') {
    if (active === 0) return 'Empty inventory; no active $2-5M listings tracked.';
    return `${active} active listings; median days on market ${domTxt}. The most actively transacting luxury band.`;
  }
  if (band.key === '5m_plus') {
    if (active === 0) return 'Empty inventory; no active $5M+ listings tracked.';
    return `${active} active listings; median days on market ${domTxt}. Selective, representation-driven; off-market share is meaningful at this tier.`;
  }
  return `${active} active listings; median days on market ${domTxt}.`;
}

/**
 * Roll a set of source-band rows into a single display band:
 *  - active     → sum
 *  - median PPSF/DOM → active-count-weighted average (medians don't
 *    aggregate cleanly, but a count-weighted blend is the best
 *    approximation without dropping back to listing-level data)
 *
 * When `rows` is empty, all three return null.
 */
function rollupBand(rows: PriceTierMartRow[]): {
  active: number;
  medianPpsf: number | null;
  medianDom: number | null;
} {
  if (rows.length === 0) return { active: 0, medianPpsf: null, medianDom: null };

  let active = 0;
  let ppsfNum = 0;
  let ppsfDen = 0;
  let domNum = 0;
  let domDen = 0;

  for (const r of rows) {
    const count =
      typeof r.active_count === 'bigint'
        ? Number(r.active_count)
        : (asNumber(r.active_count) ?? 0);
    active += count;
    const ppsf = asNumber(r.median_ppsf);
    if (ppsf != null && count > 0) {
      ppsfNum += ppsf * count;
      ppsfDen += count;
    }
    const dom = asNumber(r.median_dom);
    if (dom != null && count > 0) {
      domNum += dom * count;
      domDen += count;
    }
  }

  return {
    active,
    medianPpsf: ppsfDen > 0 ? ppsfNum / ppsfDen : null,
    medianDom: domDen > 0 ? domNum / domDen : null,
  };
}

export async function getTierBreakdown(period: Period): Promise<TierBreakdown | null> {
  const rows = await readMart<PriceTierMartRow>('fct_active_by_pricetier').catch(() => []);
  const metroRows = rows.filter(
    (r) =>
      r.scope_type === 'metro' &&
      r.scope_key === 'phoenix_metro' &&
      r.property_segment === 'all',
  );
  if (metroRows.length === 0) return null;

  const tiers: TierRow[] = LUXURY_BANDS.map((band) => {
    const sourceRows = metroRows.filter((r) => band.sourceKeys.includes(r.price_band));
    const { active, medianPpsf, medianDom } = rollupBand(sourceRows);
    return {
      label: band.label,
      bandKey: band.key,
      active,
      medianPpsf,
      medianDom,
      commentary: tierCommentary(band, active, medianDom),
    };
  });

  return {
    period,
    asOf: new Date().toISOString().slice(0, 10),
    tiers,
  };
}

// ─────────────────────────────────────────────────────────────────
// Negotiation — list-to-sale gap, share above/below ask
// ─────────────────────────────────────────────────────────────────

interface NegotiationMartRow {
  scope_type?: string;
  scope_key?: string;
  property_segment?: string;
  month: string | Date;
  closing_count: number | bigint | null;
  median_sale_to_list: number | null;
  pct_above_list: number | null;
  pct_below_list: number | null;
  median_close_to_original: number | null;
  median_sale_to_list_prior_year: number | null;
  median_sale_to_list_t12_avg: number | null;
  pct_change_sale_to_list_yoy: number | string | null;
}

export interface Negotiation {
  /** The data is monthly — surface which month the numbers are from. */
  asOfMonth: string;
  /** Median sale ÷ list (e.g. 0.977 → buyers averaging 2.3% off list). */
  medianSaleToList: number | null;
  /** Share of closings above asking (percent, 0-100). */
  pctAboveList: number | null;
  /** Share of closings below asking. */
  pctBelowList: number | null;
  /** Median sale ÷ ORIGINAL list — captures full discount from first ask. */
  medianCloseToOriginal: number | null;
  /** YoY change in sale-to-list (decimal). Positive = closing closer to ask. */
  yoyChangeSaleToList: number | null;
  /** 12-month rolling average for visual context. */
  saleToList12moAvg: number | null;
}

function asMonthDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

function asDecimal(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function getNegotiation(): Promise<Negotiation | null> {
  const rows = await readMart<NegotiationMartRow>('fct_negotiation_metro').catch(() => []);
  const metro = rows.filter(
    (r) =>
      r.scope_type === 'metro' &&
      r.scope_key === 'phoenix_metro' &&
      r.property_segment === 'all',
  );
  if (metro.length === 0) return null;

  // Pick the most recent month — mart goes back to 2011, latest is the
  // one the visitor cares about.
  metro.sort((a, b) => {
    const da = asMonthDate(a.month)?.getTime() ?? 0;
    const db = asMonthDate(b.month)?.getTime() ?? 0;
    return db - da;
  });
  const latest = metro[0];
  const monthDate = asMonthDate(latest.month);
  const asOfMonth = monthDate
    ? monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'recent month';

  return {
    asOfMonth,
    medianSaleToList: asNumber(latest.median_sale_to_list),
    pctAboveList: asNumber(latest.pct_above_list),
    pctBelowList: asNumber(latest.pct_below_list),
    medianCloseToOriginal: asNumber(latest.median_close_to_original),
    yoyChangeSaleToList: asDecimal(latest.pct_change_sale_to_list_yoy),
    saleToList12moAvg: asNumber(latest.median_sale_to_list_t12_avg),
  };
}

// ─────────────────────────────────────────────────────────────────
// Price reductions — share of listings cutting price + cut depth
// ─────────────────────────────────────────────────────────────────

interface PriceReductionMartRow {
  scope_type?: string;
  scope_key?: string;
  property_segment?: string;
  price_band: string;
  month: string | Date;
  closing_count: number | bigint | null;
  reduced_count: number | bigint | null;
  pct_with_reduction: number | null;
  median_net_change_pct: number | null;
  pct_change_with_reduction_yoy: number | string | null;
}

export interface PriceReduction {
  asOfMonth: string;
  /** Share of recent closings that had a recorded price reduction (0-1). */
  pctWithReduction: number | null;
  /** Median total reduction as a percentage of original list (negative). */
  medianNetChangePct: number | null;
  /** YoY change in the share-with-reduction rate (decimal points). */
  yoyChangePctReduction: number | null;
  /** Sample size — closings sampled in the latest month. */
  closingCount: number;
}

export async function getPriceReductions(): Promise<PriceReduction | null> {
  const rows = await readMart<PriceReductionMartRow>('fct_pricereduction_metro').catch(() => []);
  const filtered = rows.filter(
    (r) =>
      r.scope_type === 'metro' &&
      r.scope_key === 'phoenix_metro' &&
      r.property_segment === 'all',
  );
  if (filtered.length === 0) return null;

  // The mart splits property_segment='all' across 8 price bands; roll up
  // to a metro-wide picture by latest-month closing-count-weighted blend.
  // First find the latest month present (any band).
  let latestMonth = -Infinity;
  for (const r of filtered) {
    const t = asMonthDate(r.month)?.getTime() ?? -Infinity;
    if (t > latestMonth) latestMonth = t;
  }
  if (latestMonth === -Infinity) return null;
  const latestRows = filtered.filter((r) => asMonthDate(r.month)?.getTime() === latestMonth);
  if (latestRows.length === 0) return null;

  let totalClosings = 0;
  let totalReduced = 0;
  let cutPctNum = 0;
  let cutPctDen = 0;
  let yoyNum = 0;
  let yoyDen = 0;
  for (const r of latestRows) {
    const closings =
      typeof r.closing_count === 'bigint'
        ? Number(r.closing_count)
        : (asNumber(r.closing_count) ?? 0);
    const reduced =
      typeof r.reduced_count === 'bigint'
        ? Number(r.reduced_count)
        : (asNumber(r.reduced_count) ?? 0);
    totalClosings += closings;
    totalReduced += reduced;
    const cut = asNumber(r.median_net_change_pct);
    if (cut != null && reduced > 0) {
      cutPctNum += cut * reduced;
      cutPctDen += reduced;
    }
    const yoy = asDecimal(r.pct_change_with_reduction_yoy);
    if (yoy != null && closings > 0) {
      yoyNum += yoy * closings;
      yoyDen += closings;
    }
  }

  const monthDate = new Date(latestMonth);
  return {
    asOfMonth: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    pctWithReduction: totalClosings > 0 ? totalReduced / totalClosings : null,
    medianNetChangePct: cutPctDen > 0 ? cutPctNum / cutPctDen : null,
    yoyChangePctReduction: yoyDen > 0 ? yoyNum / yoyDen : null,
    closingCount: totalClosings,
  };
}

// ─────────────────────────────────────────────────────────────────
// Months of supply — buyer's vs seller's market gauge
// ─────────────────────────────────────────────────────────────────

export interface MonthsOfSupply {
  activeCount: number;
  /** Active ÷ trailing-12-month average monthly closings. */
  months12mo: number | null;
  /** Active ÷ trailing-3-month average monthly closings (more current). */
  months3mo: number | null;
  /** dbt's bucketed classification: strong_sellers, sellers, balanced, buyers, strong_buyers. */
  marketClassification: string | null;
}

export async function getMonthsOfSupply(): Promise<MonthsOfSupply | null> {
  const rows = await readMart<MonthsSupplyMartRow>('fct_months_of_supply').catch(() => []);
  const row = rows.find(
    (r) =>
      r.scope_type === 'metro' &&
      r.scope_key === 'phoenix_metro' &&
      r.property_segment === 'all',
  );
  if (!row) return null;
  const activeCount =
    typeof row.active_count === 'bigint' ? Number(row.active_count) : (asNumber(row.active_count) ?? 0);
  return {
    activeCount,
    months12mo: asNumber(row.months_of_supply_12mo),
    months3mo: asNumber(row.months_of_supply_3mo),
    marketClassification: row.market_classification ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────
// Trend series — 12 weeks (weekly) or 12 months (monthly)
// ─────────────────────────────────────────────────────────────────

export interface TrendPoint {
  /** Display label for the X-axis: "May 5" (weekly) or "May '26" (monthly). */
  date: string;
  /** Median PPSF (monthly) OR new_listings_count (weekly). */
  value: number;
  /** Optional rolling average (weekly cadence emits this; monthly leaves it null). */
  rollingAvg?: number | null;
}

export interface TrendSeries {
  period: Period;
  /** What the value column represents — drives the chart's Y-axis label. */
  metric: 'medianPpsf' | 'newListings';
  /** "Prior 12 weeks" or "Prior 12 months" — copy for the chart caption. */
  windowLabel: string;
  points: TrendPoint[];
}

export async function getTrendSeries(period: Period): Promise<TrendSeries | null> {
  if (period.kind === 'week') {
    // Weekly cadence trends on new-listings count.
    const rows = await readMart<PaceMartRow>('fct_listing_pace').catch(() => []);
    const m = period.iso.match(WEEK_SLUG_RE);
    if (!m) return null;
    const targetStart = isoWeekStart(parseInt(m[1], 10), parseInt(m[2], 10));

    const normalised = rows
      .filter(
        (r) =>
          r.scope_type === 'metro' &&
          r.scope_key === 'phoenix_metro' &&
          r.property_segment === 'all',
      )
      .map((r) => {
        const start = r.week instanceof Date ? r.week : new Date(String(r.week));
        if (Number.isNaN(start.getTime())) return null;
        return { start, raw: r };
      })
      .filter((x): x is { start: Date; raw: PaceMartRow } => x !== null)
      .filter(({ start }) => start.getTime() <= targetStart.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(-12);

    if (normalised.length === 0) return null;

    const points: TrendPoint[] = normalised.map(({ start, raw }) => {
      const c = raw.new_listings_count;
      const count = typeof c === 'bigint' ? Number(c) : (asNumber(c) ?? 0);
      return {
        date: weekChartLabel(start),
        value: count,
        rollingAvg: asNumber(raw.new_listings_4wk_avg),
      };
    });

    return {
      period,
      metric: 'newListings',
      windowLabel: 'Prior 12 complete weeks',
      points,
    };
  }

  // Monthly cadence trends on median PPSF.
  const rows = await readMart<MarketPulseRow>('fct_market_pulse_metro').catch(() => []);
  const metroAll = filterScope(rows, METRO_FILTER);
  const metroPulse = metroAll.length > 0
    ? metroAll
    : filterScope(rows, METRO_RESIDENTIAL_FILTER);
  if (metroPulse.length === 0) return null;

  const points = metroPulse
    .map((r) => ({ key: monthKey(r.month), raw: r }))
    .filter((x) => x.key.match(MONTH_SLUG_RE) && x.key <= period.iso)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12)
    .map(({ key, raw }) => ({
      date: monthChartLabel(key),
      value: Math.round(asNumber(raw.median_ppsf) ?? 0),
      rollingAvg: null,
    }))
    .filter((p) => p.value > 0);

  if (points.length === 0) return null;

  return {
    period,
    metric: 'medianPpsf',
    windowLabel: 'Prior 12 months',
    points,
  };
}

// ─────────────────────────────────────────────────────────────────
// getPeriodStats — dispatcher used by the [slug] page
// ─────────────────────────────────────────────────────────────────

export type PeriodStats =
  | { kind: 'week'; stats: WeeklyStats }
  | { kind: 'month'; stats: MonthlyStats };

export async function getPeriodStats(period: Period): Promise<PeriodStats | null> {
  if (period.kind === 'week') {
    const stats = await getWeeklyStats(period);
    return stats ? { kind: 'week', stats } : null;
  }
  const stats = await getMonthlyStats(period);
  return stats ? { kind: 'month', stats } : null;
}
