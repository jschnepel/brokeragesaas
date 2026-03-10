"use client"

import { useState, useMemo } from "react"
import { PieChart, Pie, Cell, Tooltip } from "recharts"

interface PieDataItem {
  name: string
  value: number
  color: string
}

interface PiePanelProps {
  requestsData: PieDataItem[]
  materialsData: PieDataItem[]
}

const PIE_TABS = ["Requests", "Materials"] as const
type PieTab = (typeof PIE_TABS)[number]

export function PiePanel({ requestsData, materialsData }: PiePanelProps) {
  const [tab, setTab] = useState<PieTab>("Requests")
  const [hovered, setHovered] = useState(false)

  const allData = tab === "Requests" ? requestsData : materialsData
  const top3 = useMemo(
    () => [...allData].sort((a, b) => b.value - a.value).slice(0, 3),
    [allData],
  )

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col rounded-sm border border-border bg-white px-3.5 py-3"
      data-testid="pie-panel"
    >
      {/* Tab strip */}
      <div className="mb-2.5 flex gap-px rounded-[3px] bg-gray-100 p-0.5">
        {PIE_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-sm px-1.5 py-1 text-[9px] font-medium uppercase tracking-[0.05em] transition-all duration-150 ${
              tab === t
                ? "bg-white font-bold text-[var(--brand-primary)] shadow-sm"
                : "bg-transparent text-gray-400"
            }`}
            data-testid={`pie-tab-${t.toLowerCase()}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex justify-center">
        <PieChart width={130} height={120}>
          <Pie
            data={allData}
            cx={60}
            cy={55}
            innerRadius={32}
            outerRadius={52}
            dataKey="value"
            strokeWidth={2}
            stroke="white"
          >
            {allData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, n: string) => [v, n]}
            contentStyle={{ fontSize: 11, border: "1px solid var(--border)", borderRadius: 3 }}
          />
        </PieChart>
      </div>

      {/* Top 3 legend */}
      <div className="mt-2 flex flex-col gap-1">
        {top3.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-[5px]">
              <div className="size-[7px] shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="truncate text-[10px] text-gray-500">{d.name}</span>
            </div>
            <span className="shrink-0 text-[11px] font-bold" style={{ color: d.color }}>
              {d.value}
            </span>
          </div>
        ))}
        {allData.length > 3 && (
          <div className="mt-0.5 text-[9px] tracking-[0.05em] text-gray-300">
            +{allData.length - 3} more &mdash; hover to see all
          </div>
        )}
      </div>

      {/* Hover flyout */}
      {hovered && allData.length > 3 && (
        <div
          className="absolute left-[calc(100%+8px)] top-0 z-50 w-[180px] rounded border border-border bg-white p-3.5 shadow-lg"
          data-testid="pie-flyout"
        >
          <div className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400">
            {tab} &mdash; All
          </div>
          <div className="flex flex-col gap-[7px]">
            {allData.map((d) => (
              <div key={d.name} className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 shrink-0 rounded-full" style={{ background: d.color }} />
                  <span className="text-[11px] text-gray-700">{d.name}</span>
                </div>
                <span className="text-xs font-bold" style={{ color: d.color }}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
