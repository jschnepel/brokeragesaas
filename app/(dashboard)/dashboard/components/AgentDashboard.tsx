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

interface AgentDashboardProps {
  requests: RequestDTO[]
  kpis: KPIs
  recentMessages: RecentMessage[]
  currentUserId: string
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
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

export function AgentDashboard({
  requests,
  kpis,
  recentMessages,
  currentUserId,
}: AgentDashboardProps) {
  const myRequests = requests.filter((r) => r.requesterId === currentUserId)
  const inProgress = myRequests.filter((r) => r.status === "in_progress")
  const completed = myRequests.filter((r) => r.status === "completed")
  const recentFive = myRequests.slice(0, 5)

  const avgTurnaround = kpis.avgTurnaroundHours
    ? `${Math.round(kpis.avgTurnaroundHours)}h`
    : "—"

  return (
    <div data-testid="agent-dashboard" className="space-y-6 py-6">
      {/* Header */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: BRAND_COLORS.gold }}
        >
          Agent Dashboard
        </p>
        <h1
          className="mt-1 text-3xl font-light"
          style={{ fontFamily: "var(--brand-font-display)", color: BRAND_COLORS.navy }}
        >
          Welcome back
        </h1>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <DashboardKPI
          label="My Requests"
          value={myRequests.length}
          subText={`${myRequests.filter((r) => r.isRush).length} rush`}
        />
        <DashboardKPI
          label="In Progress"
          value={inProgress.length}
          signal={inProgress.length > 5 ? "warning" : "ok"}
        />
        <DashboardKPI
          label="Completed"
          value={completed.length}
          signal="ok"
        />
        <DashboardKPI
          label="Avg Turnaround"
          value={avgTurnaround}
          subText="across all requests"
        />
      </div>

      {/* My Recent Requests */}
      <div className="rounded-md border bg-card">
        <div className="p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            My Requests
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="agent-requests-table">
            <thead>
              <tr className="border-b text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-4 py-2 font-semibold">#</th>
                <th className="px-4 py-2 font-semibold">Title</th>
                <th className="px-4 py-2 font-semibold">Material</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Due</th>
              </tr>
            </thead>
            <tbody>
              {recentFive.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No requests yet
                  </td>
                </tr>
              )}
              {recentFive.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {String(r.queueNumber).padStart(3, "0")}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/requests/${r.id}`}
                      className="font-medium hover:underline"
                      data-testid={`request-link-${r.id}`}
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.materialType}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(r.dueDate)}</td>
                </tr>
              ))}
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
        <div className="flex flex-col" data-testid="agent-recent-messages">
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

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/requests/new"
          className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: BRAND_COLORS.navy }}
          data-testid="new-request-btn"
        >
          New Request
        </Link>
        <Link
          href="/requests"
          className="text-sm font-medium underline-offset-2 hover:underline"
          style={{ color: BRAND_COLORS.navy }}
          data-testid="view-all-requests-link"
        >
          View All Requests
        </Link>
      </div>
    </div>
  )
}
