/**
 * Phoenix Inventory tab — data layer.
 *
 * Reads:
 *   fct_active_inventory           → strict_active / pending / coming_soon, median list, ppsf, DOM
 *   fct_months_of_supply           → 3mo + 12mo MoS, market classification
 *   fct_listing_pace               → weekly new listings, 4wk + 52wk avg, pct vs 52wk
 *   fct_active_dom_distribution    → active count by DOM band
 */
import {
  readMart,
  filterScope,
  type ActiveInventoryRow,
  type ScopeFilter,
} from '@/lib/marts';

const METRO_FILTER: ScopeFilter = {
  scope_type: 'metro',
  scope_key: 'phoenix_metro',
  property_segment: 'all',
};

interface MosRow extends ScopeFilter {
  active_count: number | bigint | null;
  avg_monthly_closings_12mo: number | null;
  avg_monthly_closings_3mo: number | null;
  months_of_supply_12mo: number | null;
  months_of_supply_3mo: number | null;
  market_classification: string | null;
  confidence: string | null;
}

interface PaceRow extends ScopeFilter {
  week: string;
  new_listings_count: number | bigint | null;
  new_listings_4wk_avg: number | null;
  new_listings_52wk_avg: number | null;
  pct_change_vs_52wk: number | null;
  confidence: string | null;
}

interface DomRow extends ScopeFilter {
  dom_band: string;
  active_count: number | bigint | null;
  mean_list_price: number | null;
  median_ppsf: number | null;
  confidence: string | null;
}

export interface InventorySnapshot {
  strictActive: number;
  pending: number;
  comingSoon: number;
  totalActive: number;
  medianListPrice: number | null;
  medianPpsf: number | null;
  medianDom: number | null;
  monthsOfSupply3mo: number | null;
  monthsOfSupply12mo: number | null;
  marketClassification: string | null;
  avgMonthlyClosings3mo: number | null;
  avgMonthlyClosings12mo: number | null;
}

export interface PaceWeek {
  week: string;
  newListings: number;
  fourWkAvg: number | null;
  fiftyTwoWkAvg: number | null;
  pctVs52: number | null;
}

export interface DomBucket {
  band: string;
  count: number;
  meanListPrice: number | null;
  medianPpsf: number | null;
}

const DOM_ORDER = ['0-7', '8-14', '15-30', '31-60', '61-90', '91-180', '180+'];

function num(n: number | bigint | null | undefined): number | null {
  if (n == null) return null;
  return typeof n === 'bigint' ? Number(n) : n;
}

function isoDate(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export async function getInventorySnapshot(): Promise<InventorySnapshot> {
  const [inv, mos] = await Promise.all([
    readMart<ActiveInventoryRow>('fct_active_inventory'),
    readMart<MosRow>('fct_months_of_supply'),
  ]);
  const metroInv = filterScope(inv, METRO_FILTER)[0];
  const metroMos = filterScope(mos, METRO_FILTER)[0];

  const strictActive = num(metroInv?.strict_active_count) ?? 0;
  const pending = num(metroInv?.pending_count) ?? 0;
  const comingSoon = num(metroInv?.coming_soon_count) ?? 0;

  return {
    strictActive,
    pending,
    comingSoon,
    totalActive: strictActive + pending + comingSoon,
    medianListPrice: num(metroInv?.median_list_price),
    medianPpsf: num(metroInv?.median_ppsf),
    medianDom: num(metroInv?.median_dom),
    monthsOfSupply3mo: num(metroMos?.months_of_supply_3mo),
    monthsOfSupply12mo: num(metroMos?.months_of_supply_12mo),
    marketClassification: metroMos?.market_classification ?? null,
    avgMonthlyClosings3mo: num(metroMos?.avg_monthly_closings_3mo),
    avgMonthlyClosings12mo: num(metroMos?.avg_monthly_closings_12mo),
  };
}

export async function getPaceWeeks(weeks = 12): Promise<PaceWeek[]> {
  const rows = await readMart<PaceRow>('fct_listing_pace');
  const metroRows = filterScope(rows, METRO_FILTER)
    .slice()
    .sort((a, b) => isoDate(a.week).localeCompare(isoDate(b.week)));
  return metroRows.slice(-weeks).map((r) => ({
    week: isoDate(r.week),
    newListings: num(r.new_listings_count) ?? 0,
    fourWkAvg: num(r.new_listings_4wk_avg),
    fiftyTwoWkAvg: num(r.new_listings_52wk_avg),
    pctVs52: num(r.pct_change_vs_52wk),
  }));
}

export async function getDomDistribution(): Promise<DomBucket[]> {
  const rows = await readMart<DomRow>('fct_active_dom_distribution');
  const metroRows = filterScope(rows, METRO_FILTER);
  return metroRows
    .slice()
    .sort((a, b) => DOM_ORDER.indexOf(a.dom_band) - DOM_ORDER.indexOf(b.dom_band))
    .map((r) => ({
      band: r.dom_band,
      count: num(r.active_count) ?? 0,
      meanListPrice: num(r.mean_list_price),
      medianPpsf: num(r.median_ppsf),
    }));
}
