/**
 * Live market-reports composer — pulls quarterly data from
 *   - analytics_base   (true cross-quarter median price-per-sqft)
 *   - mv_market_pulse  (eight-quarter trend backstop, monthly closes)
 *   - mv_supply_demand (supply-vs-demand monthly chart)
 *   - mv_inventory_age (current inventory-age snapshot)
 *   - mv_community_scorecard (rolling-12mo medians + YoY)
 *   - listing_records  (volume bands, headline stats)
 *
 * COMPLIANCE: Aggregate sold data only. Individual closed listings
 * (top-sales tables) are NOT surfaced — only aggregate stats (counts,
 * medians, max sale price as a single scalar).
 *
 * Editorial copy stays static. Numbers/charts/headline-stats are computed.
 *
 * PHASE 1 VALIDATION (committed 2026-04-25 against the live RDS, MVs
 * freshly refreshed). The current MV `mv_market_pulse.avg_price_per_sqft`
 * is an `avg(price_per_sqft)` across closes within a single month — when
 * we then average across the months of a quarter we get an
 * "avg-of-monthly-avgs" figure that drifts from a true cross-quarter
 * median. Verified deltas for Q1 2026:
 *
 *      community              MV avg-of-avgs   true median ppsf ($1M+)   n
 *      ─────────────────────  ───────────────  ───────────────────────  ───
 *      silverleaf-at-dc-ranch $789 (n=1)       $919                     3
 *      desert-mountain        $737 (n=4)       $699                     24
 *      estancia               $961 (n=1)       $774                     5
 *      paradise-valley        $1,446 (n=24)    $1,039                   71
 *      dc-ranch               $767 (n=8)       $755                     28
 *      arcadia                $815 (n=12)      $1,156                   69
 *      biltmore               $599 (n=15)      $670                     29
 *      troon-north            $439 (n=9)       $486                     20
 *      fountain-hills         $345 (n=30)      $393                     32
 *      north-scottsdale       $488 (n=165)     $548                     393
 *
 * For correctness we now query `analytics_base` directly, compute a true
 * `percentile_cont(0.5)` of `price_per_sqft` per quarter, and gate at
 * n >= 5 closes per (community, quarter). Communities below threshold
 * are reported in `coverage.trend` and OMITTED from the chart.
 *
 * VOLUME bands — confirmed correct vs MV-free direct query (Q1 2026,
 * Yong cities, residential, $3M+):
 *      $3-5M=145, $5-8M=60, $8-12M=16, $12-20M=11, $20M+=3.
 *
 * MEDIANS scorecard — `mv_community_scorecard.avg_ppsf` is a
 * trailing-12-month average; not directly comparable to per-quarter trend
 * values. We continue to use it as the bar value but additionally surface
 * `total_closed >= 5` as a coverage gate.
 *
 * HEADLINES — confirmed Q1 2026 (Yong cities, residential, $3M+):
 *      median close $4.3M, count 235, median DOM 110.
 *      mv_community_scorecard 'region/north-scottsdale/residential'
 *        yoy_price_change_pct = 4.0  (rendered as +4.0%).
 */

import { query } from './db';
import type {
  DataCoverage,
  InventoryAgePoint,
  MarketReport,
  MedianBar,
  PriceBandPoint,
  QuarterPoint,
  SupplyDemandPoint,
  Tier,
} from '@/content/market-reports';
import { COMMUNITY_TIERS, MARKET_REPORT_COPY } from '@/content/market-reports';

// Community scope map

type ScopeType = 'community' | 'region' | 'metro';

interface CommunitySource {
  /** Display label as it appears in chart series + median bars. */
  label: string;
  /** mv_market_pulse / mv_community_scorecard scope_type. */
  scopeType: ScopeType;
  /** mv scope_key. */
  scopeKey: string;
  /** Tier from COMMUNITY_TIERS. */
  tier: Tier;
}

interface CombinedSource {
  /** Display label for combined series (e.g. "Carefree & Cave Creek"). */
  label: string;
  scopeType: ScopeType;
  /** Two scope_keys whose monthly samples get pooled. */
  scopeKeys: [string, string];
  tier: Tier;
}

const COMMUNITY_SOURCES: CommunitySource[] = [
  { label: 'Silverleaf', scopeType: 'community', scopeKey: 'silverleaf-at-dc-ranch', tier: 'signature' },
  { label: 'Desert Mountain', scopeType: 'community', scopeKey: 'desert-mountain', tier: 'signature' },
  { label: 'Estancia', scopeType: 'community', scopeKey: 'estancia', tier: 'signature' },
  { label: 'Paradise Valley', scopeType: 'region', scopeKey: 'paradise-valley', tier: 'signature' },
  { label: 'DC Ranch', scopeType: 'community', scopeKey: 'dc-ranch', tier: 'signature' },
  { label: 'Arcadia', scopeType: 'region', scopeKey: 'arcadia', tier: 'notable' },
  { label: 'Biltmore', scopeType: 'region', scopeKey: 'biltmore', tier: 'notable' },
  { label: 'Troon North', scopeType: 'community', scopeKey: 'troon-north', tier: 'notable' },
  { label: 'Scottsdale', scopeType: 'region', scopeKey: 'north-scottsdale', tier: 'notable' },
  { label: 'Fountain Hills', scopeType: 'region', scopeKey: 'fountain-hills', tier: 'broader' },
];

