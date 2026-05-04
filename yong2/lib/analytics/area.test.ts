import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QueryResult, QueryResultRow } from 'pg';
import { getAreaRead } from './area';

vi.mock('../db', () => ({ query: vi.fn(), queryOne: vi.fn() }));
vi.mock('../communities', () => ({
  getCommunityMedianDom: vi.fn(async () => 42),
}));

function mockResult<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

beforeEach(() => vi.clearAllMocks());

describe('getAreaRead', () => {
  it('composes 12-month trend, current ppsf, YoY, list-to-sale, and median DOM', async () => {
    const { query } = await import('../db');
    const mockQuery = vi.mocked(query);

    mockQuery.mockImplementation((sql: string) => {
      if (typeof sql !== 'string') return Promise.resolve(mockResult([]));
      // 12-month trend
      if (sql.includes('mv_market_pulse') && sql.includes('INTERVAL') && sql.includes('ORDER BY month ASC')) {
        return Promise.resolve(
          mockResult([
            { month: new Date(Date.UTC(2025, 4, 1)), avg_price_per_sqft: '900', closed_count: '2' },
            { month: new Date(Date.UTC(2025, 5, 1)), avg_price_per_sqft: '950', closed_count: '3' },
            { month: new Date(Date.UTC(2025, 6, 1)), avg_price_per_sqft: '1000', closed_count: '2' },
          ]),
        );
      }
      // Current ppsf
      if (sql.includes('mv_market_pulse') && sql.includes('ORDER BY month DESC')) {
        return Promise.resolve(
          mockResult([{ month: new Date(Date.UTC(2026, 0, 1)), avg_price_per_sqft: '1050', closed_count: '1' }]),
        );
      }
      // YoY scorecard
      if (sql.includes('mv_community_scorecard')) {
        return Promise.resolve(mockResult([{ yoy_price_change_pct: '6.3', scope_label: null }]));
      }
      // list-to-sale
      if (sql.includes('PERCENTILE_CONT') && sql.includes('list_price')) {
        return Promise.resolve(mockResult([{ list_to_sale: '98.5', n: 14 }]));
      }
      // regions table fallback
      if (sql.includes('FROM regions')) {
        return Promise.resolve(mockResult([]));
      }
      return Promise.resolve(mockResult([]));
    });

    const r = await getAreaRead('community', 'silverleaf-at-dc-ranch');
    expect(r).not.toBeNull();
    expect(r!.scopeKey).toBe('silverleaf-at-dc-ranch');
    // Title-cased fallback (no slug column on communities table).
    expect(r!.scopeLabel).toBe('Silverleaf At Dc Ranch');
    expect(r!.trend).toHaveLength(3);
    expect(r!.trend[0]).toEqual({ month: "May '25", value: 900 });
    expect(r!.currentPpsf).toBe(1050);
    expect(r!.yoyPriceChangePct).toBe(6.3);
    expect(r!.listToSaleRatio).toBeCloseTo(98.5);
    expect(r!.medianDom).toBe(42);
    // closes per month — 7 closes / 12 months = 0.6
    expect(r!.closesPerMonth).toBeCloseTo(0.6, 1);
  });

  it('handles empty trend gracefully', async () => {
    const { query } = await import('../db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockImplementation(() => Promise.resolve(mockResult([])));

    const r = await getAreaRead('community', 'unknown-area');
    expect(r).not.toBeNull();
    expect(r!.trend).toEqual([]);
    expect(r!.currentPpsf).toBeNull();
    expect(r!.closesPerMonth).toBeNull();
  });

  it('uses regions.name when scopeType=region and a row exists', async () => {
    const { query } = await import('../db');
    const mockQuery = vi.mocked(query);
    mockQuery.mockImplementation((sql: string) => {
      if (typeof sql !== 'string') return Promise.resolve(mockResult([]));
      if (sql.includes('FROM regions')) {
        return Promise.resolve(mockResult([{ name: 'Paradise Valley' }]));
      }
      return Promise.resolve(mockResult([]));
    });
    const r = await getAreaRead('region', 'paradise-valley');
    expect(r!.scopeLabel).toBe('Paradise Valley');
  });
});
