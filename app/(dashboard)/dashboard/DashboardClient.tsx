"use client"

import type { PlatformRole, RequestDTO, KPIs } from "@/lib/types"
import { ROLES } from "@/lib/constants"
import { AgentDashboard } from "./components/AgentDashboard"
import { DesignerDashboard } from "./components/DesignerDashboard"
import { ManagerDashboard } from "./components/ManagerDashboard"
import { ExecutiveDashboard } from "./components/ExecutiveDashboard"

interface RecentMessage {
  id: string
  senderName: string
  body: string
  createdAt: string
  requestId: string
}

interface DashboardClientProps {
  role: PlatformRole
  requests: RequestDTO[]
  kpis: KPIs
  recentMessages: RecentMessage[]
  currentUserId: string
}

export function DashboardClient({
  role,
  requests,
  kpis,
  recentMessages,
  currentUserId,
}: DashboardClientProps) {
  switch (role) {
    case ROLES.DESIGNER:
      return (
        <DesignerDashboard
          requests={requests}
          kpis={kpis}
          recentMessages={recentMessages}
          currentUserId={currentUserId}
        />
      )
    case ROLES.MARKETING_MANAGER:
      return <ManagerDashboard />
    case ROLES.EXECUTIVE:
      return <ExecutiveDashboard />
    case ROLES.AGENT:
    default:
      return (
        <AgentDashboard
          requests={requests}
          kpis={kpis}
          recentMessages={recentMessages}
          currentUserId={currentUserId}
        />
      )
  }
}
