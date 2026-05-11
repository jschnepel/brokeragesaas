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
import { matchCuratedCommunity } from './community-match';
import type { CuratedCommunity } from '@/content/communities';
import type { Listing } from './types';

interface MosRow extends ScopeFilter {
  months_of_supply_12mo: number | null;
  months_of_supply_3mo: number | null;
}

interface NegotiationRow extends ScopeFilter {
  month: string;
  median_sale_to_list: number | null;
  pct_with_reduction: number | null;
}

interface StatusVelocityRow extends ScopeFilter {
  month: string;
  median_days_to_pending: number | null;
}

export interface ListingReadData {
  subjectPpsf: number;
  compMedianPpsf: number;
  compPoolSize: number;
  areaMedianDom: number;
  areaMonthsOfSupply: number;
  areaYoYPriceChangePct: number;
  areaLabel: string;
  /** Optional advanced signals — null when the relevant mart row is missing. */
  saleToListRatio: number | null;
  medianDaysToPending: number | null;
  pctWithReduction: number | null;
}

const METRO_FILTER: ScopeFilter = {
  scope_type: 'metro',
  scope_key: 'phoenix_metro',
  property_segment: 'residential',
};

/**
 * Map a curated community to its region scope_key in the dbt marts.
 * Returns null when no region rollup applies — caller falls back to
 * metro scope.
 *
 * The region scope_keys are kebab-case and come from the dbt
 * `analytics_base` model; we hardcode the few we need rather than
 * round-trip a directory mart.
 */
function regionScopeKeyFor(curated: CuratedCommunity | null): string | null {
  if (!curated) return null;
  // Communities with scopeType='region' carry the region key on themselves.
  if (curated.scopeType === 'region') return curated.scopeKey;
  // Community-level entries map to the parent region via locality.
  const locality = curated.locality.toLowerCase();
  if (locality === 'north scottsdale') return 'north-scottsdale';
  if (locality === 'scottsdale') return 'scottsdale';
  if (locality === 'paradise valley') return 'paradise-valley';
  return null;
}

/**
 * Build the props object for MockTheRead. Prefers region scope (so
 * Silverleaf reads against North Scottsdale, not the whole metro) and
 * falls back to metro when the listing's locality has no region
 * rollup or the region mart row is missing.
 *
 * Returns null when the subject doesn't carry a pricePerSqft (e.g.
 * land lots) or the marts are unreachable / underpopulated.
 */
