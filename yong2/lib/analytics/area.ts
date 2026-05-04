/**
 * Area read — aggregated stats for the listing-detail "The Read" block.
 *
 * COMPLIANCE: Aggregate sold data only. No individual closed records.
 *
 * Sources:
 *   - mv_market_pulse        — current $/sqft + 12-month trend (residential, Closed)
 *   - mv_community_scorecard — YoY price-change pct (residential)
 *   - analytics_base         — list-to-sale ratio median (close_price / list_price)
 *
 * The list-to-sale ratio is computed against `analytics_base` directly because
 * the materialized views do not pre-roll close_price/list_price pairs. Verified
 * via pg_attribute (mv_market_pulse carries median_close_price + median_list_price
 * separately but not their per-listing ratio, which is a different statistic).
 *
 * Median DOM is delegated to `getCommunityMedianDom` in lib/communities.ts which
 * already implements the analytics_base PERCENTILE_CONT(0.5) read.
 */

import { query } from '../db';
import { getCommunityMedianDom } from '../communities';

export type AreaScope = 'community' | 'region';

export type AreaTrendPoint = {
  /** "May '25" — short label for the chart axis. */
  month: string;
  value: number;
};

export type AreaRead = {
  scopeType: AreaScope;
  scopeKey: string;
  scopeLabel: string;
  trend: AreaTrendPoint[];
  currentPpsf: number | null;
  yoyPriceChangePct: number | null;
  /** Average closes per month over the last 12 months, residential. */
  closesPerMonth: number | null;
  /** Median (close_price / list_price) * 100. e.g. 100.0 == at-ask. */
  listToSaleRatio: number | null;
  medianDom: number | null;
};

function pNum(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

function shortMonthLabel(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}

interface PulseRow {
  month: Date | string;
  avg_price_per_sqft: string | number | null;
  closed_count: string | number | null;
}

interface ScorecardYoyRow {
  yoy_price_change_pct: string | number | null;
  scope_label: string | null;
}

interface ListToSaleRow {
  list_to_sale: string | number | null;
  n: string | number | null;
}

/**
 * Resolve a human-readable label for the scope. The `communities` table
 * does not have a `slug` column on this schema (verified via pg_attribute),
 * so for communities we fall back to the title-cased slug. Regions have a
 * proper `slug` column.
 */
async function resolveScopeLabel(scopeType: AreaScope, scopeKey: string): Promise<string> {
  if (scopeType === 'region') {
    const r = await query<{ name: string }>(
      `SELECT name FROM regions WHERE slug = $1 LIMIT 1`,
      [scopeKey],
    ).catch(() => ({ rows: [] as { name: string }[] }));
    if (r.rows[0]?.name) return r.rows[0].name;
  }
  // Title-case the slug as a fallback (works for both community + region).
  return scopeKey
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function getAreaRead(
  scopeType: AreaScope,
  scopeKey: string,
): Promise<AreaRead | null> {
  const segment = 'residential';

  // 12-month trend: month, avg_price_per_sqft from mv_market_pulse (Closed).
  const trendSql = `
    SELECT month, avg_price_per_sqft, closed_count
    FROM mv_market_pulse
    WHERE scope_type = $1
      AND scope_key = $2
      AND property_segment = $3
      AND standard_status = 'Closed'
      AND month >= date_trunc('month', NOW() - INTERVAL '12 months')
      AND month < date_trunc('month', NOW() + INTERVAL '1 month')
    ORDER BY month ASC
  `;
  const trendPromise = query<PulseRow>(trendSql, [scopeType, scopeKey, segment]);

  // Current ppsf: most recent month with non-null avg_price_per_sqft.
  const currentSql = `
    SELECT month, avg_price_per_sqft, closed_count
    FROM mv_market_pulse
    WHERE scope_type = $1 AND scope_key = $2 AND property_segment = $3
      AND standard_status = 'Closed'
      AND avg_price_per_sqft IS NOT NULL
    ORDER BY month DESC
    LIMIT 1
  `;
  const currentPromise = query<PulseRow>(currentSql, [scopeType, scopeKey, segment]);

  // YoY ppsf change from scorecard.
  const scorecardSql = `
    SELECT yoy_price_change_pct, NULL::text AS scope_label
    FROM mv_community_scorecard
    WHERE scope_type = $1 AND scope_key = $2 AND property_segment = $3
    LIMIT 1
  `;
  const scorecardPromise = query<ScorecardYoyRow>(scorecardSql, [scopeType, scopeKey, segment]);

  // List-to-sale ratio — analytics_base, last 12mo closes.
  const slugCol = scopeType === 'community' ? 'community_slug' : 'region_slug';
  const ltsSql = `
    SELECT
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (close_price * 100.0 / list_price))::numeric AS list_to_sale,
      COUNT(*)::int AS n
    FROM analytics_base
    WHERE ${slugCol} = $1
      AND property_segment = $2
      AND standard_status = 'Closed'
      AND close_date >= CURRENT_DATE - INTERVAL '12 months'
      AND close_price IS NOT NULL
      AND list_price > 0
  `;
  const ltsPromise = query<ListToSaleRow>(ltsSql, [scopeKey, segment]);

  // Label resolution (cheap; cached at the catalogue layer in practice).
  const labelPromise = resolveScopeLabel(scopeType, scopeKey);

  // Median DOM — already implemented in lib/communities.
  const medianDomPromise = getCommunityMedianDom(scopeType, scopeKey, segment).catch(() => null);

  const [trendRes, currentRes, scorecardRes, ltsRes, scopeLabel, medianDom] =
    await Promise.all([
      trendPromise,
      currentPromise,
      scorecardPromise,
      ltsPromise,
      labelPromise,
      medianDomPromise,
    ]);

  // Build trend.
  const trend: AreaTrendPoint[] = [];
  for (const row of trendRes.rows) {
    const ppsf = pNum(row.avg_price_per_sqft);
    if (ppsf == null) continue;
    const d = row.month instanceof Date ? row.month : new Date(row.month);
    trend.push({ month: shortMonthLabel(d), value: Math.round(ppsf) });
  }

  // Closes/month — average over the last 12 calendar months. Sum closed_count
  // across the trend window divided by 12 (months with no Closed status row
  // are treated as 0 — that's the right "per-month rate" semantics).
  let closeSum = 0;
  for (const row of trendRes.rows) {
    closeSum += pNum(row.closed_count) ?? 0;
  }
  const closesPerMonth = closeSum > 0 ? Math.round((closeSum / 12) * 10) / 10 : null;

  const currentPpsf = currentRes.rows[0]
    ? pNum(currentRes.rows[0].avg_price_per_sqft)
    : trend.length > 0
      ? trend[trend.length - 1].value
      : null;

  const yoyPriceChangePct = scorecardRes.rows[0]
    ? pNum(scorecardRes.rows[0].yoy_price_change_pct)
    : null;

  const ltsRow = ltsRes.rows[0];
  const ltsN = ltsRow ? pNum(ltsRow.n) : null;
  const listToSaleRatio = ltsRow && (ltsN ?? 0) > 0 ? pNum(ltsRow.list_to_sale) : null;

  return {
    scopeType,
    scopeKey,
    scopeLabel,
    trend,
    currentPpsf,
    yoyPriceChangePct,
    closesPerMonth,
    listToSaleRatio,
    medianDom,
  };
}