const COMBINED_SOURCES: CombinedSource[] = [
  {
    label: 'Carefree & Cave Creek',
    scopeType: 'region',
    scopeKeys: ['carefree', 'cave-creek'],
    tier: 'notable',
  },
];

/** Yong's service-area cities — used for luxury volume band aggregation. */
const YONG_VOLUME_CITIES: readonly string[] = [
  'Scottsdale',
  'Paradise Valley',
  'Phoenix',
  'Carefree',
  'Cave Creek',
  'Fountain Hills',
];

/** Minimum-sample gates. */
const TREND_MIN_SAMPLE = 5;
const MEDIANS_MIN_CLOSED = 5;

// Process-level memoization. The composer is read-heavy and hits 1.8M-row
// listing_records via seq scan (no useful indexes for Closed+close_date>=X).
// Cold-cache queries take 30-150s each. Cache for the full revalidate
// window to avoid repeated scans within the same Next.js worker process.
//
// Cache key is the slug; value is a settled Promise so concurrent callers
// dedupe onto a single in-flight composition. TTL matches `revalidate`.
const REPORT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const reportCache = new Map<string, { at: number; promise: Promise<MarketReport | null> }>();

// Helpers

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

/** Format a Date (UTC) into the report's chart-axis quarter label. */
export function quarterLabel(d: Date): string {
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  const yy = String(d.getUTCFullYear()).slice(2);
  return `Q${q} '${yy}`;
}

/** Parse a slug like "q1-2026" into year + quarter. */
export function parseQuarterSlug(slug: string): { year: number; quarter: 1 | 2 | 3 | 4 } | null {
  const m = /^q([1-4])-(\d{4})$/i.exec(slug);
  if (!m) return null;
  return { year: parseInt(m[2], 10), quarter: parseInt(m[1], 10) as 1 | 2 | 3 | 4 };
}

function quarterStart(year: number, quarter: 1 | 2 | 3 | 4): Date {
  return new Date(Date.UTC(year, (quarter - 1) * 3, 1));
}

function quarterEndExclusive(year: number, quarter: 1 | 2 | 3 | 4): Date {
  if (quarter === 4) return new Date(Date.UTC(year + 1, 0, 1));
  return new Date(Date.UTC(year, quarter * 3, 1));
}

export function shiftQuarter(
  year: number,
  quarter: 1 | 2 | 3 | 4,
  delta: number,
): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const total = year * 4 + (quarter - 1) + delta;
  const ny = Math.floor(total / 4);
  const nq = ((total % 4) + 4) % 4;
  return { year: ny, quarter: (nq + 1) as 1 | 2 | 3 | 4 };
}

function shortMonthLabel(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}

// Trend builder
//
// SOURCE (per LABEL, per quarter):
//   SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY price_per_sqft) AS median_ppsf,
//          COUNT(*) AS n
//   FROM analytics_base
//   WHERE label-matching scope filter
//     AND property_segment = 'residential'
//     AND standard_status = 'Closed'
//     AND close_date >= $quarter_start AND close_date < $next_quarter_start
//     AND close_price >= 1000000;
//
// Combined-source labels (Carefree & Cave Creek) pool the raw `price_per_sqft`
// samples from BOTH region_slugs into a single percentile_cont — a true median
// of pooled samples, NOT a mean of submedians. The previous weighted-mean
// approach drifts from the actual cohort median (mean-of-medians fallacy)
// and has been removed.
//
// Drop the data point when n < TREND_MIN_SAMPLE (5).
interface QuarterMedianRow {
  label: string;
  q_start: Date | string;
  median_ppsf: string | number | null;
  n: string | number | null;
}

