import { auth } from "@/auth"
import { getRequests, getKPIs } from "@/actions/intake"
import { RequestsClient } from "./RequestsClient"

export default async function RequestsPage() {
  const session = await auth()
  const userId = session!.user!.id as string
  const [requests, kpis] = await Promise.all([
    getRequests({ requesterId: userId }),
    getKPIs(),
  ])
  return <RequestsClient requests={requests} kpis={kpis} currentUserId={userId} />
}
