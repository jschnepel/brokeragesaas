'use client';

/**
 * Community Comparison — Client component.
 * Side-by-side comparison of up to 4 communities with scorecard data,
 * price trends, and feature breakdowns.
 *
 * @compliance ARMLS Section 21.1 — Aggregate statistical display with attribution.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArmlsAttribution } from '@platform/ui';
import type {
  CommunityScorecard,
  MarketPulseRow,
} from '@platform/shared';

interface CompareClientProps {
  agentId: string;
  scorecards: CommunityScorecard[];
  pulseMap: Record<string, MarketPulseRow[]>;
  allCommunities: CommunityScorecard[];
  periodStart: string;
  periodEnd: string;
}

const COLORS = ['#0C1C2E', '#Bfa67a', '#5B8DB8', '#E07A5F'];
const MAX_COMMUNITIES = 4;

function formatPrice(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function pctLabel(pct: number): string {
  return `${Math.round(pct * 100)}%`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface CompareMetric {
  label: string;
  getValue: (c: CommunityScorecard) => string;
  getRaw: (c: CommunityScorecard) => number;
  higherIsBetter?: boolean;
}

const COMPARE_METRICS: CompareMetric[] = [
  { label: 'Median Price', getValue: c => formatPrice(c.medianActivePrice), getRaw: c => c.medianActivePrice },
  { label: '$/SqFt', getValue: c => `$${Math.round(c.medianPricePerSqft)}`, getRaw: c => c.medianPricePerSqft },
  { label: 'Avg DOM', getValue: c => `${c.avgDom}d`, getRaw: c => c.avgDom },
  { label: 'Active Listings', getValue: c => `${c.activeCount}`, getRaw: c => c.activeCount, higherIsBetter: true },
  { label: 'Close-to-List', getValue: c => `${(c.avgCloseToListRatio * 100).toFixed(1)}%`, getRaw: c => c.avgCloseToListRatio, higherIsBetter: true },
  { label: 'Avg Sqft', getValue: c => `${Math.round(c.avgSqft).toLocaleString()}`, getRaw: c => c.avgSqft, higherIsBetter: true },
  { label: 'Avg Lot', getValue: c => `${c.avgLotAcres.toFixed(2)} ac`, getRaw: c => c.avgLotAcres, higherIsBetter: true },
  { label: 'Avg Year Built', getValue: c => `${c.avgYearBuilt}`, getRaw: c => c.avgYearBuilt, higherIsBetter: true },
  { label: 'Pool Homes', getValue: c => pctLabel(c.poolPct), getRaw: c => c.poolPct, higherIsBetter: true },
  { label: 'Fireplace', getValue: c => pctLabel(c.fireplacePct), getRaw: c => c.fireplacePct },
  { label: 'Horse Property', getValue: c => pctLabel(c.horsePct), getRaw: c => c.horsePct },
  { label: 'Avg Garage', getValue: c => `${c.avgGarageSpaces.toFixed(1)}`, getRaw: c => c.avgGarageSpaces, higherIsBetter: true },
  { label: 'Annual Tax', getValue: c => `$${Math.round(c.avgAnnualTax).toLocaleString()}`, getRaw: c => c.avgAnnualTax },
  { label: 'Monthly HOA', getValue: c => `$${Math.round(c.avgHoaFee).toLocaleString()}`, getRaw: c => c.avgHoaFee },
];

function getBestIdx(scorecards: CommunityScorecard[], metric: CompareMetric): number {
  if (scorecards.length === 0) return -1;
  const values = scorecards.map(c => metric.getRaw(c));
  if (metric.higherIsBetter) {
    return values.indexOf(Math.max(...values));
  }
  // For most metrics (price, DOM, tax, HOA), lower is "better" for buyers
  return values.indexOf(Math.min(...values));
}

export function CompareClient({
  agentId,
  scorecards,
  pulseMap,
  allCommunities,
  periodStart,
  periodEnd,
}: CompareClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const selectedNames = useMemo(
    () => scorecards.map(c => c.subdivisionName),
    [scorecards],
  );

  const filteredCommunities = useMemo(() => {
    if (!searchQuery.trim()) return allCommunities.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return allCommunities
      .filter(c => c.subdivisionName.toLowerCase().includes(q))
      .slice(0, 20);
  }, [searchQuery, allCommunities]);

  const updateUrl = useCallback((names: string[]) => {
    const slugs = names.map(n => slugify(n)).join(',');
    router.push(`/market/compare?communities=${slugs}`);
  }, [router]);

  const addCommunity = useCallback((name: string) => {
    if (selectedNames.includes(name) || selectedNames.length >= MAX_COMMUNITIES) return;
    updateUrl([...selectedNames, name]);
    setSearchQuery('');
    setShowSearch(false);
  }, [selectedNames, updateUrl]);

  const removeCommunity = useCallback((name: string) => {
    updateUrl(selectedNames.filter(n => n !== name));
  }, [selectedNames, updateUrl]);

  // Price trend data per community (last 12 months of closed medians)
  const priceTrends = useMemo(() => {
    const result: Record<string, { month: string; price: number }[]> = {};
    for (const card of scorecards) {
      const rows = pulseMap[card.subdivisionName] ?? [];
      const closed = rows.filter(r => r.status === 'Closed');
      const byMonth = new Map<string, MarketPulseRow>();
      for (const r of closed) byMonth.set(r.month, r);
      result[card.subdivisionName] = [...byMonth.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, row]) => ({ month, price: row.medianClosePrice }));
    }
    return result;
  }, [scorecards, pulseMap]);

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-navy text-white pt-28 pb-16">
        <div className="mx-auto max-w-content-lg px-8 lg:px-20">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest mb-6">
            <Link href="/market" className="text-white/40 hover:text-gold transition-colors font-bold">
              Market
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-gold font-bold">Compare</span>
          </nav>
          <h1 className="text-4xl lg:text-5xl font-serif mb-4">
            Community Comparison
          </h1>
          <p className="text-white/50 text-sm max-w-xl">
            Compare up to {MAX_COMMUNITIES} communities side-by-side — pricing, features, inventory, and ownership costs.
          </p>
        </div>
      </section>

      {/* Community Selector */}
      <section className="mx-auto max-w-content-lg px-8 lg:px-20 -mt-8 relative z-10">
        <div className="bg-white border border-navy/5 p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {scorecards.map((c, i) => (
              <div
                key={c.subdivisionName}
                className="flex items-center gap-2 px-3 py-1.5 border border-navy/10"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm font-serif text-navy">{c.subdivisionName}</span>
                <button
                  onClick={() => removeCommunity(c.subdivisionName)}
                  className="text-navy/30 hover:text-red-500 transition-colors text-xs ml-1"
                  aria-label={`Remove ${c.subdivisionName}`}
                >
                  ×
                </button>
              </div>
            ))}
            {scorecards.length < MAX_COMMUNITIES && (
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="px-3 py-1.5 border border-dashed border-navy/20 text-sm text-navy/40 hover:border-gold hover:text-gold transition-colors font-serif"
              >
                + Add Community
              </button>
            )}
          </div>

          {showSearch && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search communities..."
                className="w-full border border-navy/10 px-4 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors font-serif"
                autoFocus
              />
              {filteredCommunities.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-navy/10 border-t-0 max-h-60 overflow-y-auto z-20 shadow-lg">
                  {filteredCommunities
                    .filter(c => !selectedNames.includes(c.subdivisionName))
                    .map(c => (
                      <button
                        key={c.subdivisionName}
                        onClick={() => addCommunity(c.subdivisionName)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream transition-colors flex items-center justify-between"
                      >
                        <span className="font-serif text-navy">{c.subdivisionName}</span>
                        <span className="text-[10px] text-navy/30">
                          {c.postalCode} · ${Math.round(c.medianPricePerSqft)}/sqft
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Empty State */}
      {scorecards.length === 0 && (
        <section className="mx-auto max-w-content-lg px-8 lg:px-20 py-24 text-center">
          <p className="text-navy/30 font-serif text-lg mb-4">
            Select communities to compare
          </p>
          <p className="text-navy/20 text-sm max-w-md mx-auto">
            Use the search above or visit a{' '}
            <Link href="/market" className="text-gold hover:underline">community page</Link>
            {' '}and click &quot;Compare&quot; to get started.
          </p>
        </section>
      )}

      {/* Comparison Table */}
      {scorecards.length > 0 && (
        <section className="mx-auto max-w-content-lg px-8 lg:px-20 py-16">
          <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">
            Head to Head
          </span>
          <h2 className="text-2xl font-serif text-navy mb-8">Market Metrics</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/10">
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-widest text-navy/40 font-bold w-40">
                    Metric
                  </th>
                  {scorecards.map((c, i) => (
                    <th key={c.subdivisionName} className="text-right py-3 px-3 min-w-[140px]">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <Link
                          href={`/market/community/${slugify(c.subdivisionName)}`}
                          className="text-[10px] uppercase tracking-widest text-navy font-bold hover:text-gold transition-colors"
                        >
                          {c.subdivisionName}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_METRICS.map(metric => {
                  const bestIdx = getBestIdx(scorecards, metric);
                  return (
                    <tr key={metric.label} className="border-b border-navy/5 hover:bg-navy/[0.02] transition-colors">
                      <td className="py-3 px-3 text-navy/50 text-xs font-bold uppercase tracking-wider">
                        {metric.label}
                      </td>
                      {scorecards.map((c, i) => (
                        <td
                          key={c.subdivisionName}
                          className="py-3 px-3 text-right font-serif text-navy"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          <span className={i === bestIdx ? 'text-gold font-bold' : ''}>
                            {metric.getValue(c)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Price Trend Sparklines */}
      {scorecards.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-content-lg px-8 lg:px-20">
            <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">
              Price Trends
            </span>
            <h2 className="text-2xl font-serif text-navy mb-8">12-Month Median Close Price</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {scorecards.map((c, idx) => {
                const trends = priceTrends[c.subdivisionName] ?? [];
                if (trends.length === 0) return null;

                const prices = trends.map(t => t.price);
                const maxP = Math.max(...prices);
                const minP = Math.min(...prices);
                const range = maxP - minP || 1;
                const color = COLORS[idx % COLORS.length];

                return (
                  <div key={c.subdivisionName} className="bg-cream border border-navy/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <h3 className="font-serif text-navy">{c.subdivisionName}</h3>
                    </div>
                    {/* SVG Sparkline */}
                    <svg viewBox={`0 0 ${trends.length * 40} 80`} className="w-full h-20" preserveAspectRatio="none">
                      <polyline
                        points={trends.map((t, i) => `${i * 40 + 20},${75 - ((t.price - minP) / range) * 65}`).join(' ')}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex justify-between text-[10px] text-navy/30 mt-2">
                      <span>{trends[0]?.month ? new Date(trends[0].month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ''}</span>
                      <span className="font-serif text-navy text-xs">{formatPrice(prices[prices.length - 1])}</span>
                      <span>{trends[trends.length - 1]?.month ? new Date(trends[trends.length - 1].month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* True Cost of Ownership */}
      {scorecards.length > 0 && scorecards.some(c => c.avgAnnualTax > 0 || c.avgHoaFee > 0) && (
        <section className="bg-navy text-white py-16">
          <div className="mx-auto max-w-content-lg px-8 lg:px-20">
            <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">
              Ownership Costs
            </span>
            <h2 className="text-2xl font-serif mb-8">True Cost of Ownership</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {scorecards.map((c, idx) => {
                const annualTotal = c.avgAnnualTax + (c.avgHoaFee * 12);
                const monthlyTotal = annualTotal / 12;
                const color = COLORS[idx % COLORS.length];
                return (
                  <div key={c.subdivisionName} className="border border-white/10 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <h3 className="font-serif text-lg">{c.subdivisionName}</h3>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/40">Median Price</span>
                        <span className="font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatPrice(c.medianActivePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Annual Tax</span>
                        <span className="font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          ${Math.round(c.avgAnnualTax).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Monthly HOA</span>
                        <span className="font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          ${Math.round(c.avgHoaFee).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-white/10 pt-3 flex justify-between">
                        <span className="text-gold font-bold">Monthly Total</span>
                        <span className="font-serif text-gold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          ${Math.round(monthlyTotal).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <ArmlsAttribution agentId={agentId} periodStart={periodStart} periodEnd={periodEnd} />
    </main>
  );
}
