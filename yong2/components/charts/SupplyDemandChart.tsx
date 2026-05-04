'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SupplyDemandPoint } from '@/content/market-reports';
import { AXIS_TICK_STYLE, CHART_COLORS, CHART_MARGIN } from './chart-theme';

type SupplyDemandChartProps = {
  data: SupplyDemandPoint[];
};

/**
 * Trailing-12-month Supply vs Demand area chart.
 *
 * - Closed sales = solid gold area (demand)
 * - New listings = bronze area, ghosted (supply pushing in)
 *
 * When new listings overtake closes for several months running, supply is
 * building. When closes overtake new listings, the market is absorbing.
 */
export function SupplyDemandChart({ data }: SupplyDemandChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="w-full h-[280px] border border-[color:var(--hairline)] flex items-center justify-center"
        style={{ background: 'var(--ink-elevated)' }}
      >
        <p className="caps text-[10px] text-mute">No supply / demand data for this window</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Custom legend */}
      <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
        <li className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-5"
            style={{ background: CHART_COLORS.gold }}
          />
          <span className="caps text-[9px] text-stone opacity-80">
            Closed (demand)
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-5"
            style={{ background: CHART_COLORS.bronze, opacity: 0.7 }}
          />
          <span className="caps text-[9px] text-stone opacity-80">
            New listings (supply)
          </span>
        </li>
      </ul>

      <div className="w-full h-[300px]">
        <ResponsiveContainer>
          <AreaChart data={data} margin={CHART_MARGIN}>
            <defs>
              <linearGradient id="grad-closed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.gold} stopOpacity={0.45} />
                <stop offset="95%" stopColor={CHART_COLORS.gold} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="grad-new" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.bronze} stopOpacity={0.4} />
                <stop offset="95%" stopColor={CHART_COLORS.bronze} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={CHART_COLORS.hairlineSoft}
              strokeDasharray="2 4"
              vertical={false}
            />
            <XAxis
              dataKey="month"
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
            />
            <Tooltip
              cursor={{ stroke: CHART_COLORS.gold, strokeOpacity: 0.4 }}
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
              formatter={(value: number, name: string) => {
                const label = name === 'closed' ? 'Closed' : 'New listings';
                return [`${value}`, label];
              }}
            />
            <Legend wrapperStyle={{ display: 'none' }} />
            <Area
              type="monotone"
              dataKey="newListings"
              stroke={CHART_COLORS.bronze}
              strokeWidth={1.5}
              fill="url(#grad-new)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="closed"
              stroke={CHART_COLORS.gold}
              strokeWidth={2}
              fill="url(#grad-closed)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
