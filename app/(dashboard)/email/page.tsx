import type { Metadata } from "next"
import { EmailClient } from "./EmailClient"

export const metadata: Metadata = { title: "Email — RLSIR Platform" }

export default function EmailPage() {
  return <EmailClient />
}
