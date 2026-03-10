"use client"

import { useState, useMemo, useCallback } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { VolumeWeek } from "@/lib/types"
import { BRAND_COLORS, CHART_STYLE } from "@/lib/config/brand"

interface BarChartPanelProps {
  teamData: VolumeWeek[]
  personalData: VolumeWeek[]
}

type Mode = "team" | "mine"
const TIME_PERIODS = ["30D", "3M", "6M", "YTD"] as const
type TimePeriod = (typeof TIME_PERIODS)[number]

function computeKPIs(data: VolumeWeek[]) {
  const total = data.reduce((s, w) => s + w.submitted, 0)
  const lastMonth = data.slice(-4).reduce((s, w) => s + w.submitted, 0)
  const weeksCount = Math.max(data.length, 1)
  const avg = (total / (weeksCount * 7)).toFixed(1)
  return { yearTotal: total, monthTotal: lastMonth, dailyAvg: avg }
}

export function BarChartPanel({ teamData, personalData }: BarChartPanelProps) {
  const [period, setPeriod] = useState<TimePeriod>("YTD")
  const [lockedMode, setLockedMode] = useState<Mode>("team")
  const [hoveredMode, setHoveredMode] = useState<Mode | null>(null)

  // Active mode = hovered preview or locked
  const activeMode = hoveredMode ?? lockedMode
  const activeData = activeMode === "team" ? teamData : personalData
  const isPreviewing = hoveredMode !== null && hoveredMode !== lockedMode

  const teamKPIs = useMemo(() => computeKPIs(teamData), [teamData])
  const personalKPIs = useMemo(() => computeKPIs(personalData), [personalData])
  const kpis = activeMode === "team" ? teamKPIs : personalKPIs

  const handleModeClick = useCallback((mode: Mode) => {
    setLockedMode(mode)
    setHoveredMode(null)
  }, [])

  const legendItems = [
    { color: BRAND_COLORS.navy, dash: false, label: "Submitted" },
    { color: BRAND_COLORS.gold, dash: true, label: "Completed" },
  ]

  return (
    <div
      className="flex overflow-hidden rounded border border-border bg-white"
      data-testid="bar-chart-panel"
    >
      {/* Left KPI column */}
      <div className="flex w-[120px] shrink-0 flex-col border-r border-border">
        {/* Mode selector: Team / Mine */}
        <div className="border-b border-border px-3.5 py-2.5">
          <div className="flex items-center justify-center gap-1">
            {(["team", "mine"] as const).map((mode) => {
              const isActive = activeMode === mode
              const isLocked = lockedMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => handleModeClick(mode)}
                  onMouseEnter={() => setHoveredMode(mode)}
                  onMouseLeave={() => setHoveredMode(null)}
                  className="border-none bg-transparent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] transition-all duration-150"
                  style={{
                    color: isActive ? BRAND_COLORS.navy : "#C4B9AA",
                    borderBottom: isLocked ? `2px solid ${BRAND_COLORS.gold}` : "2px solid transparent",
                    cursor: "pointer",
                  }}
                  data-testid={`mode-${mode}`}
                >
                  {mode === "team" ? "Team" : "Mine"}
                </button>
              )
            })}
          </div>
          <div
            className="mt-0.5 text-center text-[8px] transition-colors duration-150"
            style={{ color: isPreviewing ? BRAND_COLORS.gold : "#C4B9AA" }}
          >
            {isPreviewing ? "preview" : "volume data"}
          </div>
        </div>

        {/* Year Total */}
        <div className="flex flex-1 flex-col items-center justify-center border-b border-border px-3.5 py-2.5">
          <div
            className="text-[22px] font-light leading-none transition-all duration-200"
            style={{
              fontFamily: "var(--brand-font-display)",
              color: isPreviewing ? BRAND_COLORS.gold : BRAND_COLORS.navy,
            }}
          >
            {kpis.yearTotal}
          </div>
          <div className="mt-[5px] text-center text-[9px] font-semibold uppercase tracking-[0.06em] text-gray-400">
            Year Total
          </div>
        </div>

        {/* Month Total */}
        <div className="flex flex-1 flex-col items-center justify-center border-b border-border px-3.5 py-2.5">
          <div
            className="text-[22px] font-light leading-none transition-all duration-200"
            style={{
              fontFamily: "var(--brand-font-display)",
              color: isPreviewing ? BRAND_COLORS.gold : BRAND_COLORS.navy,
            }}
          >
            {kpis.monthTotal}
          </div>
          <div className="mt-[5px] text-center text-[9px] font-semibold uppercase tracking-[0.06em] text-gray-400">
            Month Total
          </div>
        </div>

        {/* Daily Avg */}
        <div className="flex flex-1 flex-col items-center justify-center px-3.5 py-2.5">
          <div
            className="text-[22px] font-light leading-none transition-all duration-200"
            style={{
              fontFamily: "var(--brand-font-display)",
              color: isPreviewing ? BRAND_COLORS.gold : BRAND_COLORS.navy,
            }}
          >
            {kpis.dailyAvg}
          </div>
          <div className="mt-[5px] text-center text-[9px] font-semibold uppercase tracking-[0.06em] text-gray-400">
            Daily Avg
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex min-h-0 flex-1 flex-col p-3.5">
        {/* Header */}
        <div className="mb-2.5 flex shrink-0 flex-wrap items-center justify-between">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2.5">
            {legendItems.map((li) => (
              <div key={li.label} className="flex items-center gap-1">
                {li.dash ? (
                  <svg width="14" height="4" viewBox="0 0 14 4">
                    <line x1="0" y1="2" x2="14" y2="2" stroke={li.color} strokeWidth="1.5" strokeDasharray="4 3" />
                  </svg>
                ) : (
                  <div className="h-[2.5px] w-3.5 rounded-sm" style={{ background: li.color }} />
                )}
                <span
                  className={`whitespace-nowrap text-[9px] ${li.dash ? "font-medium" : "font-bold"}`}
                  style={{ color: li.color }}
                >
                  {li.label}
                </span>
              </div>
            ))}
          </div>

          {/* Period stepper */}
          <div className="flex shrink-0 gap-px rounded-[3px] bg-gray-100 p-0.5">
            {TIME_PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-sm px-[7px] py-[3px] text-[9px] tracking-[0.04em] transition-all duration-150 ${
                  period === p
                    ? "bg-white font-bold text-[var(--brand-primary)] shadow-sm"
                    : "bg-transparent font-medium text-gray-400"
                }`}
                data-testid={`period-${p}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activeData}>
              <CartesianGrid
                strokeDasharray={CHART_STYLE.gridDash}
                stroke={CHART_STYLE.gridStroke}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 9, fill: CHART_STYLE.tickColor }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: CHART_STYLE.tickColor }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  fontSize: CHART_STYLE.tooltipFontSize,
                  border: CHART_STYLE.tooltipBorder,
                  borderRadius: CHART_STYLE.tooltipRadius,
                }}
              />
              <Line
                type="monotone"
                dataKey="submitted"
                stroke={isPreviewing ? BRAND_COLORS.gold : BRAND_COLORS.navy}
                strokeWidth={2}
                dot={false}
                name="Submitted"
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke={isPreviewing ? "#D4A94B" : BRAND_COLORS.gold}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                name="Completed"
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
