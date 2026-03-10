"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FileDTO } from "@/lib/types"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif,.svg,.pdf,.psd,.ai,.eps"

interface FileUploadProps {
  requestId: string
  onUpload?: (file: FileDTO) => void
}

type UploadState = "idle" | "uploading" | "success" | "error"

export function FileUpload({ requestId, onUpload }: FileUploadProps) {
  const [state, setState] = useState<UploadState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null)

      if (file.size > MAX_FILE_SIZE) {
        setError("File exceeds 5MB limit.")
        setState("error")
        return
      }

      setState("uploading")

      try {
        const formData = new FormData()
        formData.append("requestId", requestId)
        formData.append("file", file)

        const res = await fetch("/api/files", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Upload failed" }))
          throw new Error(data.error ?? "Upload failed")
        }

        const fileDTO: FileDTO = await res.json()
        setState("success")
        onUpload?.(fileDTO)

        // Reset to idle after brief success indication
        setTimeout(() => setState("idle"), 2000)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed"
        setError(message)
        setState("error")
        setTimeout(() => setState("idle"), 3000)
      }
    },
    [requestId, onUpload]
  )

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file) {
      void uploadFile(file)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-2">
      <div
        data-testid="file-upload-zone"
        role="button"
        tabIndex={0}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors cursor-pointer",
          isDragOver && "border-primary bg-primary/5",
          state === "error" && "border-destructive/50",
          state === "success" && "border-green-500/50",
          state === "idle" && !isDragOver && "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          data-testid="file-upload-input"
        />

        {state === "idle" && (
          <>
            <Upload className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Drop files here or click to browse
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Images, PDFs, design files up to 5MB
            </p>
          </>
        )}

        {state === "uploading" && (
          <>
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Uploading...</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle className="size-5 text-green-600" />
            <p className="text-xs text-green-600">File uploaded</p>
          </>
        )}

        {state === "error" && (
          <>
            <AlertCircle className="size-5 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
          </>
        )}
      </div>
    </div>
  )
}
