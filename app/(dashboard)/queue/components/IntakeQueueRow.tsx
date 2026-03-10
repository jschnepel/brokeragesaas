"use client"

import { useState } from "react"
import type { IntakeQueueItem, AgentRow } from "@/lib/types"
import { BRAND_COLORS } from "@/lib/config/brand"

interface IntakeQueueRowProps {
  req: IntakeQueueItem
  designers: AgentRow[]
  onDecision: (id: string, decision: string, designerName: string, note: string, designerId?: string) => void
}

interface FeasibilityFlag {
  level: "hard" | "warn"
  reason: string
}

const FLAG_STYLE = {
  hard: { dot: "#EF4444", bg: "#FEF2F2", border: "#FCA5A5", txt: "#B91C1C" },
  warn: { dot: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", txt: "#92400E" },
} as const

const ACTION_STATES: Record<string, { label: string; bg: string; border: string; txt: string }> = {
  approved: { label: "APPROVED", bg: "#F0FDF4", border: "#86EFAC", txt: "#15803D" },
  rejected: { label: "REJECTED", bg: "#FEF2F2", border: "#FCA5A5", txt: "#B91C1C" },
  info_sent: { label: "INFO REQUESTED", bg: "#FFFBEB", border: "#FDE68A", txt: "#92400E" },
}

function getFeasibilityFlag(req: IntakeQueueItem): FeasibilityFlag | null {
  const submitted = new Date(req.submittedAt)
  const due = req.dueDate ? new Date(new Date(req.dueDate).toISOString().slice(0, 10) + "T23:59:00Z") : null

  let bizDays = 0
  if (due) {
    const d = new Date(submitted)
    while (d < due) {
      d.setDate(d.getDate() + 1)
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) bizDays++
    }
  }

  // Hard flags
  if (req.isRush && req.estimatedPages >= 20) {
    return { level: "hard", reason: "Rush request with 20+ pages \u2014 timeline not feasible" }
  }
  if (req.estimatedPages >= 12 && bizDays < 4) {
    return { level: "hard", reason: `${req.estimatedPages} pages with only ${bizDays} business days` }
  }

  // Warn flags
  if (req.attachments === 0 && req.materialType !== "Flyer") {
    return { level: "warn", reason: "No attachments provided for non-flyer material" }
  }
  if (req.isRush && bizDays < 2) {
    return { level: "warn", reason: `Rush request with <2 business days (${bizDays}d)` }
  }

  return null
}

