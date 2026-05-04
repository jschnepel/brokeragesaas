'use client';

import { useMemo } from 'react';
import type { InventoryAgePoint } from '@/content/market-reports';
import { CHART_COLORS } from './chart-theme';

type InventoryAgeChartProps = {
  data: InventoryAgePoint[];
};

/**
 * Inventory-age distribution by community (current snapshot).
 *
 * Custom horizontal stacked-bar component (no recharts) — each row is
 * one community, segmented by DOM bucket: 0-30 / 31-60 / 61-90 / 91-180 / 180+.
 *
 * Read: where is inventory aging vs moving fast. A community with most of
 * its bar on the left (0-30, 31-60) is absorbing; a community with mass
 * on the right (180+) has stale inventory.
 */
const BUCKETS = ['0-30', '31-60', '61-90', '91-180', '180+'] as const;

const BUCKET_COLORS: Record<string, string> = {
  '0-30': CHART_COLORS.gold,
  '31-60': CHART_COLORS.goldMuted,
  '61-90': CHART_COLORS.bronze,
  '91-180': CHART_COLORS.stoneDeep,
  '180+': '#5A5650',
};

export function InventoryAgeChart({ data }: InventoryAgeChartProps) {
  // Sort by total inventory descending so the busiest scopes lead.
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.total - a.total),
    [data],
  );

  const maxTotal = useMemo(
    () => Math.max(1, ...sorted.map((d) => d.total)),
    [sorted],
  );

  if (sorted.length === 0) {
    return (
      <div
        className="w-full h-[280px] border border-[color:var(--hairline)] flex items-center justify-center"
        style={{ background: 'var(--ink-elevated)' }}
      >
        <p className="caps text-[10px] text-mute">No inventory age data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <ul className="flex flex-wrap gap-x-4 gap-y-2 mb-8">
        {BUCKETS.map((b) => (
          <li key={b} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-4"
              style={{ background: BUCKET_COLORS[b] }}
            />
            <span className="caps text-[9px] text-stone opacity-80">
              {b} d
            </span>
          </li>
        ))}
      </ul>

      <ul className="space-y-5">
        {sorted.map((d) => {
          const widthPct = (d.total / maxTotal) * 100;
          return (
            <li key={d.community}>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="font-serif text-sm md:text-base text-stone tracking-tight truncate">
                  {d.community}
                </span>
                <span className="caps text-[10px] text-stone opacity-80 tabular-nums">
                  {d.total} active
                </span>
              </div>
              <div
                className="relative h-2.5 w-full overflow-hidden"
                style={{ background: CHART_COLORS.hairlineSoft }}
              >
                <div
                  className="absolute inset-y-0 left-0 flex"
                  style={{ width: `${widthPct}%` }}
                >
                  {BUCKETS.map((b) => {
                    const cnt = d.buckets[b] ?? 0;
                    if (cnt === 0) return null;
                    const seg = (cnt / d.total) * 100;
                    return (
                      <div
                        key={b}
                        className="h-full"
                        style={{
                          width: `${seg}%`,
                          background: BUCKET_COLORS[b],
                        }}
                        title={`${b} days: ${cnt}`}
                      />
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
