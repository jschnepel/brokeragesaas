import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QueryResult, QueryResultRow } from 'pg';
import {
  getReport,
  getReports,
  parseQuarterSlug,
  shiftQuarter,
  quarterLabel,
  __test,
  __resetReportCache,
} from './market-reports';

vi.mock('./db', () => ({ query: vi.fn(), queryOne: vi.fn() }));

// Compose-level cache lives module-side; clear before every getReport test.
beforeEach(() => __resetReportCache());

function mockResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

describe('parseQuarterSlug', () => {
  it('parses q1-2026', () => {
    expect(parseQuarterSlug('q1-2026')).toEqual({ year: 2026, quarter: 1 });
  });
  it('parses q4-2025 case-insensitively', () => {
    expect(parseQuarterSlug('Q4-2025')).toEqual({ year: 2025, quarter: 4 });
  });
  it('returns null on garbage', () => {
    expect(parseQuarterSlug('not-a-slug')).toBeNull();
    expect(parseQuarterSlug('q5-2026')).toBeNull();
  });
});

describe('shiftQuarter', () => {
  it('subtracts within a year', () => {
    expect(shiftQuarter(2026, 4, -1)).toEqual({ year: 2026, quarter: 3 });
  });
  it('rolls back across year boundary', () => {
    expect(shiftQuarter(2026, 1, -1)).toEqual({ year: 2025, quarter: 4 });
  });
  it('rolls back 7 quarters from Q1 2026 to Q2 2024', () => {
    expect(shiftQuarter(2026, 1, -7)).toEqual({ year: 2024, quarter: 2 });
  });
});

describe('quarterLabel', () => {
  it("formats Jan 2026 as Q1 '26", () => {
    expect(quarterLabel(new Date(Date.UTC(2026, 0, 1)))).toBe("Q1 '26");
  });
  it("formats Mar 2026 as Q1 '26 (still in Q1)", () => {
    expect(quarterLabel(new Date(Date.UTC(2026, 2, 1)))).toBe("Q1 '26");
  });
  it("formats Apr 2026 as Q2 '26", () => {
    expect(quarterLabel(new Date(Date.UTC(2026, 3, 1)))).toBe("Q2 '26");
  });
});

describe('bandOf', () => {
  it('returns null below $3M', () => {
    expect(__test.bandOf(2_500_000)).toBeNull();
  });
  it('buckets $4M as $3-5M', () => {
    expect(__test.bandOf(4_000_000)).toBe('$3-5M');
  });
  it('buckets $25M as $20M+', () => {
    expect(__test.bandOf(25_000_000)).toBe('$20M+');
  });
});

describe('buildTrend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true median ppsf per quarter when sample meets threshold", async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);

    // SQL now groups by label inside the CTE, so the result shape carries
    // the display label directly.
    mockQuery.mockResolvedValueOnce(
      mockResult([
        {
          label: 'Silverleaf',
          q_start: new Date(Date.UTC(2026, 0, 1)),
          median_ppsf: '800',
          n: '7',
        },
      ]),
    );

    const { points, coverage } = await __test.buildTrend(2026, 1);
    expect(points).toHaveLength(8);
    const last = points[points.length - 1];
    expect(last.quarter).toBe("Q1 '26");
    expect(last.Silverleaf).toBe(800);
    const slCov = coverage.find((c) => c.community === 'Silverleaf');
    expect(slCov?.status).toBe('sufficient');
    expect(slCov?.sampleSize).toBe(7);
  });

  it('drops thin-volume community from chart and flags coverage as thin', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);

    // Silverleaf with n=2 — below TREND_MIN_SAMPLE.
    mockQuery.mockResolvedValueOnce(
      mockResult([
        {
          label: 'Silverleaf',
          q_start: new Date(Date.UTC(2026, 0, 1)),
          median_ppsf: '900',
          n: '2',
        },
      ]),
    );

    const { points, coverage } = await __test.buildTrend(2026, 1);
    const last = points[points.length - 1];
    // Below threshold => omitted from chart.
    expect(last.Silverleaf).toBeUndefined();
    const slCov = coverage.find((c) => c.community === 'Silverleaf');
    expect(slCov?.status).toBe('thin');
    expect(slCov?.sampleSize).toBe(2);
  });

  it('omits a community key entirely when no rows are present (chart gap)', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce(mockResult([]));

    const { points, coverage } = await __test.buildTrend(2026, 1);
    expect(points).toHaveLength(8);
    expect(points[0].Silverleaf).toBeUndefined();
    // Every curated community is reported as missing in coverage.
    const slCov = coverage.find((c) => c.community === 'Silverleaf');
    expect(slCov?.status).toBe('missing');
  });

  it('uses the SQL-side pooled median for combined sources', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);

    // True pooled median is now computed in SQL — both Carefree and Cave
    // Creek samples are unioned upstream and the database returns a single
    // (label, q_start) row already labeled 'Carefree & Cave Creek'.
    mockQuery.mockResolvedValueOnce(
      mockResult([
        {
          label: 'Carefree & Cave Creek',
          q_start: new Date(Date.UTC(2026, 0, 1)),
          median_ppsf: '477.41',
          n: '32',
        },
      ]),
    );

    const { points } = await __test.buildTrend(2026, 1);
    const last = points[points.length - 1];
    expect(last['Carefree & Cave Creek']).toBe(477);
  });
});

