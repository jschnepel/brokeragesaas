/**
 * Analytics Query Layer
 * All queries run against RDS (ARMLS mirror) materialized views.
 * Returns typed rows for the market analytics pages.
 *
 * Key design: materialized views are grouped by city/postal_code/subdivision_name.
 * When querying metro-wide (no geo filter), we re-aggregate across geo dimensions
 * to avoid returning hundreds of thousands of per-geo rows.
 */

import type { QueryResultRow } from 'pg';
import { rdsQuery } from '../rds-client';
import type {
  GeoFilter,
  PortfolioFilter,
  PortfolioTrendRow,
  MarketPulseRow,
  PriceBandRow,
  SupplyDemandRow,
  InventoryAgeRow,
  CommunityScorecard,
  FeaturePriceImpact,
  HeatmapPoint,
} from '@platform/shared';

// ── Shared Helpers ──────────────────────────────────

function buildGeoWhere(
  filter: GeoFilter,
  params: unknown[],
  startIdx = 1,
): { conditions: string[]; nextIdx: number } {
  const conditions: string[] = [];
  let idx = startIdx;

  if (filter.city) {
    conditions.push(`city ILIKE $${idx++}`);
    params.push(filter.city);
  }
  if (filter.postalCode) {
    conditions.push(`postal_code = $${idx++}`);
    params.push(filter.postalCode);
  }
  if (filter.subdivisionName) {
    conditions.push(`subdivision_name ILIKE $${idx++}`);
    params.push(`%${filter.subdivisionName}%`);
  }

  return { conditions, nextIdx: idx };
}

// ── Market Pulse (Category 1) ───────────────────────

interface MarketPulseDbRow extends QueryResultRow {
  month: Date;
  standard_status: string;
  listing_count: string;
  avg_list_price: string | null;
  median_list_price: string | null;
  avg_close_price: string | null;
  median_close_price: string | null;
  avg_price_per_sqft: string | null;
  median_price_per_sqft: string | null;
  avg_close_price_per_sqft: string | null;
  median_close_price_per_sqft: string | null;
  avg_dom: string | null;
  median_dom: string | null;
  avg_sqft: string | null;
  min_price: string | null;
  max_price: string | null;
}