async function buildTrend(
  targetYear: number,
  targetQuarter: 1 | 2 | 3 | 4,
): Promise<{ points: QuarterPoint[]; coverage: DataCoverage[] }> {
  const startQ = shiftQuarter(targetYear, targetQuarter, -7);
  const startOfWindow = quarterStart(startQ.year, startQ.quarter);
  const endExclusive = quarterEndExclusive(targetYear, targetQuarter);

  // Build a (label, scope_type, scope_key) tuple list. Each label can
  // claim ONE OR MORE (scope_type, scope_key) tuples — combined sources
  // simply repeat the same label for each underlying scope.
  type LabelTuple = { label: string; scopeType: ScopeType; scopeKey: string };
  const labelTuples: LabelTuple[] = [
    ...COMMUNITY_SOURCES.map((c) => ({ label: c.label, scopeType: c.scopeType, scopeKey: c.scopeKey })),
    ...COMBINED_SOURCES.flatMap((c) =>
      c.scopeKeys.map((k) => ({ label: c.label, scopeType: c.scopeType, scopeKey: k })),
    ),
  ];

  // Project each row in analytics_base to its display label via UNNEST'd
  // lookup tables — one per scope_type — joined inside a CTE so that the
  // outer GROUP BY (label, q_start) sees pooled raw samples (not submedians).
  const communityTuples = labelTuples.filter((t) => t.scopeType === 'community');
  const regionTuples = labelTuples.filter((t) => t.scopeType === 'region');

  const sql = `
    WITH community_lbl(scope_key, label) AS (
      SELECT * FROM unnest($1::text[], $2::text[])
    ),
    region_lbl(scope_key, label) AS (
      SELECT * FROM unnest($3::text[], $4::text[])
    ),
    source AS (
      SELECT cl.label,
             date_trunc('quarter', ab.close_date)::date AS q_start,
             ab.price_per_sqft
      FROM analytics_base ab
      JOIN community_lbl cl ON cl.scope_key = ab.community_slug
      WHERE ab.property_segment = 'residential'
        AND ab.standard_status = 'Closed'
        AND ab.close_date >= $5::date AND ab.close_date < $6::date
        AND ab.close_price >= 1000000
        AND ab.price_per_sqft IS NOT NULL
      UNION ALL
      SELECT rl.label,
             date_trunc('quarter', ab.close_date)::date AS q_start,
             ab.price_per_sqft
      FROM analytics_base ab
      JOIN region_lbl rl ON rl.scope_key = ab.region_slug
      WHERE ab.property_segment = 'residential'
        AND ab.standard_status = 'Closed'
        AND ab.close_date >= $5::date AND ab.close_date < $6::date
        AND ab.close_price >= 1000000
        AND ab.price_per_sqft IS NOT NULL
    )
    SELECT label, q_start,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY price_per_sqft)::numeric(10,2) AS median_ppsf,
           COUNT(*)::int AS n
    FROM source
    GROUP BY label, q_start
  `;

  const { rows } = await query<QuarterMedianRow>(sql, [
    communityTuples.map((t) => t.scopeKey),
    communityTuples.map((t) => t.label),
    regionTuples.map((t) => t.scopeKey),
    regionTuples.map((t) => t.label),
    startOfWindow,
    endExclusive,
  ]);

  type Cell = { median: number; n: number };
  const byLabel = new Map<string, Map<string, Cell>>();
  for (const r of rows) {
    const m = pNum(r.median_ppsf);
    const n = pInt(r.n);
    if (m === null || n === 0) continue;
    const qDate = r.q_start instanceof Date ? r.q_start : new Date(r.q_start);
    const qIso = qDate.toISOString();
    let inner = byLabel.get(r.label);
    if (!inner) {
      inner = new Map();
      byLabel.set(r.label, inner);
    }
    inner.set(qIso, { median: m, n });
  }

  // 8 quarter labels in chronological order.
  const quarters: { label: string; iso: string }[] = [];
  for (let i = 7; i >= 0; i--) {
    const s = shiftQuarter(targetYear, targetQuarter, -i);
    const start = quarterStart(s.year, s.quarter);
    quarters.push({ label: quarterLabel(start), iso: start.toISOString() });
  }

  const points: QuarterPoint[] = quarters.map((q) => {
    const point: QuarterPoint = { quarter: q.label };
    for (const [label, inner] of byLabel) {
      const cell = inner.get(q.iso);
      if (cell && cell.n >= TREND_MIN_SAMPLE) {
        point[label] = Math.round(cell.median);
      }
      // Otherwise omit — recharts treats missing keys as gaps. Coverage
      // for the *target* quarter is reported separately below.
    }
    return point;
  });

  // Build coverage report for the TARGET quarter only — that's the one
  // the methodology footnote highlights as "excluded this quarter".
  const targetIso = quarters[quarters.length - 1].iso;
  const coverage: DataCoverage[] = [];
  for (const c of [...COMMUNITY_SOURCES, ...COMBINED_SOURCES]) {
    const label = c.label;
    const inner = byLabel.get(label);
    const cell = inner?.get(targetIso);
    const n = cell?.n ?? 0;
    coverage.push({
      community: label,
      sampleSize: n,
      threshold: TREND_MIN_SAMPLE,
      status: n === 0 ? 'missing' : n < TREND_MIN_SAMPLE ? 'thin' : 'sufficient',
    });
  }

  return { points, coverage };
}

// Volume bands builder

const BAND_DEFS = [
  { label: '$3-5M', min: 3_000_000, max: 5_000_000 },
  { label: '$5-8M', min: 5_000_000, max: 8_000_000 },
  { label: '$8-12M', min: 8_000_000, max: 12_000_000 },
  { label: '$12-20M', min: 12_000_000, max: 20_000_000 },
  { label: '$20M+', min: 20_000_000, max: null as number | null },
] as const;

function bandOf(price: number): string | null {
  if (price < 3_000_000) return null;
  for (const b of BAND_DEFS) {
    if (b.max == null || price < b.max) return b.label;
  }
  return '$20M+';
}