export async function getListingReadData(
  listing: Listing,
): Promise<ListingReadData | null> {
  if (!listing.pricePerSqft || listing.pricePerSqft <= 0) return null;

  const curated = matchCuratedCommunity({
    community: listing.community,
    subdivisionDisplay: listing.subdivisionDisplay,
    city: listing.city,
  });
  const regionKey = regionScopeKeyFor(curated);

  // Pull metro + region pulse, MoS, negotiation, and velocity in
  // parallel. All marts are small split files cached for 1h in
  // lib/marts.ts, so subsequent listings amortize the fetch cost.
  let metroPulse: MarketPulseRow[];
  let regionPulse: MarketPulseRow[];
  let mosRows: MosRow[];
  let negotiationRows: NegotiationRow[];
  let velocityRows: StatusVelocityRow[];
  try {
    [metroPulse, regionPulse, mosRows, negotiationRows, velocityRows] = await Promise.all([
      readMart<MarketPulseRow>('fct_market_pulse_metro'),
      regionKey
        ? readMart<MarketPulseRow>('fct_market_pulse_region')
        : Promise.resolve([] as MarketPulseRow[]),
      readMart<MosRow>('fct_months_of_supply'),
      readMart<NegotiationRow>('fct_negotiation_metro').catch(() => [] as NegotiationRow[]),
      readMart<StatusVelocityRow>('fct_status_velocity').catch(() => [] as StatusVelocityRow[]),
    ]);
  } catch {
    return null;
  }

  const regionFilter: ScopeFilter | null = regionKey
    ? { scope_type: 'region', scope_key: regionKey, property_segment: 'residential' }
    : null;

  // Try region first, fall back to metro if the region rollup is
  // empty (key mismatch with mart, recently added community, etc.).
  const regionRows = regionFilter
    ? filterScope(regionPulse, regionFilter).sort((a, b) =>
        a.month < b.month ? 1 : -1,
      )
    : [];
  const metroRows = filterScope(metroPulse, METRO_FILTER).sort((a, b) =>
    a.month < b.month ? 1 : -1,
  );

  const useRegion = regionRows.length > 0;
  const rows = useRegion ? regionRows : metroRows;
  const scopeFilter = useRegion && regionFilter ? regionFilter : METRO_FILTER;
  const label = useRegion && curated ? curated.locality : 'Phoenix Metro';

  const latest = rows[0];
  if (!latest) return null;

  const latestMedianPpsf = num(latest.median_ppsf);
  const latestMedianDom = num(latest.median_dom);
  if (latestMedianPpsf == null || latestMedianDom == null) return null;

  // YoY = (latest month median_ppsf - same-month-prior-year median_ppsf)
  // / same-month-prior-year. Falls back to null when the prior-year row
  // is missing or zero.
  const yoyRow = rows.find((r) => {
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
  const last12 = rows.slice(0, 12);
  const compPoolSize = last12.reduce(
    (sum, r) => sum + (num(r.closing_count) ?? 0),
    0,
  );

  // Months of supply — same scope as the pulse data. Prefer 12-mo
  // (more stable for luxury inventory's slow churn) and fall back
  // to 3-mo, then to whatever scope has a row.
  const scopedMos = filterScope(mosRows, scopeFilter)[0];
  const metroMos = filterScope(mosRows, METRO_FILTER)[0];
  const mosSource = scopedMos ?? metroMos;
  const mos =
    num(mosSource?.months_of_supply_12mo) ??
    num(mosSource?.months_of_supply_3mo) ??
    0;

  // Negotiation / velocity — metro scope only (the per-scope splits
  // for these marts aren't enabled yet). Pick the most recent row
  // whose measure of interest is populated and non-zero. The very
  // latest month often lands in the mart before the underlying
  // listings have all settled (e.g. days_to_pending = 0 because no
  // pending transitions have closed yet), so the latest-row-wins
  // strategy can surface placeholder zeros.
  const negotiationRowsScoped = filterScope(negotiationRows, METRO_FILTER)
    .sort((a, b) => (a.month < b.month ? 1 : -1));
  const velocityRowsScoped = filterScope(velocityRows, METRO_FILTER)
    .sort((a, b) => (a.month < b.month ? 1 : -1));

  const saleToListRow = negotiationRowsScoped.find(
    (r) => typeof r.median_sale_to_list === 'number' && r.median_sale_to_list > 0,
  );
  const reductionRow = negotiationRowsScoped.find(
    (r) => typeof r.pct_with_reduction === 'number' && r.pct_with_reduction > 0,
  );
  const daysToPendingRow = velocityRowsScoped.find(
    (r) => typeof r.median_days_to_pending === 'number' && r.median_days_to_pending > 0,
  );

  return {
    subjectPpsf: listing.pricePerSqft,
    compMedianPpsf: latestMedianPpsf,
    compPoolSize,
    areaMedianDom: Math.round(latestMedianDom),
    areaMonthsOfSupply: mos,
    areaYoYPriceChangePct: yoy,
    areaLabel: label,
    saleToListRatio: num(saleToListRow?.median_sale_to_list),
    medianDaysToPending: roundOrNull(num(daysToPendingRow?.median_days_to_pending)),
    pctWithReduction: num(reductionRow?.pct_with_reduction),
  };
}

function roundOrNull(n: number | null): number | null {
  return n == null ? null : Math.round(n);
}

function num(v: number | bigint | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'bigint' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}
