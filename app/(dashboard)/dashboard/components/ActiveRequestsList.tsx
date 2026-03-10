"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeader } from "./SectionHeader"
import type { DashRequest } from "../mock-data"

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  assigned: "bg-purple-100 text-purple-700",
  in_progress: "bg-blue-100 text-blue-700",
  awaiting_materials: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
}

interface ActiveRequestsListProps {
  requests: DashRequest[]
}

export function ActiveRequestsList({ requests }: ActiveRequestsListProps) {
  return (
    <Card data-testid="active-requests-list">
      <CardContent className="p-4">
        <SectionHeader title="Active Requests" />
        <div
          style={{ maxHeight: 280, overflowY: "auto" }}
          className="flex flex-col gap-2"
        >
          {requests.length === 0 && (
            <p
              className="text-muted-foreground"
              style={{ fontSize: "var(--text-sm, 12px)", textAlign: "center", padding: 24 }}
            >
              No active requests
            </p>
          )}
          {requests.map((r) => (
            <div
              key={r.id}
              data-testid={`request-item-${r.id}`}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: 8,
                cursor: "pointer",
              }}
              className="hover:bg-muted/50 transition-colors"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span
                      className="text-muted-foreground"
                      style={{
                        fontSize: "var(--text-xs, 11px)",
                        fontFamily: "var(--brand-font-mono)",
                      }}
                    >
                      #{String(r.queueNumber).padStart(3, "0")}
                    </span>
                    {r.isRush && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">
                        <Zap className="mr-0.5 size-2.5" />
                        Rush
                      </Badge>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "var(--text-sm, 12px)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.title}
                  </p>
                  <p
                    className="text-muted-foreground"
                    style={{ fontSize: "var(--text-xs, 11px)" }}
                  >
                    {r.materialType}
                    {r.designerName ? ` — ${r.designerName}` : ""}
                  </p>
                </div>
                <Badge
                  className={cn(
                    "pointer-events-none text-[10px] shrink-0",
                    STATUS_COLORS[r.status] ?? "bg-secondary text-secondary-foreground",
                  )}
                >
                  {r.statusLabel}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
