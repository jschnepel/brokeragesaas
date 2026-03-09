'use client';

/**
 * Price Band Histogram — Luxury horizontal bar chart with hover tooltips.
 * Each tier shows a visible proportional bar with floating tooltip on hover.
 */

import { useState, useCallback } from 'react';

export interface PriceBandData {
  band: string;
  count: number;
  avgDom?: number;
}

export interface PriceBandHistogramProps {
  agentId: string;
  className?: string;
  data: PriceBandData[];
  highlightBand?: string;
  dark?: boolean;
  maxRows?: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCountFull(n: number): string {
  return n.toLocaleString();
}

export function PriceBandHistogram({
  className = '',
  data,
  highlightBand,
  dark = false,
  maxRows = 5,
}: PriceBandHistogramProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const peakIndex = data.reduce((pi, d, i) => d.count > data[pi].count ? i : pi, 0);
  const totalCount = data.reduce((s, d) => s + d.count, 0);

  let displayData: (PriceBandData & { isPeak: boolean; isOther: boolean })[];

  if (data.length <= maxRows) {
    displayData = data.map((d, i) => ({ ...d, isPeak: i === peakIndex, isOther: false }));
  } else {
    const indexed = data.map((d, i) => ({ ...d, originalIndex: i }));
    const sorted = [...indexed].sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, maxRows - 1);
    const rest = sorted.slice(maxRows - 1);
    const otherCount = rest.reduce((s, d) => s + d.count, 0);
    const otherDom = rest.length > 0
      ? Math.round(rest.reduce((s, d) => s + (d.avgDom ?? 0), 0) / rest.length)
      : undefined;
    top.sort((a, b) => a.originalIndex - b.originalIndex);
    displayData = [
      ...top.map(d => ({ band: d.band, count: d.count, avgDom: d.avgDom, isPeak: d.originalIndex === peakIndex, isOther: false })),
      { band: `${rest.length} other tiers`, count: otherCount, avgDom: otherDom, isPeak: false, isOther: true },
    ];
  }

  const displayMax = Math.max(...displayData.map(d => d.count), 1);

  const handleMouseEnter = useCallback((i: number) => setHoveredIndex(i), []);
  const handleMouseLeave = useCallback(() => setHoveredIndex(null), []);

  return (
    <div className={className}>
      {/* Labels + bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {displayData.map((row, rowIndex) => {
          // Square-root scale so small tiers are still visible
          const barPct = Math.max(Math.sqrt(row.count / displayMax) * 100, 8);
          const sharePct = totalCount > 0 ? (row.count / totalCount) * 100 : 0;
          const isHighlighted = highlightBand === row.band;
          const isHovered = hoveredIndex === rowIndex;
          const accent = row.isPeak || isHighlighted;

          const insightText = row.isPeak
            ? `Dominant tier — ${Math.round(sharePct)}% of all listings`
            : row.isOther
              ? `Combined ${row.band}`
              : sharePct >= 10
                ? `Significant segment — ${Math.round(sharePct)}% market share`
                : sharePct >= 3
                  ? `${Math.round(sharePct)}% of the market`
                  : `Niche segment — ${sharePct.toFixed(1)}% of listings`;

          return (
            <div
              key={row.band}
              className="relative"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => handleMouseEnter(rowIndex)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Label row */}
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <div className="flex items-center gap-2">
                  <div
                    className="shrink-0 rounded-full transition-all duration-200"
                    style={{
                      width: accent ? 7 : 5,
                      height: accent ? 7 : 5,
                      backgroundColor: accent ? '#BFA67A' : dark ? 'rgba(191,166,122,0.4)' : 'rgba(12,28,46,0.2)',
                      boxShadow: accent ? '0 0 8px rgba(191,166,122,0.5)' : undefined,
                    }}
                  />
                  <span
                    className="font-serif font-semibold transition-colors duration-200"
                    style={{
                      fontSize: accent ? 13 : 12,
                      color: dark
                        ? accent ? '#BFA67A' : isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'
                        : accent ? '#BFA67A' : isHovered ? 'rgba(12,28,46,0.85)' : 'rgba(12,28,46,0.55)',
                    }}
                  >
                    {row.band}
                  </span>
                  {row.avgDom !== undefined && row.avgDom > 0 && (
                    <span style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      padding: '1px 5px',
                      borderRadius: 2,
                      backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(12,28,46,0.04)',
                      color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(12,28,46,0.25)',
                    }}>
                      {row.avgDom}d
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-serif font-bold transition-all duration-200"
                    style={{
                      fontSize: accent ? 16 : 13,
                      fontVariantNumeric: 'tabular-nums',
                      color: dark
                        ? accent ? '#FFFFFF' : isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)'
                        : accent ? '#0C1C2E' : isHovered ? 'rgba(12,28,46,0.85)' : 'rgba(12,28,46,0.4)',
                    }}
                  >
                    {formatCount(row.count)}
                  </span>
                  <span
                    className="font-bold transition-colors duration-200"
                    style={{
                      fontSize: 10,
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: 28,
                      textAlign: 'right',
                      color: accent
                        ? 'rgba(191,166,122,0.7)'
                        : isHovered
                          ? dark ? 'rgba(255,255,255,0.5)' : 'rgba(12,28,46,0.4)'
                          : dark ? 'rgba(255,255,255,0.18)' : 'rgba(12,28,46,0.15)',
                    }}
                  >
                    {Math.round(sharePct)}%
                  </span>
                </div>
              </div>

