"use client"

import { Play, Send, CheckCircle, RotateCcw, Package, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { REQUEST_STATUS } from "@/lib/constants"
import type { ViewerRole } from "@/lib/types"

interface ActionStripProps {
  status: string
  viewerRole: ViewerRole
  loading: boolean
  onStatusUpdate: (newStatus: string) => void
  onRequestRevision?: () => void
}

interface ActionConfig {
  label: string
  status: string
  variant: "default" | "outline" | "destructive" | "secondary" | "ghost"
  icon: typeof Play
  className?: string
}

function getActions(status: string, viewerRole: ViewerRole): ActionConfig[] {
  if (viewerRole === "designer") {
    switch (status) {
      case REQUEST_STATUS.SUBMITTED:
      case REQUEST_STATUS.ASSIGNED:
        return [
          {
            label: "Start Work",
            status: REQUEST_STATUS.IN_PROGRESS,
            variant: "default",
            icon: Play,
            className: "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90",
          },
        ]
      case REQUEST_STATUS.IN_PROGRESS:
        return [
          {
            label: "Send to Review",
            status: "review",
            variant: "default",
            icon: Send,
            className: "bg-[#7B2FBE] hover:bg-[#7B2FBE]/90 text-white",
          },
        ]
      case "revision":
      case REQUEST_STATUS.AWAITING_MATERIALS:
        return [
          {
            label: "Resume Work",
            status: REQUEST_STATUS.IN_PROGRESS,
            variant: "default",
            icon: Play,
            className: "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90",
          },
        ]
      default:
        return []
    }
  }

  if (viewerRole === "agent") {
    switch (status) {
      case "review":
      case REQUEST_STATUS.IN_REVIEW:
        return [
          {
            label: "Mark Complete",
            status: REQUEST_STATUS.COMPLETED,
            variant: "default",
            icon: CheckCircle,
            className: "bg-green-600 hover:bg-green-700 text-white",
          },
          {
            label: "Request Revision",
            status: REQUEST_STATUS.IN_PROGRESS,
            variant: "outline",
            icon: RotateCcw,
            className: "border-orange-400 text-orange-600 hover:bg-orange-50",
          },
        ]
      case REQUEST_STATUS.AWAITING_MATERIALS:
        return [
          {
            label: "Materials Sent",
            status: REQUEST_STATUS.IN_PROGRESS,
            variant: "default",
            icon: Package,
            className: "bg-cyan-600 hover:bg-cyan-700 text-white",
          },
        ]
      default:
        return []
    }
  }

  return []
}

export function ActionStrip({ status, viewerRole, loading, onStatusUpdate, onRequestRevision }: ActionStripProps) {
  const actions = getActions(status, viewerRole)

  if (actions.length === 0) return null

  return (
    <div data-testid="action-strip" className="flex flex-wrap items-center justify-center gap-2">
      {/* Primary actions */}
      {actions.map((action) => (
        <Button
          key={action.label}
          variant={action.variant}
          disabled={loading}
          onClick={() => {
            if (action.label === "Request Revision" && onRequestRevision) {
              onRequestRevision()
            } else {
              onStatusUpdate(action.status)
            }
          }}
          className={cn("px-6 py-2.5 text-sm", action.className)}
          data-testid={`action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <action.icon className="mr-2 size-4" />
          {action.label}
        </Button>
      ))}

      {/* Designer extras — pushed right */}
      {viewerRole === "designer" && (
        <div className="ml-auto flex items-center gap-2">
          {status === REQUEST_STATUS.IN_PROGRESS && (
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onStatusUpdate(REQUEST_STATUS.AWAITING_MATERIALS)}
              className="border-cyan-400 text-cyan-600 hover:bg-cyan-50"
              data-testid="action-request-materials"
            >
              <Package className="mr-1.5 size-3.5" />
              Request Materials
            </Button>
          )}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: "#7B2FBE" }}
            data-testid="action-open-canva"
          >
            <ExternalLink className="size-3" />
            Open in Canva
          </a>
        </div>
      )}
    </div>
  )
}
