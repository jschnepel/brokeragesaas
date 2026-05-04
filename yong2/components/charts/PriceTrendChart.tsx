'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { QuarterPoint } from '@/content/market-reports';
import {
  COMMUNITY_TIERS,
  SIGNATURE_COMMUNITIES,
  type Tier,
} from '@/content/market-reports';
import {
  AXIS_TICK_STYLE,
  CHART_COLORS,
  CHART_MARGIN,
  colorFor,
} from './chart-theme';

type PriceTrendChartProps = {
  data: QuarterPoint[];
  /**
   * Which neighborhoods to offer as toggles. Defaults to every key in the
   * first point that isn't 'quarter'.
   */
  neighborhoods?: string[];
};

type PresetKey = 'signature' | 'notable' | 'all' | 'custom';

export function PriceTrendChart({ data, neighborhoods }: PriceTrendChartProps) {
  const available = useMemo(
    () => neighborhoods ?? Object.keys(data[0] ?? {}).filter((k) => k !== 'quarter'),
    [data, neighborhoods],
  );

  const defaultVisible = useMemo(
    () => available.filter((n) => SIGNATURE_COMMUNITIES.includes(n)),
    [available],
  );

  const [visible, setVisible] = useState<Set<string>>(
    () => new Set(defaultVisible),
  );
  const [preset, setPreset] = useState<PresetKey>('signature');

  function applyPreset(key: PresetKey) {
    setPreset(key);
    if (key === 'signature') {
      setVisible(new Set(available.filter((n) => COMMUNITY_TIERS[n] === 'signature')));
    } else if (key === 'notable') {
      setVisible(
        new Set(
          available.filter(
            (n) =>
              COMMUNITY_TIERS[n] === 'signature' ||
              COMMUNITY_TIERS[n] === 'notable',
          ),
        ),
      );
    } else if (key === 'all') {
      setVisible(new Set(available));
    }
  }

  function toggle(name: string) {
    setPreset('custom');
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const grouped = useMemo(() => {
    const sig: string[] = [];
    const not: string[] = [];
    const other: string[] = [];
    available.forEach((n) => {
      const t: Tier | undefined = COMMUNITY_TIERS[n];
      if (t === 'signature') sig.push(n);
      else if (t === 'notable') not.push(n);
      else other.push(n);
    });
    return { sig, not, other };
  }, [available]);

  return (
    <div className="w-full">
      {/* Preset toggle row */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <span className="caps text-[10px]" style={{ color: 'var(--mute)' }}>
          View
        </span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: 'signature', label: 'Signature' },
              { key: 'notable', label: 'Signature + Notable' },
              { key: 'all', label: 'All' },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              aria-pressed={preset === p.key}
              className={`caps text-[10px] px-3 py-1.5 border transition-colors ${
                preset === p.key
                  ? 'bg-[color:var(--gold)] text-[color:var(--ink)] border-[color:var(--gold)]'
                  : 'border-[color:var(--hairline)] text-stone hover:border-[color:var(--gold)]'
              }`}
              style={preset === p.key ? { color: 'var(--ink)' } : undefined}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <span className="caps text-[10px] text-gold">· Custom selection</span>
        )}
      </div>

      {/* Toggleable legend chips, grouped by tier */}
      <div className="mb-6 space-y-3">
        <LegendGroup
          label="Signature"
          items={grouped.sig}
          visible={visible}
          onToggle={toggle}
        />
        {grouped.not.length > 0 && (
          <LegendGroup
            label="Notable"
            items={grouped.not}
            visible={visible}
            onToggle={toggle}
          />
        )}
        {grouped.other.length > 0 && (
          <LegendGroup
            label="Broader"
            items={grouped.other}
            visible={visible}
            onToggle={toggle}
          />
        )}
      </div>

      {/* Chart */}
      <div className="w-full h-[340px]">
        <ResponsiveContainer>
          <LineChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid
              stroke={CHART_COLORS.hairlineSoft}
              strokeDasharray="2 4"
              vertical={false}
            />
            <XAxis
              dataKey="quarter"
              stroke={CHART_COLORS.hairline}
              tick={AXIS_TICK_STYLE}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.hairline }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              stroke={CHART_COLORS.hairline}
              tick={AXIS_TICK_STYLE}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
              width={50}
              domain={['dataMin - 50', 'dataMax + 50']}
            />
            <Tooltip
              cursor={{ stroke: CHART_COLORS.gold, strokeWidth: 1 }}
              contentStyle={{
                background: CHART_COLORS.inkElevated,
                border: `1px solid ${CHART_COLORS.hairline}`,
                borderRadius: 0,
                padding: '10px 14px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                color: CHART_COLORS.stone,
              }}
              labelStyle={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                letterSpacing: '0.1em',
                color: CHART_COLORS.gold,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
              itemStyle={{ color: CHART_COLORS.stone, padding: '2px 0' }}
              formatter={(value: number) => [`$${value}/sqft`, null]}
              itemSorter={(item) => -(item.value as number)}
            />
            {available.map((n) => (
              <Line
                key={n}
                type="monotone"
                dataKey={n}
                stroke={colorFor(n)}
                strokeWidth={visible.has(n) ? 2 : 0}
                dot={
                  visible.has(n)
                    ? { r: 3, strokeWidth: 0, fill: colorFor(n) }
                    : false
                }
                activeDot={
                  visible.has(n)
                    ? { r: 5, strokeWidth: 2, stroke: CHART_COLORS.ink }
                    : false
                }
                hide={!visible.has(n)}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Context line */}
      <p className="mt-5 text-[10px] opacity-70 text-right" style={{ color: 'var(--mute)' }}>
        {visible.size} of {available.length} communities shown · click chips to toggle
      </p>
    </div>
  );
}

function LegendGroup({
  label,
  items,
  visible,
  onToggle,
}: {
  label: string;
  items: string[];
  visible: Set<string>;
  onToggle: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="caps text-[9px] uppercase tracking-[0.15em] w-16 shrink-0" style={{ color: 'var(--gold)' }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((n) => {
          const on = visible.has(n);
          const color = colorFor(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onToggle(n)}
              aria-pressed={on}
              className={`inline-flex items-center gap-2 px-2.5 py-1 border text-[10px] transition-all ${
                on
                  ? 'border-[color:var(--hairline)] text-stone'
                  : 'border-[color:var(--hairline)] text-mute opacity-50 hover:opacity-80'
              }`}
              style={on ? { borderColor: color } : undefined}
            >
              <span
                className="inline-block h-0.5 w-4"
                style={{ background: on ? color : CHART_COLORS.hairlineSoft }}
              />
              <span className="font-sans tracking-wide">{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
