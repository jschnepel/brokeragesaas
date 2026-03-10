"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Zap, Check, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { CHART_COLORS, CHART_STYLE } from "@/lib/config/brand"
import { AgentKPITile } from "./AgentKPITile"
import { MiniCalendar } from "./MiniCalendar"
import { RecentMessages } from "./RecentMessages"
import { SectionHeader } from "./SectionHeader"
import {
  MANAGER_KPIS,
  DESIGNER_CAPACITY,
  TRIAGE_ITEMS,
  NEEDS_ATTENTION,
  CALENDAR_EVENTS,
  RECENT_MESSAGES,
  ACTIVE_REQUESTS,
  VOLUME_CHART,
  SLA_CHART,
  BY_TYPE_CHART,
} from "../mock-data"

// ── Charts Panel ─────────────────────────────────────────────────────────────

function ManagerChartsPanel() {
  return (
    <Card>
      <CardContent className="p-4">
        <SectionHeader title="Analytics" />
        <Tabs defaultValue="volume">
          <TabsList className="mb-4">
            <TabsTrigger value="volume" data-testid="mgr-tab-volume">Volume</TabsTrigger>
            <TabsTrigger value="sla" data-testid="mgr-tab-sla">SLA</TabsTrigger>
            <TabsTrigger value="bytype" data-testid="mgr-tab-bytype">By Type</TabsTrigger>
          </TabsList>

          <TabsContent value="volume">
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={VOLUME_CHART}>
                  <CartesianGrid strokeDasharray={CHART_STYLE.gridDash} stroke={CHART_STYLE.gridStroke} />
                  <XAxis dataKey="week" fontSize={CHART_STYLE.tickFontSize} tick={{ fill: CHART_STYLE.tickColor }} />
                  <YAxis fontSize={CHART_STYLE.tickFontSize} tick={{ fill: CHART_STYLE.tickColor }} />
                  <Tooltip contentStyle={{ borderRadius: CHART_STYLE.tooltipRadius, border: CHART_STYLE.tooltipBorder, fontSize: CHART_STYLE.tooltipFontSize }} />
                  <Legend wrapperStyle={{ fontSize: CHART_STYLE.legendFontSize }} />
                  <Bar dataKey="submitted" name="Submitted" fill={CHART_COLORS.primary} radius={CHART_STYLE.barRadius} />
                  <Bar dataKey="completed" name="Completed" fill={CHART_COLORS.secondary} radius={CHART_STYLE.barRadius} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="sla">
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <LineChart data={SLA_CHART}>
                  <CartesianGrid strokeDasharray={CHART_STYLE.gridDash} stroke={CHART_STYLE.gridStroke} />
                  <XAxis dataKey="week" fontSize={CHART_STYLE.tickFontSize} tick={{ fill: CHART_STYLE.tickColor }} />
                  <YAxis fontSize={CHART_STYLE.tickFontSize} tick={{ fill: CHART_STYLE.tickColor }} domain={[80, 100]} />
                  <Tooltip contentStyle={{ borderRadius: CHART_STYLE.tooltipRadius, border: CHART_STYLE.tooltipBorder, fontSize: CHART_STYLE.tooltipFontSize }} />
                  <Legend wrapperStyle={{ fontSize: CHART_STYLE.legendFontSize }} />
                  <Line type="monotone" dataKey="compliance" name="Compliance %" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="breaches" name="Breaches" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="bytype">
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={BY_TYPE_CHART} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2} label={({ type }: { type: string }) => type}>
                    {BY_TYPE_CHART.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: CHART_STYLE.tooltipRadius, border: CHART_STYLE.tooltipBorder, fontSize: CHART_STYLE.tooltipFontSize }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// ── Needs Attention ──────────────────────────────────────────────────────────

function NeedsAttentionPanel() {
  const severityColors: Record<string, string> = {
    critical: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  }
  const severityIcons: Record<string, typeof AlertTriangle> = {
    critical: AlertTriangle,
    warning: AlertTriangle,
    info: AlertTriangle,
  }

  return (
    <Card>
      <CardContent className="p-4">
        <SectionHeader title="Needs Attention" />
        <div className="flex flex-col gap-2">
          {NEEDS_ATTENTION.map((item) => {
            const Icon = severityIcons[item.severity]
            return (
              <div
                key={item.id}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}
              >
                {Icon && <Icon className={cn("size-4 shrink-0", severityColors[item.severity])} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "var(--text-sm, 12px)", fontWeight: 500 }}>{item.title}</p>
                  <p className={cn("text-muted-foreground", severityColors[item.severity])} style={{ fontSize: "var(--text-xs, 11px)" }}>
                    {item.reason}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Designer Capacity Panel ──────────────────────────────────────────────────

function DesignerCapacityPanel() {
  return (
    <Card>
      <CardContent className="p-4">
        <SectionHeader title="Designer Capacity" />
        <div className="flex flex-col gap-3">
          {DESIGNER_CAPACITY.map((d) => {
            const pct = Math.round((d.activeCount / d.maxCapacity) * 100)
            const isNearCapacity = pct >= 80
            return (
              <div key={d.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "var(--text-sm, 12px)", fontWeight: 500 }}>{d.name}</span>
                  <span
                    className={cn("tabular-nums", isNearCapacity ? "text-red-600" : "text-muted-foreground")}
                    style={{ fontSize: "var(--text-xs, 11px)", fontFamily: "var(--brand-font-mono)" }}
                  >
                    {d.activeCount}/{d.maxCapacity}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, backgroundColor: "var(--muted)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      borderRadius: 3,
                      backgroundColor: isNearCapacity ? "#DC2626" : "var(--brand-accent)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  {Object.entries(d.avgTurnaroundByType).map(([type, hours]) => (
                    <span key={type} className="text-muted-foreground" style={{ fontSize: 9, fontFamily: "var(--brand-font-mono)" }}>
                      {type}: {hours}h
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Quick Triage ─────────────────────────────────────────────────────────────

function QuickTriagePanel() {
  return (
    <Card>
      <CardContent className="p-4">
        <SectionHeader title="Quick Triage" />
        <div className="flex flex-col gap-2">
          {TRIAGE_ITEMS.map((item) => (
            <div
              key={item.id}
              data-testid={`triage-item-${item.id}`}
              style={{ border: "1px solid var(--border)", borderRadius: 4, padding: 8 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs, 11px)", fontFamily: "var(--brand-font-mono)" }}>
                  #{String(item.queueNumber).padStart(3, "0")}
                </span>
                {item.isRush && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">
                    <Zap className="mr-0.5 size-2.5" />Rush
                  </Badge>
                )}
                <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs, 11px)", marginLeft: "auto" }}>
                  {item.materialType}
                </span>
              </div>
              <p style={{ fontSize: "var(--text-sm, 12px)", fontWeight: 500, marginBottom: 4 }}>{item.title}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs, 11px)" }}>{item.requesterName}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Button size="sm" variant="outline" className="size-7 p-0" data-testid={`triage-approve-${item.id}`}>
                    <Check className="size-3.5 text-green-600" />
                  </Button>
                  <Button size="sm" variant="outline" className="size-7 p-0" data-testid={`triage-reject-${item.id}`}>
                    <X className="size-3.5 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Active Queue Full List ───────────────────────────────────────────────────

function ActiveQueueFullList() {
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

  const STATUS_COLORS_MAP: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-700",
    in_review: "bg-amber-100 text-amber-700",
    assigned: "bg-purple-100 text-purple-700",
    in_progress: "bg-blue-100 text-blue-700",
    awaiting_materials: "bg-orange-100 text-orange-700",
  }

  return (
    <Card>
      <CardContent className="p-4">
        <SectionHeader title="Active Queue" />
        <div className="flex flex-col gap-2" style={{ maxHeight: 300, overflowY: "auto" }}>
          {allRequests.map((r) => (
            <div
              key={r.id}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}
            >
              <span className="text-muted-foreground" style={{ fontSize: "var(--text-xs, 11px)", fontFamily: "var(--brand-font-mono)", width: 36 }}>
                #{String(r.queueNumber).padStart(3, "0")}
              </span>
              <span style={{ flex: 1, fontSize: "var(--text-sm, 12px)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.title}
              </span>
              {r.isRush && <Zap className="size-3 text-red-500 shrink-0" />}
              <Badge className={cn("pointer-events-none text-[10px] shrink-0", STATUS_COLORS_MAP[r.status] ?? "bg-secondary text-secondary-foreground")}>
                {r.statusLabel}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Manager Dashboard ────────────────────────────────────────────────────────

export function ManagerDashboard() {
  return (
    <div data-testid="manager-dashboard" className="flex flex-col gap-4">
      {/* Row 1: Charts + Needs Attention | Calendar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="flex flex-col gap-4">
          <ManagerChartsPanel />
          <NeedsAttentionPanel />
        </div>
        <MiniCalendar events={CALENDAR_EVENTS} />
      </div>

      {/* Row 2: KPI Grid | Designer Capacity | Quick Triage */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 390px 1fr", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8 }}>
          {MANAGER_KPIS.map((kpi) => (
            <AgentKPITile key={kpi.label} kpi={kpi} />
          ))}
        </div>
        <DesignerCapacityPanel />
        <QuickTriagePanel />
      </div>

      {/* Row 3: Recent Messages | Active Queue */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <RecentMessages messages={RECENT_MESSAGES} />
        <ActiveQueueFullList />
      </div>
    </div>
  )
}