// SOURCE (closed bands, target quarter):
//   SELECT band, COUNT(*) FROM listing_records
//   WHERE list_price >= 2_500_000 AND close_price >= 3_000_000
//     AND standard_status = 'Closed'
//     AND close_date >= $start AND close_date < $end
//     AND city = ANY(YONG_VOLUME_CITIES)
//   GROUP BY band;
//
// SOURCE (active bands, snapshot now):
//   SELECT band, COUNT(*) FROM listing_records
//   WHERE standard_status IN ('Active','Active Under Contract','Pending')
//     AND is_deleted = FALSE AND internet_entire_listing_display_yn = TRUE
//     AND list_price >= 3_000_000 AND city = ANY(YONG_VOLUME_CITIES)
//   GROUP BY band;
//
// IDX rationale: closed historical aggregates are not subject to
// IDX-display rules (those govern individual-listing rendering, not
// aggregate counts). Active counts retain
// internet_entire_listing_display_yn = TRUE since the active band
// chart is a public-display surface.
//
// list_price >= 2_500_000 prefilter exists purely for index-scan
// selectivity via `idx_lr_price`; the close_price >= 3_000_000 bound
// stays in place for accuracy. Confirmed Q1 2026 vs unfiltered query:
// counts identical (sold-below-list edge cases negligible at $3M+).
async function buildVolume(
  targetYear: number,
  targetQuarter: 1 | 2 | 3 | 4,
): Promise<PriceBandPoint[]> {
  const start = quarterStart(targetYear, targetQuarter);
  const end = quarterEndExclusive(targetYear, targetQuarter);

  const soldSql = `
    SELECT
      CASE WHEN close_price < 5000000 THEN '$3-5M'
           WHEN close_price < 8000000 THEN '$5-8M'
           WHEN close_price < 12000000 THEN '$8-12M'
           WHEN close_price < 20000000 THEN '$12-20M'
           ELSE '$20M+' END AS band,
      COUNT(*)::int AS count
    FROM listing_records
    WHERE list_price >= 2500000
      AND close_price >= 3000000
      AND standard_status = 'Closed'
      AND close_date >= $1 AND close_date < $2
      AND city = ANY($3)
    GROUP BY 1
  `;

  const activeSql = `
    SELECT
      CASE WHEN list_price < 5000000 THEN '$3-5M'
           WHEN list_price < 8000000 THEN '$5-8M'
           WHEN list_price < 12000000 THEN '$8-12M'
           WHEN list_price < 20000000 THEN '$12-20M'
           ELSE '$20M+' END AS band,
      COUNT(*)::int AS count
    FROM listing_records
    WHERE standard_status IN ('Active','Active Under Contract','Pending')
      AND is_deleted = FALSE
      AND internet_entire_listing_display_yn = TRUE
      AND list_price >= 3000000
      AND city = ANY($1)
    GROUP BY 1
  `;

  interface BandRow { band: string; count: number | string }
  const [sold, active] = await Promise.all([
    query<BandRow>(soldSql, [start, end, YONG_VOLUME_CITIES]),
    query<BandRow>(activeSql, [YONG_VOLUME_CITIES]),
  ]);

  const soldByBand = new Map<string, number>(sold.rows.map((r) => [r.band, pInt(r.count)]));
  const activeByBand = new Map<string, number>(active.rows.map((r) => [r.band, pInt(r.count)]));

  return BAND_DEFS.map((b) => ({
    band: b.label,
    forSale: activeByBand.get(b.label) ?? 0,
    sold: soldByBand.get(b.label) ?? 0,
  }));
}

// Medians builder
//
// SOURCE: mv_community_scorecard with property_segment='residential', one
// row per (scope_type, scope_key). avg_ppsf is a trailing-12-month average,
// yoy_price_change_pct compares median-of-last-12mo vs median-of-prior-12mo.
//
//   SELECT scope_type, scope_key, avg_ppsf, yoy_price_change_pct, total_closed
//   FROM mv_community_scorecard
//   WHERE property_segment='residential'
//     AND (scope_type, scope_key) IN (...curated set);
//
// Coverage: drop a community (status='thin'/'missing') when total_closed
// < MEDIANS_MIN_CLOSED. A signature/notable community below 5 trailing-12
// closes is reported in `coverage.medians` but excluded from the bars.
interface ScorecardRow {
  scope_type: string;
  scope_key: string;
  avg_ppsf: string | number | null;
  yoy_price_change_pct: string | number | null;
  total_closed: string | number | null;
}

