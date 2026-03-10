import { auth } from "@/auth"
import {
  getRequests,
  getKPIs,
  getVolumeByWeek,
  getPersonalVolumeByWeek,
  getDesignerLoad,
  getMaterialBreakdown,
  getTeamHealth,
  getIntakeQueue,
  getDesigners,
} from "@/actions/intake"
import { QueueClient } from "./QueueClient"

export default async function QueuePage() {
  const session = await auth()
  const userId = session!.user!.id as string
  const userRole = (session!.user as { role?: string })?.role ?? "designer"

  const [
    allRequests,
    kpis,
    volumeByWeek,
    personalVolumeByWeek,
    designerLoad,
    materialBreakdown,
    teamHealth,
    intakeQueue,
    designers,
  ] = await Promise.all([
    getRequests(),
    getKPIs(),
    getVolumeByWeek(12),
    getPersonalVolumeByWeek(12),
    getDesignerLoad(),
    getMaterialBreakdown(),
    getTeamHealth(),
    getIntakeQueue(),
    getDesigners(),
  ])

  return (
    <QueueClient
      allRequests={allRequests}
      kpis={kpis}
      volumeByWeek={volumeByWeek}
      personalVolumeByWeek={personalVolumeByWeek}
      designerLoad={designerLoad}
      materialBreakdown={materialBreakdown}
      teamHealth={teamHealth}
      intakeQueue={intakeQueue}
      designers={designers}
      currentUserId={userId}
      userRole={userRole}
    />
  )
}
