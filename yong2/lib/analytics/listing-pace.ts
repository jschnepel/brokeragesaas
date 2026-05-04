/**
 * Per-listing pace KPIs for "The Read" header strip.
 *
 * Pure assembler — composes data already loaded by getActiveComps + getAreaRead
 * plus a single direct read against `analytics_base` for the `has_price_reduction`
 * flag (the mv_active_listings row carries `days_on_market` + `price_per_sqft`
 * but not the reduction flag, which only lives on the canonical analytics row).
 *
 * No new MV/scope SQL beyond that one cheap point-read.
 */

import type { Listing } from '../types';
import type { CompResult } from './comps';
import type { AreaRead } from './area';
import { query } from '../db';

export type ListingPace = {
  daysOnMarket: number | null;
  communityMedianDom: number | null;
  pricePerSqft: number | null;
  /**
   * Fractional delta — (this_ppsf - comp_median) / comp_median.
   * e.g. 0.17 => +17%. Null when either side is null/zero.
   */
  vsCompMedianPctDelta: number | null;
  monthsOfSupply: number | null;
  hasPriceReduction: boolean;
  yoyPriceChangePct: number | null;
};

interface ReductionRow {
  has_price_reduction: boolean | null;
}

interface MosRow {
  months_of_supply: string | number | null;
}

function pNum(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

export async function getListingPace(
  target: Listing,
  comp: CompResult,
  area: AreaRead | null,
): Promise<ListingPace> {
  // Read price-reduction flag from analytics_base (cheap, indexed lookup).
  // analytics_base may not have a row for every active listing — fall back
  // to false rather than null.
  let hasPriceReduction = false;
  if (target.listingKey) {
    const r = await query<ReductionRow>(
      `SELECT has_price_reduction FROM analytics_base WHERE listing_key = $1 LIMIT 1`,
      [target.listingKey],
    ).catch(() => ({ rows: [] as ReductionRow[] }));
    if (r.rows[0]?.has_price_reduction) hasPriceReduction = true;
  }

  // Months of supply — area row already knows the scope, but mv_community_scorecard
  // is the single source of truth. Fetch it here so the pace KPI matches the
  // community page exactly.
  let monthsOfSupply: number | null = null;
  if (area) {
    const r = await query<MosRow>(
      `SELECT months_of_supply
       FROM mv_community_scorecard
       WHERE scope_type = $1 AND scope_key = $2 AND property_segment = 'residential'
       LIMIT 1`,
      [area.scopeType, area.scopeKey],
    ).catch(() => ({ rows: [] as MosRow[] }));
    monthsOfSupply = r.rows[0] ? pNum(r.rows[0].months_of_supply) : null;
  }

  const ppsf = target.pricePerSqft;
  const compMed = comp.medianAskingPpsf;
  const vsCompMedianPctDelta =
    ppsf != null && compMed != null && compMed > 0 ? (ppsf - compMed) / compMed : null;

  return {
    daysOnMarket: target.daysOnMarket,
    communityMedianDom: area?.medianDom ?? null,
    pricePerSqft: ppsf,
    vsCompMedianPctDelta,
    monthsOfSupply,
    hasPriceReduction,
    yoyPriceChangePct: area?.yoyPriceChangePct ?? null,
  };
}
