/**
 * Phoenix Pricing tab — data layer.
 *
 * Reads:
 *   fct_market_pulse_metro      → median close, median ppsf, time series
 *   fct_negotiation_metro       → list-to-sale ratio, pct_above_list, pct_below_list
 *   fct_pricereduction_metro    → pct_with_reduction, mean_reduction_amount
 *   fct_active_by_pricetier     → active inventory distribution by price band
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

interface NegotiationRow extends ScopeFilter {
  month: string;
  closing_count: number | bigint | null;
  median_sale_to_list: number | null;
  mean_sale_to_list: number | null;
  pct_above_list: number | null;
  pct_below_list: number | null;
  median_close_to_original: number | null;
  pct_with_reduction: number | null;
  confidence: string | null;
}

interface PriceReductionRow extends ScopeFilter {
  month: string;
  closing_count: number | bigint | null;
  pct_with_reduction: number | null;
  mean_reduction_amount: number | null;
  median_reduction_amount: number | null;
  mean_net_change_pct: number | null;
  confidence: string | null;
}

interface PriceTierRow extends ScopeFilter {
  price_band: string;
  active_count: number | bigint | null;
  median_dom: number | null;
  median_ppsf: number | null;
  mean_list_price: number | null;
}

export interface PricingSnapshot {
  latestMonthLabel: string;
  medianClose: number | null;
  medianPpsf: number | null;
  medianCloseYoyPct: number | null;
  medianPpsfYoyPct: number | null;
  listToSale: number | null;
  pctAboveList: number | null;
  pctBelowList: number | null;
  pctWithReduction: number | null;
  meanReduction: number | null;
}

export interface PriceTrendPoint {
  month: string;
  medianClose: number | null;
  medianPpsf: number | null;
  closingCount: number;
}

export interface PriceTier {
  band: string;
  count: number;
  medianPpsf: number | null;
  medianDom: number | null;
}

function num(n: number | bigint | null | undefined): number | null {
  if (n == null) return null;
  return typeof n === 'bigint' ? Number(n) : n;
}

function isoMonth(m: unknown): string {
  if (m instanceof Date) return m.toISOString().slice(0, 7);
  if (typeof m === 'string') return String(m).slice(0, 7);
  return String(m);
}

function pctChange(latest: number | null, prior: number | null): number | null {
  if (latest == null || prior == null || prior === 0) return null;
  return ((latest - prior) / prior) * 100;
}

const PRICE_BAND_ORDER = [
  'under_500k',
  '500k_750k',
  '750k_1m',
  '1m_1.5m',
  '1.5m_2m',
  '2m_3m',
  '3m_5m',
  '5m_plus',
];

export async function getPricingSnapshot(): Promise<PricingSnapshot> {
  const [pulse, neg, red] = await Promise.all([
    readMart<MarketPulseRow>('fct_market_pulse_metro'),
    readMart<NegotiationRow>('fct_negotiation_metro'),
    readMart<PriceReductionRow>('fct_pricereduction_metro'),
  ]);

  const metroPulse = filterScope(pulse, METRO_FILTER).slice().sort((a, b) =>
    isoMonth(b.month).localeCompare(isoMonth(a.month)),
  );
  const latest = metroPulse[0];
  const yoy = metroPulse[12]; // 12 months prior

  const metroNeg = filterScope(neg, METRO_FILTER).slice().sort((a, b) =>
    isoMonth(b.month).localeCompare(isoMonth(a.month)),
  );
  const latestNeg = metroNeg[0];

  const metroRed = filterScope(red, METRO_FILTER).slice().sort((a, b) =>
    isoMonth(b.month).localeCompare(isoMonth(a.month)),
  );
  const latestRed = metroRed[0];

  return {
    latestMonthLabel: latest ? isoMonth(latest.month) : '',
    medianClose: num(latest?.median_close),
    medianPpsf: num(latest?.median_ppsf),
    medianCloseYoyPct: pctChange(num(latest?.median_close), num(yoy?.median_close)),
    medianPpsfYoyPct: pctChange(num(latest?.median_ppsf), num(yoy?.median_ppsf)),
    listToSale: num(latestNeg?.median_sale_to_list),
    pctAboveList: num(latestNeg?.pct_above_list),
    pctBelowList: num(latestNeg?.pct_below_list),
    pctWithReduction: num(latestRed?.pct_with_reduction),
    meanReduction: num(latestRed?.mean_reduction_amount),
  };
}

export async function getPriceTrends(months = 12): Promise<PriceTrendPoint[]> {
  const pulse = await readMart<MarketPulseRow>('fct_market_pulse_metro');
  const metroPulse = filterScope(pulse, METRO_FILTER).slice().sort((a, b) =>
    isoMonth(a.month).localeCompare(isoMonth(b.month)),
  );
  return metroPulse.slice(-months).map((r) => ({
    month: isoMonth(r.month),
    medianClose: num(r.median_close),
    medianPpsf: num(r.median_ppsf),
    closingCount: num(r.closing_count) ?? 0,
  }));
}

export async function getActiveByPriceTier(): Promise<PriceTier[]> {
  const rows = await readMart<PriceTierRow>('fct_active_by_pricetier');
  const metroRows = rows.filter(
    (r) =>
      r.scope_type === 'metro' &&
      r.scope_key === 'phoenix_metro' &&
      r.property_segment === 'all',
  );
  // Sort by canonical price band order
  metroRows.sort((a, b) => {
    const ai = PRICE_BAND_ORDER.indexOf(a.price_band);
    const bi = PRICE_BAND_ORDER.indexOf(b.price_band);
    if (ai === -1 || bi === -1) return a.price_band.localeCompare(b.price_band);
    return ai - bi;
  });
  return metroRows.map((r) => ({
    band: r.price_band,
    count: num(r.active_count) ?? 0,
    medianPpsf: num(r.median_ppsf),
    medianDom: num(r.median_dom),
  }));
}
