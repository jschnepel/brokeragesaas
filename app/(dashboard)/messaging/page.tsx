import type { Metadata } from "next"
import { MessagingClient } from "./MessagingClient"

export const metadata: Metadata = { title: "Messaging — RLSIR Platform" }

export default function MessagingPage() {
  return <MessagingClient />
}