describe('buildVolume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins sold + active counts onto the standard band ladder', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);

    // First call: sold per band (mocked all-quarter Q1 closes)
    mockQuery.mockResolvedValueOnce(
      mockResult([
        { band: '$3-5M', count: '145' },
        { band: '$5-8M', count: '60' },
        { band: '$8-12M', count: '16' },
      ]),
    );
    // Second call: active per band
    mockQuery.mockResolvedValueOnce(
      mockResult([
        { band: '$3-5M', count: '602' },
        { band: '$5-8M', count: '301' },
        { band: '$8-12M', count: '104' },
        { band: '$12-20M', count: '50' },
        { band: '$20M+', count: '21' },
      ]),
    );

    const bands = await __test.buildVolume(2026, 1);
    expect(bands).toEqual([
      { band: '$3-5M', forSale: 602, sold: 145 },
      { band: '$5-8M', forSale: 301, sold: 60 },
      { band: '$8-12M', forSale: 104, sold: 16 },
      { band: '$12-20M', forSale: 50, sold: 0 },
      { band: '$20M+', forSale: 21, sold: 0 },
    ]);
  });
});

describe('buildMedians', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts mv yoy_price_change_pct (6.3) into a fraction (0.063)", async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);

    mockQuery.mockResolvedValueOnce(
      mockResult([
        {
          scope_type: 'region',
          scope_key: 'paradise-valley',
          avg_ppsf: '981.0',
          yoy_price_change_pct: '6.3',
          total_closed: '120',
        },
      ]),
    );

    const { bars, coverage } = await __test.buildMedians();
    expect(bars).toHaveLength(1);
    expect(bars[0]).toMatchObject({
      neighborhood: 'Paradise Valley',
      tier: 'signature',
      median: 981,
    });
    expect(bars[0].yoyChange).toBeCloseTo(0.063, 4);
    const pvCov = coverage.find((c) => c.community === 'Paradise Valley');
    expect(pvCov?.status).toBe('sufficient');
  });

  it('drops communities with null avg_ppsf', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce(
      mockResult([
        {
          scope_type: 'community',
          scope_key: 'silverleaf-at-dc-ranch',
          avg_ppsf: null,
          yoy_price_change_pct: '5.0',
          total_closed: '0',
        },
      ]),
    );

    const { bars, coverage } = await __test.buildMedians();
    expect(bars.find((b) => b.neighborhood === 'Silverleaf')).toBeUndefined();
    const slCov = coverage.find((c) => c.community === 'Silverleaf');
    expect(slCov?.status).toBe('missing');
  });

  it('flags communities with thin total_closed as thin and excludes from bars', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce(
      mockResult([
        {
          scope_type: 'community',
          scope_key: 'silverleaf-at-dc-ranch',
          avg_ppsf: '900',
          yoy_price_change_pct: '5.0',
          total_closed: '3', // Below MEDIANS_MIN_CLOSED.
        },
      ]),
    );

    const { bars, coverage } = await __test.buildMedians();
    expect(bars.find((b) => b.neighborhood === 'Silverleaf')).toBeUndefined();
    const slCov = coverage.find((c) => c.community === 'Silverleaf');
    expect(slCov?.status).toBe('thin');
    expect(slCov?.sampleSize).toBe(3);
  });
});

