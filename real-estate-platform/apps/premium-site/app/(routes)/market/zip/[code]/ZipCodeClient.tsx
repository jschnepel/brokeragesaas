'use client';

/**
 * Zip Code Deep Dive — Client component.
 * Same analytics as market overview but scoped to a single zip code.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import {
  AnalyticsLineChart,
  AnalyticsBarChart,
  PriceBandHistogram,
  ArmlsAttribution,
} from '@platform/ui';
import type {
  MarketPulseKpis,
  MarketPulseRow,
  PriceBandRow,
  SupplyDemandRow,
  InventoryAgeRow,
  CommunityScorecard,
} from '@platform/shared';

interface ZipCodeClientProps {
  agentId: string;
  zipCode: string;
  kpis: MarketPulseKpis;
  pulse: MarketPulseRow[];
  priceBands: PriceBandRow[];
  supplyDemand: SupplyDemandRow[];
  inventoryAge: InventoryAgeRow[];
  communities: CommunityScorecard[];
  periodStart: string;
  periodEnd: string;
  heroImage: string;
}

function formatPrice(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function ZipCodeClient({
  agentId,
  zipCode,
  kpis,
  pulse,
  priceBands,
  supplyDemand,
  communities,
  periodStart,
  periodEnd,
  heroImage,
}: ZipCodeClientProps) {
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

  const supplyDemandData = useMemo(() => {
    return supplyDemand
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(row => ({
        month: row.month,
        newListings: row.newListings,
        newPendings: row.newPendings,
      }));
  }, [supplyDemand]);

  const priceBandData = useMemo(() => {
    const bandMap = new Map<string, { count: number; avgDom: number; order: number }>();
    for (const row of priceBands) {
      if (row.status !== 'Active' && row.status !== 'Active Under Contract') continue;
      const existing = bandMap.get(row.priceBand);
      if (existing) {
        existing.count += row.listingCount;
      } else {
        bandMap.set(row.priceBand, { count: row.listingCount, avgDom: row.avgDom, order: row.bandOrder });
      }
    }
    return [...bandMap.entries()]
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([band, data]) => ({ band, count: data.count, avgDom: data.avgDom }));
  }, [priceBands]);

  return (
    <main className="min-h-screen bg-cream">
      {/* Breadcrumb + Hero */}
      <section className="relative text-white pt-28 pb-20 overflow-hidden" style={{ minHeight: '380px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt={`${zipCode} market`} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/75 to-navy/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/80 to-transparent" />
        <div className="relative mx-auto max-w-content-lg px-8 lg:px-20">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest mb-6">
            <Link href="/market" className="text-white/40 hover:text-gold transition-colors font-bold">
              Market
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-gold font-bold">{zipCode}</span>
          </nav>
          <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">Zip Code Report</span>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-serif mb-4 leading-tight">
            {zipCode} Market Report
          </h1>
          <div className="w-16 h-0.5 bg-gold mb-6" />
          <p className="text-white/50 text-sm max-w-xl leading-relaxed mb-8">
            Detailed market analytics for zip code {zipCode} in Greater Phoenix.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/phoenix"
              className="inline-flex items-center gap-2 bg-gold text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-navy transition-all group"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" fill="none" />
              </svg>
              Explore Communities
              <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
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

      {/* KPIs */}
      <section className="mx-auto max-w-content-lg px-8 lg:px-20 -mt-10 relative z-10">
        <div className="grid grid-cols-12 gap-3 md:gap-4">
          {kpiCards.map((card) => (
            <div key={card.label} className="col-span-6 md:col-span-3 bg-white p-4 md:p-5 shadow-card border-t-2 border-t-gold">
              <span className="text-[9px] uppercase tracking-widest text-navy/40 font-bold block mb-1">{card.label}</span>
              <span className="text-xl md:text-2xl font-serif text-navy" style={{ fontVariantNumeric: 'tabular-nums' }}>{card.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Price Trends */}
      <section className="mx-auto max-w-content-lg px-8 lg:px-20 py-16">
        <h2 className="text-2xl font-serif text-navy mb-6">Price Trends</h2>
        {priceTrendData.length > 0 ? (
          <div className="bg-white border border-navy/5 p-6 shadow-card">
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
          </div>
        ) : (
          <div className="bg-white border border-navy/5 p-12 text-center text-navy/30 font-serif">
            No price data available yet
          </div>
        )}
      </section>

      {/* Supply & Demand */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-content-lg px-8 lg:px-20">
          <h2 className="text-2xl font-serif text-navy mb-6">Supply vs. Demand</h2>
          {supplyDemandData.length > 0 ? (
            <div className="bg-cream border border-navy/5 p-6">
              <AnalyticsBarChart
                agentId={agentId}
                data={supplyDemandData}
                xKey="month"
                bars={[
                  { dataKey: 'newListings', label: 'New Listings', color: '#0C1C2E' },
                  { dataKey: 'newPendings', label: 'New Pendings', color: '#Bfa67a' },
                ]}
              />
            </div>
          ) : (
            <div className="bg-cream border border-navy/5 p-12 text-center text-navy/30 font-serif">
              No supply data available yet
            </div>
          )}
        </div>
      </section>

      {/* Price Distribution + Market Gauge */}
      <section className="mx-auto max-w-content-lg px-8 lg:px-20 py-16">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8">
            <h2 className="text-2xl font-serif text-navy mb-6">Price Distribution</h2>
            <div className="bg-white border border-navy/5 border-t-2 border-t-gold p-6 shadow-card">
              {priceBandData.length > 0 ? (
                <PriceBandHistogram agentId={agentId} data={priceBandData} />
              ) : (
                <p className="text-navy/30 text-center py-8 font-serif">No data available</p>
              )}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <h2 className="text-2xl font-serif text-navy mb-6">Market Condition</h2>
            <div className="bg-white border border-navy/5 border-t-2 border-t-accent p-8 shadow-card flex items-center justify-center" style={{ minHeight: '240px' }}>
              <MarketGauge monthsOfSupply={kpis.monthsOfSupply} />
            </div>
          </div>
        </div>
      </section>

      {/* Communities in this Zip */}
      {communities.length > 0 && (
        <section className="bg-navy text-white py-16">
          <div className="mx-auto max-w-content-lg px-8 lg:px-20">
            <h2 className="text-2xl font-serif mb-8">Communities in {zipCode}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((c) => (
                <Link
                  key={c.subdivisionName}
                  href={`/market/community/${slugify(c.subdivisionName)}`}
                  className="group border border-white/10 p-5 hover:border-gold/50 transition-colors"
                >
                  <h3 className="font-serif text-lg group-hover:text-gold transition-colors mb-3">
                    {c.subdivisionName}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-white/40 block">Median Price</span>
                      <span className="font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrice(c.medianActivePrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block">$/SqFt</span>
                      <span className="font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${Math.round(c.medianPricePerSqft)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Avg DOM</span>
                      <span className="font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {c.avgDom}d
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Active</span>
                      <span className="font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {c.activeCount}
                      </span>
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

function MarketGauge({ monthsOfSupply }: { monthsOfSupply: number }) {
  const clampedMos = Math.min(Math.max(monthsOfSupply, 0), 12);
  const angle = (clampedMos / 12) * 180;
  const isSeller = monthsOfSupply < 3;
  const isBuyer = monthsOfSupply > 6;
  const label = isSeller ? "Seller's Market" : isBuyer ? "Buyer's Market" : 'Balanced Market';

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
          <path d={arcPath(0, 45)} fill="none" stroke="#E07A5F" strokeWidth="14" strokeLinecap="butt" opacity="0.25" />
          <path d={arcPath(0, 45)} fill="none" stroke="#E07A5F" strokeWidth="14" strokeLinecap="butt" opacity={isSeller ? 0.6 : 0.1} />
          <path d={arcPath(45, 75)} fill="none" stroke="#E07A5F" strokeWidth="14" strokeLinecap="butt" opacity="0.12" />
          <path d={arcPath(75, 105)} fill="none" stroke="#BFA67A" strokeWidth="14" strokeLinecap="butt" opacity="0.25" />
          <path d={arcPath(75, 105)} fill="none" stroke="#BFA67A" strokeWidth="14" strokeLinecap="butt" opacity={!isSeller && !isBuyer ? 0.5 : 0.1} />
          <path d={arcPath(105, 135)} fill="none" stroke="#22c55e" strokeWidth="14" strokeLinecap="butt" opacity="0.12" />
          <path d={arcPath(135, 180)} fill="none" stroke="#22c55e" strokeWidth="14" strokeLinecap="butt" opacity="0.25" />
          <path d={arcPath(135, 180)} fill="none" stroke="#22c55e" strokeWidth="14" strokeLinecap="butt" opacity={isBuyer ? 0.6 : 0.1} />
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
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#0C1C2E" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="5" fill="#0C1C2E" />
          <circle cx={cx} cy={cy} r="2.5" fill="#BFA67A" />
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
