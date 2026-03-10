import type { Metadata } from "next"
import { PridesClient } from "./PridesClient"

export const metadata: Metadata = {
  title: "Prides — RLSIR Platform",
}

export default function PridesPage() {
  return <PridesClient />
}
