'use client';

/**
 * Analytics Bar Chart — Vertical bars with optional overlay line.
 * Themed with design system tokens.
 */

import { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';

export interface AnalyticsBarChartProps {
  agentId: string;
  className?: string;
  data: Record<string, string | number>[];
  xKey: string;
  bars: { dataKey: string; label: string; color?: string }[];
  line?: { dataKey: string; label: string; color?: string };
  height?: number;
  formatX?: (value: string) => string;
  formatY?: (value: number) => string;
  stacked?: boolean;
}

const BAR_COLORS = ['#0C1C2E', '#Bfa67a', '#5B8DB8', '#E07A5F'];

function defaultFormatX(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function AnalyticsBarChart({
  className = '',
  data,
  xKey,
  bars,
  line,
  height = 320,
  formatX = defaultFormatX,
  formatY = (v) => String(Math.round(v)),
  stacked = false,
}: AnalyticsBarChartProps) {
  const ChartComponent = line ? ComposedChart : BarChart;
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

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

  return (
    <div ref={containerRef} className={`w-full ${className}`} style={{ minHeight: height }}>
      {width > 0 && (
        <ChartComponent data={data} width={width} height={height} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(12,28,46,0.06)" />
          <XAxis
            dataKey={xKey}
            tickFormatter={formatX}
            tick={{ fontSize: 10, fill: 'rgba(12,28,46,0.4)' }}
            axisLine={{ stroke: 'rgba(12,28,46,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatY}
            tick={{ fontSize: 10, fill: 'rgba(12,28,46,0.4)' }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: '#0C1C2E',
              border: 'none',
              borderRadius: 2,
              fontSize: 11,
              color: '#fff',
              fontFamily: 'serif',
            }}
            labelFormatter={(label) => formatX(String(label))}
            formatter={(value, name) => {
              const b = bars.find(b => b.dataKey === name);
              const l = line?.dataKey === name ? line : null;
              return [formatY(Number(value)), b?.label ?? l?.label ?? String(name)];
            }}
          />
          {(bars.length > 1 || line) && (
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
              formatter={(value) => {
                const b = bars.find(b => b.dataKey === value);
                const l = line?.dataKey === value ? line : null;
                return b?.label ?? l?.label ?? String(value);
              }}
            />
          )}
          {bars.map((b, i) => (
            <Bar
              key={b.dataKey}
              dataKey={b.dataKey}
              fill={b.color ?? BAR_COLORS[i % BAR_COLORS.length]}
              radius={[2, 2, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
              opacity={0.85}
            />
          ))}
          {line && (
            <Line
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color ?? '#E07A5F'}
              strokeWidth={2}
              dot={false}
            />
          )}
        </ChartComponent>
      )}
    </div>
  );
}
