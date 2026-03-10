"use client"

import { useState } from "react"
import type { RequestDTO } from "@/lib/types"
import { Request } from "@/lib/models"
import { StatusBadge } from "@/components/primitives/StatusBadge"
import { BRAND_COLORS } from "@/lib/config/brand"

interface DesignerTableRowProps {
  request: RequestDTO
  onSelectRequest: (r: RequestDTO) => void
  onCancel: (r: RequestDTO) => void
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function DesignerTableRow({ request, onSelectRequest, onCancel }: DesignerTableRowProps) {
  const [hovered, setHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const req = Request.fromDTO(request)

  const lastComment = req.messages.length > 0 ? req.messages[req.messages.length - 1] : null

  const rowBg = req.slaBreached
    ? "bg-red-50/50"
    : hovered
      ? "bg-gray-50"
      : "bg-transparent"

  return (
    <tr
      onClick={() => onSelectRequest(request)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setShowTooltip(false)
      }}
      className={`cursor-pointer border-b border-border transition-colors duration-100 ${rowBg}`}
      data-testid={`designer-row-${req.id}`}
    >
      {/* Queue # */}
      <td className="px-4 py-[11px]" style={{ color: BRAND_COLORS.gold, fontFamily: "var(--brand-font-display)", fontWeight: 700 }}>
        {req.queueLabel}
      </td>
      {/* Requester */}
      <td className="px-4 py-[11px] font-semibold" style={{ color: BRAND_COLORS.navy }}>
        {req.requesterName}
      </td>
      {/* Designer */}
      <td className="px-4 py-[11px]" style={{ color: req.designerName ? BRAND_COLORS.navy : "#D1C9BC" }}>
        {req.designerName ?? "Unassigned"}
      </td>
      {/* Material */}
      <td className="px-4 py-[11px] text-gray-500">{req.materialType}</td>
      {/* Due */}
      <td className="px-4 py-[11px] text-gray-500">{req.dueDateFormatted}</td>
      {/* SLA */}
      <td className="px-4 py-[11px]">
        <span className={`text-[11px] font-semibold ${req.slaDisplayColor}`}>
          {req.slaDisplay}
        </span>
      </td>
      {/* Status */}
      <td className="px-4 py-[11px]">
        <StatusBadge status={req.status} />
      </td>
      {/* Canva */}
      <td className="px-3 py-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            window.open("https://www.canva.com", "_blank")
          }}
          className="flex items-center gap-[5px] whitespace-nowrap rounded-[3px] border border-[#7B2FBE30] bg-[#7B2FBE08] px-2.5 py-1 text-[10px] font-bold tracking-[0.04em] text-[#7B2FBE] transition-all duration-150 hover:border-[#7B2FBE60] hover:bg-[#7B2FBE18]"
          data-testid={`canva-btn-${req.id}`}
        >
          &#x2B21; Canva
        </button>
      </td>
      {/* Comments */}
      <td className="relative px-4 py-[11px]">
        {lastComment ? (
          <div className="relative inline-block">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowTooltip((v) => !v)
              }}
              className={`flex items-center gap-[5px] rounded-[3px] border px-2.5 py-1 text-[11px] font-semibold transition-opacity duration-150 ${
                showTooltip
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                  : "border-gray-200 bg-gray-100 text-gray-500"
              }`}
              data-testid={`comments-btn-${req.id}`}
            >
              <span>&#x1F4AC;</span>
              <span>{req.messages.length}</span>
            </button>

            {showTooltip && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-[calc(100%+8px)] right-0 z-[100] w-[280px] overflow-hidden rounded border border-border bg-white shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-border bg-gray-50 px-3.5 py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                    Latest Comment
                  </span>
                  <span className="text-[10px] text-gray-400">{req.messages.length} total</span>
                </div>
                <div className="px-3.5 py-3">
                  <div className="mb-1 text-[11px] font-bold" style={{ color: BRAND_COLORS.navy }}>
                    {lastComment.senderName}
                    <span className="ml-1.5 font-normal text-gray-400">
                      {timeAgo(lastComment.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed text-gray-700">{lastComment.body}</div>
                </div>
                <div className="border-t border-border bg-gray-50 px-3.5 py-2">
                  <span
                    className="cursor-pointer text-[10px] font-semibold"
                    style={{ color: BRAND_COLORS.gold }}
                  >
                    View full thread &rarr;
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-[#D1C9BC]">N/A</span>
        )}
      </td>
      {/* Cancel */}
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
        {req.isActive && !req.isCancelled && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCancel(request)
            }}
            title="Cancel this request"
            className="whitespace-nowrap border border-red-300 bg-red-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-red-700 transition-opacity duration-150 hover:opacity-70"
            data-testid={`cancel-btn-${req.id}`}
          >
            Cancel
          </button>
        )}
        {req.isCancelled && (
          <span className="text-[10px] text-[#D1C9BC]">Cancelled</span>
        )}
      </td>
    </tr>
  )
}
