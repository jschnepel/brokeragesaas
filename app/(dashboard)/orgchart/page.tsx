import type { Metadata } from "next"
import { OrgChartClient } from "./OrgChartClient"

export const metadata: Metadata = {
  title: "Org Chart — RLSIR Platform",
}

export default function OrgChartPage() {
  return <OrgChartClient />
}
