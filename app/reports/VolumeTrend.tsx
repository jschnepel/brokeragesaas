"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/primitives";
import type { VolumeWeek } from "@/lib/types";

interface Props {
  data: VolumeWeek[];
}

export function VolumeTrend({ data }: Props) {
  return (
    <GlassCard>
      <h3
        className="mb-4 text-base font-semibold text-[var(--foreground)]"
        style={{ fontFamily: "var(--brand-font-display)" }}
      >
        Volume Trend
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F2B4F" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0F2B4F" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="submitted"
              name="Submitted"
              stroke="#0F2B4F"
              fill="url(#gradSubmitted)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#C9A96E"
              fill="url(#gradCompleted)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
