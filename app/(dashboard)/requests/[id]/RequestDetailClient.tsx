"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Zap, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { REQUEST_STATUS, ROUTES } from "@/lib/constants"
import { LAYOUT } from "@/lib/config/layout"
import { updateRequestStatus, sendMessage } from "@/actions/intake"
import { Request } from "@/lib/models"
import type { RequestDTO, FileDTO, ViewerRole, StatusLogDTO } from "@/lib/types"
import { RevisionModal, type RevisionSubmission } from "@/components/features/RevisionModal"
import { RequestStepper, DesignPreview, ChatPanel, BriefPanel, ActionStrip } from "./components"

interface RequestDetailClientProps {
  request: RequestDTO
  currentUserId: string
  viewerRole: ViewerRole
  statusLog: StatusLogDTO[]
}

function getLatestDesignUrl(files: FileDTO[]): string | undefined {
  const images = files.filter((f) => {
    const ext = f.fileName.split(".").pop()?.toLowerCase() ?? ""
    return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)
  })
  if (images.length > 0) return images[images.length - 1]?.url ?? undefined
  return files.length > 0 ? files[files.length - 1]?.url ?? undefined : undefined
}

export function RequestDetailClient({
  request: initial,
  currentUserId,
  viewerRole,
  statusLog,
}: RequestDetailClientProps) {
  const router = useRouter()
  const [requestDTO, setRequestDTO] = useState(initial)
  const [loadingAction, setLoadingAction] = useState(false)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [showBriefModal, setShowBriefModal] = useState(false)

  const request = Request.fromDTO(requestDTO)
  const backRoute = viewerRole === "designer" ? ROUTES.QUEUE : ROUTES.REQUESTS

  const handleStatusUpdate = useCallback(
    async (newStatus: string) => {
      setLoadingAction(true)
      try {
        const updated = await updateRequestStatus(requestDTO.id, newStatus)
        if (updated) {
          // Merge: keep local files/messages since the status endpoint returns empty arrays
          setRequestDTO((prev) => ({
            ...prev,
            ...updated,
            files: prev.files,
            messages: prev.messages,
          }))
        }
      } catch {
        // TODO: toast error
      } finally {
        setLoadingAction(false)
      }
    },
    [requestDTO.id],
  )

  const handleFileUpload = useCallback((file: FileDTO) => {
    setRequestDTO((prev) => ({ ...prev, files: [...prev.files, file] }))
  }, [])

  const [revisionImageUrl, setRevisionImageUrl] = useState<string | null>(null)

  const handleRevisionSubmit = useCallback(
    async (data: RevisionSubmission) => {
      setShowRevisionModal(false)
      setRevisionImageUrl(data.annotatedImageUrl)

      // Post the annotated image + reason as a chat message
      const body = `📌 **Revision Request** — ${data.reason}${data.comment ? `\n${data.comment}` : ""}\n[revision-image:${data.annotatedImageUrl}]`
      try {
        await sendMessage(requestDTO.id, body)
      } catch {
        // message send failed silently
      }

      void handleStatusUpdate("revision")
    },
    [handleStatusUpdate, requestDTO.id],
  )

  const isSlaBreached = request.slaStatus === "breached"
  const isSlaWarning = request.slaStatus === "warning"
  const designImageUrl = getLatestDesignUrl(request.files)

  return (
    <div className="space-y-5 py-6" data-testid="request-detail">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(backRoute)}
          className="mt-0.5 shrink-0"
          data-testid="back-button"
        >
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--brand-accent)" }}
            >
              Request {request.queueLabel}
            </span>
            <Badge className={cn("pointer-events-none", request.statusColor)}>
              {request.statusLabel}
            </Badge>
            {request.isRush && (
              <Badge variant="destructive" className="text-[10px]">
                <Zap className="mr-0.5 size-3" />
                Rush
              </Badge>
            )}
            <span
              className={cn("ml-auto text-xs font-medium font-mono", request.slaDisplayColor)}
            >
              {request.slaDisplay}
            </span>
          </div>
          <h1
            className="mt-1 text-xl font-semibold text-foreground"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            {request.title}
          </h1>
        </div>
      </div>

      {/* ── Alert banners ────────────────────────────────────── */}
      {isSlaBreached && (
        <div
          data-testid="sla-breach-alert"
          className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-red-700"
          style={{ backgroundColor: "rgba(220, 38, 38, 0.08)" }}
        >
          <AlertTriangle className="size-4" />
          SLA has been breached. This request is overdue.
        </div>
      )}
      {!isSlaBreached && isSlaWarning && request.isRush && (
        <div
          data-testid="rush-warning-alert"
          className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-amber-700"
          style={{ backgroundColor: "rgba(245, 158, 11, 0.08)" }}
        >
          <Zap className="size-4" />
          Rush request &mdash; {request.slaDisplay}
        </div>
      )}

      {/* ── Stepper (centered) ───────────────────────────────── */}
      <RequestStepper status={request.status} />

      {/* ── Brief info bar (opens modal) ───────────────────── */}
      <BriefPanel
        request={request}
        onFileUpload={handleFileUpload}
        open={showBriefModal}
        onToggle={() => setShowBriefModal((v) => !v)}
      />

      {/* ── Main row: Design Preview (65%) + Chat (35%) ──────── */}
      <div
        className="grid items-stretch gap-5"
        style={{ gridTemplateColumns: LAYOUT.detail.contentGrid }}
      >
        {/* LEFT — Design Preview */}
        <DesignPreview
          files={request.files}
          status={request.status}
          viewerRole={viewerRole}
          onRequestMaterials={() => void handleStatusUpdate(REQUEST_STATUS.AWAITING_MATERIALS)}
        />

        {/* RIGHT — Actions + Chat */}
        <div className="flex flex-col gap-3">
          {/* Action Strip */}
          <div className="shrink-0 rounded-md border bg-card px-4 py-3" data-testid="detail-actions">
            <ActionStrip
              status={request.status}
              viewerRole={viewerRole}
              loading={loadingAction}
              onStatusUpdate={handleStatusUpdate}
              onRequestRevision={() => setShowRevisionModal(true)}
            />
          </div>

          {/* Chat — fills remaining height */}
          <div className="min-h-0 flex-1">
            <ChatPanel
              requestId={request.id}
              currentUserId={currentUserId}
              status={request.status}
              viewerRole={viewerRole}
              statusLog={statusLog}
              loadingAction={loadingAction}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>
        </div>
      </div>

      {/* ── Revision Modal ───────────────────────────────────── */}
      {showRevisionModal && (
        <RevisionModal
          requestTitle={request.title}
          designImageUrl={designImageUrl}
          assetFileName={request.files[0]?.fileName}
          onClose={() => setShowRevisionModal(false)}
          onSubmit={handleRevisionSubmit}
        />
      )}
    </div>
  )
}
