import type { Metadata } from "next"
import { auth } from "@/auth"
import type { PlatformRole } from "@/lib/types"
import { getRequests, getKPIs, getRecentMessages } from "@/actions/intake"
import { DashboardClient } from "./DashboardClient"

export const metadata: Metadata = { title: "Dashboard — RLSIR Platform" }

export default async function DashboardPage() {
  const session = await auth()
  const role = ((session?.user as { role?: string } | undefined)?.role ?? "agent") as PlatformRole
  const currentUserId = session?.user?.id ?? ""

  const [requests, kpis, rawMessages] = await Promise.all([
    getRequests(),
    getKPIs(),
    getRecentMessages(5),
  ])

  const recentMessages = rawMessages.map((m) => ({
    id: m.id,
    senderName: m.sender_name ?? "Unknown",
    body: m.body,
    createdAt: m.created_at,
    requestId: m.request_id,
  }))

  return (
    <DashboardClient
      role={role}
      requests={requests}
      kpis={kpis}
      recentMessages={recentMessages}
      currentUserId={currentUserId}
    />
  )
}
