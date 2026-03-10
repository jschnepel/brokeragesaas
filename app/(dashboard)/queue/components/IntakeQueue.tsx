"use client"

import { useState, useCallback, useMemo } from "react"
import type { IntakeQueueItem, AgentRow } from "@/lib/types"
import { BRAND_COLORS } from "@/lib/config/brand"
import { IntakeQueueRow } from "./IntakeQueueRow"
import { PaginationBar } from "./PaginationBar"

interface IntakeQueueProps {
  items: IntakeQueueItem[]
  designers: AgentRow[]
  onApprove?: (requestId: string, designerId: string, designerName: string) => Promise<void>
}

interface DecisionLog {
  id: string
  decision: string
  designerName: string
  note: string
  at: string
}

function getFeasibilityLevel(req: IntakeQueueItem): "hard" | "warn" | null {
  const submitted = new Date(req.submittedAt)
  const due = req.dueDate ? new Date(req.dueDate + "T23:59:00Z") : null
  let bizDays = 0
  if (due) {
    const d = new Date(submitted)
    while (d < due) {
      d.setDate(d.getDate() + 1)
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) bizDays++
    }
  }
  if (req.isRush && req.estimatedPages >= 20) return "hard"
  if (req.estimatedPages >= 12 && bizDays < 4) return "hard"
  if (req.attachments === 0 && req.materialType !== "Flyer") return "warn"
  if (req.isRush && bizDays < 2) return "warn"
  return null
}

const THEAD_COLS = ["#", "", "Request", "Requester", "Scope", "Due", "Assign To", "Decision"]
const COL_WIDTHS = [48, 20, 220, 130, 80, 80, 148, 210]

export function IntakeQueue({ items, designers, onApprove }: IntakeQueueProps) {
  const [rows, setRows] = useState(items)
  const [log, setLog] = useState<DecisionLog[]>([])
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const hardFlags = useMemo(() => rows.filter((r) => getFeasibilityLevel(r) === "hard").length, [rows])
  const warnFlags = useMemo(() => rows.filter((r) => getFeasibilityLevel(r) === "warn").length, [rows])

  const handleDecision = useCallback(
    async (id: string, decision: string, designerName: string, note: string, designerId?: string) => {
      setLog((l) => [
        {
          id,
          decision,
          designerName,
          note,
          at: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        },
        ...l,
      ])

      if (decision === "approved" && designerId && onApprove) {
        try {
          await onApprove(id, designerId, designerName)
          // Remove from intake queue after successful assignment
          setRows((prev) => prev.filter((r) => r.id !== id))
        } catch (err) {
          console.error("Failed to approve request:", err)
        }
      }
    },
    [onApprove],
  )

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  if (rows.length === 0) return null

  return (
    <div className="mb-8 overflow-visible border border-border bg-white" data-testid="intake-queue">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-[#FDFAF5] px-5 py-3">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: BRAND_COLORS.navy }}
            >
              Intake Queue
            </span>
            <span
              className="px-[7px] py-0.5 text-[10px] font-bold tracking-[0.04em]"
              style={{ background: BRAND_COLORS.navy, color: BRAND_COLORS.gold }}
            >
              {rows.length}
            </span>
            {hardFlags > 0 && (
              <span className="flex items-center gap-1 border border-red-300 bg-red-50 px-[7px] py-0.5 text-[9px] font-bold tracking-[0.04em] text-red-700">
                <span className="inline-block size-1.5 rounded-full bg-red-500" />
                {hardFlags} flagged
              </span>
            )}
            {warnFlags > 0 && (
              <span className="flex items-center gap-1 border border-amber-200 bg-amber-50 px-[7px] py-0.5 text-[9px] font-bold tracking-[0.04em] text-amber-800">
                <span className="inline-block size-1.5 rounded-full bg-amber-500" />
                {warnFlags} need review
              </span>
            )}
          </div>
          <div className="mt-[3px] text-[10px] text-gray-400">
            New submissions awaiting executive review &mdash; assign a designer and approve, request more info, or reject
          </div>
        </div>

        {/* Legend */}
        <div className="flex shrink-0 gap-3">
          {[
            ["#EF4444", "Timeline not feasible"],
            ["#F59E0B", "Needs attention"],
          ].map(([c, l]) => (
            <div key={l} className="flex items-center gap-[5px]">
              <div className="size-[7px] rounded-full" style={{ background: c }} />
              <span className="text-[9px] text-gray-400">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            {COL_WIDTHS.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b-2 border-border bg-[#F9F7F4]">
              {THEAD_COLS.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left text-[8px] font-bold uppercase tracking-[0.12em] text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((req) => (
              <IntakeQueueRow
                key={req.id}
                req={req}
                designers={designers}
                onDecision={handleDecision}
              />
            ))}
          </tbody>
        </table>
        <PaginationBar
          total={rows.length}
          pageSize={pageSize}
          page={page}
          onPageSize={setPageSize}
          onPage={(p) => setPage(Math.max(1, Math.min(p, totalPages)))}
        />
      </div>

      {/* Activity log */}
      {log.length > 0 && (
        <div className="border-t border-border bg-[#FAFAF9] px-5 py-2.5" data-testid="intake-activity-log">
          <div className="mb-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#C4B9AA]">
            Recent Decisions
          </div>
          <div className="flex flex-col gap-1">
            {log.slice(0, 4).map((entry, i) => {
              const req = rows.find((r) => r.id === entry.id)
              const col =
                entry.decision === "approved"
                  ? "#15803D"
                  : entry.decision === "rejected"
                    ? "#B91C1C"
                    : "#92400E"
              const lbl =
                entry.decision === "approved"
                  ? "Approved"
                  : entry.decision === "rejected"
                    ? "Rejected"
                    : "Info Requested"
              return (
                <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="min-w-[110px] font-bold" style={{ color: col }}>
                    {lbl}
                  </span>
                  <span className="font-medium" style={{ color: BRAND_COLORS.navy }}>
                    #{req?.queueNumber} {req?.title?.slice(0, 40)}
                    {(req?.title?.length ?? 0) > 40 ? "\u2026" : ""}
                  </span>
                  {entry.designerName && <span>&rarr; {entry.designerName}</span>}
                  <span className="ml-auto text-[#C4B9AA]">{entry.at}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
