'use client';

import { useMemo, useState } from 'react';
import type { MedianBar } from '@/content/market-reports';
import { CHART_COLORS, colorFor } from './chart-theme';

type NeighborhoodBarsChartProps = {
  data: MedianBar[];
};

type TierFilter = 'signature' | 'notable' | 'all';
type SortKey = 'value' | 'yoy' | 'alpha';

const DEFAULT_VISIBLE_COUNT = 6;

/**
 * Horizontal bars with tier filter + sort + collapse. Designed to scale
 * to 30+ neighborhoods — default shows top 6 signature+notable by value.
 */
export function NeighborhoodBarsChart({ data }: NeighborhoodBarsChartProps) {
  const [tier, setTier] = useState<TierFilter>('signature');
  const [sort, setSort] = useState<SortKey>('value');
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const byTier = data.filter((d) => {
      if (tier === 'all') return true;
      if (tier === 'signature') return d.tier === 'signature';
      if (tier === 'notable') return d.tier === 'signature' || d.tier === 'notable';
      return true;
    });
    const sorted = [...byTier];
    sorted.sort((a, b) => {
      if (sort === 'value') return b.median - a.median;
      if (sort === 'yoy') return b.yoyChange - a.yoyChange;
      return a.neighborhood.localeCompare(b.neighborhood);
    });
    return sorted;
  }, [data, tier, sort]);

  const visible = expanded ? filtered : filtered.slice(0, DEFAULT_VISIBLE_COUNT);
  const hiddenCount = filtered.length - visible.length;

  const axisMax = useMemo(() => {
    const max = Math.max(...filtered.map((d) => d.median), 0);
    return Math.ceil(max / 100) * 100 + 100;
  }, [filtered]);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 md:gap-5 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="caps text-[10px] text-mute" style={{ color: 'var(--mute)' }}>
            Show
          </span>
          {(
            [
              { key: 'signature', label: 'Signature' },
              { key: 'notable', label: '+ Notable' },
              { key: 'all', label: 'All' },
            ] as const
          ).map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                setTier(o.key);
                setExpanded(false);
              }}
              aria-pressed={tier === o.key}
              className={`caps text-[10px] px-3 py-1.5 border transition-colors ${
                tier === o.key
                  ? 'bg-[color:var(--gold)] text-[color:var(--ink)] border-[color:var(--gold)]'
                  : 'border-[color:var(--hairline)] text-stone hover:border-[color:var(--gold)]'
              }`}
              style={tier === o.key ? { color: 'var(--ink)' } : undefined}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="caps text-[10px]" style={{ color: 'var(--mute)' }}>
            Sort
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="caps text-[10px] text-stone bg-transparent border border-[color:var(--hairline)] px-3 py-1.5 focus:outline-none focus:border-[color:var(--gold)]"
          >
            <option value="value" className="bg-ink text-stone">By value</option>
            <option value="yoy" className="bg-ink text-stone">By YoY change</option>
            <option value="alpha" className="bg-ink text-stone">A–Z</option>
          </select>
        </div>
      </div>

      {/* Rows */}
      {visible.length === 0 ? (
        <p className="text-sm text-mute py-8 text-center">
          No communities match this tier.
        </p>
      ) : (
        <ul className="space-y-6">
          {visible.map((d) => {
            const pct = (d.median / axisMax) * 100;
            const color = colorFor(d.neighborhood);
            const positive = d.yoyChange >= 0;
            return (
              <li key={d.neighborhood}>
                <div className="flex items-baseline justify-between gap-4 mb-2.5">
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="font-serif text-sm md:text-base text-stone tracking-tight truncate">
                      {d.neighborhood}
                    </span>
                    <span className="caps text-[9px] opacity-70 hidden sm:inline" style={{ color: 'var(--mute)' }}>
                      {d.tier === 'signature'
                        ? 'SIG'
                        : d.tier === 'notable'
                          ? 'NOT'
                          : 'BRD'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 shrink-0">
                    <span className="font-serif text-base md:text-lg text-stone tabular-nums">
                      ${d.median.toLocaleString()}
                      <span className="text-[10px] text-mute ml-1">/sqft</span>
                    </span>
                    <span
                      className="caps text-[10px]"
                      style={{
                        color: positive ? CHART_COLORS.gold : CHART_COLORS.stoneDeep,
                      }}
                    >
                      {positive ? '+' : ''}
                      {(d.yoyChange * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div
                  className="relative h-1.5"
                  style={{ background: CHART_COLORS.hairlineSoft }}
                >
                  <div
                    className="absolute inset-y-0 left-0 transition-[width] duration-[1200ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
                    style={{ background: color, width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Expand / collapse */}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-8 caps text-[10px] text-gold hover:text-[color:var(--gold-muted)] transition-colors inline-flex items-center gap-3"
        >
          Show {hiddenCount} more
          <span className="block h-px w-8 bg-current" />
        </button>
      )}
      {expanded && filtered.length > DEFAULT_VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-8 caps text-[10px] text-mute hover:text-gold transition-colors inline-flex items-center gap-3"
        >
          Collapse
          <span className="block h-px w-8 bg-current" />
        </button>
      )}

      {/* Axis labels */}
      <div className="mt-10 flex justify-between text-[9px] opacity-70" style={{ color: 'var(--mute)' }}>
        <span>$0</span>
        <span>${axisMax.toLocaleString()}/sqft</span>
      </div>
    </div>
  );
}