async function buildMedians(): Promise<{ bars: MedianBar[]; coverage: DataCoverage[] }> {
  // Build (scope_type, scope_key) pairs for every label we want.
  const wanted = new Map<string, { label: string; tier: Tier }>();
  for (const c of COMMUNITY_SOURCES) {
    wanted.set(`${c.scopeType}|${c.scopeKey}`, { label: c.label, tier: c.tier });
  }
  for (const c of COMBINED_SOURCES) {
    for (const k of c.scopeKeys) {
      wanted.set(`${c.scopeType}|${k}`, { label: c.label, tier: c.tier });
    }
  }

  const entries = Array.from(wanted.entries());
  const stypes = entries.map(([k]) => k.split('|')[0]);
  const skeys = entries.map(([k]) => k.split('|')[1]);

  const sql = `
    SELECT scope_type, scope_key, avg_ppsf, yoy_price_change_pct, total_closed
    FROM mv_community_scorecard
    WHERE property_segment = 'residential'
      AND (scope_type, scope_key) IN (
        SELECT * FROM unnest($1::text[], $2::text[])
      )
  `;
  const { rows } = await query<ScorecardRow>(sql, [stypes, skeys]);

  type Agg = { ppsfSum: number; ppsfCount: number; yoySum: number; yoyCount: number; closedSum: number; tier: Tier };
  const byLabel = new Map<string, Agg>();

  for (const r of rows) {
    const meta = wanted.get(`${r.scope_type}|${r.scope_key}`);
    if (!meta) continue;
    const ppsf = pNum(r.avg_ppsf);
    const yoy = pNum(r.yoy_price_change_pct);
    const closed = pInt(r.total_closed);
    const cur = byLabel.get(meta.label) ?? {
      ppsfSum: 0,
      ppsfCount: 0,
      yoySum: 0,
      yoyCount: 0,
      closedSum: 0,
      tier: meta.tier,
    };
    if (ppsf !== null) {
      cur.ppsfSum += ppsf;
      cur.ppsfCount += 1;
    }
    if (yoy !== null) {
      cur.yoySum += yoy;
      cur.yoyCount += 1;
    }
    cur.closedSum += closed;
    byLabel.set(meta.label, cur);
  }

  const bars: MedianBar[] = [];
  const coverage: DataCoverage[] = [];

  // Iterate in source order for stable coverage output.
  const orderedLabels: { label: string; tier: Tier }[] = [];
  for (const c of COMMUNITY_SOURCES) orderedLabels.push({ label: c.label, tier: c.tier });
  for (const c of COMBINED_SOURCES) orderedLabels.push({ label: c.label, tier: c.tier });

  for (const { label } of orderedLabels) {
    const a = byLabel.get(label);
    if (!a || a.ppsfCount === 0) {
      coverage.push({
        community: label,
        sampleSize: 0,
        threshold: MEDIANS_MIN_CLOSED,
        status: 'missing',
      });
      continue;
    }
    if (a.closedSum < MEDIANS_MIN_CLOSED) {
      coverage.push({
        community: label,
        sampleSize: a.closedSum,
        threshold: MEDIANS_MIN_CLOSED,
        status: 'thin',
      });
      continue;
    }
    bars.push({
      neighborhood: label,
      tier: a.tier,
      median: Math.round(a.ppsfSum / a.ppsfCount),
      // mv yoy_price_change_pct is a percentage (e.g. 6.3); consumer expects a fraction (0.063).
      yoyChange: a.yoyCount > 0 ? a.yoySum / a.yoyCount / 100 : 0,
    });
    coverage.push({
      community: label,
      sampleSize: a.closedSum,
      threshold: MEDIANS_MIN_CLOSED,
      status: 'sufficient',
    });
  }

  bars.sort((x, y) => y.median - x.median);
  return { bars, coverage };
}

// Supply vs demand builder (NEW chart A)
//
// SOURCE: mv_supply_demand pooled across Yong's signature & notable scopes
// for the trailing 12 months ending at target-quarter end.
//
//   SELECT month, SUM(new_listings) AS new_listings, SUM(closed_sales) AS closed
//   FROM mv_supply_demand
//   WHERE property_segment='residential'
//     AND (scope_type, scope_key) IN (...curated set)
//     AND month >= ($end - 12 months) AND month < $end
//   GROUP BY month;
//
// Read: gap between newListings and closed lines is the absorption signal
// — when newListings overtakes closed for several months running, supply
// is building.
interface SupplyDemandDbRow {
  month: Date | string;
  new_listings: string | number | null;
  closed_sales: string | number | null;
}

async function buildSupplyDemand(
  targetYear: number,
  targetQuarter: 1 | 2 | 3 | 4,
): Promise<SupplyDemandPoint[]> {
  const end = quarterEndExclusive(targetYear, targetQuarter);
  const startDate = new Date(end);
  startDate.setUTCMonth(startDate.getUTCMonth() - 12);

  // Build (scope_type, scope_key) pair list — same as medians.
  const wanted: { scopeType: ScopeType; scopeKey: string }[] = [
    ...COMMUNITY_SOURCES.map((c) => ({ scopeType: c.scopeType, scopeKey: c.scopeKey })),
    ...COMBINED_SOURCES.flatMap((c) =>
      c.scopeKeys.map((k) => ({ scopeType: c.scopeType, scopeKey: k })),
    ),
  ];
  const stypes = wanted.map((w) => w.scopeType);
  const skeys = wanted.map((w) => w.scopeKey);

  const sql = `
    SELECT month,
           SUM(new_listings)::int AS new_listings,
           SUM(closed_sales)::int AS closed_sales
    FROM mv_supply_demand
    WHERE property_segment = 'residential'
      AND (scope_type, scope_key) IN (
        SELECT * FROM unnest($1::text[], $2::text[])
      )
      AND month >= $3::date AND month < $4::date
    GROUP BY month
    ORDER BY month
  `;

  const { rows } = await query<SupplyDemandDbRow>(sql, [stypes, skeys, startDate, end]);

  return rows.map((r) => {
    const d = r.month instanceof Date ? r.month : new Date(r.month);
    return {
      month: shortMonthLabel(d),
      newListings: pInt(r.new_listings),
      closed: pInt(r.closed_sales),
    };
  });
}

