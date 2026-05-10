/**
 * Phoenix Activity tab — data layer.
 *
 * Reads:
 *   fct_market_pulse_metro    → closings by month, total volume
 *   fct_active_inventory      → pending + active counts (right now)
 *   fct_status_velocity       → median days_to_pending + days_pending_to_closed
 *   fct_buyer_office          → top buyer offices by year (no scope dim)
 */
import {
  readMart,
  filterScope,
  type MarketPulseRow,
  type ActiveInventoryRow,
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
  pct_back_on_market: number | null;
  confidence: string | null;
}

interface BuyerOfficeRow {
  year: number;
  buyer_office_name: string | null;
  buyer_office_key: string | null;
  deals: number | bigint | null;
  total_volume: number | null;
  median_close: number | null;
  median_dom: number | null;
  median_sale_to_list: number | null;
  dual_rep_deals: number | bigint | null;
  pct_dual_rep: number | null;
}

export interface ActivitySnapshot {
  pending: number;
  active: number;
  closingsLastMonth: number;
  closingsLast3mo: number;
  totalVolumeLast3mo: number;
  medianDaysToPending: number | null;
  medianDaysPendingToClosed: number | null;
  medianDaysActiveToClosed: number | null;
  pctBackOnMarket: number | null;
  latestMonthLabel: string;
  velocityCohortMonth: string;
}

export interface ClosingsMonth {
  month: string;
  closings: number;
  totalVolume: number;
  medianClose: number | null;
}

export interface BuyerOfficeRanking {
  office: string;
  deals: number;
  totalVolume: number;
  medianClose: number | null;
  medianDom: number | null;
  pctDualRep: number | null;
}

function num(n: number | bigint | null | undefined): number | null {
  if (n == null) return null;
  return typeof n === 'bigint' ? Number(n) : n;
}
function isoMonth(m: unknown): string {
  if (m instanceof Date) return m.toISOString().slice(0, 7);
  return String(m).slice(0, 7);
}

export async function getActivitySnapshot(): Promise<ActivitySnapshot> {
  const [pulse, inv, vel] = await Promise.all([
    readMart<MarketPulseRow>('fct_market_pulse_metro'),
    readMart<ActiveInventoryRow>('fct_active_inventory'),
    readMart<StatusVelocityRow>('fct_status_velocity'),
  ]);

  const metroPulse = filterScope(pulse, METRO_FILTER).slice().sort((a, b) =>
    isoMonth(b.month).localeCompare(isoMonth(a.month)),
  );
  const last3 = metroPulse.slice(0, 3);
  const latest = metroPulse[0];

  const metroInv = filterScope(inv, METRO_FILTER)[0];

  // Status velocity has the freshest reliable cohort = latest month with cohort_size > 100
  const metroVel = filterScope(vel, METRO_FILTER).slice().sort((a, b) =>
    isoMonth(b.month).localeCompare(isoMonth(a.month)),
  );
  const reliableVel = metroVel.find((r) => (num(r.cohort_size) ?? 0) >= 100) ?? metroVel[0];

  return {
    pending: num(metroInv?.pending_count) ?? 0,
    active: num(metroInv?.strict_active_count) ?? 0,
    closingsLastMonth: num(latest?.closing_count) ?? 0,
    closingsLast3mo: last3.reduce((s, r) => s + (num(r.closing_count) ?? 0), 0),
    totalVolumeLast3mo: last3.reduce((s, r) => s + (num(r.total_volume) ?? 0), 0),
    medianDaysToPending: num(reliableVel?.median_days_to_pending),
    medianDaysPendingToClosed: num(reliableVel?.median_days_pending_to_closed),
    medianDaysActiveToClosed: num(reliableVel?.median_days_active_to_closed),
    pctBackOnMarket: num(reliableVel?.pct_back_on_market),
    latestMonthLabel: latest ? isoMonth(latest.month) : '',
    velocityCohortMonth: reliableVel ? isoMonth(reliableVel.month) : '',
  };
}

export async function getClosingsByMonth(months = 12): Promise<ClosingsMonth[]> {
  const pulse = await readMart<MarketPulseRow>('fct_market_pulse_metro');
  const metroPulse = filterScope(pulse, METRO_FILTER).slice().sort((a, b) =>
    isoMonth(a.month).localeCompare(isoMonth(b.month)),
  );
  return metroPulse.slice(-months).map((r) => ({
    month: isoMonth(r.month),
    closings: num(r.closing_count) ?? 0,
    totalVolume: num(r.total_volume) ?? 0,
    medianClose: num(r.median_close),
  }));
}

export async function getTopBuyerOffices(limit = 10): Promise<BuyerOfficeRanking[]> {
  const rows = await readMart<BuyerOfficeRow>('fct_buyer_office');
  const latestYear = rows.reduce((y, r) => Math.max(y, r.year), 0);
  return rows
    .filter((r) => r.year === latestYear && r.buyer_office_name)
    .sort((a, b) => (num(b.deals) ?? 0) - (num(a.deals) ?? 0))
    .slice(0, limit)
    .map((r) => ({
      office: r.buyer_office_name as string,
      deals: num(r.deals) ?? 0,
      totalVolume: num(r.total_volume) ?? 0,
      medianClose: num(r.median_close),
      medianDom: num(r.median_dom),
      pctDualRep: num(r.pct_dual_rep),
    }));
}

export async function getLatestBuyerOfficeYear(): Promise<number> {
  const rows = await readMart<BuyerOfficeRow>('fct_buyer_office');
  return rows.reduce((y, r) => Math.max(y, r.year), 0);
}
