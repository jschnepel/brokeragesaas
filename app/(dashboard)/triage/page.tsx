import { auth } from "@/auth"
import { getRequests, getKPIs, getVolumeByWeek, getMaterialBreakdown, getRecentMessages, getDesigners } from "@/actions/intake"
import { TriageClient } from "./TriageClient"

export default async function TriagePage() {
  const session = await auth()
  const [requests, kpis, volume, materials, messages, designers] = await Promise.all([
    getRequests(), getKPIs(), getVolumeByWeek(12), getMaterialBreakdown(), getRecentMessages(10), getDesigners(),
  ])
  return (
    <TriageClient
      requests={requests}
      kpis={kpis}
      volume={volume}
      materials={materials}
      recentMessages={messages}
      designers={designers}
      currentUserId={session!.user!.id as string}
    />
  )
}
