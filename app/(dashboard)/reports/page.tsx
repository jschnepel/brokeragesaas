import { auth } from "@/auth"
import { getKPIs, getVolumeByWeek, getMaterialBreakdown, getDesignerLoad } from "@/actions/intake"
import { ReportsClient } from "./ReportsClient"

export default async function ReportsPage() {
  const session = await auth()
  const [kpis, volume, materials, designerLoad] = await Promise.all([
    getKPIs(),
    getVolumeByWeek(12),
    getMaterialBreakdown(),
    getDesignerLoad(),
  ])

  return (
    <ReportsClient
      kpis={kpis}
      volume={volume}
      materials={materials}
      designerLoad={designerLoad}
    />
  )
}