// Inventory age builder (NEW chart B)
//
// SOURCE: mv_inventory_age — current snapshot only (month='current').
// Bucket counts per (scope_type, scope_key, dom_bucket).
//
//   SELECT scope_type, scope_key, dom_bucket, listing_count
//   FROM mv_inventory_age
//   WHERE property_segment='residential'
//     AND month='current'
//     AND (scope_type, scope_key) IN (...curated set);
interface InventoryAgeDbRow {
  scope_type: string;
  scope_key: string;
  dom_bucket: string;
  listing_count: string | number | null;
}

const DOM_BUCKETS = ['0-30', '31-60', '61-90', '91-180', '180+'] as const;

async function buildInventoryAge(): Promise<{ points: InventoryAgePoint[]; coverage: DataCoverage[] }> {
  const wanted: { scopeType: ScopeType; scopeKey: string }[] = [
    ...COMMUNITY_SOURCES.map((c) => ({ scopeType: c.scopeType, scopeKey: c.scopeKey })),
    ...COMBINED_SOURCES.flatMap((c) =>
      c.scopeKeys.map((k) => ({ scopeType: c.scopeType, scopeKey: k })),
    ),
  ];
  const stypes = wanted.map((w) => w.scopeType);
  const skeys = wanted.map((w) => w.scopeKey);

  const sql = `
    SELECT scope_type, scope_key, dom_bucket, listing_count
    FROM mv_inventory_age
    WHERE property_segment = 'residential'
      AND month = 'current'
      AND (scope_type, scope_key) IN (
        SELECT * FROM unnest($1::text[], $2::text[])
      )
  `;
  const { rows } = await query<InventoryAgeDbRow>(sql, [stypes, skeys]);

  // scope -> label (combined sources collapse).
  const keyToMeta = new Map<string, { label: string; tier: Tier }>();
  for (const c of COMMUNITY_SOURCES) keyToMeta.set(`${c.scopeType}|${c.scopeKey}`, { label: c.label, tier: c.tier });
  for (const c of COMBINED_SOURCES) {
    for (const k of c.scopeKeys) keyToMeta.set(`${c.scopeType}|${k}`, { label: c.label, tier: c.tier });
  }

  type Bucket = Record<string, number>;
  const byLabel = new Map<string, { tier: Tier; buckets: Bucket; total: number }>();

  for (const r of rows) {
    const meta = keyToMeta.get(`${r.scope_type}|${r.scope_key}`);
    if (!meta) continue;
    const cnt = pInt(r.listing_count);
    let entry = byLabel.get(meta.label);
    if (!entry) {
      entry = { tier: meta.tier, buckets: {}, total: 0 };
      byLabel.set(meta.label, entry);
    }
    entry.buckets[r.dom_bucket] = (entry.buckets[r.dom_bucket] ?? 0) + cnt;
    entry.total += cnt;
  }

  // Stable ordering, signature first.
  const orderedLabels: { label: string; tier: Tier }[] = [];
  for (const c of COMMUNITY_SOURCES) orderedLabels.push({ label: c.label, tier: c.tier });
  for (const c of COMBINED_SOURCES) orderedLabels.push({ label: c.label, tier: c.tier });

  const points: InventoryAgePoint[] = [];
  const coverage: DataCoverage[] = [];
  for (const { label, tier } of orderedLabels) {
    const e = byLabel.get(label);
    if (!e || e.total === 0) {
      coverage.push({
        community: label,
        sampleSize: 0,
        threshold: 1,
        status: 'missing',
      });
      continue;
    }
    // Normalize bucket keys to the canonical ladder.
    const normalized: Record<string, number> = {};
    for (const b of DOM_BUCKETS) normalized[b] = e.buckets[b] ?? 0;
    points.push({ community: label, tier, buckets: normalized, total: e.total });
    coverage.push({
      community: label,
      sampleSize: e.total,
      threshold: 1,
      status: 'sufficient',
    });
  }

  return { points, coverage };
}

// Headline stats builder

interface MedianSaleRow {
  median_close_price: string | number | null;
  closed_count: string | number | null;
  median_dom: string | number | null;
}

interface ScorecardYoyRow {
  yoy_price_change_pct: string | number | null;
}

