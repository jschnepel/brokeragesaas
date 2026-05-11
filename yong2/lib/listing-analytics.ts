/**
 * Listing-detail analytics shim. Reads dbt-built marts (Spark → RDS →
 * dbt → S3 → CloudFront → lib/marts.ts) and shapes them for the
 * listing-detail "The Read" section.
 *
 * Phase 1 — Phoenix metro scope:
 *   Returns metro-wide aggregates as the comp baseline for every
 *   listing. The visitor reads how their subject prices and paces
 *   against the broader metro market. Honest about scope ("Phoenix
 *   Metro · 12-month read") so they don't read it as community-local.
 *
 * Future iterations would map listing → region/community via
 * matchCuratedCommunity() and switch the scope on the readMart calls.
 * The mart shape is identical at every scope; only the filter changes.
 *
 * Returns null when the marts don't have enough recent data to fill
 * the panel (cold cache failure, schema drift, etc.). Caller hides
 * the section entirely on null — never renders a half-empty card.
 */

import { filterScope, readMart, type MarketPulseRow, type ScopeFilter } from './marts';
import type { Listing } from './types';

interface MosRow extends ScopeFilter {
  months_of_supply_12mo: number | null;
  months_of_supply_3mo: number | null;
}

export interface ListingReadData {
  subjectPpsf: number;
  compMedianPpsf: number;
  compPoolSize: number;
  areaMedianDom: number;
  areaMonthsOfSupply: number;
  areaYoYPriceChangePct: number;
  areaLabel: string;
}

const METRO_FILTER: ScopeFilter = {
  scope_type: 'metro',
  scope_key: 'phoenix_metro',
  property_segment: 'residential',
};

/**
 * Build the props object for MockTheRead. Returns null when the
 * subject doesn't carry a pricePerSqft (e.g. land lots) or the marts
 * are unreachable / underpopulated — caller skips the section.
 */
export async function getListingReadData(
  listing: Listing,
): Promise<ListingReadData | null> {
  if (!listing.pricePerSqft || listing.pricePerSqft <= 0) return null;

  let pulseRows: MarketPulseRow[];
  let mosRows: MosRow[];
  try {
    [pulseRows, mosRows] = await Promise.all([
      readMart<MarketPulseRow>('fct_market_pulse_metro'),
      readMart<MosRow>('fct_months_of_supply'),
    ]);
  } catch {
    return null;
  }

  const metroPulse = filterScope(pulseRows, METRO_FILTER)
    // Most recent month first — drives YoY + median snapshot.
    .sort((a, b) => (a.month < b.month ? 1 : -1));
  const latest = metroPulse[0];
  if (!latest) return null;

  const latestMedianPpsf = num(latest.median_ppsf);
  const latestMedianDom = num(latest.median_dom);
  if (latestMedianPpsf == null || latestMedianDom == null) return null;

  // YoY = (latest month median_ppsf - same-month-prior-year median_ppsf)
  // / same-month-prior-year. Falls back to null when the prior-year row
  // is missing or zero.
  const yoyRow = metroPulse.find((r) => {
    if (!r.month) return false;
    const latestDate = new Date(latest.month);
    const rDate = new Date(r.month);
    return (
      rDate.getUTCMonth() === latestDate.getUTCMonth() &&
      rDate.getUTCFullYear() === latestDate.getUTCFullYear() - 1
    );
  });
  const priorYearPpsf = num(yoyRow?.median_ppsf);
  const yoy =
    priorYearPpsf != null && priorYearPpsf > 0
      ? (latestMedianPpsf - priorYearPpsf) / priorYearPpsf
      : 0;

  // 12-month comp pool size = sum of monthly closing counts (caps the
  // recency window to one year so it stays representative of the
  // current market, not a multi-year aggregate).
  const last12 = metroPulse.slice(0, 12);
  const compPoolSize = last12.reduce(
    (sum, r) => sum + (num(r.closing_count) ?? 0),
    0,
  );

  // Months of supply — prefer the 12-mo measure when present (more
  // stable for luxury inventory's slow churn) and fall back to 3-mo.
  const metroMos = filterScope(mosRows, METRO_FILTER)[0];
  const mos =
    num(metroMos?.months_of_supply_12mo) ??
    num(metroMos?.months_of_supply_3mo) ??
    0;

  return {
    subjectPpsf: listing.pricePerSqft,
    compMedianPpsf: latestMedianPpsf,
    compPoolSize,
    areaMedianDom: Math.round(latestMedianDom),
    areaMonthsOfSupply: mos,
    areaYoYPriceChangePct: yoy,
    areaLabel: 'Phoenix Metro',
  };
}

function num(v: number | bigint | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'bigint' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}
