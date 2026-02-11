/**
 * Right-side detail panel for the H3 heatmap — bento box layout.
 * Design language lifted directly from /map (InteractiveMap).
 *
 * All sections use fixed heights to prevent layout shift on hover.
 * Numeric values use tabular-nums for consistent widths.
 *
 * Layout: navy header → stats bar → 3-col viz row → rankings table
 */

import { useMemo, useState } from 'react';
import { MapPin, BarChart3 } from 'lucide-react';
import {
  METRIC_DEFS,
  type HexCell,
  type HexCellMetrics,
  type HeatmapMetricId,
  type HeatmapMetricDef,
} from '../../data/h3HeatmapData';
import { NEIGHBORHOODS } from '../../data/neighborhoods';

interface HexDetailPanelProps {
  hoveredCell: HexCell | null;
  metric: HeatmapMetricId;
  metricDef: HeatmapMetricDef;
  min: number;
  max: number;
  cells: HexCell[];
  /** Bubble hover from panel back to map */
  onHoverCell?: (cell: HexCell | null) => void;
  /** Navigate drill-down from rankings click (undefined at community level) */
  onDrilldown?: (neighborhoodName: string) => void;
}

const idxDefs = METRIC_DEFS.filter(m => !m.isVow);

// ── Neighborhood-level aggregate for rankings ────────

interface NeighborhoodEntry {
  name: string;
  metrics: HexCellMetrics;
  count: number;
  /** h3 indices that belong to this neighborhood */
  cellIds: string[];
}

function useNeighborhoodRankings(cells: HexCell[]) {
  return useMemo(() => {
    // Group cells by primary neighborhood name
    const grouped = new Map<string, { cells: HexCell[]; totalCount: number }>();
    for (const c of cells) {
      const name = c.neighborhoodName.split(',')[0].trim();
      if (!grouped.has(name)) grouped.set(name, { cells: [], totalCount: 0 });
      const entry = grouped.get(name)!;
      entry.cells.push(c);
      entry.totalCount += c.count;
    }

    // Average metrics per neighborhood
    const entries: NeighborhoodEntry[] = [];
    for (const [name, { cells: groupCells, totalCount }] of grouped) {
      const n = groupCells.length;
      const avg = (fn: (c: HexCell) => number) =>
        groupCells.reduce((s, c) => s + fn(c), 0) / n;

      entries.push({
        name,
        metrics: {
          ppsf: avg(c => c.metrics.ppsf),
          dom: avg(c => c.metrics.dom),
          density: totalCount,
          price: avg(c => c.metrics.price),
          appreciation: avg(c => c.metrics.appreciation),
          saleToList: avg(c => c.metrics.saleToList),
          cashBuyer: avg(c => c.metrics.cashBuyer),
        },
        count: totalCount,
        cellIds: groupCells.map(c => c.h3Index),
      });
    }
    return entries;
  }, [cells]);
}

// ── Precomputed stats ────────────────────────────────

function useAggregates(cells: HexCell[]) {
  return useMemo(() => {
    const n = cells.length || 1;
    const averages: Record<string, number> = {};
    const maxes: Record<string, number> = {};
    const mins: Record<string, number> = {};

    for (const def of idxDefs) {
      const vals = cells.map(c => c.metrics[def.id]);
      averages[def.id] = vals.reduce((s, v) => s + v, 0) / n;
      maxes[def.id] = Math.max(...vals, 1);
      mins[def.id] = vals.length > 0 ? Math.min(...vals) : 0;
    }
    return { averages, maxes, mins, count: cells.length };
  }, [cells]);
}

// ═══════════════════════════════════════════════════════
// VIZ 1 — SCATTER: Price vs DOM
// ═══════════════════════════════════════════════════════