async function buildHeadlineStats(
  targetYear: number,
  targetQuarter: 1 | 2 | 3 | 4,
): Promise<MarketReport['headlineStats']> {
  const start = quarterStart(targetYear, targetQuarter);
  const end = quarterEndExclusive(targetYear, targetQuarter);
  const quarterDisplay = `Q${targetQuarter} ${targetYear}`;

  const stats: MarketReport['headlineStats'] = [];

  // 1) Median luxury sale across Yong's market this quarter (>= $3M).
  // Same IDX rationale as buildVolume. list_price-led prefilter for index
  // selectivity via idx_lr_price.
  //
  // SOURCE:
  //   SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY close_price) AS median_close_price,
  //          COUNT(*) AS closed_count,
  //          percentile_cont(0.5) WITHIN GROUP (ORDER BY days_on_market) AS median_dom
  //   FROM listing_records
  //   WHERE list_price >= 2_500_000 AND close_price >= 3_000_000
  //     AND standard_status = 'Closed'
  //     AND close_date >= $start AND close_date < $end
  //     AND city = ANY(YONG_VOLUME_CITIES);
  const medianSql = `
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY close_price)::numeric AS median_close_price,
           COUNT(*)::int AS closed_count,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY days_on_market)::numeric AS median_dom
    FROM listing_records
    WHERE list_price >= 2500000
      AND close_price >= 3000000
      AND standard_status = 'Closed'
      AND close_date >= $1 AND close_date < $2
      AND city = ANY($3)
  `;
  const { rows: medRows } = await query<MedianSaleRow>(medianSql, [
    start,
    end,
    YONG_VOLUME_CITIES,
  ]);
  const med = medRows[0] ?? { median_close_price: null, closed_count: 0, median_dom: null };
  const medianClose = pNum(med.median_close_price);
  const closedCount = pInt(med.closed_count);
  const medianDom = pNum(med.median_dom);

  if (medianClose !== null && medianClose > 0) {
    stats.push({
      value: `$${(medianClose / 1_000_000).toFixed(1)}M`,
      label: `Median luxury sale · ${quarterDisplay}`,
    });
  }

  // 2) YoY ppsf for North Scottsdale (region row in scorecard).
  //
  // SOURCE:
  //   SELECT yoy_price_change_pct FROM mv_community_scorecard
  //   WHERE scope_type='region' AND scope_key='north-scottsdale'
  //     AND property_segment='residential';
  const yoySql = `
    SELECT yoy_price_change_pct
    FROM mv_community_scorecard
    WHERE scope_type = 'region' AND scope_key = 'north-scottsdale'
      AND property_segment = 'residential'
    LIMIT 1
  `;
  const { rows: yoyRows } = await query<ScorecardYoyRow>(yoySql);
  const yoy = yoyRows[0] ? pNum(yoyRows[0].yoy_price_change_pct) : null;
  if (yoy !== null && Math.abs(yoy) > 0.05) {
    const sign = yoy > 0 ? '+' : '';
    stats.push({
      value: `${sign}${yoy.toFixed(1)}%`,
      label: 'YoY price-per-sqft · North Scottsdale',
    });
  }

  // 3) Luxury closes tracked.
  if (closedCount > 0) {
    stats.push({
      value: closedCount.toString(),
      label: 'Luxury closes tracked · $3M+',
    });
  }

  // 4) Median DOM for the same cohort.
  if (medianDom !== null && medianDom > 0) {
    stats.push({
      value: `${Math.round(medianDom)} days`,
      label: 'Median DOM · luxury closes',
    });
  }

  // 5) Top sale of the quarter — single scalar (max close price). This is
  // an aggregate stat (no address/listing detail) and is fine under the
  // compliance rule (no individual closed display).
  //
  // SOURCE:
  //   SELECT MAX(close_price) FROM listing_records
  //   WHERE list_price >= 2_500_000 AND standard_status = 'Closed'
  //     AND close_date >= $start AND close_date < $end
  //     AND city = ANY(YONG_VOLUME_CITIES);
  const topSaleSql = `
    SELECT MAX(close_price)::numeric AS top_close
    FROM listing_records
    WHERE list_price >= 2500000
      AND standard_status = 'Closed'
      AND close_date >= $1 AND close_date < $2
      AND city = ANY($3)
  `;
  const { rows: topRows } = await query<{ top_close: string | number | null }>(topSaleSql, [start, end, YONG_VOLUME_CITIES]);
  const topClose = topRows[0] ? pNum(topRows[0].top_close) : null;
  if (topClose !== null && topClose > 0) {
    stats.push({
      value: `$${(topClose / 1_000_000).toFixed(1)}M`,
      label: `Top sale · ${quarterDisplay}`,
    });
  }

  // 6) Months of supply (metro-wide, current snapshot from scorecard).
  //
  // SOURCE: mv_community_scorecard 'region/north-scottsdale/residential'.
  // Reuses the YoY-row query for the months_of_supply column.
  const mosSql = `
    SELECT months_of_supply
    FROM mv_community_scorecard
    WHERE scope_type = 'region' AND scope_key = 'north-scottsdale'
      AND property_segment = 'residential'
    LIMIT 1
  `;
  const { rows: mosRows } = await query<{ months_of_supply: string | number | null }>(mosSql);
  const mos = mosRows[0] ? pNum(mosRows[0].months_of_supply) : null;
  if (mos !== null && mos > 0) {
    stats.push({
      value: `${mos.toFixed(1)} mo`,
      label: 'Months of supply · N. Scottsdale',
    });
  }

  return stats.slice(0, 6);
}

// Public API

/**
 * The "latest" report slug. Inventory age is sourced from
 * `mv_inventory_age` which only carries a single live snapshot
 * (`month='current'`) — back-dating it onto historical reports would
 * misrepresent the cohort at that time. We therefore only attach the
 * inventory-age section to the most-recent report.
 */
function isLatestReportSlug(slug: string): boolean {
  return MARKET_REPORT_COPY[0]?.slug === slug;
}

