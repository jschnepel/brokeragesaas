import type { Metadata } from "next"
import { Building2 } from "lucide-react"

export const metadata: Metadata = { title: "Listings — RLSIR Platform" }

export default function ListingsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Building2 className="size-12 text-muted-foreground/40" />
      <div>
        <h1 className="text-lg font-semibold">Listings</h1>
        <p className="text-sm text-muted-foreground">
          Property listings management — coming soon
        </p>
      </div>
    </div>
  )
}
