'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PriceBandPoint } from '@/content/market-reports';
import { AXIS_TICK_STYLE, CHART_COLORS, CHART_MARGIN } from './chart-theme';

type VolumeBandsChartProps = {
  data: PriceBandPoint[];
};

export function VolumeBandsChart({ data }: VolumeBandsChartProps) {
  return (
    <div className="w-full">
      {/* Legend */}
      <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
        <li className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-5"
            style={{ background: CHART_COLORS.stoneDeep }}
          />
          <span className="caps text-[9px] text-stone opacity-80">
            Active Inventory
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-5"
            style={{ background: CHART_COLORS.gold }}
          />
          <span className="caps text-[9px] text-stone opacity-80">
            Closed This Quarter
          </span>
        </li>
      </ul>

      <div className="w-full h-[340px]">
        <ResponsiveContainer>
          <BarChart data={data} margin={CHART_MARGIN} barGap={6}>
            <CartesianGrid
              stroke={CHART_COLORS.hairlineSoft}
              strokeDasharray="2 4"
              vertical={false}
            />
            <XAxis
              dataKey="band"
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
              cursor={{ fill: CHART_COLORS.hairlineSoft }}
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
                const label = name === 'forSale' ? 'Active Inventory' : 'Closed';
                return [`${value}`, label];
              }}
            />
            <Bar
              dataKey="forSale"
              fill={CHART_COLORS.stoneDeep}
              radius={[0, 0, 0, 0]}
              maxBarSize={44}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS.stoneDeep} />
              ))}
            </Bar>
            <Bar
              dataKey="sold"
              fill={CHART_COLORS.gold}
              radius={[0, 0, 0, 0]}
              maxBarSize={44}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS.gold} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
