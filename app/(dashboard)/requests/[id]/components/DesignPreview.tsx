"use client"

import { FileText, Download, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LAYOUT } from "@/lib/config/layout"
import type { FileDTO, ViewerRole } from "@/lib/types"
import { REQUEST_STATUS } from "@/lib/constants"

interface DesignPreviewProps {
  files: FileDTO[]
  status: string
  viewerRole: ViewerRole
  onRequestMaterials?: () => void
}

function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)
}

function getLatestDesignFile(files: FileDTO[]): FileDTO | null {
  const imageFiles = files.filter((f) => isImageFile(f.fileName))
  if (imageFiles.length > 0) return imageFiles[imageFiles.length - 1] ?? null
  return files.length > 0 ? files[files.length - 1] ?? null : null
}

export function DesignPreview({
  files,
  status,
  viewerRole,
  onRequestMaterials,
}: DesignPreviewProps) {
  const latestFile = getLatestDesignFile(files)
  const versionNumber = files.filter((f) => isImageFile(f.fileName)).length || 1
  const showRequestMaterials =
    viewerRole === "designer" &&
    (status === REQUEST_STATUS.IN_PROGRESS || status === REQUEST_STATUS.IN_REVIEW || status === "review")

  return (
    <div
      data-testid="design-preview"
      className="flex flex-col rounded-md border bg-card"
      style={{ minHeight: LAYOUT.detail.previewMinHeight }}
    >
      {/* Header bar */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Current Design &mdash; v{versionNumber}
        </span>
        {files.length > 0 && (
          <Badge variant="outline" className="text-[10px]">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          {showRequestMaterials && onRequestMaterials && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestMaterials}
              className="text-xs"
              data-testid="preview-request-materials"
            >
              Request Materials
            </Button>
          )}
          {latestFile?.url && (
            <a href={latestFile.url} download={latestFile.fileName}>
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--brand-accent)] text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/10"
                data-testid="preview-download"
              >
                <Download className="mr-1 size-3" />
                Download
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Preview area — fills remaining space */}
      <div className="flex flex-1 items-center justify-center p-4">
        {!latestFile ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ImageIcon className="size-16 opacity-20" />
            <p className="text-sm font-medium">Awaiting first draft</p>
            <p className="max-w-[260px] text-center text-xs leading-relaxed opacity-50">
              The designer will upload designs here once work begins.
            </p>
          </div>
        ) : isImageFile(latestFile.fileName) && latestFile.url ? (
          <img
            src={latestFile.url}
            alt={latestFile.fileName}
            className="max-w-full rounded-md object-contain shadow-sm"
            style={{ maxHeight: LAYOUT.detail.previewMaxHeight }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <FileText className="size-14 opacity-30" />
            <p className="text-sm font-medium">{latestFile.fileName}</p>
            <p className="text-xs opacity-50">
              Uploaded by {latestFile.uploadedBy}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
