/**
 * Phoenix Timing tab — data layer.
 *
 * Reads:
 *   fct_market_pulse_metro      → 24-month seasonal overlay (current vs prior year)
 *   fct_status_velocity         → median DOM trend over time
 *   fct_active_dom_distribution → seasonal pace by DOM band (single snapshot)
 *
 * Goal: surface seasonality + market timing — best months to list/sell,
 * pace trend, and how the current cohort compares to a year ago.
 */
import {
  readMart,
  filterScope,
  type MarketPulseRow,
  type ScopeFilter,
} from '@/lib/marts';

const METRO_FILTER: ScopeFilter = {
  scope_type: 'metro',
  scope_key: 'phoenix_metro',
  property_segment: 'all',
};

interface StatusVelocityRow extends ScopeFilter {
  month: string;
  cohort_size: number | bigint | null;
  median_days_to_pending: number | null;
  median_days_pending_to_closed: number | null;
  median_days_active_to_closed: number | null;
  confidence: string | null;
}

export interface SeasonalRow {
  monthOfYear: number;          // 1-12
  monthLabel: string;            // 'January'
  currentClosings: number | null;
  priorClosings: number | null;
  currentMedianClose: number | null;
  priorMedianClose: number | null;
}

export interface VelocityTrendPoint {
  month: string;
  cohortSize: number;
  medianDaysToPending: number | null;
  medianDaysPendingToClosed: number | null;
  medianDaysActiveToClosed: number | null;
  confidence: string | null;
}

export interface TimingSummary {
  bestMonth: { label: string; closings: number } | null;
  worstMonth: { label: string; closings: number } | null;
  yoyClosingsPct: number | null;
  yoyMedianClosePct: number | null;
  currentMonthLabel: string;
  currentMedianDom: number | null;
  prior12mMedianDom: number | null;
}

function num(n: number | bigint | null | undefined): number | null {
  if (n == null) return null;
  return typeof n === 'bigint' ? Number(n) : n;
}
function isoMonth(m: unknown): string {
  if (m instanceof Date) return m.toISOString().slice(0, 7);
  return String(m).slice(0, 7);
}
function pctChange(latest: number | null, prior: number | null): number | null {
  if (latest == null || prior == null || prior === 0) return null;
  return ((latest - prior) / prior) * 100;
}
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function getSeasonalOverlay(): Promise<SeasonalRow[]> {
  const pulse = await readMart<MarketPulseRow>('fct_market_pulse_metro');
  const metroPulse = filterScope(pulse, METRO_FILTER).slice().sort((a, b) =>
    isoMonth(b.month).localeCompare(isoMonth(a.month)),
  );

  // Latest 24 months — split into current 12 and prior 12 by calendar month
  const last24 = metroPulse.slice(0, 24);
  const current12 = last24.slice(0, 12);
  const prior12 = last24.slice(12, 24);

  const overlay: SeasonalRow[] = [];
  for (let i = 1; i <= 12; i++) {
    const cur = current12.find((r) => Number(isoMonth(r.month).slice(5, 7)) === i);
    const pri = prior12.find((r) => Number(isoMonth(r.month).slice(5, 7)) === i);
    overlay.push({
      monthOfYear: i,
      monthLabel: MONTH_NAMES[i - 1],
      currentClosings: cur ? num(cur.closing_count) : null,
      priorClosings: pri ? num(pri.closing_count) : null,
      currentMedianClose: cur ? num(cur.median_close) : null,
      priorMedianClose: pri ? num(pri.median_close) : null,
    });
  }
  return overlay;
}

export async function getVelocityTrend(months = 12): Promise<VelocityTrendPoint[]> {
  const rows = await readMart<StatusVelocityRow>('fct_status_velocity');
  const metroRows = filterScope(rows, METRO_FILTER).slice().sort((a, b) =>
    isoMonth(a.month).localeCompare(isoMonth(b.month)),
  );
  return metroRows.slice(-months).map((r) => ({
    month: isoMonth(r.month),
    cohortSize: num(r.cohort_size) ?? 0,
    medianDaysToPending: num(r.median_days_to_pending),
    medianDaysPendingToClosed: num(r.median_days_pending_to_closed),
    medianDaysActiveToClosed: num(r.median_days_active_to_closed),
    confidence: r.confidence ?? null,
  }));
}

export async function getTimingSummary(): Promise<TimingSummary> {
  const overlay = await getSeasonalOverlay();
  const pulse = await readMart<MarketPulseRow>('fct_market_pulse_metro');
  const metroPulse = filterScope(pulse, METRO_FILTER).slice().sort((a, b) =>
    isoMonth(b.month).localeCompare(isoMonth(a.month)),
  );
  const latest = metroPulse[0];
  const yoy = metroPulse[12]; // 12mo prior
  const last12 = metroPulse.slice(0, 12);
  const prior12_12 = metroPulse.slice(12, 24);

  // Best/worst month within current 12mo by closings
  const monthsWithData = overlay.filter((r) => r.currentClosings != null && r.currentClosings > 0);
  const best = monthsWithData.reduce<SeasonalRow | null>((b, r) =>
    !b || (r.currentClosings ?? 0) > (b.currentClosings ?? 0) ? r : b, null);
  const worst = monthsWithData.reduce<SeasonalRow | null>((b, r) =>
    !b || (r.currentClosings ?? 0) < (b.currentClosings ?? 0) ? r : b, null);

  // Median DOM across last 12mo (avg of medians — informational)
  const last12Doms = last12.map((r) => num(r.median_dom)).filter((n): n is number => n != null);
  const prior12Doms = prior12_12.map((r) => num(r.median_dom)).filter((n): n is number => n != null);
  const avg = (xs: number[]) => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;

  return {
    bestMonth: best ? { label: best.monthLabel, closings: best.currentClosings ?? 0 } : null,
    worstMonth: worst ? { label: worst.monthLabel, closings: worst.currentClosings ?? 0 } : null,
    yoyClosingsPct: pctChange(num(latest?.closing_count), num(yoy?.closing_count)),
    yoyMedianClosePct: pctChange(num(latest?.median_close), num(yoy?.median_close)),
    currentMonthLabel: latest ? isoMonth(latest.month) : '',
    currentMedianDom: avg(last12Doms),
    prior12mMedianDom: avg(prior12Doms),
  };
}
