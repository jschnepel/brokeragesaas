'use client';

/**
 * Analytics Line Chart — Time series visualization using Recharts.
 * Supports optional background bars (e.g. inventory behind price lines)
 * and a built-in time range selector (5Y, 1Y, 6M, 3M).
 * Themed with design system tokens (navy, gold, cream).
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface AnalyticsLineChartSeries {
  dataKey: string;
  label: string;
  color?: string;
  dashed?: boolean;
}

export interface AnalyticsLineChartBar {
  dataKey: string;
  label: string;
  color?: string;
  opacity?: number;
}

export type TimeRangeId = 'all' | '5y' | '1y' | '6m' | '3m';

export interface AnalyticsLineChartProps {
  agentId: string;
  className?: string;
  data: Record<string, string | number>[];
  xKey: string;
  series: AnalyticsLineChartSeries[];
  bars?: AnalyticsLineChartBar[];
  height?: number;
  formatX?: (value: string) => string;
  formatY?: (value: number) => string;
  formatBarY?: (value: number) => string;
  /** Show time range selector. Defaults to true when data has > 12 points. */
  showTimeRanges?: boolean;
  /** Default time range. Defaults to 'all'. */
  defaultRange?: TimeRangeId;
  /** Dark mode — inverts grid, axis, button, and tooltip colors. Defaults to false. */
  dark?: boolean;
}

const COLORS = ['#0C1C2E', '#Bfa67a', '#5B8DB8', '#E07A5F', '#162A42'];

const TIME_RANGES: { id: TimeRangeId; label: string; months: number }[] = [
  { id: '3m', label: '3M', months: 3 },
  { id: '6m', label: '6M', months: 6 },
  { id: '1y', label: '1Y', months: 12 },
  { id: '5y', label: '5Y', months: 60 },
  { id: 'all', label: 'All', months: Infinity },
];

function formatXForRange(value: string, range: TimeRangeId): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  switch (range) {
    case 'all':
      // Year only — keeps axis clean over 20+ years
      return d.toLocaleDateString('en-US', { year: 'numeric' });
    case '5y':
      // Quarter notation — Q1 '21
      return `Q${Math.ceil((d.getMonth() + 1) / 3)} '${String(d.getFullYear()).slice(2)}`;
    case '1y':
      // Month + short year — Jan '25
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    case '6m':
    case '3m':
      // Full month — January
      return d.toLocaleDateString('en-US', { month: 'short' });
    default:
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
}

