'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendSeries } from '@/lib/market-reports';
import { AXIS_TICK_STYLE, CHART_COLORS, CHART_MARGIN } from '../charts/chart-theme';

export interface TrendChartClientProps {
  series: TrendSeries;
}

export function TrendChartClient({ series }: TrendChartClientProps) {
  if (series.metric === 'newListings') {
    return <WeeklyPace series={series} />;
  }
  return <MonthlyPpsf series={series} />;
}

function WeeklyPace({ series }: TrendChartClientProps) {
  return (
    <div className="w-full">
      <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
        <li className="flex items-center gap-2">
          <span className="inline-block h-2 w-5" style={{ background: CHART_COLORS.gold, opacity: 0.7 }} />
          <span className="caps text-[9px] text-stone opacity-80">New listings (weekly)</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-px w-5" style={{ background: CHART_COLORS.champagne, boxShadow: `0 0 0 1px ${CHART_COLORS.champagne}` }} />
          <span className="caps text-[9px] text-stone opacity-80">4-week rolling average</span>
        </li>
      </ul>
      <div className="w-full h-[300px]">
        <ResponsiveContainer>
          <ComposedChart data={series.points} margin={CHART_MARGIN}>
            <CartesianGrid stroke={CHART_COLORS.hairlineSoft} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="date"
              stroke={CHART_COLORS.hairline}
              tick={AXIS_TICK_STYLE}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.hairline }}
            />
            <YAxis
              stroke={CHART_COLORS.hairline}
              tick={AXIS_TICK_STYLE}
              tickLine={false}
              axisLine={false}
              width={40}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: CHART_COLORS.hairlineSoft }}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={{ color: CHART_COLORS.stone, padding: '2px 0' }}
              formatter={(value: number, name: string) => {
                if (name === 'value') return [Math.round(value), 'New listings'];
                if (name === 'rollingAvg') return [value.toFixed(1), '4-wk avg'];
                return [value, name];
              }}
              labelFormatter={(label: string) => `Week of ${label}`}
            />
            <Bar dataKey="value" fill={CHART_COLORS.gold} fillOpacity={0.7} isAnimationActive={false} maxBarSize={32} />
            <Line
              type="monotone"
              dataKey="rollingAvg"
              stroke={CHART_COLORS.champagne}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.champagne }}
              isAnimationActive={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-5 text-[10px] opacity-70 text-right" style={{ color: 'var(--mute)' }}>
        {series.windowLabel} · Phoenix metro
      </p>
    </div>
  );
}

function MonthlyPpsf({ series }: TrendChartClientProps) {
  return (
    <div className="w-full">
      <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
        <li className="flex items-center gap-2">
          <span className="inline-block h-px w-5" style={{ background: CHART_COLORS.gold, boxShadow: `0 0 0 1px ${CHART_COLORS.gold}` }} />
          <span className="caps text-[9px] text-stone opacity-80">Median price per sqft</span>
        </li>
      </ul>
      <div className="w-full h-[300px]">
        <ResponsiveContainer>
          <LineChart data={series.points} margin={CHART_MARGIN}>
            <CartesianGrid stroke={CHART_COLORS.hairlineSoft} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="date"
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
              width={56}
              domain={['dataMin - 50', 'dataMax + 50']}
            />
            <Tooltip
              cursor={{ stroke: CHART_COLORS.gold, strokeWidth: 1 }}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={{ color: CHART_COLORS.stone, padding: '2px 0' }}
              formatter={(value: number) => [`$${value}/sqft`, 'Median']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS.gold}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.gold }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-5 text-[10px] opacity-70 text-right" style={{ color: 'var(--mute)' }}>
        {series.windowLabel} · Phoenix metro
      </p>
    </div>
  );
}

const tooltipStyle = {
  background: CHART_COLORS.inkElevated,
  border: `1px solid ${CHART_COLORS.hairline}`,
  borderRadius: 0,
  padding: '10px 14px',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  color: CHART_COLORS.stone,
};

const tooltipLabelStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  letterSpacing: '0.1em',
  color: CHART_COLORS.gold,
  textTransform: 'uppercase' as const,
  marginBottom: 8,
};