describe('buildSupplyDemand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formats monthly rows with short labels', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce(
      mockResult([
        { month: new Date(Date.UTC(2025, 6, 1)), new_listings: '40', closed_sales: '30' },
        { month: new Date(Date.UTC(2025, 7, 1)), new_listings: '35', closed_sales: '32' },
      ]),
    );

    const points = await __test.buildSupplyDemand(2026, 1);
    expect(points).toEqual([
      { month: "Jul '25", newListings: 40, closed: 30 },
      { month: "Aug '25", newListings: 35, closed: 32 },
    ]);
  });

  it('returns empty array when no rows', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce(mockResult([]));
    const points = await __test.buildSupplyDemand(2026, 1);
    expect(points).toEqual([]);
  });
});

describe('buildInventoryAge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('groups bucket counts per community + canonicalizes the bucket ladder', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValueOnce(
      mockResult([
        {
          scope_type: 'community',
          scope_key: 'silverleaf-at-dc-ranch',
          dom_bucket: '0-30',
          listing_count: '5',
        },
        {
          scope_type: 'community',
          scope_key: 'silverleaf-at-dc-ranch',
          dom_bucket: '180+',
          listing_count: '2',
        },
        {
          scope_type: 'region',
          scope_key: 'carefree',
          dom_bucket: '0-30',
          listing_count: '4',
        },
        {
          scope_type: 'region',
          scope_key: 'cave-creek',
          dom_bucket: '0-30',
          listing_count: '6',
        },
      ]),
    );

    const { points, coverage } = await __test.buildInventoryAge();
    const sl = points.find((p) => p.community === 'Silverleaf');
    expect(sl).toBeDefined();
    expect(sl!.buckets['0-30']).toBe(5);
    expect(sl!.buckets['180+']).toBe(2);
    expect(sl!.buckets['31-60']).toBe(0);
    expect(sl!.total).toBe(7);

    // Combined: Carefree + Cave Creek pools into one row.
    const cc = points.find((p) => p.community === 'Carefree & Cave Creek');
    expect(cc?.buckets['0-30']).toBe(10);
    expect(cc?.total).toBe(10);

    // Communities not present in the result set are reported as missing.
    const dm = coverage.find((c) => c.community === 'Desert Mountain');
    expect(dm?.status).toBe('missing');
  });
});

describe('buildHeadlineStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips zero/null values rather than rendering hollow stats', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);

    // listing_records aggregate (median, count, dom)
    mockQuery.mockResolvedValueOnce(
      mockResult([{ median_close_price: null, closed_count: '0', median_dom: null }]),
    );
    // North Scottsdale yoy
    mockQuery.mockResolvedValueOnce(mockResult([{ yoy_price_change_pct: null }]));
    // Top sale + MoS — both null
    mockQuery.mockResolvedValueOnce(mockResult([{ top_close: null }]));
    mockQuery.mockResolvedValueOnce(mockResult([{ months_of_supply: null }]));

    const stats = await __test.buildHeadlineStats(2026, 1);
    expect(stats).toEqual([]);
  });

  it('formats six healthy stats including top-sale and months-of-supply', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);

    mockQuery.mockResolvedValueOnce(
      mockResult([
        { median_close_price: '4200000', closed_count: '235', median_dom: '35' },
      ]),
    );
    mockQuery.mockResolvedValueOnce(
      mockResult([{ yoy_price_change_pct: '6.3' }]),
    );
    mockQuery.mockResolvedValueOnce(mockResult([{ top_close: '48000000' }]));
    mockQuery.mockResolvedValueOnce(mockResult([{ months_of_supply: '6.3' }]));

    const stats = await __test.buildHeadlineStats(2026, 1);
    expect(stats).toHaveLength(6);
    expect(stats[0]).toEqual({
      value: '$4.2M',
      label: 'Median luxury sale · Q1 2026',
    });
    expect(stats[1]).toEqual({
      value: '+6.3%',
      label: 'YoY price-per-sqft · North Scottsdale',
    });
    expect(stats[2]).toEqual({
      value: '235',
      label: 'Luxury closes tracked · $3M+',
    });
    expect(stats[3]).toEqual({
      value: '35 days',
      label: 'Median DOM · luxury closes',
    });
    expect(stats[4]).toEqual({
      value: '$48.0M',
      label: 'Top sale · Q1 2026',
    });
    expect(stats[5]).toEqual({
      value: '6.3 mo',
      label: 'Months of supply · N. Scottsdale',
    });
  });
});

