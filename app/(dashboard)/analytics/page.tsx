import type { Metadata } from "next"
import { TrendingUp } from "lucide-react"

export const metadata: Metadata = { title: "Analytics — RLSIR Platform" }

export default function AnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <TrendingUp className="size-12 text-muted-foreground/40" />
      <div>
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Advanced analytics and insights — coming soon
        </p>
      </div>
    </div>
  )
}
