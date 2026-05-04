import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCommunityScorecard,
  getAllCommunityScorecards,
  scorecardRowToKpis,
} from './communities';

vi.mock('./db', () => ({ query: vi.fn(), queryOne: vi.fn() }));

/** A sample mirroring real mv_community_scorecard tuples. */
const dmRow = {
  scope_type: 'community' as const,
  scope_key: 'desert-mountain',
  property_segment: 'residential' as const,
  median_price: 2850000,
  total_closed: '95',
  total_active: '130',
  total_pending: '8',
  avg_dom: '143.4315789473684211',
  avg_ppsf: '741.8050526315789474',
  months_of_supply: '16.4',
  yoy_price_change_pct: '-9.5',
};

describe('scorecardRowToKpis', () => {
  it('coerces string numerics and integer counts', () => {
    const k = scorecardRowToKpis(dmRow);
    expect(k.scopeType).toBe('community');
    expect(k.scopeKey).toBe('desert-mountain');
    expect(k.propertySegment).toBe('residential');
    expect(k.medianPrice).toBe(2850000);
    expect(k.totalActive).toBe(130);
    expect(k.totalClosed).toBe(95);
    expect(k.totalPending).toBe(8);
    expect(k.avgDom).toBeCloseTo(143.4316, 3);
    expect(k.medianDom).toBeNull(); // default — not provided
    expect(k.avgPpsf).toBeCloseTo(741.805, 2);
    expect(k.monthsOfSupply).toBeCloseTo(16.4);
    expect(k.yoyPriceChangePct).toBeCloseTo(-9.5);
  });

  it('accepts an optional medianDom argument', () => {
    const k = scorecardRowToKpis(dmRow, 112);
    expect(k.medianDom).toBe(112);
  });

  it('preserves nulls (does not coerce to 0)', () => {
    const k = scorecardRowToKpis({ ...dmRow, avg_ppsf: null, median_price: null });
    expect(k.medianPrice).toBeNull();
    expect(k.avgPpsf).toBeNull();
    expect(k.medianDom).toBeNull();
  });
});

describe('getCommunityScorecard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns null when no row found', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    expect(await getCommunityScorecard('does-not-exist')).toBeNull();
  });

  it('queries mv_community_scorecard by (scope_type, scope_key, property_segment)', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    await getCommunityScorecard('desert-mountain');
    const [sql, params] = mockQuery.mock.calls[0]!;
    expect(sql).toMatch(/FROM\s+mv_community_scorecard/i);
    expect(sql).toMatch(/scope_type\s*=\s*\$1/);
    expect(sql).toMatch(/scope_key\s*=\s*\$2/);
    expect(sql).toMatch(/property_segment\s*=\s*\$3/);
    expect(params).toEqual(['community', 'desert-mountain', 'residential']);
  });

  it('honors a region scope_type for paradise-valley-style entries', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    await getCommunityScorecard('paradise-valley', 'region');
    const params = mockQuery.mock.calls[0]![1];
    expect(params).toEqual(['region', 'paradise-valley', 'residential']);
  });

  it('returns kpis when row exists', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockResolvedValue({ rows: [dmRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });
    const k = await getCommunityScorecard('desert-mountain');
    expect(k).not.toBeNull();
    expect(k!.medianPrice).toBe(2850000);
  });
});

describe('getAllCommunityScorecards', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('groups curated content by scope_type and keys results by scope_key', async () => {
    const { query } = await import('./db');
    const mockQuery = vi.mocked(query);
    // Reader now fires two queries per scopeType: one against
    // mv_community_scorecard, one against analytics_base for median DOM.
    // Branch by SQL text rather than relying on call order — Promise.all
    // means scorecard + median fire concurrently within each scopeType.
    mockQuery.mockImplementation((sql: string) => {
      if (typeof sql !== 'string') {
        return Promise.resolve({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
      }
      if (sql.includes('mv_community_scorecard')) {
        if (sql.includes('scope_type = $1')) {
          // Community vs region branch keyed by the $1 placeholder pattern.
          // We can't know which scopeType it is without parsing — return both
          // sets and let the reader filter by scope_key match.
          return Promise.resolve({
            rows: [
              dmRow,
              { ...dmRow, scope_key: 'estancia', median_price: 4500000 },
              { ...dmRow, scope_key: 'silverleaf-at-dc-ranch', median_price: 6200000 },
              { ...dmRow, scope_type: 'region', scope_key: 'paradise-valley', median_price: 3800000 },
            ],
            rowCount: 4, command: 'SELECT', oid: 0, fields: [],
          });
        }
      }
      // analytics_base median-DOM bulk query — return empty (medians become null).
      return Promise.resolve({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
    });

    const out = await getAllCommunityScorecards();
    expect(out['desert-mountain']?.medianPrice).toBe(2850000);
    expect(out['estancia']?.medianPrice).toBe(4500000);
    expect(out['silverleaf-at-dc-ranch']?.medianPrice).toBe(6200000);
    expect(out['paradise-valley']?.medianPrice).toBe(3800000);
    expect(out['paradise-valley']?.scopeType).toBe('region');
    // Median DOM was empty — should be null on every scope.
    expect(out['desert-mountain']?.medianDom).toBeNull();
  });
});
