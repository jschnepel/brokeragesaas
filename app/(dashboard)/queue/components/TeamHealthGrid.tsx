"use client"

import { useState } from "react"

interface TeamHealthGridProps {
  revisionRate: number
  slaCompliance: number
  reqPerDesigner: number
  avgCompletionDays: number
}

interface TileConfig {
  label: string
  value: string
  barPct: number
  color: string
  signal: string
  target: string
}

function HealthTile({ label, value, color, barPct, signal, target }: TileConfig) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex cursor-default flex-col justify-center rounded border px-3.5 py-3 transition-all duration-150"
      style={{
        background: hovered ? "#FAFAFA" : "white",
        borderColor: hovered ? `${color}60` : "var(--border)",
        borderTopWidth: 3,
        borderTopColor: color,
      }}
      data-testid={`health-tile-${label.toLowerCase().replace(/[\s/]/g, "-")}`}
    >
      <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.08em] text-gray-400">
        {label}
      </div>
      <div
        className="mb-2.5 text-[26px] font-light leading-none"
        style={{ fontFamily: "var(--brand-font-display)", color }}
      >
        {value}
      </div>
      <div className="mb-[5px] h-[3px] rounded-sm bg-gray-100">
        <div className="h-full rounded-sm" style={{ width: `${barPct}%`, background: color }} />
      </div>
      <div className="flex justify-between">
        <span className="text-[10px] font-medium text-gray-500">{signal}</span>
        <span className="text-[9px] text-gray-300">{target}</span>
      </div>
    </div>
  )
}

function getColor(
  value: number,
  thresholds: { green: (v: number) => boolean; amber: (v: number) => boolean },
): string {
  if (thresholds.green(value)) return "#15803D"
  if (thresholds.amber(value)) return "#F59E0B"
  return "#DC2626"
}

export function TeamHealthGrid({
  revisionRate,
  slaCompliance,
  reqPerDesigner,
  avgCompletionDays,
}: TeamHealthGridProps) {
  const tiles: TileConfig[] = [
    {
      label: "Revision Rate",
      value: `${revisionRate}%`,
      barPct: revisionRate,
      color: getColor(revisionRate, {
        green: (v) => v <= 15,
        amber: (v) => v <= 25,
      }),
      signal: revisionRate <= 15 ? "\u2713 Healthy" : revisionRate <= 25 ? "\u26A0 Monitor" : "\u2717 High",
      target: "Target <15%",
    },
    {
      label: "SLA Compliance",
      value: `${slaCompliance}%`,
      barPct: slaCompliance,
      color: getColor(slaCompliance, {
        green: (v) => v >= 95,
        amber: (v) => v >= 85,
      }),
      signal: slaCompliance >= 95 ? "\u2713 Excellent" : slaCompliance >= 85 ? "\u26A0 Slipping" : "\u2717 Critical",
      target: "Target \u226595%",
    },
    {
      label: "Req / Designer",
      value: String(reqPerDesigner),
      barPct: Math.min((reqPerDesigner / 8) * 100, 100),
      color: getColor(reqPerDesigner, {
        green: (v) => v <= 5,
        amber: (v) => v <= 7,
      }),
      signal: reqPerDesigner <= 5 ? "\u2713 Balanced" : reqPerDesigner <= 7 ? "\u26A0 Heavy" : "\u2717 Overloaded",
      target: "Target \u22645",
    },
    {
      label: "Avg Completion",
      value: `${avgCompletionDays}d`,
      barPct: Math.min((avgCompletionDays / 14) * 100, 100),
      color: getColor(avgCompletionDays, {
        green: (v) => v <= 5,
        amber: (v) => v <= 9,
      }),
      signal: avgCompletionDays <= 5 ? "\u2713 Fast" : avgCompletionDays <= 9 ? "\u26A0 Average" : "\u2717 Slow",
      target: "Target \u22645d",
    },
  ]

  return (
    <div className="grid h-full grid-rows-[auto_1fr]" data-testid="team-health-grid">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
        Team Health
      </div>
      <div className="grid grid-cols-2 grid-rows-2 gap-2">
        {tiles.map((t) => (
          <HealthTile key={t.label} {...t} />
        ))}
      </div>
    </div>
  )
}
