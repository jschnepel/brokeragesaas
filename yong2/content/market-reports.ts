/**
 * Market-reports shared types + tier metadata.
 *
 * The quarterly editorial-copy model (`MARKET_REPORT_COPY` /
 * `MARKET_REPORTS`) was retired when the report cadence moved to
 * weekly + monthly slugs (`YYYY-wWW` / `YYYY-MM`). Live data now
 * comes from CloudFront dbt parquet via `lib/market-reports.ts`;
 * monthly editorial prose comes from
 * `content/market-reports/monthly/{YYYY-MM}.mdx`.
 *
 * What remains in this file:
 *   - Tier classification (signature / notable / broader) — still
 *     used by chart components to colour-code series + scope
 *     "Signature" preset toggles.
 *   - Chart row types — kept as the surface chart components import
 *     against. These are display-layer types only; data shape lives
 *     in lib/market-reports.ts.
 */

export type QuarterPoint = { quarter: string } & Record<string, number | string>;

export type PriceBandPoint = {
  band: string;
  forSale: number;
  sold: number;
};

export type Tier = 'signature' | 'notable' | 'broader';

export type MedianBar = {
  neighborhood: string;
  tier: Tier;
  median: number; // per-sqft
  yoyChange: number; // e.g. +0.064 = +6.4%
};

/**
 * Coverage status for a single community in a single chart.
 *   - 'sufficient' = sample meets threshold; render the value
 *   - 'thin'       = sample is non-zero but below threshold; either omit or render dashed
 *   - 'missing'    = no sample at all for this scope/quarter
 */
export type CoverageStatus = 'sufficient' | 'thin' | 'missing';

export type DataCoverage = {
  community: string;
  status: CoverageStatus;
  sampleSize: number;
  threshold: number;
  /** Optional human-readable note rendered in the methodology footnote. */
  note?: string;
};

/** Single point on the supply-vs-demand monthly chart. */
export type SupplyDemandPoint = {
  /** Month label e.g. "Jan '26" */
  month: string;
  /** Closed sales in that month (Yong cities, residential, $1M+). */
  closed: number;
  /** New listings in that month (same scope). */
  newListings: number;
};

/** A single community's inventory-age bucket counts (current snapshot). */
export type InventoryAgePoint = {
  community: string;
  tier: Tier;
  /** Bucket counts; missing buckets default to 0 in the chart. */
  buckets: Record<string, number>;
  /** Total active listings across all buckets. */
  total: number;
};

/**
 * Tier assignments tuned for Yong's practice:
 *   Signature — Silverleaf, Desert Mountain, Estancia, Paradise Valley, DC Ranch
 *   Notable   — Troon North, Biltmore, Arcadia, Carefree & Cave Creek, Scottsdale
 *   Broader   — Fountain Hills
 */
export const COMMUNITY_TIERS: Record<string, Tier> = {
  Silverleaf: 'signature',
  'Desert Mountain': 'signature',
  Estancia: 'signature',
  'Paradise Valley': 'signature',
  'DC Ranch': 'signature',
  'Troon North': 'notable',
  Biltmore: 'notable',
  Arcadia: 'notable',
  'Carefree & Cave Creek': 'notable',
  Scottsdale: 'notable',
  'Fountain Hills': 'broader',
};

export const SIGNATURE_COMMUNITIES = [
  'Silverleaf',
  'Desert Mountain',
  'Estancia',
  'Paradise Valley',
  'DC Ranch',
];

/** Optional editorial-flagged stat that can't be derived from MVs. */
export type HeadlineStat = { value: string; label: string };

/**
 * "At a Glance" pulse bar — 5 hero stats shown at the top of the
 * /market-reports index. Hand-authored quarterly when the report
 * publishes; refreshed against MVs as Yong sees fit. Static copy means
 * zero DB on the index page (Lambda timeout safe).
 */
