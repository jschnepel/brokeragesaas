"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SectionHeader } from "./SectionHeader"
import type { ActionItem, Priority } from "../mock-data"

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
}

interface ActionItemsProps {
  items: ActionItem[]
}

export function ActionItems({ items: initialItems }: ActionItemsProps) {
  const [items, setItems] = useState(initialItems)

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    )
  }

  return (
    <Card data-testid="action-items">
      <CardContent className="p-4">
        <SectionHeader title="Action Items" />
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const d = new Date(item.dueDate + "T00:00:00")
            const dateStr = d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })

            return (
              <div
                key={item.id}
                data-testid={`action-item-${item.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                }}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggleItem(item.id)}
                  data-testid={`action-checkbox-${item.id}`}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: "var(--text-sm, 12px)",
                    textDecoration: item.completed ? "line-through" : undefined,
                    opacity: item.completed ? 0.5 : 1,
                  }}
                >
                  {item.label}
                </span>
                <Badge
                  className={cn(
                    "pointer-events-none text-[9px] px-1.5 py-0",
                    PRIORITY_STYLES[item.priority],
                  )}
                >
                  {item.priority}
                </Badge>
                <span
                  className="text-muted-foreground"
                  style={{
                    fontSize: "var(--text-xs, 11px)",
                    fontFamily: "var(--brand-font-mono)",
                    flexShrink: 0,
                  }}
                >
                  {dateStr}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
