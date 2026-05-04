/**
 * Market Analytics query layer — reads from RDS analytics materialized views.
 *
 * Source MVs (refreshed every 4 hours by rlsir-armls-sync Lambda):
 *   mv_market_pulse        — monthly aggregates by (scope_type, scope_key, segment, status)
 *   mv_supply_demand       — listings/closings by month
 *   mv_price_bands         — price-bucket counts by month
 *   mv_inventory_age       — DOM-bucketed counts (current snapshot)
 *
 * These MVs are pre-rolled-up by (scope_type, scope_key, property_segment).
 * Filter on those dimensions directly — no city/postal aggregation needed.
 *
 * NOTE: mv_heatmap_active / mv_heatmap_sold do NOT exist on the real RDS.
 * Heatmap support has been removed. If needed, source from mv_active_listings
 * (latitude, longitude, list_price, etc.) directly.
 */

import { query } from './db';
import type {
  AnalyticsScope,
  MarketPulseRow,
  SupplyDemandRow,
  PriceBandRow,
  InventoryAgeRow,
} from './types';

// ── Helpers ─────────────────────────────────────────

function buildScopeWhere(
  scope: AnalyticsScope,
  params: unknown[],
  startIdx = 1,
): { conditions: string[]; nextIdx: number } {
  const segment = scope.propertySegment ?? 'residential';
  const conditions: string[] = [
    `scope_type = $${startIdx}`,
    `scope_key = $${startIdx + 1}`,
    `property_segment = $${startIdx + 2}`,
  ];
  params.push(scope.scopeType, scope.scopeKey, segment);
  return { conditions, nextIdx: startIdx + 3 };
}

function pNum(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

function pInt(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseInt(v, 10) : Math.round(v);
  return Number.isFinite(n) ? n : 0;
}

function monthToIso(m: Date | string): string {
  if (m instanceof Date) return m.toISOString();
  return new Date(m).toISOString();
}

// ── Market Pulse ────────────────────────────────────

interface MarketPulseDbRow {
  month: Date | string;
  standard_status: string;
  listing_count: string | number | null;
  closed_count: string | number | null;
  median_close_price: string | number | null;
  avg_close_price: string | number | null;
  median_list_price: string | number | null;
  avg_dom: string | number | null;
  median_dom: string | number | null;
  avg_price_per_sqft: string | number | null;
  total_volume: string | number | null;
}

export async function getMarketPulse(
  scope: AnalyticsScope,
  months = 12,
): Promise<MarketPulseRow[]> {
  const params: unknown[] = [];
  const { conditions } = buildScopeWhere(scope, params);
  conditions.push(`month >= date_trunc('month', NOW() - interval '${months} months')`);
  conditions.push(`month <= date_trunc('month', NOW() + interval '1 month')`);
  const where = `WHERE ${conditions.join(' AND ')}`;

  const sql = `
    SELECT month, standard_status,
      listing_count, closed_count,
      median_close_price, avg_close_price, median_list_price,
      avg_dom, median_dom, avg_price_per_sqft, total_volume
    FROM mv_market_pulse
    ${where}
    ORDER BY month ASC, standard_status ASC
  `;
  const { rows } = await query<MarketPulseDbRow>(sql, params);
  return rows.map((r) => ({
    month: monthToIso(r.month),
    standardStatus: r.standard_status,
    listingCount: pInt(r.listing_count),
    closedCount: pInt(r.closed_count),
    medianClosePrice: pNum(r.median_close_price),
    avgClosePrice: pNum(r.avg_close_price),
    medianListPrice: pNum(r.median_list_price),
    avgDom: pNum(r.avg_dom),
    medianDom: pNum(r.median_dom),
    avgPricePerSqft: pNum(r.avg_price_per_sqft),
    totalVolume: pNum(r.total_volume),
  }));
}

// ── Supply & Demand ─────────────────────────────────

interface SupplyDemandDbRow {
  month: Date | string;
  new_listings: string | number | null;
  closed_sales: string | number | null;
}

export async function getSupplyDemand(
  scope: AnalyticsScope,
  months = 12,
): Promise<SupplyDemandRow[]> {
  const params: unknown[] = [];
  const { conditions } = buildScopeWhere(scope, params);
  conditions.push(`month >= date_trunc('month', NOW() - interval '${months} months')`);
  conditions.push(`month <= date_trunc('month', NOW() + interval '1 month')`);
  const where = `WHERE ${conditions.join(' AND ')}`;

  const sql = `
    SELECT month, new_listings, closed_sales
    FROM mv_supply_demand
    ${where}
    ORDER BY month ASC
  `;
  const { rows } = await query<SupplyDemandDbRow>(sql, params);
  return rows.map((r) => ({
    month: monthToIso(r.month),
    newListings: pInt(r.new_listings),
    closedSales: pInt(r.closed_sales),
  }));
}

// ── Price Bands ─────────────────────────────────────

interface PriceBandDbRow {
  month: Date | string;
  price_band: string;
  standard_status: string;
  listing_count: string | number | null;
  avg_dom: string | number | null;
  median_price_in_band: string | number | null;
}

export async function getPriceBands(
  scope: AnalyticsScope,
  status?: string,
): Promise<PriceBandRow[]> {
  const params: unknown[] = [];
  const { conditions, nextIdx } = buildScopeWhere(scope, params);
  let i = nextIdx;
  if (status) {
    conditions.push(`standard_status = $${i++}`);
    params.push(status);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;

  const sql = `
    SELECT month, price_band, standard_status,
      listing_count, avg_dom, median_price_in_band
    FROM mv_price_bands
    ${where}
    ORDER BY month ASC, price_band ASC
  `;
  const { rows } = await query<PriceBandDbRow>(sql, params);
  return rows.map((r) => ({
    month: monthToIso(r.month),
    priceBand: r.price_band,
    standardStatus: r.standard_status,
    listingCount: pInt(r.listing_count),
    avgDom: pNum(r.avg_dom),
    medianPriceInBand: pNum(r.median_price_in_band),
  }));
}

// ── Inventory Age ───────────────────────────────────

interface InventoryAgeDbRow {
  month: string;
  dom_bucket: string;
  listing_count: string | number | null;
  avg_list_price: string | number | null;
}

export async function getInventoryAge(scope: AnalyticsScope): Promise<InventoryAgeRow[]> {
  const params: unknown[] = [];
  const { conditions } = buildScopeWhere(scope, params);
  const where = `WHERE ${conditions.join(' AND ')}`;

  const sql = `
    SELECT month, dom_bucket, listing_count, avg_list_price
    FROM mv_inventory_age
    ${where}
    ORDER BY dom_bucket ASC
  `;
  const { rows } = await query<InventoryAgeDbRow>(sql, params);
  return rows.map((r) => ({
    month: r.month,
    domBucket: r.dom_bucket,
    listingCount: pInt(r.listing_count),
    avgListPrice: pNum(r.avg_list_price),
  }));
}

// ── Heatmap (REMOVED) ───────────────────────────────
// mv_heatmap_active and mv_heatmap_sold do not exist on the real RDS schema.
// If a heatmap surface returns to yong2, build it from mv_active_listings
// (latitude/longitude/list_price) directly with H3 aggregation.