async function buildReportUncached(slug: string): Promise<MarketReport | null> {
  const copy = MARKET_REPORT_COPY.find((c) => c.slug === slug);
  if (!copy) return null;
  const parsed = parseQuarterSlug(slug);
  if (!parsed) return null;

  const isLatest = isLatestReportSlug(slug);

  const [trendResult, volume, mediansResult, supplyDemand, inventoryAgeResult, headlineStats] = await Promise.all([
    buildTrend(parsed.year, parsed.quarter),
    buildVolume(parsed.year, parsed.quarter),
    buildMedians(),
    buildSupplyDemand(parsed.year, parsed.quarter),
    isLatest ? buildInventoryAge() : Promise.resolve(null),
    buildHeadlineStats(parsed.year, parsed.quarter),
  ]);

  // Concatenate any editorial-flagged stats from copy after computed ones.
  const allStats = [...headlineStats, ...(copy.editorialStats ?? [])].slice(0, 6);

  return {
    slug: copy.slug,
    quarter: copy.quarter,
    title: copy.title,
    subtitle: copy.subtitle,
    datePublished: copy.datePublished,
    summary: copy.summary,
    headlineStats: allStats,
    observations: copy.observations,
    neighborhoodNotes: copy.neighborhoodNotes,
    outlook: copy.outlook,
    charts: {
      trend: trendResult.points,
      volume,
      medians: mediansResult.bars,
      supplyDemand,
      ...(inventoryAgeResult ? { inventoryAge: inventoryAgeResult.points } : {}),
    },
    coverage: {
      trend: trendResult.coverage,
      medians: mediansResult.coverage,
      ...(inventoryAgeResult ? { inventoryAge: inventoryAgeResult.coverage } : {}),
    },
    pdfUrl: copy.pdfUrl,
    coverImage: copy.coverImage,
  };
}

export async function getReport(slug: string): Promise<MarketReport | null> {
  const now = Date.now();
  const cached = reportCache.get(slug);
  if (cached && now - cached.at < REPORT_CACHE_TTL_MS) {
    return cached.promise;
  }
  const promise = buildReportUncached(slug).catch((err: unknown) => {
    // Evict on failure so we don't pin a bad result.
    reportCache.delete(slug);
    throw err;
  });
  reportCache.set(slug, { at: now, promise });
  return promise;
}

/**
 * Lite version of getReport — fetches only what the /market-reports
 * INDEX page actually consumes: headlineStats (2x2), trend (chart +
 * qoqBlock), and medians (bigMover/tierAverage/spread snapshots).
 *
 * Skips volume/supplyDemand/inventoryAge — only the detail page reads
 * those. Cuts ~6 fetchers to 3, fits inside Lambda's ~30s timeout on
 * a cold start where the full getReport() would 504.
 */
export async function getReportForIndex(slug: string): Promise<MarketReport | null> {
  const copy = MARKET_REPORT_COPY.find((c) => c.slug === slug);
  if (!copy) return null;
  const parsed = parseQuarterSlug(slug);
  if (!parsed) return null;

  const [trendResult, mediansResult, headlineStats] = await Promise.all([
    buildTrend(parsed.year, parsed.quarter),
    buildMedians(),
    buildHeadlineStats(parsed.year, parsed.quarter),
  ]);

  const allStats = [...headlineStats, ...(copy.editorialStats ?? [])].slice(0, 6);

  return {
    slug: copy.slug,
    quarter: copy.quarter,
    title: copy.title,
    subtitle: copy.subtitle,
    datePublished: copy.datePublished,
    summary: copy.summary,
    headlineStats: allStats,
    observations: copy.observations,
    neighborhoodNotes: copy.neighborhoodNotes,
    outlook: copy.outlook,
    charts: {
      trend: trendResult.points,
      // Stub volume — only the snapshot's first 3 blocks (medians/trend
      // sourced) are shown on the index, so volume can be empty here.
      volume: [],
      medians: mediansResult.bars,
      // Same — supplyDemand only renders on the detail page.
      supplyDemand: [],
    },
    coverage: {
      trend: trendResult.coverage,
      medians: mediansResult.coverage,
    },
    pdfUrl: copy.pdfUrl,
    coverImage: copy.coverImage,
  };
}

export async function getReports(): Promise<MarketReport[]> {
  const slugs = MARKET_REPORT_COPY.map((c) => c.slug);
  // Run sequentially to avoid pool exhaustion. Pool is max=5 and each
  // report fires ~9 queries, so 4 reports × 9 = 36 parallel queries can
  // queue past statement_timeout. Per-report failures are isolated so
  // one slow quarter doesn't drop the whole list.
  const reports: (MarketReport | null)[] = [];
  for (const s of slugs) {
    const r = await getReport(s).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(`getReport(${s}) failed:`, err);
      return null;
    });
    reports.push(r);
  }
  return reports.filter((r): r is MarketReport => r !== null);
}

/** Clears the in-memory report cache. For tests only. */
export function __resetReportCache(): void {
  reportCache.clear();
}

// Internal helpers exported for tests.
export const __test = {
  buildTrend,
  buildVolume,
  buildMedians,
  buildSupplyDemand,
  buildInventoryAge,
  buildHeadlineStats,
  bandOf,
  TREND_MIN_SAMPLE,
  MEDIANS_MIN_CLOSED,
};

export { COMMUNITY_TIERS };