export function IntakeQueueRow({ req, designers, onDecision }: IntakeQueueRowProps) {
  const [designerId, setDesignerId] = useState("")
  const [designerName, setDesignerName] = useState("")
  const [action, setAction] = useState<string>("idle")
  const [rejectNote, setRejectNote] = useState("")
  const [infoNote, setInfoNote] = useState("")
  const [expanded, setExpanded] = useState(false)

  const flag = getFeasibilityFlag(req)
  const submitted = new Date(req.submittedAt)
  const due = req.dueDate ? new Date(new Date(req.dueDate).toISOString().slice(0, 10) + "T23:59:00Z") : null

  let bizDays = 0
  if (due) {
    const d = new Date(submitted)
    while (d < due) {
      d.setDate(d.getDate() + 1)
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) bizDays++
    }
  }

  const designer = designerName // alias for display logic
  const isDone = ["approved", "rejected", "info_sent"].includes(action)
  const rowBg = flag?.level === "hard" ? "bg-red-50/40" : flag?.level === "warn" ? "bg-amber-50/40" : "bg-white"

  return (
    <>
      <tr
        className={`border-b border-[#F0EDE8] transition-opacity duration-200 ${rowBg}`}
        style={{ opacity: isDone ? 0.6 : 1 }}
        data-testid={`intake-row-${req.id}`}
      >
        {/* # */}
        <td className="w-9 px-3 py-[11px] align-middle">
          <span className="text-[10px] font-bold text-gray-400">#{req.queueNumber}</span>
        </td>

        {/* Flag */}
        <td className="w-5 px-2 py-[11px] align-middle">
          {flag && (
            <div
              title={flag.reason}
              className="size-2 shrink-0 cursor-help rounded-full"
              style={{ background: FLAG_STYLE[flag.level].dot }}
              data-testid={`flag-${req.id}`}
            />
          )}
        </td>

        {/* Request title + brief toggle */}
        <td className="max-w-[220px] px-3 py-[11px] align-middle">
          <div className="mb-0.5 max-w-[210px] truncate text-xs font-semibold leading-snug" style={{ color: BRAND_COLORS.navy }}>
            {req.title}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">{req.materialType}</span>
            {req.isRush && (
              <span className="border border-red-300 bg-red-50 px-[5px] py-px text-[8px] font-bold tracking-[0.06em] text-red-700">
                RUSH
              </span>
            )}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="border-none bg-transparent p-0 text-[9px] underline"
              style={{ color: BRAND_COLORS.gold }}
              data-testid={`brief-toggle-${req.id}`}
            >
              {expanded ? "less" : "brief"}
            </button>
          </div>
        </td>

        {/* Requester */}
        <td className="w-[130px] px-3 py-[11px] align-middle">
          <div className="text-[11px] font-medium" style={{ color: BRAND_COLORS.navy }}>
            {req.requesterName}
          </div>
          <div className="text-[10px] text-gray-400">{req.office}</div>
        </td>

        {/* Scope (pages + days) */}
        <td className="w-20 px-3 py-[11px] text-center align-middle">
          <div className="text-xs font-bold" style={{ color: flag?.level === "hard" ? "#B91C1C" : BRAND_COLORS.navy }}>
            {req.estimatedPages}pp
          </div>
          <div
            className="text-[9px]"
            style={{ color: bizDays <= 1 ? "#B91C1C" : bizDays <= 3 ? "#92400E" : "#9CA3AF" }}
          >
            {bizDays} biz day{bizDays !== 1 ? "s" : ""}
          </div>
        </td>

        {/* Due */}
        <td className="w-20 px-3 py-[11px] align-middle">
          <div className="text-[11px] font-medium" style={{ color: BRAND_COLORS.navy }}>
            {req.dueDate ? String(req.dueDate).slice(5, 10).replace("-", "/") : "\u2014"}
          </div>
          <div className="text-[9px] text-gray-400">
            {req.attachments} file{req.attachments !== 1 ? "s" : ""}
          </div>
        </td>

        {/* Designer assign */}
        <td className="w-[148px] px-3 py-[11px] align-middle">
          {isDone ? (
            <span className="text-[10px]" style={{ color: designer ? BRAND_COLORS.navy : "#9CA3AF" }}>
              {designer || "\u2014"}
            </span>
          ) : (
            <select
              value={designerId}
              onChange={(e) => {
                const id = e.target.value
                setDesignerId(id)
                const found = designers.find((d) => d.id === id)
                setDesignerName(found?.name ?? "")
              }}
              className="w-full cursor-pointer border border-border bg-white px-[7px] py-[5px] text-[11px] outline-none focus:border-[var(--brand-primary)]"
              style={{
                fontFamily: "var(--brand-font-body)",
                color: designerId ? BRAND_COLORS.navy : "#9CA3AF",
              }}
              data-testid={`assign-designer-${req.id}`}
            >
              <option value="">&mdash; Assign to &mdash;</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} &middot; {d.role}
                </option>
              ))}
            </select>
          )}
        </td>

        {/* Actions */}
        <td className="w-[200px] px-3 py-[11px] align-middle">
          {isDone ? (
            <span
              className="text-[10px] font-bold tracking-[0.06em]"
              style={{
                padding: "4px 10px",
                border: `1px solid ${ACTION_STATES[action]?.border}`,
                background: ACTION_STATES[action]?.bg,
                color: ACTION_STATES[action]?.txt,
              }}
            >
              {ACTION_STATES[action]?.label}
            </span>
          ) : action === "confirming_reject" ? (
            <div className="flex flex-col gap-1">
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Reason for rejection..."
                rows={2}
                className="w-full resize-none border border-red-300 p-1.5 text-[10px] outline-none"
                style={{ fontFamily: "var(--brand-font-body)" }}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => { setAction("rejected"); onDecision(req.id, "rejected", designer, rejectNote) }}
                  className="flex-1 border-none bg-red-500 p-[5px] text-[9px] font-bold text-white"
                  data-testid={`confirm-reject-${req.id}`}
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => setAction("idle")}
                  className="border border-border bg-white px-2 py-[5px] text-[9px] text-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : action === "confirming_info" ? (
            <div className="flex flex-col gap-1">
              <textarea
                value={infoNote}
                onChange={(e) => setInfoNote(e.target.value)}
                placeholder="What information is needed?"
                rows={2}
                className="w-full resize-none border border-amber-200 p-1.5 text-[10px] outline-none"
                style={{ fontFamily: "var(--brand-font-body)" }}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => { setAction("info_sent"); onDecision(req.id, "info_sent", designer, infoNote) }}
                  className="flex-1 border-none bg-amber-500 p-[5px] text-[9px] font-bold text-white"
                  data-testid={`confirm-info-${req.id}`}
                >
                  Send Request
                </button>
                <button
                  onClick={() => setAction("idle")}
                  className="border border-border bg-white px-2 py-[5px] text-[9px] text-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-[5px]">
              {/* Approve */}
              <button
                onClick={() => {
                  if (designerId) {
                    setAction("approved")
                    onDecision(req.id, "approved", designerName, "", designerId)
                  }
                }}
                title={!designerId ? "Select a designer first" : "Approve and send to queue"}
                className="flex items-center gap-[5px] border-none px-2.5 py-1.5 text-[9px] font-bold tracking-[0.06em] transition-all duration-150"
                style={{
                  cursor: designerId ? "pointer" : "not-allowed",
                  background: designerId ? BRAND_COLORS.navy : "#E5E1D8",
                  color: designerId ? "white" : "#C4B9AA",
                }}
                data-testid={`approve-btn-${req.id}`}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Begin
              </button>
              {/* Need info */}
              <button
                onClick={() => setAction("confirming_info")}
                title="Request more information from agent"
                className="border border-amber-200 bg-amber-50 px-[7px] py-1.5 text-[9px] font-bold text-amber-800 transition-opacity duration-150 hover:opacity-75"
                data-testid={`info-btn-${req.id}`}
              >
                ?
              </button>
              {/* Reject */}
              <button
                onClick={() => setAction("confirming_reject")}
                title="Reject this request"
                className="border border-red-300 bg-red-50 px-[7px] py-1.5 text-[9px] font-bold text-red-700 transition-opacity duration-150 hover:opacity-75"
                data-testid={`reject-btn-${req.id}`}
              >
                &times;
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded brief row */}
      {expanded && (
        <tr
          className={`border-b border-[#F0EDE8] ${
            flag?.level === "hard" ? "bg-red-50/30" : flag?.level === "warn" ? "bg-amber-50/30" : "bg-gray-50/50"
          }`}
        >
          <td colSpan={8} className="px-3 pb-3 pl-[52px] pt-0">
            {flag && (
              <div
                className="mb-2 flex items-start gap-2 p-3"
                style={{ background: FLAG_STYLE[flag.level].bg, border: `1px solid ${FLAG_STYLE[flag.level].border}` }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={FLAG_STYLE[flag.level].dot}
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="mt-px shrink-0"
                >
                  <path d="M12 9v4M12 17h.01" />
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span className="text-[11px] font-semibold" style={{ color: FLAG_STYLE[flag.level].txt }}>
                  {flag.reason}
                </span>
              </div>
            )}
            <div className="text-xs leading-relaxed text-gray-700">{req.brief}</div>
          </td>
        </tr>
      )}
    </>
  )
}
