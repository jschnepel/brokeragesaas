'use client';

/**
 * Detail panel overlay for the H3 heatmap.
 * Layout: navy header → stats bar → 3-col viz row → rankings table
 * Two-level drill-down: Phoenix regions (cities) → Communities (subdivisions).
 * Ported from prototypes/yong — adapted for platform data model.
 */

import { useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { MapMetricSwitcher } from './MapMetricSwitcher';
import { METRIC_DEFS } from './types';
import type { HexCell, HeatmapMetricId, HeatmapMetricDef } from './types';

export interface HexDetailPanelProps {
  hoveredCell: HexCell | null;
  metric: HeatmapMetricId;
  metricDef: HeatmapMetricDef;
  min: number;
  max: number;
  cells: HexCell[];
  allCells: HexCell[];
  drillCity: string | null;
  onHoverCell?: (cell: HexCell | null) => void;
  onMetricChange?: (id: HeatmapMetricId) => void;
  onDrillToCity?: (city: string) => void;
  onDrillBack?: () => void;
}

// Only show non-VOW (public IDX) metrics in stats bar
const IDX_DEFS = METRIC_DEFS.filter(d => d.id !== 'saleToList');

// ── Inline grid styles (Tailwind v4 cross-package scanning workaround) ──

const STATS_GRID = { display: 'grid', gridTemplateColumns: `repeat(${IDX_DEFS.length}, 1fr)` } as const;
const RANKING_GRID = { display: 'grid', gridTemplateColumns: '24px 1fr 72px 48px', gap: 4 } as const;
const VIZ_GRID = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 } as const;

// ── Ranking entry ──

interface RankEntry {
  name: string;
  metricValue: number;
  dom: number;
  count: number;
  cellIds: string[];
}

function useRankings(cells: HexCell[], metric: HeatmapMetricId, groupBy: 'city' | 'subdivision'): RankEntry[] {
  return useMemo(() => {
    const grouped = new Map<string, { cells: HexCell[]; totalCount: number }>();
    for (const c of cells) {
      const key = groupBy === 'city' ? (c.city || 'Unknown') : c.neighborhoodName.split(',')[0].trim();
      if (!grouped.has(key)) grouped.set(key, { cells: [], totalCount: 0 });
      const entry = grouped.get(key)!;
      entry.cells.push(c);
      entry.totalCount += c.count;
    }

    const entries: RankEntry[] = [];
    for (const [name, { cells: groupCells, totalCount }] of grouped) {
      const n = groupCells.length;
      const avg = (fn: (c: HexCell) => number) => groupCells.reduce((s, c) => s + fn(c), 0) / n;
      entries.push({
        name,
        metricValue: metric === 'density' ? totalCount : avg(c => c.metrics[metric]),
        dom: avg(c => c.metrics.dom),
        count: totalCount,
        cellIds: groupCells.map(c => c.h3Index),
      });
    }

    return entries.sort((a, b) =>
      metric === 'dom' ? a.metricValue - b.metricValue : b.metricValue - a.metricValue
    );
  }, [cells, metric, groupBy]);
}

function useAggregates(cells: HexCell[]) {
  return useMemo(() => {
    const n = cells.length || 1;
    const averages: Record<string, number> = {};
    const maxes: Record<string, number> = {};
    for (const def of IDX_DEFS) {
      const vals = cells.map(c => c.metrics[def.id]);
      averages[def.id] = vals.reduce((s, v) => s + v, 0) / n;
      maxes[def.id] = Math.max(...vals, 1);
    }
    return { averages, maxes };
  }, [cells]);
}

// ═══════════════════════════════════════════════════════
// VIZ 1 — SCATTER: Price vs DOM
// ═══════════════════════════════════════════════════════

