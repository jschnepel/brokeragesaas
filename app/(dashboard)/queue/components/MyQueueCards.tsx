"use client"

import type { RequestDTO } from "@/lib/types"
import { Request } from "@/lib/models"
import { StatusBadge } from "@/components/primitives/StatusBadge"
import { BRAND_COLORS } from "@/lib/config/brand"

interface MyQueueCardsProps {
  requests: RequestDTO[]
  onSelect: (r: RequestDTO) => void
}

function materialIcon(type: string): string {
  if (type.includes("Video")) return "\u25B6"
  if (type.includes("Social")) return "\u25C8"
  return "\u2B1C"
}

export function MyQueueCards({ requests, onSelect }: MyQueueCardsProps) {
  if (requests.length === 0) return null

  return (
    <div data-testid="my-queue-cards">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">
        My Queue &mdash; {requests.length}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {requests.map((dto) => {
          const req = Request.fromDTO(dto)
          return (
            <div
              key={req.id}
              onClick={() => onSelect(dto)}
              className="cursor-pointer overflow-hidden rounded border border-border bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--brand-accent)]"
              data-testid={`my-queue-card-${req.id}`}
            >
              {/* Navy gradient header */}
              <div
                className="flex h-[100px] items-center justify-center text-[32px]"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, #2A4A7A 100%)`,
                  color: BRAND_COLORS.gold,
                }}
              >
                {materialIcon(req.materialType)}
              </div>

              <div className="px-3.5 py-3">
                <div
                  className="mb-1 text-[11px] font-bold leading-snug"
                  style={{ color: BRAND_COLORS.navy }}
                >
                  {req.title}
                </div>
                <div className="mb-2 text-[10px] text-gray-400">{req.materialType}</div>

                <div className="mb-1.5 flex items-center justify-between">
                  <StatusBadge status={req.status} />
                  <span className="text-[10px] text-gray-400">{req.queueLabel}</span>
                </div>

                {/* SLA indicator */}
                <div
                  className="mb-2.5 flex items-center gap-[5px] border px-2 py-[5px]"
                  style={{
                    background: req.slaStatus === "breached" ? "#FEF2F2"
                      : req.slaStatus === "warning" ? "#FFFBEB"
                      : "#F9F7F4",
                    borderColor: req.slaStatus === "breached" ? "#FCA5A5"
                      : req.slaStatus === "warning" ? "#FDE68A"
                      : "var(--border)",
                  }}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={
                      req.slaStatus === "breached" ? "#EF4444"
                        : req.slaStatus === "warning" ? "#F59E0B"
                        : "#9CA3AF"
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span
                    className="text-[9px] font-bold tracking-[0.03em]"
                    style={{
                      color: req.slaStatus === "breached" ? "#B91C1C"
                        : req.slaStatus === "warning" ? "#92400E"
                        : "#6B7280",
                    }}
                  >
                    {req.slaDisplay}
                  </span>
                </div>

                {/* Canva button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open("https://www.canva.com", "_blank")
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[3px] border-none bg-[#7B2FBE] px-2.5 py-[7px] text-[11px] font-bold tracking-[0.04em] text-white transition-opacity duration-150 hover:opacity-85"
                  data-testid={`canva-btn-${req.id}`}
                >
                  &#x2B21; Open in Canva
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
