"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { AgentKPI } from "../mock-data"

const SIGNAL_COLORS: Record<AgentKPI["signal"], string> = {
  "on-track": "var(--brand-accent)",
  behind: "#DC2626",
  ahead: "#16a34a",
}

/**
 * Rich KPI tile for the Agent dashboard.
 * 3px accent top border, uppercase 9px label, 26px display number,
 * progress bar, signal text + target.
 */
export function AgentKPITile({ kpi }: { kpi: AgentKPI }) {
  const signalColor = SIGNAL_COLORS[kpi.signal]

  return (
    <Card
      data-testid={`agent-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}
      style={{
        borderTop: `3px solid var(--brand-accent)`,
        borderRadius: 4,
      }}
    >
      <CardContent className="p-3">
        <p
          className="text-muted-foreground"
          style={{
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontFamily: "var(--brand-font-body)",
          }}
        >
          {kpi.label}
        </p>
        <p
          className="tabular-nums"
          style={{
            fontSize: 26,
            fontWeight: 600,
            fontFamily: "var(--brand-font-display)",
            lineHeight: 1.2,
            marginTop: 4,
          }}
        >
          {kpi.value}
        </p>
        <div
          style={{
            marginTop: 8,
            height: 4,
            borderRadius: 2,
            backgroundColor: "var(--muted)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${kpi.progress}%`,
              borderRadius: 2,
              backgroundColor: signalColor,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 4,
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs, 11px)",
              color: signalColor,
              fontFamily: "var(--brand-font-mono)",
            }}
          >
            {kpi.signalText}
          </span>
          <span
            className="text-muted-foreground"
            style={{
              fontSize: "var(--text-xs, 11px)",
              fontFamily: "var(--brand-font-mono)",
            }}
          >
            {kpi.target}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
