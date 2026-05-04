/**
 * Community query layer.
 *
 * yong2's curated list (content/communities.ts) maps a Yong-marketed slug
 * (e.g. "silverleaf") to a real (scope_type, scope_key) pair on the
 * mv_community_scorecard MV.
 *
 * mv_community_scorecard shape (verified):
 *   scope_type ∈ { 'community', 'region', 'metro' }
 *   scope_key  — e.g. 'desert-mountain', 'paradise-valley'
 *   property_segment ∈ { 'residential', 'land', 'all' }
 *   median_price, total_closed, total_active, total_pending,
 *   avg_dom, avg_ppsf, months_of_supply, yoy_price_change_pct
 *
 * `regions` table is empty on prod — we don't query it. Curated content is
 * the source of truth for the directory; KPIs come from the scorecard MV.
 */

import { query } from './db';
import type { CommunityKpis } from './types';
import { communitiesContent, communitySlugs, type CommunitySlug } from '@/content/communities';

// ── Curated summary (no DB hit) ─────────────────────

export interface CuratedCommunitySummary {
  slug: CommunitySlug;
  name: string;
  locality: string;
  imageUrl: string | null;
}

export function getCuratedCommunities(): CuratedCommunitySummary[] {
  return communitySlugs.map((slug) => {
    const c = communitiesContent[slug];
    return {
      slug,
      name: c.name,
      locality: c.locality,
      imageUrl: c.heroImageUrl ?? null,
    };
  });
}

// ── KPIs (mv_community_scorecard) ───────────────────

interface ScorecardRow {
  scope_type: 'community' | 'region' | 'metro';
  scope_key: string;
  property_segment: 'residential' | 'land' | 'all';
  median_price: string | number | null;
  total_closed: string | number | null;
  total_active: string | number | null;
  total_pending: string | number | null;
  avg_dom: string | number | null;
  avg_ppsf: string | number | null;
  months_of_supply: string | number | null;
  yoy_price_change_pct: string | number | null;
}

