'use client';

/**
 * Community Deep Dive — Client component.
 * Full community market report with scorecard, trends, features, and comparisons.
 * Users can customize which profile fields appear.
 *
 * @compliance ARMLS Section 21.1 — Aggregate statistics with required attribution.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AnalyticsLineChart,
  ArmlsAttribution,
  H3Heatmap,
} from '@platform/ui';
import type {
  MarketPulseKpis,
  MarketPulseRow,
  CommunityScorecard,
  PriceBandRow,
  FeaturePriceImpact,
  HeatmapPoint,
} from '@platform/shared';
import { aggregateToHexCells } from '@platform/shared';

interface CommunityClientProps {
  agentId: string;
  communityName: string;
  slug: string;
  kpis: MarketPulseKpis;
  pulse: MarketPulseRow[];
  priceBands: PriceBandRow[];
  featureImpact: FeaturePriceImpact[];
  heatmapPoints: HeatmapPoint[];
  scorecard: CommunityScorecard | null;
  similarCommunities: CommunityScorecard[];
  periodStart: string;
  periodEnd: string;
  heroImage: string | null;
  regionId: string | null;
  communityId: string | null;
}

function formatPrice(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Scorecard Field Registry ────────────────────────

type FieldId =
  | 'sqft' | 'lot' | 'yearBuilt' | 'closeToList'
  | 'tax' | 'hoa';

interface FieldDef {
  id: FieldId;
  label: string;
  getValue: (c: CommunityScorecard) => string;
}

const FIELDS: FieldDef[] = [
  { id: 'sqft', label: 'Avg Sqft', getValue: c => `${Math.round(c.avgSqft).toLocaleString()}` },
  { id: 'lot', label: 'Avg Lot', getValue: c => `${c.avgLotAcres.toFixed(2)} acres` },
  { id: 'yearBuilt', label: 'Avg Year Built', getValue: c => `${c.avgYearBuilt}` },
  { id: 'closeToList', label: 'Close-to-List', getValue: c => `${(c.avgCloseToListRatio * 100).toFixed(1)}%` },
  { id: 'tax', label: 'Annual Tax', getValue: c => `$${Math.round(c.avgAnnualTax).toLocaleString()}` },
  { id: 'hoa', label: 'Monthly HOA', getValue: c => `$${Math.round(c.avgHoaFee).toLocaleString()}` },
];

const DEFAULT_FIELDS: FieldId[] = ['sqft', 'lot', 'yearBuilt', 'closeToList', 'tax', 'hoa'];

function parseFields(param: string | null): FieldId[] {
  if (!param) return DEFAULT_FIELDS;
  const ids = param.split(',').filter((id): id is FieldId =>
    FIELDS.some(f => f.id === id)
  );
  return ids.length > 0 ? ids : DEFAULT_FIELDS;
}

export function CommunityClient({
  agentId,
  communityName,
  kpis,
  pulse,
  priceBands,
  featureImpact,
  heatmapPoints,
  scorecard,
  similarCommunities,
  periodStart,
  periodEnd,
  heroImage,
  regionId,
  communityId,
}: CommunityClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const fieldsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (fieldsRef.current && !fieldsRef.current.contains(e.target as Node)) {
        setFieldsOpen(false);
      }
    }
    if (fieldsOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [fieldsOpen]);

  const activeFields = useMemo(
    () => parseFields(searchParams.get('fields')),
    [searchParams]
  );

  const isFieldActive = useCallback(
    (id: FieldId) => activeFields.includes(id),
    [activeFields]
  );

  const toggleField = useCallback((id: FieldId) => {
    const next = isFieldActive(id)
      ? activeFields.filter(f => f !== id)
      : [...activeFields, id];
    const ordered = FIELDS.map(f => f.id).filter(f => next.includes(f));
    const params = new URLSearchParams(searchParams.toString());
    if (ordered.length === DEFAULT_FIELDS.length && DEFAULT_FIELDS.every((f, i) => ordered[i] === f)) {
      params.delete('fields');
    } else {
      params.set('fields', ordered.join(','));
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [activeFields, isFieldActive, searchParams, router]);

  const kpiCards = useMemo(() => [
    { label: 'Median Price', value: formatPrice(kpis.medianPrice) },
    { label: 'Price per SqFt', value: `$${Math.round(kpis.medianPricePerSqft)}` },
    { label: 'Days on Market', value: `${kpis.medianDom}` },
    { label: 'Close-to-List', value: `${kpis.avgCloseToListRatio}%` },
  ], [kpis]);

  const priceTrendData = useMemo(() => {
    const closedByMonth = new Map<string, MarketPulseRow>();
    const activeByMonth = new Map<string, number>();
    for (const row of pulse) {
      if (row.status === 'Closed') closedByMonth.set(row.month, row);
      if (row.status === 'Active' || row.status === 'Active Under Contract') {
        activeByMonth.set(row.month, (activeByMonth.get(row.month) ?? 0) + row.listingCount);
      }
    }
    return [...closedByMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, row]) => ({
        month,
        medianPrice: row.medianClosePrice,
        medianPpsf: row.medianClosePricePerSqft,
        activeInventory: activeByMonth.get(month) ?? 0,
      }));
  }, [pulse]);

  const priceBandData = useMemo(() => {
    const bandMap = new Map<string, { count: number; avgDom: number; order: number }>();
    for (const row of priceBands) {
      if (row.status !== 'Active' && row.status !== 'Active Under Contract') continue;
      const existing = bandMap.get(row.priceBand);
      if (existing) {
        existing.count += row.listingCount;
        existing.avgDom = Math.round((existing.avgDom + row.avgDom) / 2);
      } else {
        bandMap.set(row.priceBand, { count: row.listingCount, avgDom: row.avgDom, order: row.bandOrder });
      }
    }
    return [...bandMap.entries()]
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([band, data]) => ({ band, count: data.count, avgDom: data.avgDom }));
  }, [priceBands]);

  const heatmapCells = useMemo(() => {
    if (!heatmapPoints || heatmapPoints.length === 0) return [];
    return aggregateToHexCells(heatmapPoints, 8);
  }, [heatmapPoints]);

  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';

  const visibleFields = FIELDS.filter(f => activeFields.includes(f.id));
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative text-white pt-28 pb-20 overflow-hidden" style={{ minHeight: heroImage ? '380px' : undefined }}>
        {/* Background image or gradient */}
        {heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt={communityName} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-mid to-navy" />
        )}
        <div className="relative mx-auto max-w-content-lg px-8 lg:px-20">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest mb-6">
            <Link href="/market" className="text-white/40 hover:text-gold transition-colors font-bold">Market</Link>
            <span className="text-white/20">/</span>
            {scorecard && (
              <>
                <Link href={`/market/zip/${scorecard.postalCode}`} className="text-white/40 hover:text-gold transition-colors font-bold">
                  {scorecard.postalCode}
                </Link>
                <span className="text-white/20">/</span>
              </>
            )}
            <span className="text-gold font-bold">{communityName}</span>
          </nav>
          <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">Community Market Report</span>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-serif mb-4 leading-tight">{communityName}</h1>
          <div className="w-16 h-0.5 bg-gold mb-6" />
          <p className="text-white/50 text-sm max-w-xl leading-relaxed mb-8">
            Complete market report for {communityName} — pricing, inventory health, and community comparisons.
          </p>
          <div className="flex flex-wrap gap-3">
            {regionId && communityId && (
              <Link
                href={`/phoenix/${regionId}/${communityId}`}
                className="inline-flex items-center gap-2 bg-gold text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-navy transition-all group"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" fill="none" />
                </svg>
                Go to {communityName}
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-navy transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <section className="mx-auto max-w-content-lg px-8 lg:px-20 -mt-10 relative z-10 pb-16">
        <div className="grid grid-cols-12 gap-3 md:gap-4">

          {/* Row 1: KPI Cards */}
          {kpiCards.map((card) => (
            <div key={card.label} className="col-span-6 md:col-span-3 bg-white p-4 md:p-5 shadow-card border-t-2 border-t-gold">
              <span className="text-[9px] uppercase tracking-widest text-navy/40 font-bold block mb-1">{card.label}</span>
              <span className="text-xl md:text-2xl font-serif text-navy" style={{ fontVariantNumeric: 'tabular-nums' }}>{card.value}</span>
            </div>
          ))}

          {/* Row 2: Market Gauge + Profile + Inventory */}
          <div className="col-span-12 md:col-span-4 lg:col-span-4 bg-white p-6 md:p-8 shadow-card border-t-2 border-t-accent flex items-center justify-center">
            <MarketGauge monthsOfSupply={kpis.monthsOfSupply} />
          </div>

          {/* Profile card — shares row with gauge */}
          {scorecard && (
            <div className="col-span-12 md:col-span-8 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-label uppercase tracking-xl text-gold font-bold block mb-2">Community Profile</span>
                  <h2 className="text-xl font-serif text-navy">At a Glance</h2>
                </div>
                <div ref={fieldsRef} className="relative">
                  <button
                    onClick={() => setFieldsOpen(!fieldsOpen)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 border ${
                      fieldsOpen
                        ? 'bg-navy text-gold border-navy'
                        : 'border-navy/15 text-navy/40 hover:border-gold hover:text-gold'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Fields
                    <span className={`px-1.5 py-0.5 text-[9px] rounded-sm ${fieldsOpen ? 'bg-gold/20' : 'bg-navy/5'}`}>
                      {activeFields.length}
                    </span>
                  </button>

                  {fieldsOpen && (
                    <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-navy/10 shadow-lg z-50">
                      <div className="px-4 py-2.5 border-b border-navy/5">
                        <span className="text-[10px] uppercase tracking-widest text-navy/40 font-bold">Profile Fields</span>
                      </div>
                      <div className="py-1">
                        {FIELDS.map(field => {
                          const active = isFieldActive(field.id);
                          return (
                            <button
                              key={field.id}
                              onClick={() => toggleField(field.id)}
                              className="w-full flex items-center gap-3 px-4 py-1.5 text-left hover:bg-navy/3 transition-colors"
                            >
                              <div className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 transition-all ${
                                active ? 'border-gold bg-gold' : 'border-navy/20'
                              }`}>
                                {active && (
                                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs ${active ? 'text-navy font-medium' : 'text-navy/40'}`}>{field.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {visibleFields.map(field => (
                  <div key={field.id} className="bg-cream p-3 rounded-sm">
                    <span className="text-[9px] uppercase tracking-widest text-navy/40 font-bold block mb-1">{field.label}</span>
                    <span className="text-lg font-serif text-navy" style={{ fontVariantNumeric: 'tabular-nums' }}>{field.getValue(scorecard)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory by Price Range — box-and-whisker style */}
          <div className="col-span-12 md:col-span-4 bg-white p-6 shadow-card">
            <span className="text-label uppercase tracking-xl text-gold font-bold block mb-2">Inventory</span>
            <h2 className="text-xl font-serif text-navy mb-5">By Price Range</h2>
            {priceBandData.length > 0 ? (
              <InventoryBoxWhisker bands={priceBandData} />
            ) : (
              <p className="text-navy/30 text-center py-8 font-serif">No data available</p>
            )}
          </div>

          {/* Price Trends — shares row with inventory */}
          <div className="col-span-12 md:col-span-8 bg-white p-6 shadow-card border-t-2 border-t-gold">
            <span className="text-label uppercase tracking-xl text-gold font-bold block mb-2">Price Trends</span>
            <h2 className="text-xl font-serif text-navy mb-6">Median Close Price, $/SqFt & Inventory</h2>
            {priceTrendData.length > 0 ? (
              <AnalyticsLineChart
                agentId={agentId}
                data={priceTrendData}
                xKey="month"
                series={[
                  { dataKey: 'medianPrice', label: 'Median Close Price', color: '#0C1C2E' },
                  { dataKey: 'medianPpsf', label: 'Median $/SqFt', color: '#Bfa67a' },
                ]}
                bars={[
                  { dataKey: 'activeInventory', label: 'Active Inventory', color: '#0C1C2E', opacity: 0.08 },
                ]}
                height={360}
              />
            ) : (
              <div className="py-12 text-center text-navy/30 font-serif">No price data available yet</div>
            )}
          </div>

          {/* Feature Price Impact */}
          {featureImpact.length > 0 && (
            <div className="col-span-12 bg-white p-6 md:p-8 shadow-card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="text-label uppercase tracking-xl text-gold font-bold block mb-2">Feature Impact</span>
                  <h2 className="text-xl font-serif text-navy">How Features Affect Price per Sq Ft</h2>
                </div>
                <span className="text-[9px] text-navy/30 font-bold uppercase tracking-widest mt-1 shrink-0">Size-adjusted · Closed sales</span>
              </div>
              <FeatureImpactChart features={featureImpact} />
            </div>
          )}

        </div>
      </section>

      {/* Community Heatmap */}
      {heatmapCells.length > 0 && mapTilerKey && (
        <section className="mx-auto max-w-content-lg px-8 lg:px-20 py-16">
          <div className="mb-6">
            <span className="text-label uppercase tracking-xl text-gold font-bold block mb-2">Geographic View</span>
            <h2 className="text-2xl font-serif text-navy">Active Listings in {communityName}</h2>
          </div>
          <div className="border-t-2 border-gold shadow-card">
            <H3Heatmap
              agentId={agentId}
              cells={heatmapCells}
              mapTilerKey={mapTilerKey}
              defaultMetric="ppsf"
              className="min-h-[500px]"
            />
          </div>
        </section>
      )}

      {/* Similar Communities */}
      {similarCommunities.length > 0 && (
        <section className="relative bg-navy text-white py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-navy-mid to-navy" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <div className="relative mx-auto max-w-content-lg px-8 lg:px-20">
            <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">
              Explore Similar
            </span>
            <h2 className="text-2xl font-serif mb-8">Communities Like {communityName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarCommunities.map((c, i) => (
                <Link
                  key={c.subdivisionName}
                  href={`/market/community/${slugify(c.subdivisionName)}`}
                  className={`group border border-white/10 p-5 hover:border-gold/50 transition-colors ${i === 0 ? 'bg-gold/5' : ''}`}
                >
                  <h3 className="font-serif text-lg group-hover:text-gold transition-colors mb-3">
                    {c.subdivisionName}
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">$/SqFt</span>
                      <span className="font-serif text-gold" style={{ fontVariantNumeric: 'tabular-nums' }}>${Math.round(c.medianPricePerSqft)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Median Price</span>
                      <span className="font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(c.medianActivePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Avg DOM</span>
                      <span className="font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.avgDom}d</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <ArmlsAttribution agentId={agentId} periodStart={periodStart} periodEnd={periodEnd} />
    </main>
  );
}

// ── Inventory Box & Whisker ─────────────────────────

function InventoryBoxWhisker({ bands }: { bands: { band: string; count: number; avgDom: number }[] }) {
  if (bands.length === 0) return null;
  const maxCount = Math.max(...bands.map(b => b.count));
  const totalCount = bands.reduce((sum, b) => sum + b.count, 0);

  // Find the "median" band (where cumulative count crosses 50%)
  let cumulative = 0;
  let medianIdx = 0;
  for (let i = 0; i < bands.length; i++) {
    cumulative += bands[i].count;
    if (cumulative >= totalCount / 2) {
      medianIdx = i;
      break;
    }
  }

  // Find Q1 and Q3 bands
  cumulative = 0;
  let q1Idx = 0;
  let q3Idx = bands.length - 1;
  for (let i = 0; i < bands.length; i++) {
    cumulative += bands[i].count;
    if (cumulative >= totalCount * 0.25 && q1Idx === 0) q1Idx = i;
    if (cumulative >= totalCount * 0.75) { q3Idx = i; break; }
  }

  return (
    <div className="space-y-0">
      {bands.map((band, i) => {
        const pct = maxCount > 0 ? (band.count / maxCount) * 100 : 0;
        const isMedian = i === medianIdx;
        const isIQR = i >= q1Idx && i <= q3Idx;

        return (
          <div key={band.band} className="flex items-center gap-3 py-1.5">
            {/* Price label */}
            <span className="text-[9px] text-navy/40 font-bold w-16 shrink-0 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {band.band}
            </span>
            {/* Bar + whisker */}
            <div className="flex-1 relative h-5">
              {/* Whisker line (thin line for all bars) */}
              <div className="absolute top-1/2 left-0 h-px bg-navy/10" style={{ width: `${pct}%` }} />
              {/* Box (thicker for IQR range) */}
              <div
                className={`absolute top-0 left-0 h-full rounded-sm transition-all duration-500 ${
                  isMedian ? 'bg-gold' : isIQR ? 'bg-navy/20' : 'bg-navy/8'
                }`}
                style={{ width: `${pct}%` }}
              />
              {/* Median marker */}
              {isMedian && (
                <div className="absolute top-0 h-full w-0.5 bg-navy" style={{ left: `${pct}%` }} />
              )}
            </div>
            {/* Count */}
            <span className={`text-[10px] w-8 text-right shrink-0 ${isMedian ? 'text-gold font-bold' : 'text-navy/30'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {band.count}
            </span>
          </div>
        );
      })}
      {/* Legend */}
      <div className="flex items-center gap-4 pt-3 mt-2 border-t border-navy/5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-gold rounded-sm" />
          <span className="text-[8px] uppercase tracking-widest text-navy/30 font-bold">Median</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-navy/20 rounded-sm" />
          <span className="text-[8px] uppercase tracking-widest text-navy/30 font-bold">IQR</span>
        </div>
      </div>
    </div>
  );
}

// ── Market Gauge ───────────────────────────────────

function MarketGauge({ monthsOfSupply }: { monthsOfSupply: number }) {
  const clampedMos = Math.min(Math.max(monthsOfSupply, 0), 12);
  const angle = (clampedMos / 12) * 180;
  const isSeller = monthsOfSupply < 3;
  const isBuyer = monthsOfSupply > 6;
  const label = isSeller ? "Seller's Market" : isBuyer ? "Buyer's Market" : 'Balanced Market';

  // Arc helper: describes a semicircle arc segment
  const cx = 100, cy = 90, r = 70;
  function arcPath(startDeg: number, endDeg: number) {
    const s = (Math.PI / 180) * (180 - startDeg);
    const e = (Math.PI / 180) * (180 - endDeg);
    const x1 = cx + r * Math.cos(s), y1 = cy - r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy - r * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  const needleLen = 55;
  const needleRad = (Math.PI / 180) * (180 - angle);
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy - needleLen * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center justify-center h-full py-4">
      <span className="text-label uppercase tracking-xl text-gold font-bold mb-4">Market Type</span>
      <div className="relative w-full max-w-[200px]">
        <svg viewBox="0 0 200 110" className="w-full">
          {/* Seller arc (0-45°) — terracotta */}
          <path d={arcPath(0, 45)} fill="none" stroke="#E07A5F" strokeWidth="14" strokeLinecap="butt" opacity="0.25" />
          <path d={arcPath(0, 45)} fill="none" stroke="#E07A5F" strokeWidth="14" strokeLinecap="butt" opacity={isSeller ? 0.6 : 0.1} />
          {/* Seller-leaning arc (45-75°) */}
          <path d={arcPath(45, 75)} fill="none" stroke="#E07A5F" strokeWidth="14" strokeLinecap="butt" opacity="0.12" />
          {/* Balanced arc (75-105°) — gold */}
          <path d={arcPath(75, 105)} fill="none" stroke="#BFA67A" strokeWidth="14" strokeLinecap="butt" opacity="0.25" />
          <path d={arcPath(75, 105)} fill="none" stroke="#BFA67A" strokeWidth="14" strokeLinecap="butt" opacity={!isSeller && !isBuyer ? 0.5 : 0.1} />
          {/* Buyer-leaning arc (105-135°) */}
          <path d={arcPath(105, 135)} fill="none" stroke="#22c55e" strokeWidth="14" strokeLinecap="butt" opacity="0.12" />
          {/* Buyer arc (135-180°) — green */}
          <path d={arcPath(135, 180)} fill="none" stroke="#22c55e" strokeWidth="14" strokeLinecap="butt" opacity="0.25" />
          <path d={arcPath(135, 180)} fill="none" stroke="#22c55e" strokeWidth="14" strokeLinecap="butt" opacity={isBuyer ? 0.6 : 0.1} />
          {/* Tick marks */}
          {[0, 45, 90, 135, 180].map(deg => {
            const rad = (Math.PI / 180) * (180 - deg);
            const inner = r - 10, outer = r + 10;
            return (
              <line key={deg}
                x1={cx + inner * Math.cos(rad)} y1={cy - inner * Math.sin(rad)}
                x2={cx + outer * Math.cos(rad)} y2={cy - outer * Math.sin(rad)}
                stroke="#0C1C2E" strokeWidth="1" opacity="0.12"
              />
            );
          })}
          {/* Needle */}
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#0C1C2E" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="5" fill="#0C1C2E" />
          <circle cx={cx} cy={cy} r="2.5" fill="#BFA67A" />
          {/* End labels */}
          <text x="18" y="98" fontSize="9" fill="rgba(12,28,46,0.35)" fontWeight="700" textAnchor="start" fontFamily="sans-serif">SELLER</text>
          <text x="182" y="98" fontSize="9" fill="rgba(12,28,46,0.35)" fontWeight="700" textAnchor="end" fontFamily="sans-serif">BUYER</text>
        </svg>
      </div>
      <span className={`text-lg font-serif font-semibold mt-2 ${isSeller ? 'text-accent' : isBuyer ? 'text-emerald-600' : 'text-gold'}`}>
        {label}
      </span>
      <span className="text-xs text-navy/40 font-semibold mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {monthsOfSupply} months of supply
      </span>
    </div>
  );
}

// ── Feature Price Impact Chart ──────────────────────

function FeatureImpactChart({ features }: { features: FeaturePriceImpact[] }) {
  const maxAbsDelta = Math.max(...features.map(f => Math.abs(f.priceDelta)), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map(f => {
        const isPositive = f.priceDelta >= 0;
        const barWidth = Math.min(Math.abs(f.priceDelta) / maxAbsDelta * 100, 100);
        const deltaSign = isPositive ? '+' : '';

        return (
          <div key={f.feature} className="bg-cream p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-navy">{f.label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 ${
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}>
                {deltaSign}{f.pctImpact}%
              </span>
            </div>

            {/* Bar visualization */}
            <div className="relative h-6 bg-navy/5 mb-3 overflow-hidden">
              <div
                className={`absolute top-0 h-full transition-all duration-500 ${
                  isPositive ? 'bg-emerald-500/20 left-1/2' : 'bg-red-400/20 right-1/2'
                }`}
                style={{ width: `${barWidth / 2}%` }}
              />
              {/* Center line */}
              <div className="absolute top-0 left-1/2 w-px h-full bg-navy/15" />
              {/* Indicator dot */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                  isPositive ? 'bg-emerald-500' : 'bg-red-400'
                }`}
                style={{
                  left: `${50 + (f.priceDelta / maxAbsDelta) * 45}%`,
                }}
              />
            </div>

            {/* Values row */}
            <div className="flex justify-between text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <div>
                <span className="text-navy/35 block text-[9px] uppercase tracking-widest font-bold">Without</span>
                <span className="text-navy font-serif">${Math.round(f.avgPpsfWithout)}/sf</span>
              </div>
              <div className="text-center">
                <span className="text-navy/35 block text-[9px] uppercase tracking-widest font-bold">Impact</span>
                <span className={`font-serif font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {deltaSign}${Math.abs(Math.round(f.priceDelta))}/sf
                </span>
              </div>
              <div className="text-right">
                <span className="text-navy/35 block text-[9px] uppercase tracking-widest font-bold">With</span>
                <span className="text-navy font-serif">${Math.round(f.avgPpsfWith)}/sf</span>
              </div>
            </div>

            {/* Sample size */}
            <div className="mt-2 text-[9px] text-navy/25 font-bold text-right">
              {f.countWith.toLocaleString()} with · {f.countWithout.toLocaleString()} without
            </div>
          </div>
        );
      })}
    </div>
  );
}
