import type { Metadata } from "next"
import { Contact } from "lucide-react"

export const metadata: Metadata = { title: "Contacts — RLSIR Platform" }

export default function ContactsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Contact className="size-12 text-muted-foreground/40" />
      <div>
        <h1 className="text-lg font-semibold">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          CRM contacts directory — coming soon
        </p>
      </div>
    </div>
  )
}
