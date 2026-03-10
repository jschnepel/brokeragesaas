"use client"

import Link from "next/link"
import { BRAND_COLORS } from "@/lib/config/brand"
import { StatusBadge } from "@/components/primitives/StatusBadge"
import { DashboardKPI } from "./DashboardKPI"
import type { RequestDTO, KPIs } from "@/lib/types"

interface RecentMessage {
  id: string
  senderName: string
  body: string
  createdAt: string
  requestId: string
}

interface DesignerDashboardProps {
  requests: RequestDTO[]
  kpis: KPIs
  recentMessages: RecentMessage[]
  currentUserId: string
}

type SlaStatus = "breached" | "warning" | "ok"

function getSlaStatus(r: RequestDTO): SlaStatus {
  if (r.slaBreached) return "breached"
  if (!r.slaDeadline) return "ok"
  const hoursLeft = (new Date(r.slaDeadline).getTime() - Date.now()) / 3600000
  if (hoursLeft <= 4) return "warning"
  return "ok"
}

function slaCountdown(r: RequestDTO): string {
  if (r.slaBreached) return "BREACHED"
  if (!r.slaDeadline) return "—"
  const hoursLeft = (new Date(r.slaDeadline).getTime() - Date.now()) / 3600000
  if (hoursLeft <= 0) return "BREACHED"
  if (hoursLeft < 1) return `${Math.round(hoursLeft * 60)}m left`
  if (hoursLeft < 24) return `${Math.round(hoursLeft)}h left`
  return `${Math.round(hoursLeft / 24)}d left`
}

const SLA_COLOR: Record<SlaStatus, string> = {
  breached: "text-red-600 font-semibold",
  warning: "text-amber-600 font-medium",
  ok: "text-emerald-600",
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function DesignerDashboard({
  requests,
  kpis,
  recentMessages,
  currentUserId,
}: DesignerDashboardProps) {
  const activeStatuses = ["submitted", "in_review", "assigned", "in_progress", "awaiting_materials"]
  const myQueue = requests.filter(
    (r) => r.assignedTo === currentUserId && activeStatuses.includes(r.status)
  )
  const myInProgress = myQueue.filter((r) => r.status === "in_progress")

  const sevenDaysAgo = Date.now() - 7 * 24 * 3600000
  const completedThisWeek = requests.filter(
    (r) =>
      r.assignedTo === currentUserId &&
      r.status === "completed" &&
      new Date(r.submittedAt).getTime() >= sevenDaysAgo
  )

  const slaCompliance = kpis.slaBreachRate != null
    ? `${Math.round(100 - kpis.slaBreachRate)}%`
    : "—"

  // Sort queue by SLA urgency: breached first, then warning, then ok
  const sortedQueue = [...myQueue].sort((a, b) => {
    const order: Record<SlaStatus, number> = { breached: 0, warning: 1, ok: 2 }
    return order[getSlaStatus(a)] - order[getSlaStatus(b)]
  }).slice(0, 5)

  return (
    <div data-testid="designer-dashboard" className="space-y-6 py-6">
      {/* Header */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: BRAND_COLORS.gold }}
        >
          Design Studio
        </p>
        <h1
          className="mt-1 text-3xl font-light"
          style={{ fontFamily: "var(--brand-font-display)", color: BRAND_COLORS.navy }}
        >
          My Workspace
        </h1>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <DashboardKPI
          label="My Queue"
          value={myQueue.length}
          subText={`${myQueue.filter((r) => r.isRush).length} rush`}
          signal={myQueue.length > 8 ? "warning" : "ok"}
        />
        <DashboardKPI
          label="In Progress"
          value={myInProgress.length}
        />
        <DashboardKPI
          label="Completed This Week"
          value={completedThisWeek.length}
          signal="ok"
        />
        <DashboardKPI
          label="SLA Compliance"
          value={slaCompliance}
          signal={kpis.slaBreachRate > 10 ? "critical" : kpis.slaBreachRate > 5 ? "warning" : "ok"}
        />
      </div>

      {/* My Queue Table */}
      <div className="rounded-md border bg-card">
        <div className="p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            My Queue
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="designer-queue-table">
            <thead>
              <tr className="border-b text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-2 font-semibold">#</th>
                <th className="px-4 py-2 font-semibold">Title</th>
                <th className="px-4 py-2 font-semibold">Requester</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">SLA</th>
              </tr>
            </thead>
            <tbody>
              {sortedQueue.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Queue is empty
                  </td>
                </tr>
              )}
              {sortedQueue.map((r) => {
                const sla = getSlaStatus(r)
                return (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      {String(r.queueNumber).padStart(3, "0")}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/requests/${r.id}`}
                        className="font-medium hover:underline"
                        data-testid={`queue-link-${r.id}`}
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.requesterName}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className={`px-4 py-2.5 text-xs ${SLA_COLOR[sla]}`}>
                      {slaCountdown(r)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="rounded-md border bg-card">
        <div className="p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Recent Messages
          </h3>
        </div>
        <div className="flex flex-col" data-testid="designer-recent-messages">
          {recentMessages.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No messages yet
            </p>
          )}
          {recentMessages.map((m) => (
            <Link
              key={m.id}
              href={`/requests/${m.requestId}`}
              className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-muted/50 transition-colors"
              data-testid={`message-${m.id}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{m.senderName}</p>
                <p className="truncate text-xs text-muted-foreground">{m.body}</p>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {timeAgo(m.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
