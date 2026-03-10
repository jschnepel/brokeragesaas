"use client"

import { useState, useCallback } from "react"
import type {
  RequestDTO,
  KPIs,
  VolumeWeek,
  DesignerLoad,
  MaterialBreakdown,
  TeamHealth,
  IntakeQueueItem,
  AgentRow,
} from "@/lib/types"
import { BRAND_COLORS, CHART_COLORS } from "@/lib/config/brand"
import { LAYOUT } from "@/lib/config/layout"
import { updateRequestStatus, assignRequest } from "@/actions/intake"
import { QuickActionSheet } from "@/components/features/QuickActionSheet"
import {
  PiePanel,
  BarChartPanel,
  TeamHealthGrid,
  DesignerTable,
  IntakeQueue,
  MyQueueCards,
} from "./components"

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  allRequests: RequestDTO[]
  kpis: KPIs
  volumeByWeek: VolumeWeek[]
  personalVolumeByWeek: VolumeWeek[]
  designerLoad: DesignerLoad[]
  materialBreakdown: MaterialBreakdown[]
  teamHealth: TeamHealth
  intakeQueue: IntakeQueueItem[]
  designers: AgentRow[]
  currentUserId: string
  userRole: string
}

// ── Build chart data from DB results ────────────────────────────────────

function buildRequestsPieData(kpis: KPIs) {
  const active = kpis.openRequests
  const breached = Math.round(kpis.totalRequests * kpis.slaBreachRate)
  const rush = Math.round(kpis.totalRequests * kpis.rushPercentage)
  const completed = kpis.completedRequests
  return [
    { name: "Active", value: active, color: BRAND_COLORS.navy },
    { name: "Completed", value: completed, color: "#15803D" },
    { name: "SLA Breached", value: breached, color: "#DC2626" },
    { name: "Rush", value: rush, color: "#92400E" },
  ].filter((d) => d.value > 0)
}

function buildMaterialsPieData(breakdown: MaterialBreakdown[]) {
  const palette = CHART_COLORS.palette
  return breakdown.map((m, i) => ({
    name: m.materialType,
    value: m.count,
    color: palette[i % palette.length],
  }))
}

// ── Role Gate ───────────────────────────────────────────────────────────

function AccessDenied({ role }: { role: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="text-5xl font-light text-muted-foreground/30" style={{ fontFamily: "var(--brand-font-display)" }}>403</div>
      <div className="text-sm font-bold tracking-wide" style={{ color: BRAND_COLORS.navy }}>Access Restricted</div>
      <p className="max-w-[280px] text-center text-xs leading-relaxed text-muted-foreground">
        The Design Queue is only available to designers and marketing managers.
        Contact your office administrator for access.
      </p>
      <span className="mt-2 bg-muted px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Role: {role}
      </span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────

export function QueueClient({
  allRequests,
  kpis,
  volumeByWeek,
  personalVolumeByWeek,
  materialBreakdown,
  teamHealth,
  intakeQueue,
  designers,
  currentUserId,
  userRole,
}: Props) {
  const [requests, setRequests] = useState(allRequests)
  const [selectedRequest, setSelectedRequest] = useState<RequestDTO | null>(null)
  const [loadingAction, setLoadingAction] = useState(false)

  // Role gate
  const allowed = ["designer", "marketing_manager", "executive"]
  if (!allowed.includes(userRole)) {
    return <AccessDenied role={userRole} />
  }

  const requestsPieData = buildRequestsPieData(kpis)
  const materialsPieData = buildMaterialsPieData(materialBreakdown)

  const handleSelectRequest = useCallback((r: RequestDTO) => {
    setSelectedRequest(r)
  }, [])

  const handleCancel = useCallback((r: RequestDTO) => {
    setSelectedRequest(r)
  }, [])

  const handleStatusUpdate = useCallback(async (requestId: string, newStatus: string) => {
    setLoadingAction(true)
    try {
      await updateRequestStatus(requestId, newStatus)
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r)),
      )
      setSelectedRequest((prev) =>
        prev && prev.id === requestId ? { ...prev, status: newStatus } : prev,
      )
    } catch (err) {
      console.error("Failed to update status:", err)
    } finally {
      setLoadingAction(false)
    }
  }, [])

  const handleIntakeApprove = useCallback(async (requestId: string, designerId: string, designerName: string) => {
    await assignRequest(requestId, designerId)
    const updated = await updateRequestStatus(requestId, "assigned")
    if (updated) {
      // Add to main requests list (or update if already present)
      setRequests((prev) => {
        const exists = prev.some((r) => r.id === requestId)
        if (exists) {
          return prev.map((r) => r.id === requestId ? { ...r, status: "assigned", assignedTo: designerId, designerName } : r)
        }
        return [{ ...updated, designerName }, ...prev]
      })
    }
  }, [])

  // Filter my requests (assigned to current user)
  const myRequests = requests.filter((r) => r.assignedTo === currentUserId)

  return (
    <div className="space-y-6 py-6">
      {/* Page header */}
      <div className="mb-6">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: BRAND_COLORS.gold }}>
          Marketing · Creative Director
        </div>
        <h2
          className="text-[28px] font-light tracking-tight"
          style={{ fontFamily: "var(--brand-font-display)", color: BRAND_COLORS.navy }}
        >
          Operations Overview
        </h2>
      </div>

      {/* Analytics Row: Pie | Chart | Health */}
      <div
        className="mb-6 grid items-stretch gap-4"
        style={{
          height: LAYOUT.queue.analyticsHeight,
          gridTemplateColumns: LAYOUT.queue.analyticsGrid,
        }}
      >
        <PiePanel requestsData={requestsPieData} materialsData={materialsPieData} />
        <BarChartPanel teamData={volumeByWeek} personalData={personalVolumeByWeek} />
        <TeamHealthGrid
          revisionRate={teamHealth.revisionRate}
          slaCompliance={teamHealth.slaCompliance}
          reqPerDesigner={teamHealth.reqPerDesigner}
          avgCompletionDays={teamHealth.avgCompletionDays}
        />
      </div>

      {/* All Requests Table */}
      <DesignerTable
        requests={requests}
        currentUserId={currentUserId}
        onSelectRequest={handleSelectRequest}
        onCancel={handleCancel}
      />

      {/* Intake Queue */}
      <IntakeQueue items={intakeQueue} designers={designers} onApprove={handleIntakeApprove} />

      {/* My Queue Cards */}
      <MyQueueCards requests={myRequests} onSelect={handleSelectRequest} />

      {/* Quick action sheet */}
      <QuickActionSheet
        request={selectedRequest}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        viewerRole="designer"
        loadingAction={loadingAction}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  )
}