describe('getReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for unknown slug', async () => {
    const r = await getReport('q1-1999');
    expect(r).toBeNull();
  });

  it('composes editorial copy + computed charts for a known slug', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);

    // Order is non-deterministic across Promise.all branches; mock responses
    // by inspecting the SQL text instead.
    mockQuery.mockImplementation((sql: string) => {
      if (typeof sql !== 'string') return Promise.resolve(mockResult([]));
      if (sql.includes('mv_supply_demand')) {
        return Promise.resolve(mockResult([]));
      }
      if (sql.includes('mv_inventory_age')) {
        return Promise.resolve(mockResult([]));
      }
      if (sql.includes('analytics_base')) {
        // buildTrend
        return Promise.resolve(mockResult([]));
      }
      if (sql.includes('MAX(close_price)')) {
        return Promise.resolve(mockResult([{ top_close: '48000000' }]));
      }
      if (sql.includes('months_of_supply')) {
        return Promise.resolve(mockResult([{ months_of_supply: '6.3' }]));
      }
      if (sql.includes("standard_status = 'Closed'") && sql.includes('close_date')) {
        // Either sold-band or median-headline
        if (sql.includes('percentile_cont')) {
          return Promise.resolve(
            mockResult([{ median_close_price: '4200000', closed_count: '235', median_dom: '35' }]),
          );
        }
        return Promise.resolve(mockResult([]));
      }
      if (sql.includes('Active Under Contract')) {
        return Promise.resolve(mockResult([]));
      }
      if (sql.includes('mv_community_scorecard') && sql.includes('north-scottsdale')) {
        return Promise.resolve(mockResult([{ yoy_price_change_pct: '6.3' }]));
      }
      if (sql.includes('mv_community_scorecard')) {
        return Promise.resolve(
          mockResult([
            {
              scope_type: 'region',
              scope_key: 'paradise-valley',
              avg_ppsf: '981.0',
              yoy_price_change_pct: '6.3',
              total_closed: '120',
            },
          ]),
        );
      }
      return Promise.resolve(mockResult([]));
    });

    const r = await getReport('q1-2026');
    expect(r).not.toBeNull();
    expect(r!.slug).toBe('q1-2026');
    expect(r!.quarter).toBe('Q1 2026');
    expect(r!.title).toBe('The Valley at the Top');
    expect(r!.charts).toBeDefined();
    expect(r!.charts!.trend).toHaveLength(8);
    expect(r!.charts!.volume).toHaveLength(5);
    expect(r!.charts!.medians.length).toBeGreaterThan(0);
    expect(r!.charts!.supplyDemand).toBeDefined();
    expect(r!.charts!.inventoryAge).toBeDefined();
    expect(r!.coverage).toBeDefined();
    expect(r!.coverage!.trend.length).toBeGreaterThan(0);
    expect(r!.headlineStats.length).toBeGreaterThan(0);
  });
});

describe('getReports', () => {
  it('returns reports in copy-file order (latest first), filtering nulls', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    // Minimal valid responses for any SQL — return empty rows.
    mockQuery.mockImplementation(() => Promise.resolve(mockResult([])));

    const reports = await getReports();
    // Editorial copy file has 4 entries (q1-2026, q4-2025, q3-2025, q2-2025).
    expect(reports).toHaveLength(4);
    expect(reports[0].slug).toBe('q1-2026');
    expect(reports[reports.length - 1].slug).toBe('q2-2025');
  });
});