              {/* Bar track */}
              <div
                className="relative overflow-hidden transition-all duration-200"
                style={{
                  height: accent ? 24 : isHovered ? 20 : 16,
                  borderRadius: 4,
                  backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(12,28,46,0.04)',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(12,28,46,0.04)'}`,
                }}
              >
                {/* Bar fill */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
                  style={{
                    width: `${barPct}%`,
                    borderRadius: 3,
                    background: accent
                      ? isHovered
                        ? 'linear-gradient(90deg, #BFA67A 0%, rgba(191,166,122,0.6) 60%, rgba(191,166,122,0.25) 100%)'
                        : 'linear-gradient(90deg, rgba(191,166,122,0.85) 0%, rgba(191,166,122,0.45) 60%, rgba(191,166,122,0.15) 100%)'
                      : isHovered
                        ? dark
                          ? 'linear-gradient(90deg, rgba(191,166,122,0.45) 0%, rgba(191,166,122,0.2) 60%, rgba(191,166,122,0.06) 100%)'
                          : 'linear-gradient(90deg, rgba(12,28,46,0.25) 0%, rgba(12,28,46,0.12) 60%, rgba(12,28,46,0.03) 100%)'
                        : dark
                          ? 'linear-gradient(90deg, rgba(191,166,122,0.3) 0%, rgba(191,166,122,0.12) 60%, rgba(191,166,122,0.03) 100%)'
                          : 'linear-gradient(90deg, rgba(12,28,46,0.15) 0%, rgba(12,28,46,0.06) 60%, rgba(12,28,46,0.02) 100%)',
                  }}
                />
                {/* Top shimmer */}
                <div
                  className="absolute top-0 left-0"
                  style={{
                    width: `${barPct}%`,
                    height: 1,
                    background: accent
                      ? 'linear-gradient(90deg, rgba(191,166,122,0.8), rgba(191,166,122,0.2), transparent)'
                      : dark
                        ? 'linear-gradient(90deg, rgba(191,166,122,0.3), rgba(191,166,122,0.08), transparent)'
                        : 'linear-gradient(90deg, rgba(12,28,46,0.1), rgba(12,28,46,0.03), transparent)',
                  }}
                />
                {/* Trailing edge */}
                <div
                  className="absolute top-0 bottom-0 transition-all duration-500"
                  style={{
                    left: `${barPct}%`,
                    width: 2,
                    marginLeft: -2,
                    background: accent
                      ? isHovered ? '#BFA67A' : 'rgba(191,166,122,0.7)'
                      : isHovered
                        ? dark ? 'rgba(191,166,122,0.6)' : 'rgba(12,28,46,0.3)'
                        : dark ? 'rgba(191,166,122,0.3)' : 'rgba(12,28,46,0.12)',
                    boxShadow: (accent || isHovered)
                      ? `0 0 10px ${accent ? 'rgba(191,166,122,0.5)' : 'rgba(191,166,122,0.25)'}`
                      : undefined,
                  }}
                />
              </div>

              {/* Floating tooltip on hover */}
              {isHovered && (
                <div
                  className="absolute left-0 right-0 z-10"
                  style={{
                    bottom: '100%',
                    marginBottom: 6,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    className="inline-flex items-center gap-2 px-3 py-2 rounded"
                    style={{
                      backgroundColor: dark ? 'rgba(12,28,46,0.95)' : '#0C1C2E',
                      border: `1px solid ${accent ? 'rgba(191,166,122,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.7)',
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                    }}>
                      <strong style={{ color: accent ? '#BFA67A' : '#FFFFFF' }}>
                        {formatCountFull(row.count)}
                      </strong>
                      {' listings · '}{insightText}
                      {row.avgDom !== undefined && row.avgDom > 0 && ` · ${row.avgDom}d avg`}
                    </span>
                    {/* Tooltip arrow */}
                    <div style={{
                      position: 'absolute',
                      bottom: -4,
                      left: 20,
                      width: 8,
                      height: 8,
                      backgroundColor: dark ? 'rgba(12,28,46,0.95)' : '#0C1C2E',
                      border: `1px solid ${accent ? 'rgba(191,166,122,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      borderTop: 'none',
                      borderLeft: 'none',
                      transform: 'rotate(45deg)',
                    }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scale axis */}
      <div className="flex items-center justify-between mt-4 px-1">
        <span style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontWeight: 700, color: dark ? 'rgba(255,255,255,0.12)' : 'rgba(12,28,46,0.12)' }}>
          0%
        </span>
        <div className="flex-1 mx-3 flex items-center gap-3">
          <div className="flex-1" style={{ height: 1, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(12,28,46,0.05)' }} />
          <span style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 700, color: dark ? 'rgba(255,255,255,0.12)' : 'rgba(12,28,46,0.12)' }}>
            relative share
          </span>
          <div className="flex-1" style={{ height: 1, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(12,28,46,0.05)' }} />
        </div>
        <span style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const, fontWeight: 700, color: dark ? 'rgba(255,255,255,0.12)' : 'rgba(12,28,46,0.12)' }}>
          100%
        </span>
      </div>
    </div>
  );
}
