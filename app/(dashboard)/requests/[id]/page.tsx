import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getRequestById } from "@/actions/intake"
import type { ViewerRole, StatusLogDTO } from "@/lib/types"
import { RequestDetailClient } from "./RequestDetailClient"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const userId = session.user.id
  const userRole = (session.user as { role?: string }).role ?? "agent"
  // Marketing managers have designer privileges
  const viewerRole: ViewerRole = userRole === "marketing_manager" ? "designer" : (userRole as ViewerRole)

  const request = await getRequestById(id)
  if (!request) notFound()

  // Mock status log until we wire up a real query
  const statusLog: StatusLogDTO[] = []

  return (
    <RequestDetailClient
      request={request}
      currentUserId={userId}
      viewerRole={viewerRole}
      statusLog={statusLog}
    />
  )
}
