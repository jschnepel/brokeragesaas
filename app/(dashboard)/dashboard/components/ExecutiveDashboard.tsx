"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashKPI } from "./DashKPI"
import { SectionHeader } from "./SectionHeader"
import {
  EXEC_KPIS,
  ACTIVE_REQUESTS,
  TRIAGE_ITEMS,
  DESIGNER_WORKLOADS,
  DESIGNER_ACTIVITY,
} from "../mock-data"

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  assigned: "bg-purple-100 text-purple-700",
  in_progress: "bg-blue-100 text-blue-700",
  awaiting_materials: "bg-orange-100 text-orange-700",
}

// ── All Active Requests Table ────────────────────────────────────────────────

function AllActiveRequestsTable() {
  const allRequests = [...ACTIVE_REQUESTS, ...TRIAGE_ITEMS.map((t) => ({
    id: t.id,
    queueNumber: t.queueNumber,
    title: t.title,
    materialType: t.materialType,
    status: "submitted" as const,
    statusLabel: "Submitted",
    isRush: t.isRush,
    submittedAt: t.submittedAt,
    dueDate: null,
    assignedTo: null,
    designerName: null,
  }))]

  return (
    <Card>
      <CardContent className="p-4">
        <SectionHeader title="All Active Requests" />
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, textAlign: "left", padding: "8px 4px", fontFamily: "var(--brand-font-body)" }} className="text-muted-foreground">#</th>
                <th style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, textAlign: "left", padding: "8px 4px", fontFamily: "var(--brand-font-body)" }} className="text-muted-foreground">Title</th>
                <th style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, textAlign: "left", padding: "8px 4px", fontFamily: "var(--brand-font-body)" }} className="text-muted-foreground">Type</th>
                <th style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, textAlign: "left", padding: "8px 4px", fontFamily: "var(--brand-font-body)" }} className="text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {allRequests.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <td style={{ padding: "8px 4px", fontSize: "var(--text-xs, 11px)", fontFamily: "var(--brand-font-mono)" }} className="text-muted-foreground">
                    #{String(r.queueNumber).padStart(3, "0")}
                  </td>
                  <td style={{ padding: "8px 4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: "var(--text-sm, 12px)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 }}>
                        {r.title}
                      </span>
                      {r.isRush && <Zap className="size-3 text-red-500 shrink-0" />}
                    </div>
                  </td>
                  <td style={{ padding: "8px 4px", fontSize: "var(--text-sm, 12px)" }} className="text-muted-foreground">
                    {r.materialType}
                  </td>
                  <td style={{ padding: "8px 4px" }}>
                    <Badge className={cn("pointer-events-none text-[10px]", STATUS_COLORS[r.status] ?? "bg-secondary text-secondary-foreground")}>
                      {r.statusLabel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Recent Activity Feed ─────────────────────────────────────────────────────

function RecentActivityFeed() {
  return (
    <Card>
      <CardContent className="p-4">
        <SectionHeader title="Recent Activity" />
        <div className="flex flex-col gap-2">
          {DESIGNER_ACTIVITY.map((entry) => (
            <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "var(--text-sm, 12px)", flex: 1 }}>
                {entry.text}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs, 11px)", fontFamily: "var(--brand-font-mono)", flexShrink: 0 }}>
                {entry.timestamp}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Designer Workload ────────────────────────────────────────────────────────

function DesignerWorkloadPanel() {
  return (
    <Card>
      <CardContent className="p-4">
        <SectionHeader title="Designer Workload" />
        <div className="flex flex-col gap-3">
          {DESIGNER_WORKLOADS.map((d) => {
            const pct = Math.round((d.active / d.capacity) * 100)
            const isNearCapacity = pct >= 80
            return (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "var(--text-sm, 12px)", fontWeight: 500 }}>
                    {d.name}
                  </span>
                  <span
                    className={cn("tabular-nums", isNearCapacity ? "text-red-600" : "text-muted-foreground")}
                    style={{ fontSize: "var(--text-xs, 11px)", fontFamily: "var(--brand-font-mono)" }}
                  >
                    {d.active}/{d.capacity}
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, backgroundColor: "var(--muted)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      borderRadius: 4,
                      backgroundColor: isNearCapacity ? "#DC2626" : "var(--brand-accent)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Executive Dashboard ──────────────────────────────────────────────────────

export function ExecutiveDashboard() {
  return (
    <div data-testid="executive-dashboard" className="flex flex-col gap-4">
      {/* 4 KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {EXEC_KPIS.map((kpi) => (
          <DashKPI key={kpi.label} label={kpi.label} value={kpi.value} subText={kpi.subText} />
        ))}
      </div>

      {/* Main: LEFT table + activity | RIGHT workload */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
        <div className="flex flex-col gap-4">
          <AllActiveRequestsTable />
          <RecentActivityFeed />
        </div>
        <DesignerWorkloadPanel />
      </div>
    </div>
  )
}