const ScatterPlot: React.FC<{
  cell: HexCell | null;
  cells: HexCell[];
  onHoverCell?: (cell: HexCell | null) => void;
}> = ({ cell, cells, onHoverCell }) => {
  const w = 200;
  const h = 160;
  const pad = { top: 8, right: 8, bottom: 22, left: 32 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const { priceRange, domRange } = useMemo(() => {
    const prices = cells.map(c => c.metrics.price);
    const doms = cells.map(c => c.metrics.dom);
    return {
      priceRange: { min: Math.min(...prices), max: Math.max(...prices) || 1 },
      domRange: { min: Math.min(...doms), max: Math.max(...doms) || 1 },
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
          <g key={c.h3Index} style={{ cursor: onHoverCell ? 'pointer' : undefined }}>
            {/* Invisible larger hit target */}
            {onHoverCell && (
              <circle
                cx={cx} cy={cy} r={8}
                fill="transparent"
                onMouseEnter={() => onHoverCell(c)}
                onMouseLeave={() => onHoverCell(null)}
              />
            )}
            <circle
              cx={cx} cy={cy}
              r={cell ? 2.5 : 3}
              fill="#5B8DB8"
              opacity={cell ? 0.15 : 0.45}
              stroke="#5B8DB8"
              strokeWidth={0.5}
              strokeOpacity={cell ? 0.08 : 0.2}
              style={{ pointerEvents: 'none' }}
            />
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
};

// ═══════════════════════════════════════════════════════
// VIZ 2 — DISTRIBUTION: Active metric histogram
// ═══════════════════════════════════════════════════════

const DistributionChart: React.FC<{
  cell: HexCell | null;
  cells: HexCell[];
  metric: HeatmapMetricId;
  metricDef: HeatmapMetricDef;
}> = ({ cell, cells, metric, metricDef }) => {
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
      cells: bucketCells[i],
      hasHovered: cell ? bucketCells[i].some(c => c.h3Index === cell.h3Index) : false,
    }));
  }, [cells, metric, cell]);

  const w = 200;
  const h = 160;
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
            <rect
              x={x} y={y}
              width={barW - gap} height={barH}
              rx={1}
              fill={b.hasHovered ? '#Bfa67a' : '#5B8DB8'}
              opacity={b.hasHovered ? 0.9 : 0.35}
            />
            {b.count > 0 && (
              <text
                x={x + (barW - gap) / 2} y={y - 3}
                textAnchor="middle" fontSize="6"
                fill={b.hasHovered ? '#Bfa67a' : '#9ca3af'}
                fontWeight={b.hasHovered ? 'bold' : 'normal'}
              >
                {b.count}
              </text>
            )}
          </g>
        );
      })}

      <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke="#e5e7eb" strokeWidth="0.5" />

      {buckets.length > 0 && (
        <>
          <text x={pad.left} y={h - 6} textAnchor="start" fontSize="6" fill="#9ca3af" fontFamily="serif">
            {metricDef.format(buckets[0].lo)}
          </text>
          <text x={pad.left + plotW} y={h - 6} textAnchor="end" fontSize="6" fill="#9ca3af" fontFamily="serif">
            {metricDef.format(buckets[buckets.length - 1].hi)}
          </text>
        </>
      )}
      <text x={pad.left + plotW / 2} y={h - 1} textAnchor="middle" fontSize="6" fill="#9ca3af" fontWeight="bold" letterSpacing="0.1em">
        DISTRIBUTION
      </text>
    </svg>
  );
};

// ═══════════════════════════════════════════════════════
// VIZ 3 — COMPARISON: Hovered cell vs market average
// ═══════════════════════════════════════════════════════