function toNum(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

function toInt(v: string | number | null | undefined): number {
  const n = toNum(v);
  return n == null ? 0 : Math.round(n);
}

export function scorecardRowToKpis(r: ScorecardRow, medianDom: number | null = null): CommunityKpis {
  return {
    scopeType: r.scope_type,
    scopeKey: r.scope_key,
    propertySegment: r.property_segment,
    medianPrice: toNum(r.median_price),
    totalClosed: toInt(r.total_closed),
    totalActive: toInt(r.total_active),
    totalPending: toInt(r.total_pending),
    avgDom: toNum(r.avg_dom),
    medianDom,
    avgPpsf: toNum(r.avg_ppsf),
    monthsOfSupply: toNum(r.months_of_supply),
    yoyPriceChangePct: toNum(r.yoy_price_change_pct),
  };
}

type ScopeType = 'community' | 'region' | 'metro';
type PropertySegment = 'residential' | 'land' | 'all';

/**
 * Median DOM from raw `analytics_base` over the last 12 months of closes.
 * `mv_community_scorecard` only carries `avg_dom` (a mean), which is
 * misleading for long-tail-skewed cohorts like Silverleaf where
 * new-construction parcels routinely sit on the market for 1000+ days.
 *
 * scope_type='community' → filter on community_slug
 * scope_type='region'    → filter on region_slug
 * scope_type='metro'     → not supported here; returns null
 */
export async function getCommunityMedianDom(
  scopeType: ScopeType,
  scopeKey: string,
  segment: PropertySegment = 'residential',
): Promise<number | null> {
  if (scopeType === 'metro') return null;
  const slugCol = scopeType === 'community' ? 'community_slug' : 'region_slug';
  const sql = `
    SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)::numeric AS median_dom,
           COUNT(*)::int AS n
    FROM analytics_base
    WHERE ${slugCol} = $1
      AND property_segment = $2
      AND standard_status = 'Closed'
      AND close_date >= CURRENT_DATE - INTERVAL '12 months'
      AND days_on_market IS NOT NULL
  `;
  const { rows } = await query<{ median_dom: string | number | null; n: string | number | null }>(
    sql,
    [scopeKey, segment],
  );
  if (!rows[0]) return null;
  const n = toInt(rows[0].n);
  if (n < 1) return null;
  return toNum(rows[0].median_dom);
}

const SCORECARD_COLUMNS = `
  scope_type, scope_key, property_segment,
  median_price, total_closed, total_active, total_pending,
  avg_dom, avg_ppsf, months_of_supply, yoy_price_change_pct
`;

/**
 * Get KPIs for a single (scopeType, scopeKey, segment) tuple.
 * Returns null if the scorecard has no row for that scope.
 */
export async function getCommunityScorecard(
  scopeKey: string,
  scopeType: 'community' | 'region' | 'metro' = 'community',
  segment: 'residential' | 'land' | 'all' = 'residential',
): Promise<CommunityKpis | null> {
  const sql = `
    SELECT ${SCORECARD_COLUMNS}
    FROM mv_community_scorecard
    WHERE scope_type = $1
      AND scope_key = $2
      AND property_segment = $3
    LIMIT 1
  `;
  const [{ rows }, medianDom] = await Promise.all([
    query<ScorecardRow>(sql, [scopeType, scopeKey, segment]),
    getCommunityMedianDom(scopeType, scopeKey, segment).catch(() => null),
  ]);
  return rows[0] ? scorecardRowToKpis(rows[0], medianDom) : null;
}

/**
 * Bulk fetch KPIs for the curated communities.
 *
 * The curated content carries (scopeType, scopeKey) per slug — we issue one
 * query per scopeType to keep the SQL small, then key results by scope_key.
 *
 * Returned map is keyed by scope_key (e.g. "desert-mountain").
 */
export async function getAllCommunityScorecards(
  segment: 'residential' | 'land' | 'all' = 'residential',
): Promise<Record<string, CommunityKpis>> {
  const byType = new Map<'community' | 'region' | 'metro', string[]>();
  for (const slug of communitySlugs) {
    const c = communitiesContent[slug];
    const list = byType.get(c.scopeType) ?? [];
    list.push(c.scopeKey);
    byType.set(c.scopeType, list);
  }

  const out: Record<string, CommunityKpis> = {};
  for (const [scopeType, keys] of byType) {
    if (keys.length === 0) continue;
    const sql = `
      SELECT ${SCORECARD_COLUMNS}
      FROM mv_community_scorecard
      WHERE scope_type = $1
        AND scope_key = ANY($2::text[])
        AND property_segment = $3
    `;
    // Bulk median-DOM query — one row per scope_key, joining analytics_base
    // by community_slug or region_slug depending on scopeType.
    const slugCol = scopeType === 'community' ? 'community_slug' : 'region_slug';
    const medianSql = scopeType === 'metro'
      ? null
      : `
        SELECT ${slugCol} AS scope_key,
               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market)::numeric AS median_dom,
               COUNT(*)::int AS n
        FROM analytics_base
        WHERE ${slugCol} = ANY($1::text[])
          AND property_segment = $2
          AND standard_status = 'Closed'
          AND close_date >= CURRENT_DATE - INTERVAL '12 months'
          AND days_on_market IS NOT NULL
        GROUP BY ${slugCol}
      `;

    const [{ rows }, medianRows] = await Promise.all([
      query<ScorecardRow>(sql, [scopeType, keys, segment]),
      medianSql
        ? query<{ scope_key: string; median_dom: string | number | null; n: string | number | null }>(
            medianSql,
            [keys, segment],
          ).then((r) => r.rows)
            .catch(() => [] as { scope_key: string; median_dom: string | number | null; n: string | number | null }[])
        : Promise.resolve([] as { scope_key: string; median_dom: string | number | null; n: string | number | null }[]),
    ]);

    const medianBySlug = new Map<string, number | null>();
    for (const m of medianRows) {
      const n = toInt(m.n);
      medianBySlug.set(m.scope_key, n >= 1 ? toNum(m.median_dom) : null);
    }
    for (const r of rows) {
      out[r.scope_key] = scorecardRowToKpis(r, medianBySlug.get(r.scope_key) ?? null);
    }
  }
  return out;
}