function ScatterPlot({ cell, cells, onHoverCell }: {
  cell: HexCell | null;
  cells: HexCell[];
  onHoverCell?: (cell: HexCell | null) => void;
}) {
  const w = 200, h = 160;
  const pad = { top: 8, right: 8, bottom: 22, left: 32 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const { priceRange, domRange } = useMemo(() => {
    const prices = cells.map(c => c.metrics.price);
    const doms = cells.map(c => c.metrics.dom);
    return {
      priceRange: { min: Math.min(...prices, 0), max: Math.max(...prices, 1) },
      domRange: { min: Math.min(...doms, 0), max: Math.max(...doms, 1) },
    };
  }, [cells]);

  const toX = (dom: number) => pad.left + ((dom - domRange.min) / (domRange.max - domRange.min || 1)) * plotW;
  const toY = (price: number) => pad.top + plotH - ((price - priceRange.min) / (priceRange.max - priceRange.min || 1)) * plotH;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x={pad.left} y={pad.top} width={plotW / 2} height={plotH / 2} fill="#10B981" opacity={0.03} />
      <rect x={pad.left + plotW / 2} y={pad.top + plotH / 2} width={plotW / 2} height={plotH / 2} fill="#EF4444" opacity={0.03} />

      {[0.25, 0.5, 0.75].map(pct => (
        <g key={`grid-${pct}`}>
          <line x1={pad.left} y1={pad.top + plotH * (1 - pct)} x2={pad.left + plotW} y2={pad.top + plotH * (1 - pct)} stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1={pad.left + plotW * pct} y1={pad.top} x2={pad.left + plotW * pct} y2={pad.top + plotH} stroke="#e5e7eb" strokeWidth="0.5" />
        </g>
      ))}
      <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />

      {cells.map(c => {
        if (cell?.h3Index === c.h3Index) return null;
        const cx = toX(c.metrics.dom);
        const cy = toY(c.metrics.price);
        return (
          <g key={c.h3Index}>
            {onHoverCell && (
              <circle cx={cx} cy={cy} r={8} fill="transparent"
                onMouseEnter={() => onHoverCell(c)} onMouseLeave={() => onHoverCell(null)} />
            )}
            <circle cx={cx} cy={cy} r={cell ? 2.5 : 3}
              fill="#5B8DB8" opacity={cell ? 0.15 : 0.45}
              stroke="#5B8DB8" strokeWidth={0.5} strokeOpacity={cell ? 0.08 : 0.2}
              style={{ pointerEvents: 'none' }} />
          </g>
        );
      })}

      {cell && (() => {
        const px = toX(cell.metrics.dom);
        const py = toY(cell.metrics.price);
        return (
          <>
            <line x1={px} y1={pad.top} x2={px} y2={pad.top + plotH} stroke="#Bfa67a" strokeWidth="0.8" strokeDasharray="3 2" opacity={0.4} />
            <line x1={pad.left} y1={py} x2={pad.left + plotW} y2={py} stroke="#Bfa67a" strokeWidth="0.8" strokeDasharray="3 2" opacity={0.4} />
            <circle cx={px} cy={py} r={6} fill="#Bfa67a" opacity={0.1} />
            <circle cx={px} cy={py} r={4} fill="#Bfa67a" stroke="white" strokeWidth="1.5" />
          </>
        );
      })()}

      <text x={pad.left - 3} y={pad.top + 5} textAnchor="end" fontSize="6" fill="#9ca3af" fontFamily="serif">
        ${(priceRange.max / 1e6).toFixed(1)}M
      </text>
      <text x={pad.left - 3} y={pad.top + plotH} textAnchor="end" fontSize="6" fill="#9ca3af" fontFamily="serif">
        ${(priceRange.min / 1e6).toFixed(1)}M
      </text>
      <text x={pad.left} y={h - 6} textAnchor="start" fontSize="6" fill="#9ca3af" fontFamily="serif">{Math.round(domRange.min)}d</text>
      <text x={pad.left + plotW} y={h - 6} textAnchor="end" fontSize="6" fill="#9ca3af" fontFamily="serif">{Math.round(domRange.max)}d</text>
      <text x={pad.left + plotW / 2} y={h - 1} textAnchor="middle" fontSize="6" fill="#9ca3af" fontWeight="bold" letterSpacing="0.1em">
        DAYS ON MARKET
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// VIZ 2 — DISTRIBUTION: Active metric histogram
// ═══════════════════════════════════════════════════════

function DistributionChart({ cell, cells, metric, metricDef }: {
  cell: HexCell | null;
  cells: HexCell[];
  metric: HeatmapMetricId;
  metricDef: HeatmapMetricDef;
}) {
  const buckets = useMemo(() => {
    if (cells.length === 0) return [];
    const vals = cells.map(c => c.metrics[metric]);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const range = hi - lo || 1;
    const numBuckets = 8;
    const bucketWidth = range / numBuckets;

    const counts = Array.from({ length: numBuckets }, () => 0);
    const bucketCells: HexCell[][] = Array.from({ length: numBuckets }, () => []);

    for (const c of cells) {
      const v = c.metrics[metric];
      let idx = Math.floor((v - lo) / bucketWidth);
      if (idx >= numBuckets) idx = numBuckets - 1;
      counts[idx]++;
      bucketCells[idx].push(c);
    }

    const maxCount = Math.max(...counts, 1);
    return counts.map((count, i) => ({
      count,
      pct: count / maxCount,
      lo: lo + i * bucketWidth,
      hi: lo + (i + 1) * bucketWidth,
      hasHovered: cell ? bucketCells[i].some(c => c.h3Index === cell.h3Index) : false,
    }));
  }, [cells, metric, cell]);

  const w = 200, h = 160;
  const pad = { top: 8, right: 8, bottom: 22, left: 8 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const barW = plotW / (buckets.length || 1);
  const gap = 2;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {buckets.map((b, i) => {
        const barH = Math.max(2, b.pct * plotH);
        const x = pad.left + i * barW + gap / 2;
        const y = pad.top + plotH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW - gap} height={barH} rx={1}
              fill={b.hasHovered ? '#Bfa67a' : '#5B8DB8'}
              opacity={b.hasHovered ? 0.9 : 0.35} />
            {b.count > 0 && (
              <text x={x + (barW - gap) / 2} y={y - 3} textAnchor="middle" fontSize="6"
                fill={b.hasHovered ? '#Bfa67a' : '#9ca3af'}
                fontWeight={b.hasHovered ? 'bold' : 'normal'}>
                {b.count}
              </text>
            )}
          </g>
        );
      })}
      <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke="#e5e7eb" strokeWidth="0.5" />
      {buckets.length > 0 && (
        <>
          <text x={pad.left} y={h - 6} textAnchor="start" fontSize="6" fill="#9ca3af" fontFamily="serif">{metricDef.format(buckets[0].lo)}</text>
          <text x={pad.left + plotW} y={h - 6} textAnchor="end" fontSize="6" fill="#9ca3af" fontFamily="serif">{metricDef.format(buckets[buckets.length - 1].hi)}</text>
        </>
      )}
      <text x={pad.left + plotW / 2} y={h - 1} textAnchor="middle" fontSize="6" fill="#9ca3af" fontWeight="bold" letterSpacing="0.1em">
        DISTRIBUTION
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// VIZ 3 — COMPARISON: Hovered cell vs market average
// ═══════════════════════════════════════════════════════

function MetricComparison({ cell, averages, maxes }: {
  cell: HexCell | null;
  averages: Record<string, number>;
  maxes: Record<string, number>;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ justifyContent: 'space-evenly' }}>
      {IDX_DEFS.map(def => {
        const avg = averages[def.id];
        const val = cell ? cell.metrics[def.id] : avg;
        const ceiling = maxes[def.id] || 1;
        const avgPct = (avg / ceiling) * 100;
        const valPct = (val / ceiling) * 100;
        const delta = avg > 0 ? ((val - avg) / avg) * 100 : 0;
        const showDelta = cell && Math.abs(delta) >= 0.5;

        return (
          <div key={def.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#9ca3af' }}>{def.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 11, fontFamily: 'serif', color: '#0C1C2E', fontVariantNumeric: 'tabular-nums' }}>{def.format(val)}</span>
                {showDelta && (
                  <span style={{ fontSize: 8, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: delta > 0 ? '#10B981' : '#f87171' }}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div style={{ position: 'relative', height: 2, backgroundColor: '#f3f4f6', borderRadius: 9999, overflow: 'hidden', marginTop: 2 }}>
              <div style={{ position: 'absolute', top: 0, height: '100%', width: 2, backgroundColor: '#d1d5db', zIndex: 1, left: `${Math.min(avgPct, 100)}%` }} />
              <div style={{ height: '100%', borderRadius: 9999, transition: 'all 200ms', width: `${Math.min(valPct, 100)}%`, backgroundColor: cell ? '#Bfa67a' : 'rgba(91,141,184,0.4)' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PANEL
// ═══════════════════════════════════════════════════════

export function HexDetailPanel({
  hoveredCell,
  metric,
  metricDef,
  cells,
  allCells,
  drillCity,
  onHoverCell,
  onMetricChange,
  onDrillToCity,
  onDrillBack,
}: HexDetailPanelProps) {
  const { averages, maxes } = useAggregates(cells);
  const regionRanked = useRankings(allCells, metric, 'city');
  const communityRanked = useRankings(cells, metric, 'subdivision');
  const ranked = drillCity ? communityRanked : regionRanked;

  const cellName = hoveredCell?.neighborhoodName.split(',')[0].trim() ?? null;
  const hoveredRank = hoveredCell
    ? ranked.findIndex(n => n.cellIds.includes(hoveredCell.h3Index)) + 1
    : 0;
  const nCount = ranked.length;
  const percentile = hoveredCell && nCount > 1
    ? Math.round(((nCount - hoveredRank) / (nCount - 1)) * 100)
    : 0;

  const top10 = ranked.slice(0, 10);

  return (
    <div className="flex flex-col h-full">

      {/* ── Navy Header ── */}
      <div className="bg-navy px-3 pt-2 pb-2 shrink-0" style={{ minHeight: 72 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {drillCity && onDrillBack && (
              <button onClick={onDrillBack} className="flex items-center text-gold/70 hover:text-gold transition-colors">
                <ChevronLeft size={14} />
              </button>
            )}
            <span className="text-gold font-bold" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              {drillCity ? drillCity : hoveredCell ? 'Hex Cell' : 'Market Overview'}
            </span>
          </div>
          {onMetricChange && (
            <MapMetricSwitcher current={metric} onChange={onMetricChange} />
          )}
        </div>
        <h2 className="text-xl font-serif text-white tracking-wide">
          {drillCity ? (cellName ?? 'Communities') : (cellName ?? 'All Areas')}
        </h2>
        <div className="flex items-center gap-4 mt-2 text-white/70 h-4" style={{ fontSize: 11 }}>
          {hoveredCell ? (
            <>
              <span><span className="font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{hoveredCell.count}</span> listings</span>
              <div className="w-px h-3 bg-white/20" />
              <span>Rank <span className="font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{hoveredRank}</span> of {nCount}</span>
              <div className="w-px h-3 bg-white/20" />
              <span className="font-semibold text-gold" style={{ fontVariantNumeric: 'tabular-nums' }}>{percentile}th pctl</span>
            </>
          ) : (
            <span className="text-white/30 tracking-widest" style={{ fontSize: 10, textTransform: 'uppercase' }}>
              {drillCity ? 'Hover a cell to explore' : 'Select a region to explore'}
            </span>
          )}
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="shrink-0 bg-navy border-t border-white/10 overflow-hidden" style={STATS_GRID}>
        {IDX_DEFS.map((def, i) => {
          const val = hoveredCell ? hoveredCell.metrics[def.id] : averages[def.id];
          const isActive = def.id === metric;
          return (
            <div key={def.id}
              className={`px-2 py-2 text-center overflow-hidden ${i > 0 ? 'border-l border-white/10' : ''}`}
              style={isActive ? { borderBottom: '2px solid #Bfa67a' } : { borderBottom: '2px solid transparent' }}>
              <p className={`font-bold mb-1 truncate ${isActive ? 'text-gold' : 'text-white/40'}`} style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{def.label}</p>
              <p className="text-base font-serif text-white truncate" style={{ fontVariantNumeric: 'tabular-nums' }}>{def.format(val)}</p>
            </div>
          );
        })}
      </div>

      {/* ── Bento Content ── */}
      <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>

        {/* ── 3-Column Visualization Row ── */}
        <div className="px-3 py-1 overflow-hidden" style={{ ...VIZ_GRID, flex: '2 1 0%', minHeight: 0 }}>
          <div className="bg-white border border-gray-100 shadow-sm rounded min-w-0 overflow-hidden flex flex-col" style={{ padding: '6px 8px' }}>
            <h4 style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', fontWeight: 700, marginBottom: 2, flexShrink: 0 }}>Price vs DOM</h4>
            <div className="flex-1" style={{ minHeight: 0 }}><ScatterPlot cell={hoveredCell} cells={cells} onHoverCell={onHoverCell} /></div>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded min-w-0 overflow-hidden flex flex-col" style={{ padding: '6px 8px' }}>
            <h4 style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', fontWeight: 700, marginBottom: 2, flexShrink: 0 }}>{metricDef.label}</h4>
            <div className="flex-1" style={{ minHeight: 0 }}><DistributionChart cell={hoveredCell} cells={cells} metric={metric} metricDef={metricDef} /></div>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded min-w-0 overflow-hidden flex flex-col" style={{ padding: '6px 8px' }}>
            <h4 style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', fontWeight: 700, marginBottom: 2, flexShrink: 0 }}>{hoveredCell ? 'vs Market' : 'Market Avg'}</h4>
            <div className="flex-1" style={{ minHeight: 0 }}><MetricComparison cell={hoveredCell} averages={averages} maxes={maxes} /></div>
          </div>
        </div>

        {/* ── Rankings Table ── */}
        <div className="px-3 pb-3" style={{ flex: '3 1 0%', minHeight: 0 }}>
          <div className="bg-white border border-gray-100 shadow-sm rounded flex flex-col overflow-hidden" style={{ height: '100%' }}>

            {/* Drill-down breadcrumb */}
            {drillCity && (
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 shrink-0">
                <span className="text-navy/40 font-bold" style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Communities</span>
                <button onClick={onDrillBack} className="text-gold/70 hover:text-gold font-bold transition-colors" style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  All Regions
                </button>
              </div>
            )}

            <div className="px-3 py-2 border-b border-gray-100 shrink-0" style={RANKING_GRID}>
              {['#', drillCity ? 'Community' : 'Region', metricDef.label, 'Avg DOM'].map((label, i) => (
                <span key={label} className="text-gray-400 font-bold" style={{ fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: i >= 2 ? 'right' : undefined }}>{label}</span>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              {top10.map((entry, i) => {
                const isHovered = hoveredCell ? entry.cellIds.includes(hoveredCell.h3Index) : false;
                const representativeCell = cells.find(c => entry.cellIds.includes(c.h3Index));
                const canDrill = !drillCity && onDrillToCity;

                return (
                  <div key={entry.name} className="items-center px-3 transition-colors duration-150"
                    style={{
                      ...RANKING_GRID,
                      height: 30,
                      alignItems: 'center',
                      backgroundColor: isHovered ? '#0C1C2E' : undefined,
                      borderLeft: isHovered ? '3px solid #Bfa67a' : '3px solid transparent',
                      cursor: canDrill ? 'pointer' : undefined,
                    }}
                    onMouseEnter={() => representativeCell && onHoverCell?.(representativeCell)}
                    onMouseLeave={() => onHoverCell?.(null)}
                    onClick={() => canDrill && onDrillToCity(entry.name)}>
                    <span className="font-serif text-gold" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                    <span className="font-serif truncate" style={{ fontSize: 13, minWidth: 0, color: isHovered ? '#ffffff' : '#0C1C2E' }}>{entry.name}</span>
                    <span className="font-serif" style={{ fontSize: 13, textAlign: 'right', color: isHovered ? '#ffffff' : '#0C1C2E', fontVariantNumeric: 'tabular-nums' }}>{metricDef.format(entry.metricValue)}</span>
                    <span style={{ fontSize: 11, textAlign: 'right', color: isHovered ? 'rgba(255,255,255,0.6)' : '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{Math.round(entry.dom)}d</span>
                  </div>
                );
              })}
            </div>

            {/* Hovered entry if outside top 10 */}
            {hoveredCell && hoveredRank > 10 && (() => {
              const entry = ranked[hoveredRank - 1];
              if (!entry) return null;
              return (
                <div className="items-center px-3 shrink-0 border-t border-gray-200"
                  style={{ ...RANKING_GRID, height: 30, alignItems: 'center', backgroundColor: '#0C1C2E', borderLeft: '3px solid #Bfa67a' }}>
                  <span className="font-serif text-gold" style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{hoveredRank}</span>
                  <span className="font-serif text-white truncate" style={{ fontSize: 13 }}>{entry.name}</span>
                  <span className="font-serif text-white" style={{ fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{metricDef.format(entry.metricValue)}</span>
                  <span className="text-white/60" style={{ fontSize: 11, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(entry.dom)}d</span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
