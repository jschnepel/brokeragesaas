"use client";

import {
  FileText,
  Clock,
  CheckCircle,
  Timer,
  AlertTriangle,
  Zap,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { KPITile, GlassCard } from "@/components/primitives";
import type { KPIs, VolumeWeek, MaterialBreakdown, DesignerLoad } from "@/lib/types";
import { VolumeTrend } from "./VolumeTrend";
import { WorkloadTable } from "./WorkloadTable";

const PIE_COLORS = ["#0F2B4F", "#C9A96E", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"];

interface Props {
  kpis: KPIs;
  volume: VolumeWeek[];
  materials: MaterialBreakdown[];
  designerLoad: DesignerLoad[];
}

export function ReportsClient({ kpis, volume, materials, designerLoad }: Props) {
  const hours = kpis.avgTurnaroundHours;
  const turnaround =
    hours >= 24 ? `${(hours / 24).toFixed(1)}d` : `${Math.round(hours)}h`;

  return (
    <AppShell title="Reports">
      {/* KPI grid — 6 tiles */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KPITile label="Total Requests" value={kpis.totalRequests} icon={<FileText className="size-5" />} />
        <KPITile label="Open" value={kpis.openRequests} icon={<Clock className="size-5" />} />
        <KPITile label="Completed" value={kpis.completedRequests} icon={<CheckCircle className="size-5" />} />
        <KPITile label="Avg Turnaround" value={turnaround} icon={<Timer className="size-5" />} />
        <KPITile
          label="SLA Breach Rate"
          value={`${(kpis.slaBreachRate * 100).toFixed(1)}%`}
          icon={<AlertTriangle className="size-5" />}
        />
        <KPITile
          label="Rush %"
          value={`${(kpis.rushPercentage * 100).toFixed(1)}%`}
          icon={<Zap className="size-5" />}
        />
      </div>

      {/* Volume trend */}
      <div className="mb-8">
        <VolumeTrend data={volume} />
      </div>

      {/* Material breakdown + Designer workload */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h3
            className="mb-4 text-base font-semibold text-[var(--foreground)]"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            Material Breakdown
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={materials}
                  dataKey="count"
                  nameKey="materialType"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ materialType, percentage }) =>
                    `${materialType} ${percentage.toFixed(0)}%`
                  }
                  labelLine={{ stroke: "#6b7280" }}
                >
                  {materials.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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

        <WorkloadTable data={designerLoad} />
      </div>
    </AppShell>
  );
}