export async function getMarketPulseMonthly(
  filter: GeoFilter,
  months = 24,
): Promise<MarketPulseRow[]> {
  const params: unknown[] = [];
  const { conditions } = buildGeoWhere(filter, params);

  const timeCondition = `month >= date_trunc('month', NOW() - interval '${months} months')`;
  // Guard against corrupt future dates in ARMLS data (e.g. year 2914)
  const futureGuard = `month <= date_trunc('month', NOW() + interval '1 month')`;

  let sql: string;

  conditions.push(timeCondition);
  conditions.push(futureGuard);
  const where = `WHERE ${conditions.join(' AND ')}`;

  // Re-aggregate across geo dimensions. Use NULLIF to exclude zero values
  // (the MV stores COALESCE(..., 0) for geos with no data, which would dilute averages).
  // Weight averages by listing_count for accuracy.
  sql = `SELECT month, standard_status,
          SUM(listing_count)::text AS listing_count,
          (SUM(avg_list_price * listing_count) / NULLIF(SUM(CASE WHEN avg_list_price > 0 THEN listing_count END), 0))::text AS avg_list_price,
          (SUM(median_list_price * listing_count) / NULLIF(SUM(CASE WHEN median_list_price > 0 THEN listing_count END), 0))::text AS median_list_price,
          (SUM(avg_close_price * listing_count) / NULLIF(SUM(CASE WHEN avg_close_price > 0 THEN listing_count END), 0))::text AS avg_close_price,
          (SUM(median_close_price * listing_count) / NULLIF(SUM(CASE WHEN median_close_price > 0 THEN listing_count END), 0))::text AS median_close_price,
          (SUM(avg_price_per_sqft * listing_count) / NULLIF(SUM(CASE WHEN avg_price_per_sqft > 0 THEN listing_count END), 0))::text AS avg_price_per_sqft,
          (SUM(median_price_per_sqft * listing_count) / NULLIF(SUM(CASE WHEN median_price_per_sqft > 0 THEN listing_count END), 0))::text AS median_price_per_sqft,
          (SUM(avg_close_price_per_sqft * listing_count) / NULLIF(SUM(CASE WHEN avg_close_price_per_sqft > 0 THEN listing_count END), 0))::text AS avg_close_price_per_sqft,
          (SUM(median_close_price_per_sqft * listing_count) / NULLIF(SUM(CASE WHEN median_close_price_per_sqft > 0 THEN listing_count END), 0))::text AS median_close_price_per_sqft,
          (SUM(avg_dom * listing_count) / NULLIF(SUM(CASE WHEN avg_dom > 0 THEN listing_count END), 0))::text AS avg_dom,
          (SUM(median_dom * listing_count) / NULLIF(SUM(CASE WHEN median_dom > 0 THEN listing_count END), 0))::text AS median_dom,
          (SUM(avg_sqft * listing_count) / NULLIF(SUM(CASE WHEN avg_sqft > 0 THEN listing_count END), 0))::text AS avg_sqft,
          MIN(NULLIF(min_price, 0))::text AS min_price,
          MAX(max_price)::text AS max_price
   FROM mv_market_pulse_monthly
   ${where}
   GROUP BY month, standard_status
   ORDER BY month ASC`;

  const result = await rdsQuery<MarketPulseDbRow>(sql, params);

  return result.rows.map(r => ({
    month: r.month.toISOString(),
    status: r.standard_status,
    listingCount: parseInt(r.listing_count ?? '0', 10),
    avgListPrice: parseFloat(r.avg_list_price ?? '0'),
    medianListPrice: parseFloat(r.median_list_price ?? '0'),
    avgClosePrice: parseFloat(r.avg_close_price ?? '0'),
    medianClosePrice: parseFloat(r.median_close_price ?? '0'),
    avgPricePerSqft: parseFloat(r.avg_price_per_sqft ?? '0'),
    medianPricePerSqft: parseFloat(r.median_price_per_sqft ?? '0'),
    avgClosePricePerSqft: parseFloat(r.avg_close_price_per_sqft ?? '0'),
    medianClosePricePerSqft: parseFloat(r.median_close_price_per_sqft ?? '0'),
    avgDom: parseInt(r.avg_dom ?? '0', 10),
    medianDom: parseInt(r.median_dom ?? '0', 10),
    avgSqft: parseFloat(r.avg_sqft ?? '0'),
    minPrice: parseFloat(r.min_price ?? '0'),
    maxPrice: parseFloat(r.max_price ?? '0'),
  }));
}

// ── Price Bands (Category 2) ────────────────────────

interface PriceBandDbRow extends QueryResultRow {
  price_band: string;
  band_order: number;
  listing_count: string;
  avg_dom: string;
  avg_price_per_sqft: string;
  standard_status: string;
}

