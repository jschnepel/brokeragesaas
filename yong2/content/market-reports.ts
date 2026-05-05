/**
 * Quarterly market reports — editorial copy only.
 *
 * NUMBERS DO NOT LIVE HERE. Charts (trend / volume / medians) and
 * headline stats are computed live from the analytics MVs in
 * `lib/market-reports.ts`. This file holds Yong's editorial layer:
 * summary, observations, neighborhood notes, and outlook.
 *
 * To add a new quarterly report:
 *   1) Add a new entry at the top of `MARKET_REPORT_COPY` with slug
 *      `q<n>-<yyyy>` (e.g. "q2-2026").
 *   2) Make sure the MVs cover that quarter — `mv_market_pulse` needs
 *      monthly closes, and listing_records needs close_date rows in
 *      that quarter for the volume bands.
 *   3) The page render will pick it up automatically via `getReports()`.
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

// Editorial copy — latest first. Numbers stay out.
export const MARKET_REPORT_COPY: MarketReportCopy[] = [
  {
    slug: 'q1-2026',
    quarter: 'Q1 2026',
    title: 'The Valley at the Top',
    subtitle: 'Luxury market intelligence · first quarter',
    datePublished: '2026-04-15',
    summary:
      'The first quarter opened with its strongest luxury inventory in three years. Paradise Valley set a new per-square-foot record; Silverleaf held serve in the top decile. Buyer depth from California technology wealth continues to widen the floor of the market.',
    observations: [
      "Paradise Valley posted another record-setting quarter at the top of the per-square-foot table — the architectural-review threshold continues to compress supply at the top.",
      "Silverleaf's Upper Canyon saw multiple transactions clear $20M, maintaining its position as the Valley's highest-priced micro-market.",
      'Arcadia inventory tightened further. Days-on-market dropped meaningfully for architecturally merchandised homes; land-value transactions continue to outpace recent-remodel sales.',
      'Off-market share at the top of the market remains elevated — an estimated third of $10M+ transactions closed without public listing.',
      'Buyer composition continues to shift. California technology transplants represent the largest new-buyer cohort for the fourth consecutive quarter.',
    ],
    neighborhoodNotes: [
      { neighborhood: 'Paradise Valley', note: 'Record-setting quarter. Inventory remains structurally thin and the architectural-review process continues to support per-sqft values.' },
      { neighborhood: 'Silverleaf', note: 'Upper Canyon dominates. Multiple $20M+ trades, all private introductions. Membership environment remains the determining factor for the top tier.' },
      { neighborhood: 'Desert Mountain', note: 'Two full-club-membership transfers completed at close — a notable structural data point. Inventory at the seven-course level continues to absorb steadily.' },
      { neighborhood: 'Estancia', note: 'Quietly one of the strongest quarters in years. Pinnacle Peak views remain the singular driver of premium per-sqft.' },
      { neighborhood: 'DC Ranch', note: "Consistent quarter across price bands. Design-review discipline still produces the Valley's most merchandise-ready inventory." },
    ],
    outlook: [
      'The Q2 outlook favors continued strength at the top. Expect new entrants to the $25M+ bracket in Paradise Valley and Silverleaf through the summer months.',
      'Interest-rate sensitivity in the luxury tier is muted — most $5M+ transactions close in cash or with short-term bridge financing. The more consequential variable remains inventory, which appears to be constrained through Q3.',
      'The off-market share is likely to grow further. Sellers at the top of the market are increasingly unwilling to accept the marketing exposure of a public listing for what is a limited pool of qualified buyers anyway. Private representation is, quietly, becoming the norm.',
    ],
    editorialStats: [
      { label: 'Median PPSF', value: '$1,184' },
      { label: 'QoQ change', value: '+3.2%' },
      { label: 'Median DOM', value: '47 days' },
      { label: 'Months supply', value: '4.1 mo' },
    ],
    pulse: {
      medianPpsf: '$1,184',
      qoqDeltaPct: 3.2,
      medianDom: 47,
      monthsSupply: 4.1,
      activeCount: 312,
      asOfLabel: 'As of May 4, 2026 · refreshed quarterly',
    },
    curatedFindings: [
      {
        label: 'Inventory',
        headline: 'Active count up 18% QoQ as new builds reach the market — first inventory loosening in three quarters.',
      },
      {
        label: 'Pricing',
        headline: 'Median ppsf held flat at $1.18K despite supply growth — a clean read on buyer conviction.',
      },
      {
        label: 'Velocity',
        headline: 'Days to pending shortened to 31 — well-priced architecturally-merchandised homes are still moving fast.',
      },
    ],
    monthlyTrend: [1018, 1032, 1041, 1058, 1064, 1073, 1098, 1112, 1128, 1147, 1166, 1184],
    tierBreakdown: [
      {
        band: '$3M – $5M',
        activeCount: 142,
        closedCount: 31,
        ppsf: '$968',
        medianDom: 37,
        note: 'Liquid; competitive bidding on Cat-A homes. The most actively transacting band.',
      },
      {
        band: '$5M – $10M',
        activeCount: 88,
        closedCount: 18,
        ppsf: '$1,210',
        medianDom: 62,
        note: 'Selective; buyers are patient on price. Architectural pedigree commands real premium here.',
      },
      {
        band: '$10M+',
        activeCount: 31,
        closedCount: 4,
        ppsf: '$1,840',
        medianDom: 118,
        note: 'Bespoke; representation-driven. ~⅓ of trades close off-market, never publicly listed.',
      },
    ],
    pdfUrl: '',
    coverImage:
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=80&auto=format&fit=crop',
  },
  {
    slug: 'q4-2025',
    quarter: 'Q4 2025',
    title: 'A Year of Widening Depth',
    subtitle: 'Luxury market intelligence · fourth quarter + full year 2025',
    datePublished: '2026-01-22',
    summary:
      "Full-year 2025 closed with the broadest buyer base in five years. The median luxury transaction expanded across the Valley, led by North Scottsdale and Paradise Valley. The year's defining story: technology-wealth migration from coastal California.",
    observations: [
      '2025 ended with per-sqft values up materially across all five signature communities tracked by this report.',
      "Several of the year's largest closes — including the largest in Silverleaf's Upper Canyon — were arranged with private buyer introductions; photos were never published.",
      'Technology-wealth migration from California (the Bay Area in particular) accelerated through Q3 and Q4. Bay Area postal codes accounted for a disproportionate share of Paradise Valley buyers in 2025.',
      'Remodel-ready inventory continues to outperform teardown candidates in Arcadia by a widening margin — a notable reversal from the 2021–2022 pattern.',
    ],
    neighborhoodNotes: [
      { neighborhood: 'Paradise Valley', note: "Strongest full-year gain in the Valley. Thin inventory at the town's architectural-review threshold continues to be the ceiling constraint." },
      { neighborhood: 'Silverleaf', note: 'The largest publicly recorded sale of the year was an Upper Canyon close in Q4; an off-market trade earlier in the year eclipsed it quietly.' },
      { neighborhood: 'Desert Mountain', note: 'Six full-club-membership transfers completed at close in 2025 — the highest in five years.' },
    ],
    outlook: [
      'Looking into 2026, the structural dynamics holding the luxury market up remain in place: in-migration, insufficient at-the-top inventory, and buyer depth from new wealth categories.',
      'The two variables worth watching: (1) the interplay of architectural-review constraint in Paradise Valley, which is the single largest determinant of supply at the very top, and (2) the California exodus trajectory, which if it softens would cool the top decile sooner than the broader market.',
    ],
    pdfUrl: '',
    coverImage:
      'https://images.unsplash.com/photo-1600607687644-aac76f0e23ec?w=1600&q=80&auto=format&fit=crop',
  },
  {
    slug: 'q3-2025',
    quarter: 'Q3 2025',
    title: 'Summer, Quieted',
    subtitle: 'Luxury market intelligence · third quarter',
    datePublished: '2025-10-18',
    summary:
      'The typical summer lull was more pronounced than recent years, but transaction prices held. Closed volume dipped from Q2 while median per-sqft values held flat-to-up — a seasonally clean read on buyer conviction.',
    observations: [
      'Seasonal slowdown arrived on schedule but with noticeably less price pressure than prior cycles.',
      'Club-membership environments continued to outperform. Silverleaf Club and Desert Mountain both saw multiple full-membership transfers at close.',
      "The quarter's most interesting sub-trend: accelerating interest in the Biltmore / Camelback corridor as buyers widen their search from Paradise Valley proper into adjacent neighborhoods.",
    ],
    neighborhoodNotes: [
      { neighborhood: 'Desert Mountain', note: 'Three full-club-membership transfers in the quarter despite typical summer compression.' },
      { neighborhood: 'Estancia', note: 'Quiet quarter on the public side — a couple of architectural new-builds quietly traded off-market in the high $20Ms.' },
      { neighborhood: 'DC Ranch', note: 'Market performed exactly as expected — steady across price bands, with design-review compliant listings moving within typical windows.' },
    ],
    outlook: [
      'Q4 is historically the strongest luxury quarter in the Valley, and early indicators suggest 2025 will follow that pattern. The seasonal buyer cohort arrives in October; inventory should absorb through year-end.',
    ],
    pdfUrl: '',
    coverImage:
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&q=80&auto=format&fit=crop',
  },
  {
    slug: 'q2-2025',
    quarter: 'Q2 2025',
    title: 'The Spring Surge',
    subtitle: 'Luxury market intelligence · second quarter',
    datePublished: '2025-07-12',
    summary:
      'Q2 delivered one of the strongest luxury quarters on record — driven by in-migration, improved inventory conditions, and a wave of long-deferred transactions from buyers finally willing to close. Per-sqft values set new records in three of the five signature communities.',
    observations: [
      'Both volume and price set new highs simultaneously — a combination that typically signals structural rather than seasonal strength.',
      'Arcadia architectural-remodel listings cleared fastest among the signature submarkets.',
      "The quarter saw the first publicly recorded $30M+ transaction in Silverleaf — a multi-acre estate on the Upper Canyon ridge that had previously been represented privately for two years.",
    ],
    neighborhoodNotes: [
      { neighborhood: 'Silverleaf', note: "Landmark quarter. The $30M+ ridge-line close reset the community's ceiling by a meaningful margin." },
      { neighborhood: 'Paradise Valley', note: 'Record per-sqft. The architectural-review threshold continues to prove out as a value preservation mechanism.' },
      { neighborhood: 'Estancia', note: 'Strong showing. Two architectural homes on Pinnacle Peak ridges traded near record per-sqft values for the community.' },
    ],
    outlook: [
      'Q3 is historically soft but the Q2 strength should compress seasonal slowdown. Expect close-to-par pricing through the summer, with real activity resuming in October.',
    ],
    pdfUrl: '',
    coverImage:
      'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1600&q=80&auto=format&fit=crop',
  },
];

/**
 * Legacy alias — surfaces editorial copy as a `MarketReport[]` for callers
 * that don't need the live charts (e.g. the sitemap). For the actual page
 * render with charts and headline stats, call `getReport(slug)` from
 * `@/lib/market-reports`.
 */
export const MARKET_REPORTS: MarketReport[] = MARKET_REPORT_COPY.map((c) => ({
  ...c,
  headlineStats: c.editorialStats ?? [],
}));

/** @deprecated use `getReport` from `@/lib/market-reports` for live data. */
export function getReportBySlug(slug: string): MarketReport | undefined {
  return MARKET_REPORTS.find((r) => r.slug === slug);
}
