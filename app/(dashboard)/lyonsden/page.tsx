import type { Metadata } from "next"
import { LyonsDenClient } from "./LyonsDenClient"

export const metadata: Metadata = {
  title: "Lyon's Den — Russ Lyon Marketing Platform",
  description: "Russ Lyon Sotheby's International Realty intranet hub",
}

export default function LyonsDenPage() {
  return <LyonsDenClient />
}
