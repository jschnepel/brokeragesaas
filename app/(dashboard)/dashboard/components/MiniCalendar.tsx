"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import type { CalendarEvent, EventType } from "../mock-data"

const EVENT_DOT_COLORS: Record<EventType, string> = {
  showing: "#3b82f6",
  closing: "#16a34a",
  "open-house": "#f59e0b",
  meeting: "var(--brand-primary)",
  deadline: "#DC2626",
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

interface MiniCalendarProps {
  events: CalendarEvent[]
}

export function MiniCalendar({ events }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 2, 1))
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const dateKey = event.date
      const existing = map.get(dateKey)
      if (existing) {
        existing.push(event)
      } else {
        map.set(dateKey, [event])
      }
    }
    return map
  }, [events])

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const monthLabel = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })

  const today = new Date()
  const isToday = (day: number) =>
    year === today.getFullYear() &&
    month === today.getMonth() &&
    day === today.getDate()

  return (
    <Card data-testid="mini-calendar">
      <CardContent className="p-4">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            data-testid="calendar-prev"
            className="size-8 p-0"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span
            style={{
              fontSize: "var(--text-sm, 12px)",
              fontWeight: 600,
              fontFamily: "var(--brand-font-display)",
            }}
          >
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            data-testid="calendar-next"
            className="size-8 p-0"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 2,
            textAlign: "center",
          }}
        >
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="text-muted-foreground"
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: 4,
                fontFamily: "var(--brand-font-body)",
              }}
            >
              {d}
            </div>
          ))}
          <TooltipProvider>
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} />
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const dayEvents = eventsByDate.get(dateStr)
              const uniqueTypes = dayEvents
                ? [...new Set(dayEvents.map((e) => e.type))]
                : []

              const cell = (
                <div
                  key={dateStr}
                  style={{
                    padding: 4,
                    borderRadius: 4,
                    cursor: dayEvents ? "pointer" : "default",
                    backgroundColor: isToday(day) ? "var(--brand-accent)" : undefined,
                    color: isToday(day) ? "white" : undefined,
                    fontSize: "var(--text-xs, 11px)",
                    fontFamily: "var(--brand-font-mono)",
                    position: "relative",
                  }}
                >
                  {day}
                  {uniqueTypes.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 2,
                        justifyContent: "center",
                        marginTop: 2,
                      }}
                    >
                      {uniqueTypes.slice(0, 3).map((type) => (
                        <div
                          key={type}
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            backgroundColor: EVENT_DOT_COLORS[type],
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )

              if (dayEvents && dayEvents.length > 0) {
                return (
                  <Tooltip key={dateStr}>
                    <TooltipTrigger render={<div />}>
                      {cell}
                    </TooltipTrigger>
                    <TooltipContent>
                      <div style={{ fontSize: "var(--text-xs, 11px)" }}>
                        {dayEvents.map((e) => (
                          <div key={e.id}>{e.time} — {e.title}</div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return cell
            })}
          </TooltipProvider>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          {Object.entries(EVENT_DOT_COLORS).map(([type, color]) => (
            <div
              key={type}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: color,
                }}
              />
              <span
                className="text-muted-foreground"
                style={{
                  fontSize: 9,
                  textTransform: "capitalize",
                  fontFamily: "var(--brand-font-body)",
                }}
              >
                {type.replace("-", " ")}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
