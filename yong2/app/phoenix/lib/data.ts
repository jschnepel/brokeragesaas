/**
 * Phoenix dashboard data layer.
 *
 * Reads dbt parquet marts via lib/marts.ts (CloudFront-cached). Server-only.
 * Composes the metro snapshot, top regions, and notable-community list for
 * the page, using only the marts that fit comfortably under Amplify's 30s
 * SSR timeout (metro + region; community/subdivision splits are >40MB).
 */
import {
  readMart,
  filterScope,
  type MarketPulseRow,
  type ActiveInventoryRow,
  type ScopeFilter,
} from '@/lib/marts';

export interface MetroSnapshot {
  active: number;
  pending: number;
  comingSoon: number;
  medianClose: number | null;
  medianDom: number | null;
  medianPpsf: number | null;
  totalVolume6mo: number;
  closingCount6mo: number;
  latestMonthLabel: string;
}

export interface RegionRow {
  scopeKey: string;
  name: string;
  closingCount: number;
  medianClose: number | null;
  medianDom: number | null;
  totalVolume: number;
}

export interface CommunityHighlightRow {
  scope_type: string;
  scope_key: string;
  property_segment: string;
  region_name: string | null;
  community_name: string | null;
  closes_12mo: number | null;
  median_close_12mo: number | null;
  median_ppsf_12mo: number | null;
  median_dom_12mo: number | null;
}

const METRO_FILTER: ScopeFilter = {
  scope_type: 'metro',
  scope_key: 'phoenix_metro',
  property_segment: 'all',
};

function num(n: number | bigint | null | undefined): number | null {
  if (n == null) return null;
  return typeof n === 'bigint' ? Number(n) : n;
}

function isoMonth(m: unknown): string {
  if (m instanceof Date) return m.toISOString().slice(0, 7);
  if (typeof m === 'string') return String(m).slice(0, 7);
  return String(m);
}

function regionLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function getMetroSnapshot(): Promise<MetroSnapshot> {
  const [pulse, inventory] = await Promise.all([
    readMart<MarketPulseRow>('fct_market_pulse_metro'),
    readMart<ActiveInventoryRow>('fct_active_inventory'),
  ]);

  const metroPulse = filterScope(pulse, METRO_FILTER);
  const sortedDesc = metroPulse.slice().sort((a, b) =>
    isoMonth(b.month).localeCompare(isoMonth(a.month)),
  );
  const last6 = sortedDesc.slice(0, 6);
  const latest = last6[0];

  const metroInv = filterScope(inventory, METRO_FILTER)[0];

  const closingCount6mo = last6.reduce((s, r) => s + (num(r.closing_count) ?? 0), 0);
  const totalVolume6mo = last6.reduce((s, r) => s + (num(r.total_volume) ?? 0), 0);

  return {
    active: num(metroInv?.strict_active_count) ?? 0,
    pending: num(metroInv?.pending_count) ?? 0,
    comingSoon: num(metroInv?.coming_soon_count) ?? 0,
    medianClose: num(latest?.median_close),
    medianDom: num(latest?.median_dom),
    medianPpsf: num(latest?.median_ppsf),
    totalVolume6mo,
    closingCount6mo,
    latestMonthLabel: latest ? isoMonth(latest.month) : '',
  };
}

export async function getTopRegions(limit = 6): Promise<RegionRow[]> {
  const pulse = await readMart<MarketPulseRow>('fct_market_pulse_region');
  const allRegionsAll = pulse.filter(
    (r) => r.scope_type === 'region' && r.property_segment === 'all',
  );

  // Pick latest month available for each region, then sort by closing_count desc.
  const byRegion = new Map<string, MarketPulseRow>();
  for (const row of allRegionsAll) {
    const key = row.scope_key;
    const cur = byRegion.get(key);
    if (!cur || isoMonth(row.month) > isoMonth(cur.month)) byRegion.set(key, row);
  }

  return Array.from(byRegion.values())
    .filter((r) => (num(r.closing_count) ?? 0) > 0)
    .sort((a, b) => (num(b.closing_count) ?? 0) - (num(a.closing_count) ?? 0))
    .slice(0, limit)
    .map((r) => ({
      scopeKey: r.scope_key,
      name: regionLabel(r.scope_key),
      closingCount: num(r.closing_count) ?? 0,
      medianClose: num(r.median_close),
      medianDom: num(r.median_dom),
      totalVolume: num(r.total_volume) ?? 0,
    }));
}

export async function getNotableCommunities(limit = 8): Promise<CommunityHighlightRow[]> {
  const rows = await readMart<CommunityHighlightRow>('fct_community_scorecard');
  return rows
    .filter(
      (r) =>
        r.scope_type === 'community' &&
        r.property_segment === 'all' &&
        (num(r.closes_12mo) ?? 0) > 0,
    )
    .sort((a, b) => (num(b.closes_12mo) ?? 0) - (num(a.closes_12mo) ?? 0))
    .slice(0, limit);
}