const MetricComparison: React.FC<{
  cell: HexCell | null;
  averages: Record<string, number>;
  maxes: Record<string, number>;
}> = ({ cell, averages, maxes }) => {
  return (
    <div className="flex flex-col justify-between h-full py-1">
      {idxDefs.map(def => {
        const avg = averages[def.id];
        const val = cell ? cell.metrics[def.id] : avg;
        const ceiling = maxes[def.id] || 1;
        const avgPct = (avg / ceiling) * 100;
        const valPct = (val / ceiling) * 100;
        const delta = avg > 0 ? ((val - avg) / avg) * 100 : 0;
        const showDelta = cell && Math.abs(delta) >= 0.5;

        return (
          <div key={def.id} className="mb-1.5 last:mb-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[7px] uppercase tracking-[0.12em] font-bold text-gray-400">
                {def.label}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-serif text-[#0C1C2E]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {def.format(val)}
                </span>
                {showDelta && (
                  <span className={`text-[7px] font-bold ${delta > 0 ? 'text-emerald-500' : 'text-red-400'}`}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-[3px] bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 h-full w-[2px] bg-gray-300 z-10"
                style={{ left: `${Math.min(avgPct, 100)}%` }}
              />
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${Math.min(valPct, 100)}%`,
                  backgroundColor: cell ? '#Bfa67a' : 'rgba(91,141,184,0.4)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// COMMUNITY — Tabbed panel: Profile / Stats Summary
// ═══════════════════════════════════════════════════════

type CommunityTab = 'profile' | 'stats';

const CommunityPanel: React.FC<{
  cells: HexCell[];
  metric: HeatmapMetricId;
  metricDef: HeatmapMetricDef;
  hoveredCell: HexCell | null;
  communityName: string;
}> = ({ cells, metric, metricDef, hoveredCell, communityName }) => {
  const [tab, setTab] = useState<CommunityTab>('profile');

  // Resolve neighborhood from community name
  const neighborhood = useMemo(() => {
    const name = communityName.toLowerCase().replace(/\s+/g, '-');
    return NEIGHBORHOODS.find(n => n.id === name || n.name === communityName);
  }, [communityName]);

  // Stats summary across all IDX metrics
  const statsSummary = useMemo(() => {
    if (cells.length === 0) return [];
    return idxDefs.map(def => {
      const vals = cells.map(c => c.metrics[def.id]);
      const sorted = [...vals].sort((a, b) => a - b);
      const sum = vals.reduce((s, v) => s + v, 0);
      const avg = sum / vals.length;
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const median = sorted[Math.floor(sorted.length / 2)];
      const range = max - min;
      const hovVal = hoveredCell ? hoveredCell.metrics[def.id] : null;
      return { def, avg, min, max, median, range, count: vals.length, hovVal };
    });
  }, [cells, hoveredCell]);

  const tabs: { id: CommunityTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <MapPin size={10} /> },
    { id: 'stats', label: 'Summary', icon: <BarChart3 size={10} /> },
  ];

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded h-full flex flex-col overflow-hidden">

      {/* Tab bar */}
      <div className="flex border-b border-gray-100 shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[8px] uppercase tracking-widest font-bold transition-colors ${
              tab === t.id
                ? 'text-[#Bfa67a] border-b-2 border-[#Bfa67a] bg-[#Bfa67a]/5'
                : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="p-3 space-y-3">
            {neighborhood ? (
              <>
                {/* Tagline */}
                <p className="text-sm font-serif text-[#0C1C2E] leading-snug">
                  {neighborhood.tagline}
                </p>

                {/* Description */}
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {neighborhood.description}
                </p>

                {/* Features */}
                {neighborhood.features.length > 0 && (
                  <div>
                    <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold block mb-1.5">
                      Features
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {neighborhood.features.map(f => (
                        <span key={f} className="text-[9px] font-serif px-2 py-0.5 bg-[#Bfa67a]/10 text-[#0C1C2E] border border-[#Bfa67a]/20 rounded-sm">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {neighborhood.amenities.length > 0 && (
                  <div>
                    <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold block mb-1.5">
                      Amenities
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {neighborhood.amenities.map(a => (
                        <span key={a} className="text-[9px] font-serif px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-100 rounded-sm">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick stats from neighborhood data */}
                <div>
                  <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold block mb-1.5">
                    Market Snapshot
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Price Range', value: neighborhood.stats.priceRange },
                      { label: 'Active Listings', value: String(neighborhood.stats.inventory) },
                      { label: 'YoY Trend', value: neighborhood.stats.trend },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <span className="text-[7px] uppercase tracking-widest text-gray-400 block">
                          {s.label}
                        </span>
                        <span className="text-xs font-serif text-[#0C1C2E] font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-gray-400 italic">
                Community profile not available.
              </p>
            )}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div className="p-0">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_56px_56px_56px_56px] gap-0 px-3 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
              <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold">Metric</span>
              <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold text-right">Min</span>
              <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold text-right">Avg</span>
              <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold text-right">Med</span>
              <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold text-right">Max</span>
            </div>

            {/* Rows */}
            {statsSummary.map(row => {
              const isActive = row.def.id === metric;
              return (
                <div
                  key={row.def.id}
                  className="grid grid-cols-[1fr_56px_56px_56px_56px] gap-0 items-center px-3 border-b border-gray-50"
                  style={{
                    height: 36,
                    borderLeft: isActive ? '3px solid #Bfa67a' : '3px solid transparent',
                    backgroundColor: isActive ? 'rgba(191,166,122,0.04)' : undefined,
                  }}
                >
                  <span className={`text-[9px] uppercase tracking-widest font-bold ${isActive ? 'text-[#Bfa67a]' : 'text-gray-400'}`}>
                    {row.def.label}
                  </span>
                  <span className="text-[10px] font-serif text-gray-500 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.def.format(row.min)}
                  </span>
                  <span className="text-[10px] font-serif text-[#0C1C2E] text-right font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.def.format(row.avg)}
                  </span>
                  <span className="text-[10px] font-serif text-gray-500 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.def.format(row.median)}
                  </span>
                  <span className="text-[10px] font-serif text-gray-500 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.def.format(row.max)}
                  </span>
                </div>
              );
            })}

            {/* Hovered cell row (if hovering) */}
            {hoveredCell && (
              <>
                <div className="px-3 py-1.5 bg-[#0C1C2E]">
                  <span className="text-[7px] uppercase tracking-widest text-[#Bfa67a] font-bold">
                    Hovered Cell
                  </span>
                </div>
                {statsSummary.map(row => {
                  const val = hoveredCell.metrics[row.def.id];
                  const delta = row.avg > 0 ? ((val - row.avg) / row.avg) * 100 : 0;
                  const isActive = row.def.id === metric;
                  return (
                    <div
                      key={`hov-${row.def.id}`}
                      className="grid grid-cols-[1fr_72px_72px] gap-0 items-center px-3 bg-[#0C1C2E]"
                      style={{
                        height: 32,
                        borderLeft: isActive ? '3px solid #Bfa67a' : '3px solid transparent',
                      }}
                    >
                      <span className={`text-[9px] uppercase tracking-widest font-bold ${isActive ? 'text-[#Bfa67a]' : 'text-white/40'}`}>
                        {row.def.label}
                      </span>
                      <span className="text-[10px] font-serif text-white text-right font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.def.format(val)}
                      </span>
                      <span
                        className={`text-[9px] font-bold text-right ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-white/40'}`}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs avg
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Panel ───────────────────────────────────────

const HexDetailPanel: React.FC<HexDetailPanelProps> = ({
  hoveredCell,
  metric,
  metricDef,
  min,
  max,
  cells,
  onHoverCell,
  onDrilldown,
}) => {
  const { averages, maxes } = useAggregates(cells);
  const neighborhoods = useNeighborhoodRankings(cells);

  const cellName = hoveredCell
    ? hoveredCell.neighborhoodName.split(',')[0].trim()
    : null;

  // Sort neighborhoods by active metric
  const rankedNeighborhoods = useMemo(() => {
    return [...neighborhoods].sort((a, b) =>
      metric === 'dom'
        ? a.metrics[metric] - b.metrics[metric]
        : b.metrics[metric] - a.metrics[metric]
    );
  }, [neighborhoods, metric]);

  // Hovered cell's neighborhood rank
  const hoveredNeighborhood = hoveredCell
    ? rankedNeighborhoods.findIndex(n => n.cellIds.includes(hoveredCell.h3Index))
    : -1;
  const rank = hoveredNeighborhood >= 0 ? hoveredNeighborhood + 1 : 0;
  const nCount = rankedNeighborhoods.length;
  const percentile = hoveredCell && nCount > 1
    ? Math.round(((nCount - rank) / (nCount - 1)) * 100)
    : 0;

  // Top 10 neighborhoods — stable list, highlight hovered
  const top10 = rankedNeighborhoods.slice(0, 10);
  const topVal = top10[0]?.metrics[metric] ?? 1;

  return (
    <div className="flex flex-col h-full bg-gray-50/50">

      {/* ── Navy Header (fixed height — always renders stats row) ── */}
      <div className="bg-[#0C1C2E] p-4 shrink-0" style={{ minHeight: 88 }}>
        <div className="flex items-center gap-2 text-[#Bfa67a] text-[9px] uppercase tracking-[0.2em] font-bold mb-1">
          {hoveredCell ? 'Hex Cell' : 'Market Overview'}
        </div>
        <h2 className="text-xl font-serif text-white tracking-wide">
          {cellName ?? 'All Areas'}
        </h2>
        {/* Always-visible stats row — prevents height shift */}
        <div className="flex items-center gap-4 mt-2 text-[11px] text-white/70 h-4">
          {hoveredCell ? (
            <>
              <span>
                <span className="font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{hoveredCell.count}</span> listings
              </span>
              <div className="w-px h-3 bg-white/20" />
              <span>
                Rank <span className="font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{rank}</span> of {nCount}
              </span>
              <div className="w-px h-3 bg-white/20" />
              <span className="font-semibold text-[#Bfa67a]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {percentile}th pctl
              </span>
            </>
          ) : (
            <span className="text-white/30 text-[10px] uppercase tracking-widest">
              Hover a cell to explore
            </span>
          )}
        </div>
      </div>

      {/* ── Stats Bar (fixed height) ── */}
      <div className="grid grid-cols-4 shrink-0 bg-[#0C1C2E] border-t border-white/10">
        {idxDefs.map((def, i) => {
          const val = hoveredCell ? hoveredCell.metrics[def.id] : averages[def.id];
          const isActive = def.id === metric;
          return (
            <div
              key={def.id}
              className={`p-3 text-center ${i > 0 ? 'border-l border-white/10' : ''}`}
              style={isActive ? { borderBottom: '2px solid #Bfa67a' } : { borderBottom: '2px solid transparent' }}
            >
              <p className={`text-[8px] uppercase tracking-[0.15em] font-bold mb-1 ${isActive ? 'text-[#Bfa67a]' : 'text-white/40'}`}>
                {def.label}
              </p>
              <p className="text-lg font-serif text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {def.format(val)}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Bento Content ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* ── 3-Column Visualization Row ──────────── */}
        <div className="grid grid-cols-3 gap-2 p-3 shrink-0">
          <div className="bg-white border border-gray-100 shadow-sm rounded p-2">
            <h4 className="text-[7px] uppercase tracking-widest text-gray-500 font-bold mb-1">
              Price vs DOM
            </h4>
            <ScatterPlot cell={hoveredCell} cells={cells} onHoverCell={onHoverCell} />
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded p-2">
            <h4 className="text-[7px] uppercase tracking-widest text-gray-500 font-bold mb-1">
              {metricDef.label}
            </h4>
            <DistributionChart
              cell={hoveredCell}
              cells={cells}
              metric={metric}
              metricDef={metricDef}
            />
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded p-2">
            <h4 className="text-[7px] uppercase tracking-widest text-gray-500 font-bold mb-1">
              {hoveredCell ? 'vs Market' : 'Market Avg'}
            </h4>
            <MetricComparison
              cell={hoveredCell}
              averages={averages}
              maxes={maxes}
            />
          </div>
        </div>

        {/* ── Bottom Section: Rankings or Community Profile ── */}
        <div className="flex-1 min-h-0 px-3 pb-3">
          {nCount <= 2 ? (
            /* ── Community: tabbed profile + stats ── */
            <CommunityPanel
              cells={cells}
              metric={metric}
              metricDef={metricDef}
              hoveredCell={hoveredCell}
              communityName={rankedNeighborhoods[0]?.name ?? ''}
            />
          ) : (
            /* ── Rankings Table (3+ neighborhoods) ──────── */
            <div className="bg-white border border-gray-100 shadow-sm rounded h-full flex flex-col overflow-hidden">

              <div className="grid grid-cols-[24px_1fr_72px_48px] gap-1 px-3 py-2 border-b border-gray-100 shrink-0">
                <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold">#</span>
                <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold">Area</span>
                <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold text-right">{metricDef.label}</span>
                <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold text-right">Avg DOM</span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                {top10.map((entry, i) => {
                  const val = entry.metrics[metric];
                  const pct = topVal > 0 ? (val / topVal) * 100 : 0;
                  const isHovered = hoveredCell
                    ? entry.cellIds.includes(hoveredCell.h3Index)
                    : false;
                  const canClick = !!onDrilldown;

                  // Find a representative cell for this neighborhood (for hover highlight)
                  const representativeCell = cells.find(c => entry.cellIds.includes(c.h3Index));

                  return (
                    <div
                      key={entry.name}
                      className="grid grid-cols-[24px_1fr_72px_48px] gap-1 items-center px-3 transition-colors duration-150"
                      style={{
                        height: 36,
                        backgroundColor: isHovered ? '#0C1C2E' : undefined,
                        borderLeft: isHovered ? '3px solid #Bfa67a' : '3px solid transparent',
                        cursor: canClick ? 'pointer' : undefined,
                      }}
                      onMouseEnter={() => {
                        if (representativeCell && onHoverCell) onHoverCell(representativeCell);
                      }}
                      onMouseLeave={() => {
                        if (onHoverCell) onHoverCell(null);
                      }}
                      onClick={() => {
                        if (onDrilldown) onDrilldown(entry.name);
                      }}
                    >
                      <span
                        className="text-xs font-serif"
                        style={{ color: '#Bfa67a', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {i + 1}
                      </span>

                      <div className="min-w-0">
                        <span
                          className="text-[11px] font-serif block truncate"
                          style={{ color: isHovered ? '#ffffff' : '#0C1C2E' }}
                        >
                          {entry.name}
                        </span>
                        <div className="h-[2px] bg-gray-100 rounded-full mt-0.5" style={{ backgroundColor: isHovered ? 'rgba(255,255,255,0.1)' : undefined }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: isHovered ? '#Bfa67a' : 'rgba(191,166,122,0.3)',
                            }}
                          />
                        </div>
                      </div>

                      <span
                        className="text-[11px] font-serif text-right"
                        style={{
                          color: isHovered ? '#ffffff' : '#0C1C2E',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {metricDef.format(val)}
                      </span>

                      <span
                        className="text-[10px] text-right"
                        style={{
                          color: isHovered ? 'rgba(255,255,255,0.6)' : '#6b7280',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {Math.round(entry.metrics.dom)}d
                      </span>
                    </div>
                  );
                })}
              </div>

              {hoveredCell && hoveredNeighborhood >= 10 && (() => {
                const entry = rankedNeighborhoods[hoveredNeighborhood];
                return (
                  <div
                    className="grid grid-cols-[24px_1fr_72px_48px] gap-1 items-center px-3 shrink-0 border-t border-gray-200"
                    style={{
                      height: 36,
                      backgroundColor: '#0C1C2E',
                      borderLeft: '3px solid #Bfa67a',
                    }}
                  >
                    <span className="text-xs font-serif text-[#Bfa67a]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {rank}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[11px] font-serif text-white block truncate">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-serif text-right text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {metricDef.format(entry.metrics[metric])}
                    </span>
                    <span className="text-[10px] text-right text-white/60" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round(entry.metrics.dom)}d
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HexDetailPanel;
