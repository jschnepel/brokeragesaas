"use client"

import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "./SectionHeader"
import type { UpcomingEvent, EventType } from "../mock-data"

const EVENT_BAR_COLORS: Record<EventType, string> = {
  showing: "#3b82f6",
  closing: "#16a34a",
  "open-house": "#f59e0b",
  meeting: "var(--brand-primary)",
  deadline: "#DC2626",
}

interface UpcomingEventsProps {
  events: UpcomingEvent[]
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <Card data-testid="upcoming-events">
      <CardContent className="p-4">
        <SectionHeader title="Upcoming Events" />
        <div className="flex flex-col gap-2">
          {events.map((event) => {
            const d = new Date(event.date + "T00:00:00")
            const dayNum = d.getDate()
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" })

            return (
              <div
                key={event.id}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 8,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: 3,
                    borderRadius: 2,
                    backgroundColor: EVENT_BAR_COLORS[event.type],
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    width: 36,
                    textAlign: "center",
                    flexShrink: 0,
                    padding: "4px 0",
                  }}
                >
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: "var(--brand-font-display)",
                      lineHeight: 1,
                    }}
                  >
                    {dayNum}
                  </p>
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: 9,
                      textTransform: "uppercase",
                      fontFamily: "var(--brand-font-body)",
                    }}
                  >
                    {dayName}
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 0, padding: "4px 0" }}>
                  <p
                    style={{
                      fontSize: "var(--text-sm, 12px)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {event.title}
                  </p>
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: "var(--text-xs, 11px)",
                      fontFamily: "var(--brand-font-mono)",
                    }}
                  >
                    {event.time}
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
