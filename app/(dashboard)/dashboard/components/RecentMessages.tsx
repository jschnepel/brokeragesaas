"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeader } from "./SectionHeader"
import type { DashMessage, MessageChannel } from "../mock-data"

const CHANNEL_FILTERS: { value: MessageChannel | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "platform", label: "Platform" },
  { value: "email", label: "Email" },
  { value: "dm", label: "DM" },
]

const CHANNEL_ICONS: Record<MessageChannel, typeof Mail> = {
  platform: MessageSquare,
  email: Mail,
  dm: MessageSquare,
}

interface RecentMessagesProps {
  messages: DashMessage[]
}

export function RecentMessages({ messages }: RecentMessagesProps) {
  const [filter, setFilter] = useState<MessageChannel | "all">("all")

  const filtered =
    filter === "all"
      ? messages
      : messages.filter((m) => m.channel === filter)

  return (
    <Card data-testid="recent-messages">
      <CardContent className="p-4">
        <SectionHeader title="Recent Messages" />
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {CHANNEL_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
              data-testid={`msg-filter-${f.value}`}
              style={{ fontSize: "var(--text-xs, 11px)" }}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <p
              className="text-muted-foreground"
              style={{
                fontSize: "var(--text-sm, 12px)",
                textAlign: "center",
                padding: 24,
              }}
            >
              No messages
            </p>
          )}
          {filtered.map((m) => {
            const Icon = CHANNEL_ICONS[m.channel]
            const time = new Date(m.timestamp)
            const timeStr = time.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })

            return (
              <div
                key={m.id}
                data-testid={`message-item-${m.id}`}
                style={{
                  display: "flex",
                  gap: 8,
                  padding: 8,
                  borderRadius: 4,
                  cursor: "pointer",
                  backgroundColor: m.unread ? "var(--accent)" : undefined,
                }}
                className="hover:bg-muted/50 transition-colors"
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    m.unread
                      ? "text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                  style={{
                    backgroundColor: m.unread ? "var(--brand-primary)" : undefined,
                  }}
                >
                  <Icon className="size-4" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--text-sm, 12px)",
                        fontWeight: m.unread ? 600 : 500,
                      }}
                    >
                      {m.senderName}
                    </span>
                    <span
                      className="text-muted-foreground"
                      style={{
                        fontSize: "var(--text-xs, 11px)",
                        fontFamily: "var(--brand-font-mono)",
                        flexShrink: 0,
                      }}
                    >
                      {timeStr}
                    </span>
                  </div>
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: "var(--text-xs, 11px)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.preview}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
