"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/primitives";
import type { MaterialBreakdown } from "@/lib/types";

const COLORS = ["#0F2B4F", "#C9A96E", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"];

interface Props {
  data: MaterialBreakdown[];
}

export function MaterialChart({ data }: Props) {
  return (
    <GlassCard>
      <h3
        className="mb-4 text-base font-semibold text-[var(--foreground)]"
        style={{ fontFamily: "var(--brand-font-display)" }}
      >
        Material Breakdown
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="materialType"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ materialType, percentage }) =>
                `${materialType} ${percentage.toFixed(0)}%`
              }
              labelLine={{ stroke: "#6b7280" }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