export type MarketIndexPulse = {
  medianPpsf: string;       // formatted, e.g. "$1,184"
  qoqDeltaPct: number;      // signed, e.g. 3.2 or -1.8
  medianDom: number;        // days
  monthsSupply: number;     // e.g. 4.1
  activeCount: number;      // top-tier active inventory
  asOfLabel: string;        // "As of May 4, 2026 · refresh quarterly"
};

/**
 * Tier breakdown — 3 panels under the featured report. Hand-authored
 * by Yong with the editorial copy for each quarterly report.
 */
export type TierBreakdownRow = {
  band: string;             // "$3M – $5M"
  activeCount: number;
  closedCount: number;      // 90-day trailing
  ppsf: string;             // formatted, e.g. "$968"
  medianDom: number;
  note: string;             // 1-line character description
};

/**
 * Editorial copy for a single quarterly report. Charts and headline-stats
 * are NOT here — they're composed live from the MVs.
 */
export type MarketReportCopy = {
  slug: string; // q1-2026, q4-2025, ...
  quarter: string; // "Q1 2026"
  title: string;
  subtitle: string;
  datePublished: string; // ISO
  summary: string;
  observations: string[];
  neighborhoodNotes: Array<{ neighborhood: string; note: string }>;
  outlook: string[];
  /**
   * Optional editorial-flagged stats appended after the computed ones
   * (only displayed if there's slot space — at most 4 total). Use for
   * non-MV-derivable insights like "Off-market transactions tracked".
   */
  editorialStats?: HeadlineStat[];
  /**
   * Index-page enhancements (latest report only — older reports leave
   * these undefined and the index falls back to copy-only rendering).
   */
  pulse?: MarketIndexPulse;
  curatedFindings?: Array<{ label: string; headline: string }>;
  monthlyTrend?: number[]; // 12 months of median ppsf, oldest → newest
  tierBreakdown?: TierBreakdownRow[];
  pdfUrl?: string;
  coverImage: string;
};

/**
 * Full report shape consumed by pages and components — copy + computed.
 * Composer in `lib/market-reports.ts` produces this.
 */
export type MarketReport = MarketReportCopy & {
  headlineStats: HeadlineStat[];
  charts?: {
    trend: QuarterPoint[];
    volume: PriceBandPoint[];
    medians: MedianBar[];
    /** Monthly closed-sales vs new-listings for the trailing 12 months. */
    supplyDemand: SupplyDemandPoint[];
    /**
     * Inventory age (current snapshot) by community. Only populated for
     * the LATEST report — `mv_inventory_age` carries a single live snapshot
     * (`month='current'`) and historical quarters cannot be back-dated, so
     * showing it on past reports would misrepresent the cohort at that time.
     */
    inventoryAge?: InventoryAgePoint[];
  };
  /**
   * Per-chart data-coverage indicators. Charts use this to decide whether
   * to render a community at all and the methodology section uses it to
   * surface "Excluded due to insufficient data" notes.
   */
  coverage?: {
    trend: DataCoverage[];
    medians: DataCoverage[];
    /** Inventory-age coverage; only set on the latest report. */
    inventoryAge?: DataCoverage[];
  };
};

// Editorial-copy archive retired with the quarterly cadence (the
// q{N}-YYYY URLs 301 to /market-reports — see next.config.ts redirects).
// New cadence: weekly auto-summary (computed in lib/market-reports.ts)
// + monthly MDX prose under content/market-reports/monthly/.
// Kept as an empty export so any straggling imports compile while
// the migration finishes; the four quarter copy-blocks below are
// preserved as comments only for historical reference.
export const MARKET_REPORT_COPY: MarketReportCopy[] = [];

/**
 * @deprecated The quarterly cadence retired with the weekly+monthly
 * migration. The sitemap now reads `listAvailablePeriods()` from
 * `lib/market-reports.ts`. Exported as an empty array so any
 * remaining importer compiles cleanly.
 */
export const MARKET_REPORTS: MarketReport[] = [];

/**
 * @deprecated Use `parsePeriodSlug` + `getPeriodStats` from
 * `lib/market-reports.ts` for the weekly + monthly cadence.
 */
export function getReportBySlug(_slug: string): MarketReport | undefined {
  return undefined;
}