function defaultFormatX(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function defaultFormatY(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return String(Math.round(value));
}

function defaultFormatBarY(value: number): string {
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

function filterByTimeRange(
  data: Record<string, string | number>[],
  xKey: string,
  months: number,
): Record<string, string | number>[] {
  if (!isFinite(months) || data.length === 0) return data;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return data.filter(d => {
    const val = d[xKey];
    const date = new Date(String(val));
    return !isNaN(date.getTime()) && date >= cutoff;
  });
}

export function AnalyticsLineChart({
  className = '',
  data,
  xKey,
  series,
  bars,
  height = 320,
  formatX = defaultFormatX,
  formatY = defaultFormatY,
  formatBarY = defaultFormatBarY,
  showTimeRanges,
  defaultRange = 'all',
  dark = false,
}: AnalyticsLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [activeRange, setActiveRange] = useState<TimeRangeId>(defaultRange);
  const hasBars = bars && bars.length > 0;

  // Auto-show time ranges when data is large enough
  const shouldShowRanges = showTimeRanges ?? data.length > 12;

  const filteredData = useMemo(() => {
    const range = TIME_RANGES.find(r => r.id === activeRange);
    return filterByTimeRange(data, xKey, range?.months ?? Infinity);
  }, [data, xKey, activeRange]);

  // Adaptive X-axis formatting based on time range; fall back to formatX if ranges hidden
  const xTickFormatter = useMemo(() => {
    if (!shouldShowRanges) return formatX;
    return (value: string) => formatXForRange(value, activeRange);
  }, [activeRange, shouldShowRanges, formatX]);

  // Thin out ticks for dense data — aim for ~8-12 labels
  const xTickInterval = useMemo(() => {
    const count = filteredData.length;
    if (count <= 12) return 0; // show all
    return Math.ceil(count / 10) - 1;
  }, [filteredData.length]);

  // Tooltip always shows full month + year regardless of axis format
  const tooltipLabelFormatter = useMemo(() => {
    return (label: unknown) => {
      const d = new Date(String(label));
      if (isNaN(d.getTime())) return String(label);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.floor(el.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => measure());
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Always use ComposedChart — supports both lines and optional bars
  const ChartComponent = ComposedChart;

  const allSeries = [
    ...(bars ?? []).map(b => ({ dataKey: b.dataKey, label: b.label })),
    ...series.map(s => ({ dataKey: s.dataKey, label: s.label })),
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Time Range Selector */}
      {shouldShowRanges && (
        <div className="flex items-center justify-end gap-1 mb-4">
          {TIME_RANGES.map(range => (
            <button
              key={range.id}
              onClick={() => setActiveRange(range.id)}
              className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-all duration-200"
              style={
                activeRange === range.id
                  ? dark
                    ? { backgroundColor: '#Bfa67a', color: '#0C1C2E' }
                    : { backgroundColor: '#0C1C2E', color: '#fff' }
                  : dark
                    ? { color: 'rgba(255,255,255,0.3)' }
                    : { color: 'rgba(12,28,46,0.3)' }
              }
              onMouseEnter={(e) => {
                if (activeRange !== range.id) {
                  e.currentTarget.style.color = dark
                    ? 'rgba(255,255,255,0.6)'
                    : 'rgba(12,28,46,0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeRange !== range.id) {
                  e.currentTarget.style.color = dark
                    ? 'rgba(255,255,255,0.3)'
                    : 'rgba(12,28,46,0.3)';
                }
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}

      <div ref={containerRef} style={{ minHeight: height }}>
        {width > 0 && (
          <ChartComponent data={filteredData} width={width} height={height} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(12,28,46,0.06)'} />
            <XAxis
              dataKey={xKey}
              tickFormatter={xTickFormatter}
              interval={xTickInterval}
              tick={{ fontSize: 10, fill: dark ? 'rgba(255,255,255,0.4)' : 'rgba(12,28,46,0.4)' }}
              axisLine={{ stroke: dark ? 'rgba(255,255,255,0.1)' : 'rgba(12,28,46,0.1)' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatY}
              tick={{ fontSize: 10, fill: dark ? 'rgba(255,255,255,0.4)' : 'rgba(12,28,46,0.4)' }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            {hasBars && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={formatBarY}
                tick={{ fontSize: 10, fill: dark ? 'rgba(255,255,255,0.2)' : 'rgba(12,28,46,0.2)' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
            )}
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: dark ? 'rgba(255,255,255,0.2)' : 'rgba(12,28,46,0.2)' }}
              contentStyle={{
                background: '#0C1C2E',
                border: dark ? '1px solid rgba(191,166,122,0.2)' : 'none',
                borderRadius: 2,
                fontSize: 11,
                color: '#fff',
                fontFamily: 'serif',
              }}
              labelFormatter={tooltipLabelFormatter}
              formatter={(value, name) => {
                const match = allSeries.find(s => s.dataKey === name);
                const isBar = bars?.some(b => b.dataKey === name);
                const formatted = isBar ? formatBarY(Number(value)) : formatY(Number(value));
                return [formatted, match?.label ?? String(name)];
              }}
            />
            {(series.length > 1 || hasBars) && (
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                formatter={(value) => {
                  const match = allSeries.find(s => s.dataKey === value);
                  return match?.label ?? String(value);
                }}
              />
            )}
            {bars?.map((b) => (
              <Bar
                key={b.dataKey}
                yAxisId="right"
                dataKey={b.dataKey}
                fill={b.color ?? 'rgba(12,28,46,0.15)'}
                radius={[2, 2, 0, 0]}
                fillOpacity={b.opacity ?? 0.15}
              />
            ))}
            {series.map((s, i) => (
              <Line
                key={s.dataKey}
                yAxisId="left"
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color ?? COLORS[i % COLORS.length]}
                strokeWidth={2}
                strokeDasharray={s.dashed ? '6 3' : undefined}
                dot={false}
                activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
              />
            ))}
          </ChartComponent>
        )}
      </div>
    </div>
  );
}