export async function getPriceBands(
  filter: GeoFilter,
  status?: string,
): Promise<PriceBandRow[]> {
  const params: unknown[] = [];
  const { conditions } = buildGeoWhere(filter, params);

  if (status) {
    conditions.push(`standard_status = $${params.length + 1}`);
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Re-aggregate across geo dimensions with weighted averages
  const result = await rdsQuery<PriceBandDbRow>(
    `SELECT price_band, band_order,
            SUM(listing_count)::text AS listing_count,
            (SUM(avg_dom * listing_count) / NULLIF(SUM(listing_count), 0))::int AS avg_dom,
            (SUM(avg_price_per_sqft * listing_count) / NULLIF(SUM(listing_count), 0))::text AS avg_price_per_sqft,
            standard_status
     FROM mv_price_band_distribution
     ${where}
     GROUP BY price_band, band_order, standard_status
     ORDER BY band_order ASC`,
    params,
  );

  return result.rows.map(r => ({
    priceBand: r.price_band,
    bandOrder: r.band_order,
    listingCount: parseInt(r.listing_count, 10),
    avgDom: parseInt(String(r.avg_dom), 10),
    avgPricePerSqft: parseFloat(r.avg_price_per_sqft),
    status: r.standard_status,
  }));
}

// ── Supply & Demand (Category 3) ────────────────────

interface SupplyDemandDbRow extends QueryResultRow {
  month: Date;
  new_listings: string;
  new_pendings: string;
  new_closings: string;
  expired: string;
  withdrawn: string;
}

export async function getSupplyDemand(
  filter: GeoFilter,
  months = 24,
): Promise<SupplyDemandRow[]> {
  const params: unknown[] = [];
  const { conditions } = buildGeoWhere(filter, params);

  const timeCondition = `month >= date_trunc('month', NOW() - interval '${months} months')`;
  const futureGuard = `month <= date_trunc('month', NOW() + interval '1 month')`;
  conditions.push(timeCondition);
  conditions.push(futureGuard);
  const where = `WHERE ${conditions.join(' AND ')}`;

  // Always re-aggregate across geo dimensions
  const result = await rdsQuery<SupplyDemandDbRow>(
    `SELECT month,
            SUM(new_listings)::text AS new_listings,
            SUM(new_pendings)::text AS new_pendings,
            SUM(new_closings)::text AS new_closings,
            SUM(expired)::text AS expired,
            SUM(withdrawn)::text AS withdrawn
     FROM mv_supply_demand_monthly
     ${where}
     GROUP BY month
     ORDER BY month ASC`,
    params,
  );

  return result.rows.map(r => ({
    month: r.month.toISOString(),
    newListings: parseInt(r.new_listings, 10),
    newPendings: parseInt(r.new_pendings, 10),
    newClosings: parseInt(r.new_closings, 10),
    expired: parseInt(r.expired, 10),
    withdrawn: parseInt(r.withdrawn, 10),
  }));
}

// ── Inventory Age ───────────────────────────────────

interface InventoryAgeDbRow extends QueryResultRow {
  dom_band: string;
  band_order: number;
  listing_count: string;
  avg_price: string;
  avg_price_per_sqft: string;
}

export async function getInventoryAge(
  filter: GeoFilter,
): Promise<InventoryAgeRow[]> {
  const params: unknown[] = [];
  const { conditions } = buildGeoWhere(filter, params);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Re-aggregate across geo dimensions with weighted averages
  const result = await rdsQuery<InventoryAgeDbRow>(
    `SELECT dom_band, band_order,
            SUM(listing_count)::text AS listing_count,
            (SUM(avg_price * listing_count) / NULLIF(SUM(listing_count), 0))::text AS avg_price,
            (SUM(avg_price_per_sqft * listing_count) / NULLIF(SUM(listing_count), 0))::text AS avg_price_per_sqft
     FROM mv_inventory_age
     ${where}
     GROUP BY dom_band, band_order
     ORDER BY band_order ASC`,
    params,
  );

  return result.rows.map(r => ({
    domBand: r.dom_band,
    bandOrder: r.band_order,
    listingCount: parseInt(r.listing_count, 10),
    avgPrice: parseFloat(r.avg_price),
    avgPricePerSqft: parseFloat(r.avg_price_per_sqft),
  }));
}

// ── Community Scorecards ────────────────────────────

interface CommunityDbRow extends QueryResultRow {
  city: string;
  postal_code: string;
  subdivision_name: string;
  active_count: string;
  closed_count: string;
  pending_count: string;
  avg_active_price: string;
  median_active_price: string;
  avg_close_price: string;
  median_close_price: string;
  avg_price_per_sqft: string;
  median_price_per_sqft: string;
  avg_dom: string;
  median_dom: string;
  avg_sqft: string;
  avg_lot_acres: string;
  avg_year_built: string;
  avg_close_to_list_ratio: string;
  avg_annual_tax: string;
  avg_hoa_fee: string;
  pool_pct: string;
  fireplace_pct: string;
  horse_pct: string;
  avg_garage_spaces: string;
  centroid_lat: string;
  centroid_lng: string;
}

function mapCommunityRow(r: CommunityDbRow): CommunityScorecard {
  return {
    city: r.city,
    postalCode: r.postal_code,
    subdivisionName: r.subdivision_name,
    activeCount: parseInt(r.active_count, 10),
    closedCount: parseInt(r.closed_count, 10),
    pendingCount: parseInt(r.pending_count, 10),
    avgActivePrice: parseFloat(r.avg_active_price),
    medianActivePrice: parseFloat(r.median_active_price),
    avgClosePrice: parseFloat(r.avg_close_price),
    medianClosePrice: parseFloat(r.median_close_price),
    avgPricePerSqft: parseFloat(r.avg_price_per_sqft),
    medianPricePerSqft: parseFloat(r.median_price_per_sqft),
    avgDom: parseInt(r.avg_dom, 10),
    medianDom: parseInt(r.median_dom, 10),
    avgSqft: parseFloat(r.avg_sqft),
    avgLotAcres: parseFloat(r.avg_lot_acres),
    avgYearBuilt: parseInt(r.avg_year_built, 10),
    avgCloseToListRatio: parseFloat(r.avg_close_to_list_ratio),
    avgAnnualTax: parseFloat(r.avg_annual_tax),
    avgHoaFee: parseFloat(r.avg_hoa_fee),
    poolPct: parseFloat(r.pool_pct),
    fireplacePct: parseFloat(r.fireplace_pct),
    horsePct: parseFloat(r.horse_pct),
    avgGarageSpaces: parseFloat(r.avg_garage_spaces),
    centroidLat: parseFloat(r.centroid_lat),
    centroidLng: parseFloat(r.centroid_lng),
  };
}

export async function getCommunityScorecard(
  filter: GeoFilter,
): Promise<CommunityScorecard | null> {
  const params: unknown[] = [];
  const { conditions } = buildGeoWhere(filter, params);

  if (conditions.length === 0) return null;
  const where = `WHERE ${conditions.join(' AND ')}`;

  const result = await rdsQuery<CommunityDbRow>(
    `SELECT * FROM mv_community_scorecard ${where} LIMIT 1`,
    params,
  );

  return result.rows[0] ? mapCommunityRow(result.rows[0]) : null;
}

export async function getCommunityRankings(
  filter: GeoFilter,
  sortBy: 'median_price_per_sqft' | 'avg_dom' | 'active_count' | 'median_active_price' = 'median_price_per_sqft',
  limit = 50,
): Promise<CommunityScorecard[]> {
  const params: unknown[] = [];
  const { conditions, nextIdx } = buildGeoWhere(filter, params);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const order = sortBy === 'avg_dom' ? `${sortBy} ASC` : `${sortBy} DESC`;

  params.push(limit);

  const result = await rdsQuery<CommunityDbRow>(
    `SELECT * FROM mv_community_scorecard
     ${where}
     ORDER BY ${order}
     LIMIT $${nextIdx}`,
    params,
  );

  return result.rows.map(mapCommunityRow);
}

// ── Feature Price Impact ────────────────────────────
// Uses closed sales only, controls for home size by comparing within
// sqft quartiles then averaging the per-quartile deltas. This removes
// the bias where (e.g.) fireplace homes are just larger estates.

interface FeatureImpactDbRow extends QueryResultRow {
  feature: string;
  avg_ppsf_with: string;
  avg_ppsf_without: string;
  count_with: string;
  count_without: string;
}

export async function getFeaturePriceImpact(
  _filter: GeoFilter,
): Promise<FeaturePriceImpact[]> {
  // Run metro-wide (ignoring geo filter) for statistically meaningful sample sizes.
  // Size-quartile normalization controls for the home-size confound.
  const baseWhere = [
    'is_deleted = FALSE',
    'internet_entire_listing_display_yn = TRUE',
    'living_area > 0',
    'close_price > 0',
    "standard_status = 'Closed'",
  ].join(' AND ');

  // CTE: assign each closed sale to a sqft quartile, then for each feature
  // compute avg price/sqft WITH vs WITHOUT within each quartile,
  // and finally average those quartile-level deltas.
  const result = await rdsQuery<FeatureImpactDbRow>(
    `WITH sized AS (
      SELECT *,
        NTILE(4) OVER (ORDER BY living_area) AS sq
      FROM listing_records
      WHERE ${baseWhere}
    ),
    -- Per-quartile averages for each feature
    pool_q AS (
      SELECT sq,
        AVG(close_price / living_area) FILTER (WHERE pool_private_yn = TRUE)::numeric(14,2) AS ppsf_w,
        AVG(close_price / living_area) FILTER (WHERE pool_private_yn IS DISTINCT FROM TRUE)::numeric(14,2) AS ppsf_wo,
        COUNT(*) FILTER (WHERE pool_private_yn = TRUE) AS cnt_w,
        COUNT(*) FILTER (WHERE pool_private_yn IS DISTINCT FROM TRUE) AS cnt_wo
      FROM sized GROUP BY sq
    ),
    fireplace_q AS (
      SELECT sq,
        AVG(close_price / living_area) FILTER (WHERE fireplace_yn = TRUE)::numeric(14,2) AS ppsf_w,
        AVG(close_price / living_area) FILTER (WHERE fireplace_yn IS DISTINCT FROM TRUE)::numeric(14,2) AS ppsf_wo,
        COUNT(*) FILTER (WHERE fireplace_yn = TRUE) AS cnt_w,
        COUNT(*) FILTER (WHERE fireplace_yn IS DISTINCT FROM TRUE) AS cnt_wo
      FROM sized GROUP BY sq
    ),
    horse_q AS (
      SELECT sq,
        AVG(close_price / living_area) FILTER (WHERE horse_yn = TRUE)::numeric(14,2) AS ppsf_w,
        AVG(close_price / living_area) FILTER (WHERE horse_yn IS DISTINCT FROM TRUE)::numeric(14,2) AS ppsf_wo,
        COUNT(*) FILTER (WHERE horse_yn = TRUE) AS cnt_w,
        COUNT(*) FILTER (WHERE horse_yn IS DISTINCT FROM TRUE) AS cnt_wo
      FROM sized GROUP BY sq
    ),
    garage_q AS (
      SELECT sq,
        AVG(close_price / living_area) FILTER (WHERE garage_spaces >= 3)::numeric(14,2) AS ppsf_w,
        AVG(close_price / living_area) FILTER (WHERE garage_spaces < 3 OR garage_spaces IS NULL)::numeric(14,2) AS ppsf_wo,
        COUNT(*) FILTER (WHERE garage_spaces >= 3) AS cnt_w,
        COUNT(*) FILTER (WHERE garage_spaces < 3 OR garage_spaces IS NULL) AS cnt_wo
      FROM sized GROUP BY sq
    )
    SELECT feature, avg_ppsf_with, avg_ppsf_without, count_with, count_without FROM (
      SELECT 'pool' AS feature,
        AVG(ppsf_w)::numeric(14,2) AS avg_ppsf_with,
        AVG(ppsf_wo)::numeric(14,2) AS avg_ppsf_without,
        SUM(cnt_w) AS count_with,
        SUM(cnt_wo) AS count_without
      FROM pool_q WHERE ppsf_w IS NOT NULL AND ppsf_wo IS NOT NULL
      UNION ALL
      SELECT 'fireplace',
        AVG(ppsf_w)::numeric(14,2),
        AVG(ppsf_wo)::numeric(14,2),
        SUM(cnt_w), SUM(cnt_wo)
      FROM fireplace_q WHERE ppsf_w IS NOT NULL AND ppsf_wo IS NOT NULL
      UNION ALL
      SELECT 'horse',
        AVG(ppsf_w)::numeric(14,2),
        AVG(ppsf_wo)::numeric(14,2),
        SUM(cnt_w), SUM(cnt_wo)
      FROM horse_q WHERE ppsf_w IS NOT NULL AND ppsf_wo IS NOT NULL
      UNION ALL
      SELECT 'garage',
        AVG(ppsf_w)::numeric(14,2),
        AVG(ppsf_wo)::numeric(14,2),
        SUM(cnt_w), SUM(cnt_wo)
      FROM garage_q WHERE ppsf_w IS NOT NULL AND ppsf_wo IS NOT NULL
    ) sub WHERE avg_ppsf_with IS NOT NULL AND avg_ppsf_without IS NOT NULL`,
    [],
  );

  const labels: Record<string, string> = {
    pool: 'Pool',
    fireplace: 'Fireplace',
    horse: 'Horse Property',
    garage: '3+ Car Garage',
  };

  return result.rows.map(r => {
    const avgWith = parseFloat(r.avg_ppsf_with);
    const avgWithout = parseFloat(r.avg_ppsf_without);
    const delta = avgWith - avgWithout;
    return {
      feature: r.feature,
      label: labels[r.feature] ?? r.feature,
      avgPpsfWith: avgWith,
      avgPpsfWithout: avgWithout,
      priceDelta: Math.round(delta * 100) / 100,
      pctImpact: avgWithout > 0 ? Math.round((delta / avgWithout) * 1000) / 10 : 0,
      countWith: parseInt(r.count_with, 10),
      countWithout: parseInt(r.count_without, 10),
    };
  });
}

// ── Available Locations (for filter dropdowns) ──────

interface LocationDbRow extends QueryResultRow {
  city: string;
  postal_code: string;
}

export async function getAvailableLocations(): Promise<{
  cities: string[];
  zipCodes: string[];
}> {
  const result = await rdsQuery<LocationDbRow>(
    `SELECT DISTINCT city, postal_code
     FROM mv_community_scorecard
     WHERE city IS NOT NULL AND postal_code IS NOT NULL
     ORDER BY city, postal_code`,
    [],
  );

  const cities = [...new Set(result.rows.map(r => r.city))].sort();
  const zipCodes = [...new Set(result.rows.map(r => r.postal_code))].sort();

  return { cities, zipCodes };
}

// ── Heatmap Points ──────────────────────────────────

interface HeatmapDbRow extends QueryResultRow {
  listing_key: string;
  latitude: string;
  longitude: string;
  subdivision_name: string | null;
  city: string | null;
  postal_code: string;
  list_price: string;
  close_price: string | null;
  price_per_sqft: string | null;
  days_on_market: string | null;
  sale_to_list_pct: string | null;
  standard_status: string;
}

export async function getHeatmapPoints(
  filter: GeoFilter,
  status?: string[],
): Promise<HeatmapPoint[]> {
  const params: unknown[] = [];
  const { conditions, nextIdx } = buildGeoWhere(filter, params);

  // Default to active listings only for heatmap (reduces 820K → ~5K rows)
  if (!status || status.length === 0) {
    conditions.push(`standard_status IN ('Active', 'Active Under Contract')`);
  } else {
    const placeholders = status.map((_, i) => `$${nextIdx + i}`);
    conditions.push(`standard_status IN (${placeholders.join(', ')})`);
    params.push(...status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await rdsQuery<HeatmapDbRow>(
    `SELECT listing_key, latitude, longitude, subdivision_name, city, postal_code,
            list_price, close_price, price_per_sqft, days_on_market,
            sale_to_list_pct, standard_status
     FROM mv_heatmap_points
     ${where}`,
    params,
  );

  return result.rows.map(r => ({
    listingKey: r.listing_key,
    latitude: parseFloat(r.latitude),
    longitude: parseFloat(r.longitude),
    subdivisionName: r.subdivision_name,
    city: r.city,
    postalCode: r.postal_code,
    listPrice: parseFloat(r.list_price),
    closePrice: r.close_price ? parseFloat(r.close_price) : null,
    pricePerSqft: r.price_per_sqft ? parseFloat(r.price_per_sqft) : null,
    daysOnMarket: r.days_on_market ? parseInt(r.days_on_market, 10) : null,
    saleToListPct: r.sale_to_list_pct ? parseFloat(r.sale_to_list_pct) : null,
    standardStatus: r.standard_status,
  }));
}

// ── Portfolio Trends (raw listing queries) ──────────

interface PortfolioTrendDbRow extends QueryResultRow {
  month: Date;
  median_price: string;
  median_ppsf: string;
  listing_count: string;
}

/**
 * Compute monthly price trends from raw listing_records with feature filters.
 * Used when the user applies portfolio criteria (pool, beds, price range, etc.)
 * that can't be answered by the pre-aggregated MVs.
 */
export async function getPortfolioTrends(
  filter: PortfolioFilter,
  months = 240,
): Promise<PortfolioTrendRow[]> {
  const params: unknown[] = [];
  const conditions: string[] = [
    `is_deleted = FALSE`,
    `standard_status IN ('Closed', 'Active', 'Active Under Contract')`,
  ];
  let idx = 1;

  // Geo filters
  if (filter.city) {
    conditions.push(`city ILIKE $${idx++}`);
    params.push(filter.city);
  }
  if (filter.postalCode) {
    conditions.push(`postal_code = $${idx++}`);
    params.push(filter.postalCode);
  }
  if (filter.subdivisionName) {
    conditions.push(`subdivision_name ILIKE $${idx++}`);
    params.push(`%${filter.subdivisionName}%`);
  }

  // Feature filters
  if (filter.pool === true) {
    conditions.push(`pool_private_yn = TRUE`);
  }
  if (filter.bedsMin) {
    conditions.push(`bedrooms_total >= $${idx++}`);
    params.push(filter.bedsMin);
  }
  if (filter.bathsMin) {
    conditions.push(`bathrooms_total_integer >= $${idx++}`);
    params.push(filter.bathsMin);
  }
  if (filter.priceMin) {
    conditions.push(`COALESCE(close_price, list_price) >= $${idx++}`);
    params.push(filter.priceMin);
  }
  if (filter.priceMax) {
    conditions.push(`COALESCE(close_price, list_price) <= $${idx++}`);
    params.push(filter.priceMax);
  }

  // Time window
  conditions.push(`COALESCE(close_date, listing_contract_date, original_entry_timestamp::date) >= (CURRENT_DATE - interval '${months} months')`);
  conditions.push(`COALESCE(close_date, listing_contract_date, original_entry_timestamp::date) <= CURRENT_DATE + interval '1 month'`);

  // Need living_area > 0 for ppsf
  conditions.push(`living_area > 0`);

  const where = `WHERE ${conditions.join(' AND ')}`;

  const result = await rdsQuery<PortfolioTrendDbRow>(
    `SELECT
       date_trunc('month', COALESCE(close_date, listing_contract_date, original_entry_timestamp::date)) AS month,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(close_price, list_price))::numeric::text AS median_price,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (COALESCE(close_price, list_price) / living_area))::numeric::text AS median_ppsf,
       COUNT(*)::text AS listing_count
     FROM listing_records
     ${where}
     GROUP BY month
     HAVING COUNT(*) >= 1
     ORDER BY month ASC`,
    params,
  );

  return result.rows.map(r => ({
    month: r.month.toISOString(),
    medianPrice: parseFloat(r.median_price),
    medianPpsf: parseFloat(r.median_ppsf),
    listingCount: parseInt(r.listing_count, 10),
  }));
}
