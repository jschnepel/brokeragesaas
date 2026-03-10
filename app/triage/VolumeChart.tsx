"use client";

import {
  BarChart,
  Bar,
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

export function VolumeChart({ data }: Props) {
  return (
    <GlassCard>
      <h3
        className="mb-4 text-base font-semibold text-[var(--foreground)]"
        style={{ fontFamily: "var(--brand-font-display)" }}
      >
        Weekly Volume (12 Weeks)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
            <Bar dataKey="submitted" name="Submitted" fill="#0F2B4F" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill="#C9A96E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
