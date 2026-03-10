"use client"

import { BRAND_COLORS } from "@/lib/config/brand"

type Signal = "ok" | "warning" | "critical"

const SIGNAL_BORDER: Record<Signal, string> = {
  ok: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
}

interface DashboardKPIProps {
  label: string
  value: string | number
  subText?: string
  signal?: Signal
}

export function DashboardKPI({ label, value, subText, signal = "ok" }: DashboardKPIProps) {
  return (
    <div
      data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className="rounded-md border bg-card p-4"
      style={{ borderTopWidth: 3, borderTopColor: SIGNAL_BORDER[signal] }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
      >
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-light tabular-nums"
        style={{ fontFamily: "var(--brand-font-display)", color: BRAND_COLORS.navy }}
      >
        {value}
      </p>
      {subText && (
        <p className="mt-1 text-xs text-muted-foreground">{subText}</p>
      )}
    </div>
  )
}
