"use client"

import { Card, CardContent } from "@/components/ui/card"

interface DashKPIProps {
  label: string
  value: number | string
  subText: string
}

/**
 * Simple KPI card used by Designer and Executive dashboards.
 * Uppercase label, large number, sub-text.
 */
export function DashKPI({ label, value, subText }: DashKPIProps) {
  return (
    <Card data-testid={`dash-kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-4">
        <p
          className="text-muted-foreground"
          style={{
            fontSize: "var(--text-xs, 11px)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontFamily: "var(--brand-font-body)",
          }}
        >
          {label}
        </p>
        <p
          className="tabular-nums"
          style={{
            fontSize: 30,
            fontWeight: 600,
            fontFamily: "var(--brand-font-body)",
            lineHeight: 1.2,
            marginTop: 4,
          }}
        >
          {value}
        </p>
        <p
          className="text-muted-foreground"
          style={{ fontSize: "var(--text-sm, 12px)", marginTop: 4 }}
        >
          {subText}
        </p>
      </CardContent>
    </Card>
  )
}
