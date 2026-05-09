/**
 * Live demo page — proves the full lakehouse → yong2 chain.
 *
 * Server component fetches dbt analytics marts directly from S3 (via
 * lib/marts.ts module cache, no API round-trip) and renders KPI cards
 * across all 5 scope levels. Numbers refresh hourly with the dbt
 * schedule.
 *
 * Visit at http://localhost:3200/marts-live
 */

import { filterScope, readMartByScope, type MarketPulseRow, type ScopeType } from '@/lib/marts';

export const dynamic = 'force-dynamic';

interface KPIRow {
  label: string;
  scope_type: string;
  scope_key: string;
  segment: string;
}

const KPI_TARGETS: KPIRow[] = [
  { label: 'Phoenix Metro · all',          scope_type: 'metro',     scope_key: 'phoenix_metro',    segment: 'all' },
  { label: 'Phoenix Metro · residential',  scope_type: 'metro',     scope_key: 'phoenix_metro',    segment: 'residential' },
  { label: 'North Scottsdale region',      scope_type: 'region',    scope_key: 'north-scottsdale', segment: 'all' },
  { label: 'Peoria region',                scope_type: 'region',    scope_key: 'peoria',           segment: 'all' },
  { label: 'Desert Mountain (polygon)',    scope_type: 'community', scope_key: 'desert-mountain',  segment: 'all' },
  { label: 'Encanterra (canonical-map)',   scope_type: 'community', scope_key: 'encanterra',       segment: 'all' },
  { label: 'Sun City (canonical-map)',     scope_type: 'community', scope_key: 'sun-city',         segment: 'all' },
  { label: '85254 zipcode (Scottsdale)',   scope_type: 'zipcode',   scope_key: '85254',            segment: 'all' },
  { label: '85262 zipcode (N Scott)',      scope_type: 'zipcode',   scope_key: '85262',            segment: 'all' },
];

const TARGET_MONTH = '2026-04';

function isoMonth(m: unknown): string {
  if (m instanceof Date) return m.toISOString().slice(0, 7);
  if (typeof m === 'string') return String(m).slice(0, 7);
  return String(m);
}

// hyparquet returns DECIMAL/BIGINT columns as bigint. Coerce to number.
function num(n: number | bigint | null | undefined): number | null {
  if (n == null) return null;
  return typeof n === 'bigint' ? Number(n) : n;
}

function fmtDollar(raw: number | bigint | null): string {
  const n = num(raw);
  if (n == null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${Math.round(n).toLocaleString()}`;
  return `$${n.toFixed(0)}`;
}

function fmtNum(raw: number | bigint | null): string {
  const n = num(raw);
  return n == null ? '—' : Math.round(n).toLocaleString();
}

function confColor(c: string | null): string {
  switch (c) {
    case 'high': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'low': return '#ef4444';
    case 'very_low': return '#7c2d12';
    default: return '#6b7280';
  }
}

export default async function MartsLivePage() {
  const startedAt = Date.now();
  // Per-scope mart split: load only the scope_types we need (deduplicated).
  const scopeTypes = Array.from(new Set(KPI_TARGETS.map((t) => t.scope_type as ScopeType)));
  const rowsByScope: Record<string, MarketPulseRow[]> = {};
  await Promise.all(
    scopeTypes.map(async (st) => {
      rowsByScope[st] = await readMartByScope<MarketPulseRow>('fct_market_pulse', st);
    }),
  );
  const fetchMs = Date.now() - startedAt;
  const totalRows = Object.values(rowsByScope).reduce((s, r) => s + r.length, 0);

  const cards = KPI_TARGETS.map((t) => {
    const filtered = filterScope(rowsByScope[t.scope_type] ?? [], {
      scope_type: t.scope_type as MarketPulseRow['scope_type'],
      scope_key: t.scope_key,
      property_segment: t.segment as MarketPulseRow['property_segment'],
    });
    const row = filtered.find((r) => isoMonth(r.month) === TARGET_MONTH);
    return { ...t, row };
  });

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1280, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#fafaf8', color: '#0b1620', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: 24, marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, marginBottom: 8 }}>Lakehouse Marts — Live</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
          Live from <code>fct_market_pulse.parquet</code> in S3 → parsed by hyparquet → rendered server-side.
          Mart refreshes hourly via the <code>rlsir-analytics-dbt</code> Lambda. Numbers below are for{' '}
          <strong>April 2026 closed listings</strong>, all property segments unless noted.
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af' }}>
          Marts fetched in <strong>{fetchMs}ms</strong> · {totalRows.toLocaleString()} rows across{' '}
          {scopeTypes.length} scope file{scopeTypes.length === 1 ? '' : 's'} · rendered at {new Date().toISOString()}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 8, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 4 }}>
              {c.scope_type}/{c.scope_key}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#0b1620' }}>{c.label}</div>
            {c.row ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Median Close</div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtDollar(c.row.median_close)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Closings</div>
                    <div style={{ fontSize: 18, fontWeight: 500 }}>{fmtNum(c.row.closing_count)}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ color: '#9ca3af' }}>DOM</div>
                    <div style={{ fontWeight: 500 }}>{fmtNum(c.row.median_dom)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#9ca3af' }}>$/sqft</div>
                    <div style={{ fontWeight: 500 }}>{(() => { const v = num(c.row.median_ppsf); return v == null ? '—' : `$${Math.round(v)}`; })()}</div>
                  </div>
                  <div>
                    <div style={{ color: '#9ca3af' }}>Volume</div>
                    <div style={{ fontWeight: 500 }}>{fmtDollar(c.row.total_volume)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: confColor(c.row.confidence ?? null), textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  ● confidence: {c.row.confidence ?? '—'} · sample 12mo: {fmtNum(c.row.sample_12mo)}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#9ca3af' }}>no data for {TARGET_MONTH}</div>
            )}
          </div>
        ))}
      </div>

      <footer style={{ marginTop: 48, fontSize: 12, color: '#9ca3af', borderTop: '1px solid #e5e5e5', paddingTop: 16 }}>
        Pipeline: ARMLS Spark → RDS (4h) → S3 bronze (4h) → S3 marts (1h, dbt-duckdb) → yong2 (this page).
        Five scope levels supported: metro / region / community / subdivision / zipcode.
      </footer>
    </main>
  );
}
