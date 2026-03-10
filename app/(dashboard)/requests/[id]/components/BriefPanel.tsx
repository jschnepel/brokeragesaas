"use client"

import { FileText, Download, Info, Upload as UploadIcon, ExternalLink, X, Paperclip, Calendar, User, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/FileUpload"
import type { FileDTO } from "@/lib/types"
import { Request } from "@/lib/models"

interface BriefPanelProps {
  request: Request
  onFileUpload: (file: FileDTO) => void
  open: boolean
  onToggle: () => void
}

function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)
}

function DetailField({ label, value, icon: Icon }: { label: string; value: string | null; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      {Icon && <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />}
      <div>
        <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-foreground">{value || "\u2014"}</dd>
      </div>
    </div>
  )
}

/** Compact inline bar — shows key info at a glance with a button to open the full modal */
export function BriefInfoBar({ request, onOpen }: { request: Request; onOpen: () => void }) {
  const fileCount = request.files.length
  const imageCount = request.files.filter((f) => isImageFile(f.fileName)).length

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 px-4 py-2 text-left transition-colors hover:border-[var(--brand-accent)]/40 hover:bg-muted/50"
      data-testid="brief-info-bar"
    >
      <Info className="size-4 shrink-0 text-[var(--brand-accent)]" />
      <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{request.materialType}</span>
        </span>
        <span className="hidden sm:inline">&middot;</span>
        <span>Due {request.dueDateFormatted}</span>
        <span className="hidden sm:inline">&middot;</span>
        <span>From {request.requesterName}</span>
        {request.designerName && (
          <>
            <span className="hidden sm:inline">&middot;</span>
            <span>Assigned to {request.designerName}</span>
          </>
        )}
        {fileCount > 0 && (
          <>
            <span className="hidden sm:inline">&middot;</span>
            <span className="flex items-center gap-1">
              <Paperclip className="size-3" />
              {fileCount} file{fileCount !== 1 ? "s" : ""}
              {imageCount > 0 && ` (${imageCount} image${imageCount !== 1 ? "s" : ""})`}
            </span>
          </>
        )}
      </div>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--brand-accent)]">
        View Brief
      </span>
    </button>
  )
}

/** Full modal with brief, materials, files, and upload */
export function BriefModal({ request, onFileUpload, onClose }: {
  request: Request
  onFileUpload: (file: FileDTO) => void
  onClose: () => void
}) {
  const imageFiles = request.files.filter((f) => isImageFile(f.fileName))
  const otherFiles = request.files.filter((f) => !isImageFile(f.fileName))

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      data-testid="brief-modal-overlay"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border bg-card shadow-2xl"
        data-testid="brief-modal"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--brand-accent)" }}
            >
              Request {request.queueLabel}
            </div>
            <h2
              className="text-lg font-semibold text-foreground"
              style={{ fontFamily: "var(--brand-font-display)" }}
            >
              Brief &amp; Materials
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/requests/${request.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              data-testid="brief-modal-fullpage"
            >
              <ExternalLink className="size-3" />
              Full Page
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
              data-testid="brief-modal-close"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left — Request details */}
            <div>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Request Details
              </h3>
              <div className="rounded-md border bg-muted/20 p-4">
                <DetailField icon={Palette} label="Material Type" value={request.materialType} />
                <DetailField icon={Calendar} label="Due Date" value={request.dueDateLong} />
                <DetailField icon={User} label="Requester" value={request.requesterName} />
                <DetailField icon={User} label="Designer" value={request.designerName} />
              </div>
              {request.brief && (
                <div className="mt-4">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Brief
                  </h3>
                  <div className="rounded-md border bg-muted/20 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {request.brief}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right — Files & Upload */}
            <div>
              {/* Images */}
              {imageFiles.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Images ({imageFiles.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {imageFiles.map((f) => (
                      <div
                        key={f.id}
                        className="group relative aspect-[4/3] overflow-hidden rounded-md border"
                      >
                        {f.url ? (
                          <img src={f.url} alt={f.fileName} className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-muted">
                            <FileText className="size-4 text-muted-foreground" />
                          </div>
                        )}
                        {f.url && (
                          <a
                            href={f.url}
                            download={f.fileName}
                            className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="size-5 text-white" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other files */}
              {otherFiles.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Files ({otherFiles.length})
                  </h3>
                  <ul className="space-y-1.5">
                    {otherFiles.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{f.fileName}</span>
                        {f.url && (
                          <a href={f.url} download={f.fileName}>
                            <Button variant="ghost" size="sm" className="size-7 p-0" data-testid={`download-${f.id}`}>
                              <Download className="size-3.5" />
                            </Button>
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upload */}
              <div>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Upload Materials
                </h3>
                <FileUpload requestId={request.id} onUpload={onFileUpload} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Legacy export — wraps the bar + modal together */
export function BriefPanel({ request, onFileUpload, open, onToggle }: BriefPanelProps) {
  return (
    <>
      <BriefInfoBar request={request} onOpen={onToggle} />
      {open && (
        <BriefModal request={request} onFileUpload={onFileUpload} onClose={onToggle} />
      )}
    </>
  )
}
