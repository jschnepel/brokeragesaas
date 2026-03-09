'use client';

/**
 * Market Overview — Client component.
 * Customizable report builder with dropdown section selector and data filters.
 * Users select which analytics modules to display and filter by location/price.
 *
 * @compliance ARMLS Section 21.1 — Aggregate statistical display with attribution.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AnalyticsLineChart,
  AnalyticsBarChart,
  PriceBandHistogram,
  ArmlsAttribution,
  H3Heatmap,
} from '@platform/ui';
import type {
  MarketPulseKpis,
  MarketPulseRow,
  PriceBandRow,
  SupplyDemandRow,
  InventoryAgeRow,
  CommunityScorecard,
  HeatmapPoint,
  PortfolioTrendRow,
} from '@platform/shared';
import { aggregateToHexCells } from '@platform/shared';

interface MarketOverviewClientProps {
  agentId: string;
  kpis: MarketPulseKpis;
  pulse: MarketPulseRow[];
  priceBands: PriceBandRow[];
  supplyDemand: SupplyDemandRow[];
  inventoryAge: InventoryAgeRow[];
  communities: CommunityScorecard[];
  heatmapPoints: HeatmapPoint[];
  periodStart: string;
  periodEnd: string;
  availableCities: string[];
  availableZipCodes: string[];
  portfolioTrends: PortfolioTrendRow[] | null;
  hasPortfolioFilters: boolean;
  heroImage: string;
}

// ── Section Registry ────────────────────────────────

type SectionId =
  | 'kpis'
  | 'heatmap'
  | 'priceTrends'
  | 'supplyDemand'
  | 'priceBands'
  | 'inventoryAge'
  | 'communityRankings';

interface SectionDef {
  id: SectionId;
  label: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'kpis', label: 'Key Metrics' },
  { id: 'heatmap', label: 'Market Heatmap' },
  { id: 'priceTrends', label: 'Price Trends' },
  { id: 'supplyDemand', label: 'Supply & Demand' },
  { id: 'priceBands', label: 'Price Distribution' },
  { id: 'inventoryAge', label: 'Inventory Health' },
  { id: 'communityRankings', label: 'Community Rankings' },
];

const DEFAULT_SECTIONS: SectionId[] = [
  'kpis', 'heatmap', 'priceTrends', 'supplyDemand', 'priceBands', 'inventoryAge',
];

function parseSections(param: string | null): SectionId[] {
  if (!param) return DEFAULT_SECTIONS;
  const ids = param.split(',').filter((id): id is SectionId =>
    SECTIONS.some(s => s.id === id)
  );
  return ids.length > 0 ? ids : DEFAULT_SECTIONS;
}

// ── Helpers ─────────────────────────────────────────

function formatPrice(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Dropdown Hook ───────────────────────────────────

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return { open, setOpen, ref };
}

// ── Component ───────────────────────────────────────

export function MarketOverviewClient({
  agentId,
  kpis,
  pulse,
  priceBands,
  supplyDemand,
  inventoryAge,
  communities,
  heatmapPoints,
  periodStart,
  periodEnd,
  availableCities,
  availableZipCodes,
  portfolioTrends,
  hasPortfolioFilters,
  heroImage,
}: MarketOverviewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Section state ──
  const sectionsDropdown = useDropdown();

  const activeSections = useMemo(
    () => parseSections(searchParams.get('sections')),
    [searchParams]
  );

  const isActive = useCallback(
    (id: SectionId) => activeSections.includes(id),
    [activeSections]
  );

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.replace(`/market${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchParams, router]);

  const toggleSection = useCallback((id: SectionId) => {
    const next = isActive(id)
      ? activeSections.filter(s => s !== id)
      : [...activeSections, id];
    const ordered = SECTIONS.map(s => s.id).filter(s => next.includes(s));
    if (ordered.length === DEFAULT_SECTIONS.length && DEFAULT_SECTIONS.every((s, i) => ordered[i] === s)) {
      updateParam('sections', null);
    } else {
      updateParam('sections', ordered.join(','));
    }
  }, [activeSections, isActive, updateParam]);

  const selectAll = useCallback(() => updateParam('sections', null), [updateParam]);
  const clearAll = useCallback(() => updateParam('sections', ''), [updateParam]);

  // ── Filter state ──
  const activeCity = searchParams.get('city') ?? '';
  const activeZip = searchParams.get('zip') ?? '';
  const priceMinParam = searchParams.get('priceMin') ?? '';
  const priceMaxParam = searchParams.get('priceMax') ?? '';
  const activePool = searchParams.get('pool') === 'true';
  const activeBeds = searchParams.get('beds') ?? '';
  const activeBaths = searchParams.get('baths') ?? '';
  const [priceMin, setPriceMin] = useState(priceMinParam);
  const [priceMax, setPriceMax] = useState(priceMaxParam);
  const hasFilters = activeCity || activeZip || priceMinParam || priceMaxParam || activePool || activeBeds || activeBaths;

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('city');
    params.delete('zip');
    params.delete('priceMin');
    params.delete('priceMax');
    params.delete('pool');
    params.delete('beds');
    params.delete('baths');
    setPriceMin('');
    setPriceMax('');
    const qs = params.toString();
    router.replace(`/market${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchParams, router]);

  const applyPriceFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (priceMin) params.set('priceMin', priceMin); else params.delete('priceMin');
    if (priceMax) params.set('priceMax', priceMax); else params.delete('priceMax');
    const qs = params.toString();
    router.replace(`/market${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchParams, router, priceMin, priceMax]);

  // ── Filter communities by price range (client-side) ──
  const priceMinNum = priceMinParam ? parseInt(priceMinParam, 10) * 1000 : 0;
  const priceMaxNum = priceMaxParam ? parseInt(priceMaxParam, 10) * 1000 : Infinity;

  const filteredCommunities = useMemo(() => {
    if (!priceMinParam && !priceMaxParam) return communities;
    return communities.filter(c => {
      const price = c.medianActivePrice || c.avgClosePrice;
      return price >= priceMinNum && price <= priceMaxNum;
    });
  }, [communities, priceMinParam, priceMaxParam, priceMinNum, priceMaxNum]);

  // ── Data computations ──
  const kpiCards = useMemo(() => [
    { label: 'Median Price', value: formatPrice(kpis.medianPrice), tooltip: 'Median active listing price across the metro' },
    { label: 'Price per SqFt', value: `$${Math.round(kpis.medianPricePerSqft)}`, tooltip: 'Median price per square foot of active listings' },
    { label: 'Days on Market', value: `${kpis.medianDom}`, tooltip: 'Median days on market for active listings' },
    { label: 'Close-to-List', value: `${kpis.avgCloseToListRatio}%`, tooltip: 'How close buyers pay to asking price' },
  ], [kpis]);

  const priceTrendData = useMemo(() => {
    const closedByMonth = new Map<string, MarketPulseRow>();
    const activeByMonth = new Map<string, number>();
    for (const row of pulse) {
      if (row.status === 'Closed') {
        const existing = closedByMonth.get(row.month);
        if (!existing || row.listingCount > existing.listingCount) {
          closedByMonth.set(row.month, row);
        }
      }
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

  // Portfolio trend data (from raw listings with feature filters applied)
  const portfolioTrendData = useMemo(() => {
    if (!portfolioTrends || portfolioTrends.length === 0) return null;
    return portfolioTrends.map(row => ({
      month: row.month,
      medianPrice: row.medianPrice,
      medianPpsf: row.medianPpsf,
      activeInventory: row.listingCount,
    }));
  }, [portfolioTrends]);

  // Use portfolio data for price trends when portfolio filters are active
  const effectiveTrendData = hasPortfolioFilters && portfolioTrendData
    ? portfolioTrendData
    : priceTrendData;

  const supplyDemandData = useMemo(() => {
    return supplyDemand
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(row => ({
        month: row.month,
        newListings: row.newListings,
        newPendings: row.newPendings,
        newClosings: row.newClosings,
      }));
  }, [supplyDemand]);

  const priceBandData = useMemo(() => {
    const bandMap = new Map<string, { count: number; avgDom: number; order: number }>();
    for (const row of priceBands) {
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
    return aggregateToHexCells(heatmapPoints, 7);
  }, [heatmapPoints]);

  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';

  const inventoryAgeTotal = inventoryAge.reduce((sum, r) => sum + r.listingCount, 0);

  // Peak price band for dashboard summary
  const peakBand = useMemo(() => {
    if (priceBandData.length === 0) return null;
    return priceBandData.reduce((max, b) => b.count > max.count ? b : max, priceBandData[0]);
  }, [priceBandData]);

  // Freshness ratio for inventory health summary
  const freshPct = useMemo(() => {
    const freshRows = inventoryAge.filter(r => r.bandOrder === 1);
    const freshCount = freshRows.reduce((s, r) => s + r.listingCount, 0);
    return inventoryAgeTotal > 0 ? Math.round((freshCount / inventoryAgeTotal) * 100) : 0;
  }, [inventoryAge, inventoryAgeTotal]);

  const activeCount = activeSections.length;

  // ── Location label for title ──
  const locationLabel = activeCity || activeZip
    ? activeCity
      ? `${activeCity}${activeZip ? ` (${activeZip})` : ''}`
      : `ZIP ${activeZip}`
    : 'Greater Phoenix';

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative text-white pt-28 pb-20 overflow-hidden" style={{ minHeight: '420px' }}>
        {/* Background image + overlay */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt="Market overview" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/75 to-navy/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/80 to-transparent" />

        <div className="relative mx-auto max-w-content-lg px-8 lg:px-20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
                Market Intelligence
              </span>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-serif mb-4 leading-tight">
                {locationLabel}<br />
                <span className="text-white/60">Market Overview</span>
              </h1>
              <div className="w-16 h-0.5 bg-gold mb-6" />
              <p className="text-white/40 text-sm max-w-xl leading-relaxed mb-8">
                Real-time aggregate market analytics derived from ARMLS data.
                Use the filters and section controls below to build your custom report.
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
            {/* Quick stats highlight */}
            {isActive('kpis') && (
              <div className="hidden xl:flex flex-col items-end gap-1 mt-4">
                <span className="text-[10px] uppercase tracking-widest text-gold/60 font-bold">At a Glance</span>
                <span className="text-3xl font-serif">{formatPrice(kpis.medianPrice)}</span>
                <span className="text-[10px] uppercase tracking-widest text-white/30">Median Price</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filter & Section Controls Bar */}
      <section className="bg-navy border-t border-gold/10 shadow-lg">
        <div className="mx-auto max-w-content-lg px-8 lg:px-20 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sections Dropdown */}
            <div ref={sectionsDropdown.ref} className="relative">
              <button
                onClick={() => sectionsDropdown.setOpen(!sectionsDropdown.open)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 border ${
                  sectionsDropdown.open
                    ? 'bg-gold text-navy border-gold'
                    : 'border-white/20 text-white/70 hover:border-gold hover:text-gold'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Sections
                <span className={`px-1.5 py-0.5 text-[9px] rounded-sm ${sectionsDropdown.open ? 'bg-navy/15' : 'bg-white/10'}`}>
                  {activeCount}/{SECTIONS.length}
                </span>
                <svg className={`w-2.5 h-2.5 transition-transform ${sectionsDropdown.open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sectionsDropdown.open && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-navy/10 shadow-lg z-50">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-navy/5">
                    <span className="text-[10px] uppercase tracking-widest text-navy/40 font-bold">Report Sections</span>
                    <div className="flex gap-2">
                      <button onClick={selectAll} className="text-[9px] uppercase tracking-widest font-bold text-gold hover:text-navy transition-colors">All</button>
                      <button onClick={clearAll} className="text-[9px] uppercase tracking-widest font-bold text-navy/30 hover:text-navy transition-colors">None</button>
                    </div>
                  </div>
                  <div className="py-1">
                    {SECTIONS.map(section => {
                      const active = isActive(section.id);
                      return (
                        <button
                          key={section.id}
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-navy/3 transition-colors"
                        >
                          <div className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-all ${
                            active ? 'border-gold bg-gold' : 'border-navy/20'
                          }`}>
                            {active && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-xs font-medium ${active ? 'text-navy' : 'text-navy/40'}`}>
                            {section.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10" />

            {/* City Filter */}
            <select
              value={activeCity}
              onChange={(e) => updateParam('city', e.target.value || null)}
              className="bg-transparent border border-white/20 text-white/70 text-[10px] uppercase tracking-widest font-bold px-3 py-2 appearance-none cursor-pointer hover:border-gold hover:text-gold transition-colors focus:outline-none focus:border-gold min-w-[120px]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="" className="bg-navy text-white">All Cities</option>
              {availableCities.map(city => (
                <option key={city} value={city} className="bg-navy text-white">{city}</option>
              ))}
            </select>

            {/* Zip Filter */}
            <select
              value={activeZip}
              onChange={(e) => updateParam('zip', e.target.value || null)}
              className="bg-transparent border border-white/20 text-white/70 text-[10px] uppercase tracking-widest font-bold px-3 py-2 appearance-none cursor-pointer hover:border-gold hover:text-gold transition-colors focus:outline-none focus:border-gold min-w-[100px]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="" className="bg-navy text-white">All ZIPs</option>
              {availableZipCodes.map(zip => (
                <option key={zip} value={zip} className="bg-navy text-white">{zip}</option>
              ))}
            </select>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10" />

            {/* Price Range */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Price</span>
              <input
                type="number"
                placeholder="Min (K)"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                onBlur={applyPriceFilter}
                onKeyDown={(e) => e.key === 'Enter' && applyPriceFilter()}
                className="bg-transparent border border-white/20 text-white/70 text-[10px] font-bold px-2 py-2 w-20 focus:outline-none focus:border-gold placeholder:text-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-white/20 text-[10px]">—</span>
              <input
                type="number"
                placeholder="Max (K)"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                onBlur={applyPriceFilter}
                onKeyDown={(e) => e.key === 'Enter' && applyPriceFilter()}
                className="bg-transparent border border-white/20 text-white/70 text-[10px] font-bold px-2 py-2 w-20 focus:outline-none focus:border-gold placeholder:text-white/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10" />

            {/* Feature Filters */}
            <button
              onClick={() => updateParam('pool', activePool ? null : 'true')}
              className={`px-3 py-2 text-[10px] uppercase tracking-widest font-bold border transition-all duration-200 ${
                activePool
                  ? 'bg-gold text-navy border-gold'
                  : 'border-white/20 text-white/40 hover:border-gold hover:text-gold'
              }`}
            >
              Pool
            </button>

            <select
              value={activeBeds}
              onChange={(e) => updateParam('beds', e.target.value || null)}
              className="bg-transparent border border-white/20 text-white/70 text-[10px] uppercase tracking-widest font-bold px-3 py-2 appearance-none cursor-pointer hover:border-gold hover:text-gold transition-colors focus:outline-none focus:border-gold min-w-[80px]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="" className="bg-navy text-white">Beds</option>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n} className="bg-navy text-white">{n}+</option>
              ))}
            </select>

            <select
              value={activeBaths}
              onChange={(e) => updateParam('baths', e.target.value || null)}
              className="bg-transparent border border-white/20 text-white/70 text-[10px] uppercase tracking-widest font-bold px-3 py-2 appearance-none cursor-pointer hover:border-gold hover:text-gold transition-colors focus:outline-none focus:border-gold min-w-[80px]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="" className="bg-navy text-white">Baths</option>
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n} className="bg-navy text-white">{n}+</option>
              ))}
            </select>

            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-white/30 hover:text-gold transition-colors ml-auto"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Empty state when nothing selected */}
      {activeCount === 0 && (
        <section className="mx-auto max-w-content-lg px-8 lg:px-20 py-24 text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-gold/10 to-gold/5 flex items-center justify-center border border-gold/20">
            <svg className="w-10 h-10 text-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-serif text-2xl text-navy mb-3">Build Your Report</h3>
          <p className="text-sm text-navy/40 mb-8 max-w-sm mx-auto leading-relaxed">
            Select sections from the dropdown above to build your custom market report.
          </p>
          <button
            onClick={() => sectionsDropdown.setOpen(true)}
            className="bg-navy text-white px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-navy-mid transition-colors duration-300"
          >
            Choose Sections
          </button>
        </section>
      )}

      {/* KPI Cards */}
      {isActive('kpis') && (
        <section className="mx-auto max-w-content-lg px-8 lg:px-20 -mt-10 relative z-10">
          <div className="grid grid-cols-12 gap-3 md:gap-4">
            {kpiCards.map((card, i) => (
              <div key={card.label} className="col-span-6 md:col-span-3 relative bg-white p-5 md:p-6 rounded-sm overflow-hidden group hover:shadow-lg transition-shadow duration-300" style={{ boxShadow: '0 10px 40px -10px rgba(12,28,46,0.1), 0 2px 8px -2px rgba(12,28,46,0.04)', border: '1px solid rgba(12,28,46,0.06)' }}>
                {/* Gold top accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold via-gold to-gold/50" />
                {/* Subtle number watermark */}
                <div className="absolute -right-2 -top-4 text-7xl font-serif font-bold text-navy/[0.03] select-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {i + 1}
                </div>
                <span className="text-[9px] uppercase tracking-widest text-navy/40 font-bold block mb-2">{card.label}</span>
                <span className="text-2xl md:text-3xl font-serif text-navy block" style={{ fontVariantNumeric: 'tabular-nums' }}>{card.value}</span>
                {'tooltip' in card && card.tooltip && (
                  <span className="block text-[9px] text-navy/30 mt-2 leading-tight">{card.tooltip}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* H3 Heatmap */}
      {isActive('heatmap') && heatmapCells.length > 0 && mapTilerKey && (
        <section className="mx-auto max-w-content-lg px-8 lg:px-20 py-16">
          <SectionHeader
            label="Geographic Intelligence"
            title="Market Heatmap"
            description="Hexagonal aggregation of active listings across Greater Phoenix. Select a metric to explore."
          />
          <div className="border-t-2 border-gold shadow-card">
            <H3Heatmap
              agentId={agentId}
              cells={heatmapCells}
              mapTilerKey={mapTilerKey}
              defaultMetric="ppsf"
            />
          </div>
        </section>
      )}

      {/* Price Trends — Dark navy section */}
      {isActive('priceTrends') && (
        <section className="relative bg-navy text-white py-20 overflow-hidden">
          {/* Layered background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-mid via-navy to-navy-mid" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold/3 rounded-full blur-3xl" />
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative mx-auto max-w-content-lg px-8 lg:px-20">
            {/* Header row with KPI callouts */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
              <div>
                <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">
                  {hasPortfolioFilters ? 'Portfolio Trends' : 'Price Trends'}
                </span>
                <h2 className="text-3xl lg:text-4xl font-serif text-white mb-3">
                  Median Close Price, $/SqFt & Inventory
                </h2>
                <p className="text-sm text-white/40 max-w-2xl leading-relaxed">
                  {hasPortfolioFilters
                    ? 'Showing trends for your filtered portfolio. Adjust filters above to refine.'
                    : 'Price lines overlay active inventory bars to show how supply levels relate to pricing.'}
                </p>
              </div>
              {/* Inline KPI callouts */}
              <div className="flex gap-6 shrink-0">
                <div className="text-right">
                  <span className="block text-2xl font-serif text-gold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatPrice(kpis.medianPrice)}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Median Price</span>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-right">
                  <span className="block text-2xl font-serif text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ${Math.round(kpis.medianPricePerSqft)}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Per SqFt</span>
                </div>
              </div>
            </div>

            {hasPortfolioFilters && (
              <div className="mb-6 p-4 border border-gold/12 flex flex-wrap items-center gap-2" style={{ backgroundColor: 'rgba(191,166,122,0.06)' }}>
                <svg className="w-3.5 h-3.5 text-gold/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-label uppercase tracking-widest text-white/40 font-bold">Active filters:</span>
                {activePool && <span className="px-2.5 py-1 bg-gold/15 text-gold text-label font-bold uppercase tracking-wider">Pool</span>}
                {activeBeds && <span className="px-2.5 py-1 bg-gold/15 text-gold text-label font-bold uppercase tracking-wider">{activeBeds}+ Beds</span>}
                {activeBaths && <span className="px-2.5 py-1 bg-gold/15 text-gold text-label font-bold uppercase tracking-wider">{activeBaths}+ Baths</span>}
                {priceMinParam && <span className="px-2.5 py-1 bg-gold/15 text-gold text-label font-bold uppercase tracking-wider">${priceMinParam}K+</span>}
                {priceMaxParam && <span className="px-2.5 py-1 bg-gold/15 text-gold text-label font-bold uppercase tracking-wider">Under ${priceMaxParam}K</span>}
                {activeCity && <span className="px-2.5 py-1 bg-gold/15 text-gold text-label font-bold uppercase tracking-wider">{activeCity}</span>}
                {activeZip && <span className="px-2.5 py-1 bg-gold/15 text-gold text-label font-bold uppercase tracking-wider">ZIP {activeZip}</span>}
              </div>
            )}
            {effectiveTrendData.length > 0 ? (
              <div className="relative p-8 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                {/* Gold accent top border */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                <AnalyticsLineChart
                  agentId={agentId}
                  data={effectiveTrendData}
                  xKey="month"
                  dark
                  series={[
                    { dataKey: 'medianPrice', label: 'Median Close Price', color: '#BFA67A' },
                    { dataKey: 'medianPpsf', label: 'Median $/SqFt', color: '#5B8DB8' },
                  ]}
                  bars={[
                    { dataKey: 'activeInventory', label: hasPortfolioFilters ? 'Matching Listings' : 'Active Inventory', color: '#BFA67A', opacity: 0.12 },
                  ]}
                  height={380}
                />
              </div>
            ) : (
              <EmptyCard message="Price trend data will appear once listings are synced" />
            )}
          </div>
        </section>
      )}

      {/* Supply vs Demand — Premium cream section */}
      {isActive('supplyDemand') && (
        <section className="relative bg-cream-alt py-20 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-navy/3 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />

          <div className="mx-auto max-w-content-lg px-8 lg:px-20">
            {/* Header with inline stat callouts */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
              <div>
                <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">
                  Supply & Demand
                </span>
                <h2 className="text-3xl lg:text-4xl font-serif text-navy mb-3">
                  New Listings vs. Buyer Activity
                </h2>
                <p className="text-sm text-navy/40 max-w-2xl leading-relaxed">
                  When demand (pendings) crosses above supply (new listings), the market is tightening.
                </p>
              </div>
              {/* Legend-style stat pills */}
              <div className="flex gap-3 shrink-0">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-sm" style={{ boxShadow: '0 2px 8px rgba(12,28,46,0.06)' }}>
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#0C1C2E' }} />
                  <span className="text-xs font-bold text-navy/70 uppercase tracking-wider">New Listings</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-sm" style={{ boxShadow: '0 2px 8px rgba(12,28,46,0.06)' }}>
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#BFA67A' }} />
                  <span className="text-xs font-bold text-navy/70 uppercase tracking-wider">Pendings</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-sm" style={{ boxShadow: '0 2px 8px rgba(12,28,46,0.06)' }}>
                  <div className="w-2 h-0.5 rounded-full" style={{ backgroundColor: '#E07A5F' }} />
                  <span className="text-xs font-bold text-navy/70 uppercase tracking-wider">Closings</span>
                </div>
              </div>
            </div>

            {supplyDemandData.length > 0 ? (
              <div className="relative bg-white p-8 rounded-sm" style={{ boxShadow: '0 25px 60px -15px rgba(12,28,46,0.1), 0 4px 16px -4px rgba(12,28,46,0.04)', border: '1px solid rgba(12,28,46,0.06)' }}>
                {/* Gold accent line inside card */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold to-transparent" style={{ opacity: 0.35 }} />
                {/* Subtle top border accent */}
                <div className="absolute top-0 left-0 w-24 h-0.5 bg-gold" />
                <AnalyticsBarChart
                  agentId={agentId}
                  data={supplyDemandData}
                  xKey="month"
                  bars={[
                    { dataKey: 'newListings', label: 'New Listings', color: '#0C1C2E' },
                    { dataKey: 'newPendings', label: 'New Pendings', color: '#Bfa67a' },
                  ]}
                  line={{ dataKey: 'newClosings', label: 'Closings', color: '#E07A5F' }}
                  height={360}
                />
              </div>
            ) : (
              <EmptyCard message="Supply & demand data will appear once listings are synced" />
            )}
          </div>
        </section>
      )}

      {/* ═══ AT A GLANCE DASHBOARD ═══ */}
      {(isActive('priceBands') || isActive('inventoryAge')) && (
        <section className="relative bg-navy text-white py-20 overflow-hidden">
          {/* Layered background */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-mid to-navy" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold/3 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

          <div className="relative mx-auto max-w-content-lg px-8 lg:px-20">
            {/* Section header */}
            <div className="mb-12">
              <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">Market Snapshot</span>
              <h2 className="text-3xl lg:text-4xl font-serif text-white mb-3">At a Glance</h2>
              <p className="text-sm text-white/40 max-w-2xl leading-relaxed">
                Key market indicators across the Greater Phoenix metro — price distribution, market equilibrium, and inventory freshness.
              </p>
              <div className="w-16 h-px bg-gradient-to-r from-gold to-transparent mt-6" />
            </div>

            {/* ── Row 1: Market Condition hero + Key Stats ── */}
            <div className="grid grid-cols-12 gap-5 mb-5">
              {/* Market Condition — hero tile */}
              <div className="col-span-12 lg:col-span-7">
                <DashboardCard>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                    <span className="text-[10px] uppercase tracking-widest text-gold/80 font-bold">Market Condition</span>
                  </div>
                  <div className="flex items-start gap-8">
                    {/* Left: Gauge visual */}
                    <div className="shrink-0">
                      <MarketGauge monthsOfSupply={kpis.monthsOfSupply} dark />
                    </div>
                    {/* Right: Context metrics */}
                    <div className="flex-1 pt-2">
                      {/* Segmented supply bar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Months of Supply</span>
                          <span className="text-lg font-serif text-white font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{kpis.monthsOfSupply}</span>
                        </div>
                        <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                          {/* Segmented zones */}
                          <div className="absolute inset-0 flex">
                            <div className="h-full" style={{ width: '25%', backgroundColor: 'rgba(224,122,95,0.15)' }} />
                            <div className="h-full" style={{ width: '25%', backgroundColor: 'rgba(191,166,122,0.12)' }} />
                            <div className="h-full" style={{ width: '50%', backgroundColor: 'rgba(52,211,153,0.1)' }} />
                          </div>
                          {/* Indicator dot */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white"
                            style={{
                              left: `${Math.min((kpis.monthsOfSupply / 12) * 100, 97)}%`,
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: kpis.monthsOfSupply < 3 ? '#E07A5F' : kpis.monthsOfSupply > 6 ? '#34d399' : '#BFA67A',
                              boxShadow: `0 0 12px ${kpis.monthsOfSupply < 3 ? 'rgba(224,122,95,0.5)' : kpis.monthsOfSupply > 6 ? 'rgba(52,211,153,0.5)' : 'rgba(191,166,122,0.5)'}`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Seller&apos;s</span>
                          <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Balanced</span>
                          <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Buyer&apos;s</span>
                        </div>
                      </div>
                      {/* Supporting KPIs */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                          <span className="block text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Absorption Rate</span>
                          <span className="text-lg font-serif text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{kpis.absorptionRate.toFixed(1)}%</span>
                        </div>
                        <div className="p-3 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                          <span className="block text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Close-to-List</span>
                          <span className="text-lg font-serif text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{kpis.avgCloseToListRatio}%</span>
                        </div>
                        <div className="p-3 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                          <span className="block text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Active Listings</span>
                          <span className="text-lg font-serif text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{kpis.activeInventory.toLocaleString()}</span>
                        </div>
                        <div className="p-3 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                          <span className="block text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Median DOM</span>
                          <span className="text-lg font-serif text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{kpis.medianDom}d</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DashboardCard>
              </div>

              {/* Key Stats — vertical strip */}
              <div className="col-span-12 lg:col-span-5">
                <DashboardCard>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                    <span className="text-[10px] uppercase tracking-widest text-gold/80 font-bold">Key Metrics</span>
                  </div>
                  {/* Stacked metric rows */}
                  <div className="space-y-0">
                    <DashboardMetricRow label="Median Price" value={formatPrice(kpis.medianPrice)} accent />
                    <DashboardMetricRow label="Price per SqFt" value={`$${Math.round(kpis.medianPricePerSqft)}`} />
                    <DashboardMetricRow label="Price Range" value={`${formatPrice(kpis.minPrice)} – ${formatPrice(kpis.maxPrice)}`} />
                    <DashboardMetricRow label="Days on Market" value={`${kpis.medianDom} days`} />
                    <DashboardMetricRow label="Close-to-List Ratio" value={`${kpis.avgCloseToListRatio}%`} />
                    <DashboardMetricRow label="Months of Supply" value={`${kpis.monthsOfSupply}`} />
                  </div>
                </DashboardCard>
              </div>
            </div>

            {/* ── Row 2: Price Distribution + Inventory Health ── */}
            <div className="grid grid-cols-12 gap-5">
              {/* Price Distribution */}
              {isActive('priceBands') && (
                <div className="col-span-12 lg:col-span-7">
                  <DashboardCard>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                        <span className="text-[10px] uppercase tracking-widest text-gold/80 font-bold">Price Distribution</span>
                      </div>
                      {peakBand && (
                        <span className="text-xs text-white/40">
                          Peak: <span className="text-white/70 font-semibold">{peakBand.band}</span>
                          <span className="text-white/25 ml-1">({peakBand.count.toLocaleString()})</span>
                        </span>
                      )}
                    </div>
                    {priceBandData.length > 0 ? (
                      <PriceBandHistogram agentId={agentId} data={priceBandData} dark />
                    ) : (
                      <p className="text-white/30 text-center py-8 font-serif">No data available</p>
                    )}
                  </DashboardCard>
                </div>
              )}

              {/* Inventory Health */}
              {isActive('inventoryAge') && (
                <div className={`col-span-12 ${isActive('priceBands') ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
                  <DashboardCard>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                        <span className="text-[10px] uppercase tracking-widest text-gold/80 font-bold">Inventory Health</span>
                      </div>
                      <span className="text-xs text-white/40">
                        <span className="text-white/70 font-semibold">{freshPct}%</span> fresh
                      </span>
                    </div>

                    {/* Stacked horizontal bar summary */}
                    {inventoryAge.length > 0 && (
                      <div className="mb-5">
                        <div className="h-2.5 rounded-full overflow-hidden flex" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                          {inventoryAge.filter(r => r.bandOrder > 0).map((row) => {
                            const pct = inventoryAgeTotal > 0 ? (row.listingCount / inventoryAgeTotal) * 100 : 0;
                            const barColor = row.bandOrder === 1 ? '#34d399' : row.bandOrder === 2 ? '#BFA67A' : '#E07A5F';
                            return (
                              <div
                                key={row.domBand}
                                className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                                style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: barColor }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {inventoryAge.length > 0 ? (
                      <div className="space-y-3">
                        {inventoryAge.filter(r => r.bandOrder > 0).map((row) => {
                          const pct = inventoryAgeTotal > 0 ? (row.listingCount / inventoryAgeTotal) * 100 : 0;
                          const barColor = row.bandOrder === 1 ? '#34d399' : row.bandOrder === 2 ? '#BFA67A' : '#E07A5F';
                          const statusLabel = row.bandOrder === 1 ? 'Fresh' : row.bandOrder === 2 ? 'Aging' : 'Stale';
                          return (
                            <div key={row.domBand} className="flex items-center gap-3 p-2.5 rounded-sm transition-colors duration-200" style={{ backgroundColor: `${barColor}08` }}>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}40` }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-sm font-serif text-white font-semibold truncate">{row.domBand}</span>
                                  <span className="text-[9px] uppercase tracking-widest font-bold shrink-0" style={{ color: barColor }}>{statusLabel}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-bold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  {row.listingCount.toLocaleString()}
                                </span>
                                <span className="text-xs text-white/30 font-bold w-10 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  {Math.round(pct)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {/* Footer total */}
                        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <span className="text-[9px] uppercase tracking-widest text-white/25 font-bold">Total Active Inventory</span>
                          <span className="text-sm font-serif text-gold font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {inventoryAgeTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/30 text-center py-8 font-serif">No data available</p>
                    )}
                  </DashboardCard>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Community Rankings Table */}
      {isActive('communityRankings') && (
        <section className="relative bg-navy text-white py-16 overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-b from-navy-mid to-navy" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-content-lg px-8 lg:px-20">
            <SectionHeader label="Community Rankings" title="Top Communities by Price per Square Foot" dark />
            {filteredCommunities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gold/20">
                      <th className="text-left py-4 px-3 text-[10px] uppercase tracking-widest text-gold/60 font-bold">#</th>
                      <th className="text-left py-4 px-3 text-[10px] uppercase tracking-widest text-gold/60 font-bold">Community</th>
                      <th className="text-right py-4 px-3 text-[10px] uppercase tracking-widest text-gold/60 font-bold">$/SqFt</th>
                      <th className="text-right py-4 px-3 text-[10px] uppercase tracking-widest text-gold/60 font-bold">Avg Close Price</th>
                      <th className="text-right py-4 px-3 text-[10px] uppercase tracking-widest text-gold/60 font-bold">Closed</th>
                      <th className="text-right py-4 px-3 text-[10px] uppercase tracking-widest text-gold/60 font-bold">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommunities.slice(0, 20).map((c, i) => (
                      <tr key={`${c.city}-${c.subdivisionName}`} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i < 3 ? 'bg-gold/5' : ''}`}>
                        <td className="py-3.5 px-3" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {i < 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-gold text-navy text-xs font-bold">{i + 1}</span>
                          ) : (
                            <span className="text-white/30 font-serif pl-1">{i + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <Link
                            href={`/market/community/${slugify(c.subdivisionName)}`}
                            className="font-serif hover:text-gold transition-colors"
                          >
                            {c.subdivisionName}
                          </Link>
                          <span className="text-[10px] text-white/20 ml-2">{c.postalCode}</span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-serif font-semibold text-gold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          ${Math.round(c.medianPricePerSqft)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-white/70" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatPrice(c.avgClosePrice)}
                        </td>
                        <td className="py-3.5 px-3 text-right text-white/50" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {c.closedCount}
                        </td>
                        <td className="py-3.5 px-3 text-right text-white/50" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {c.activeCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-white/30 text-center py-12 font-serif text-lg">
                {hasFilters ? 'No communities match the current filters' : 'Community data will appear once listings are synced'}
              </p>
            )}
          </div>
        </section>
      )}

      {/* @compliance ARMLS: Attribution required on all analytics displays */}
      <ArmlsAttribution
        agentId={agentId}
        periodStart={periodStart}
        periodEnd={periodEnd}
      />
    </main>
  );
}

// ── Sub-components ──────────────────────────────────

function SectionHeader({
  label,
  title,
  description,
  dark,
  compact,
}: {
  label: string;
  title: string;
  description?: string;
  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`mb-${description ? '8' : compact ? '6' : '10'}`}>
      <span className="text-label uppercase tracking-xl text-gold font-bold block mb-3">
        {label}
      </span>
      <h2 className={`${compact ? 'text-2xl' : 'text-3xl lg:text-4xl'} font-serif ${dark ? 'text-white' : 'text-navy'} ${description ? 'mb-3' : ''}`}>
        {title}
      </h2>
      {description && (
        <p className={`text-sm ${dark ? 'text-white/40' : 'text-navy/40'} max-w-2xl leading-relaxed`}>
          {description}
        </p>
      )}
    </div>
  );
}

function MarketGauge({ monthsOfSupply, dark }: { monthsOfSupply: number; dark?: boolean }) {
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
                stroke={dark ? '#FFFFFF' : '#0C1C2E'} strokeWidth="1" opacity="0.12"
              />
            );
          })}
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={dark ? '#FFFFFF' : '#0C1C2E'} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="5" fill={dark ? '#FFFFFF' : '#0C1C2E'} />
          <circle cx={cx} cy={cy} r="2.5" fill="#BFA67A" />
          <text x="18" y="98" fontSize="9" fill={dark ? 'rgba(255,255,255,0.35)' : 'rgba(12,28,46,0.35)'} fontWeight="700" textAnchor="start" fontFamily="sans-serif">SELLER</text>
          <text x="182" y="98" fontSize="9" fill={dark ? 'rgba(255,255,255,0.35)' : 'rgba(12,28,46,0.35)'} fontWeight="700" textAnchor="end" fontFamily="sans-serif">BUYER</text>
        </svg>
      </div>
      <span className={`text-lg font-serif font-semibold mt-2 ${isSeller ? 'text-accent' : isBuyer ? 'text-emerald-600' : 'text-gold'}`}>
        {label}
      </span>
      <span className={`text-xs ${dark ? 'text-white/40' : 'text-navy/40'} font-semibold mt-0.5`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {monthsOfSupply} months of supply
      </span>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="bg-white border border-navy/5 border-t-2 border-t-navy/10 p-12 text-center shadow-card">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-navy/5 flex items-center justify-center">
        <svg className="w-6 h-6 text-navy/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="font-serif text-lg text-navy/30">{message}</p>
    </div>
  );
}

// ── Dashboard primitives ──

function DashboardCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative p-6 rounded-sm h-full transition-shadow duration-300"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 20px 50px -12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      {children}
    </div>
  );
}

function DashboardMetricRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-xs text-white/40 font-semibold">{label}</span>
      <span
        className={`text-base font-serif font-semibold ${accent ? 'text-gold' : 'text-white'}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
    </div>
  );
}
