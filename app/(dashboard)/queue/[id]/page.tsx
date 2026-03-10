import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getRequestById } from "@/actions/intake"
import type { StatusLogDTO } from "@/lib/types"
import { RequestDetailClient } from "../../requests/[id]/RequestDetailClient"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QueueDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const userId = session.user.id

  const request = await getRequestById(id)
  if (!request) notFound()

  // Mock status log until we wire up a real query
  const statusLog: StatusLogDTO[] = []

  return (
    <RequestDetailClient
      request={request}
      currentUserId={userId}
      viewerRole="designer"
      statusLog={statusLog}
    />
  )
}
