"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, Undo2, Trash2, MoveRight, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LAYOUT } from "@/lib/config/layout"

// ── Constants ────────────────────────────────────────────────────────────────

const REVISION_REASONS = [
  "Wrong dimensions / crop",
  "Text error or typo",
  "Wrong colors / branding",
  "Image quality issue",
  "Layout / spacing problem",
  "Wrong or missing content",
  "Font issue",
  "Other — see comment",
] as const

const CW = LAYOUT.revision.canvasWidth
const CH = LAYOUT.revision.canvasHeight

type ToolType = "select" | "arrow" | "box"

interface Shape {
  type: "arrow" | "box"
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface RevisionSubmission {
  annotatedImageUrl: string
  reason: string
  comment: string
  shapesCount: number
}

interface RevisionModalProps {
  requestTitle: string
  designImageUrl?: string
  assetFileName?: string
  onClose: () => void
  onSubmit: (data: RevisionSubmission) => void
}

// ── Annotation Colors ────────────────────────────────────────────────────────

const COLORS = {
  primary: "#E85D3A",
  primaryLight: "rgba(232, 93, 58, 0.15)",
  outline: "rgba(255,255,255,0.9)",
  shadow: "rgba(0,0,0,0.35)",
  selected: "#3B82F6",
  selectedLight: "rgba(59, 130, 246, 0.2)",
}

// ── Hit Testing ──────────────────────────────────────────────────────────────

const HIT_TOLERANCE = 12
const HANDLE_RADIUS = 10

type HandleId = "p1" | "p2" | "tl" | "tr" | "bl" | "br"

function distPt(px: number, py: number, hx: number, hy: number): number {
  return Math.sqrt((px - hx) ** 2 + (py - hy) ** 2)
}

/** Returns the handle id if the cursor is near a drag handle, or null */
function hitTestHandle(s: Shape, px: number, py: number): HandleId | null {
  if (s.type === "arrow") {
    if (distPt(px, py, s.x1, s.y1) < HANDLE_RADIUS) return "p1"
    if (distPt(px, py, s.x2, s.y2) < HANDLE_RADIUS) return "p2"
  } else {
    const x = Math.min(s.x1, s.x2)
    const y = Math.min(s.y1, s.y2)
    const r = Math.max(s.x1, s.x2)
    const b = Math.max(s.y1, s.y2)
    if (distPt(px, py, x, y) < HANDLE_RADIUS) return "tl"
    if (distPt(px, py, r, y) < HANDLE_RADIUS) return "tr"
    if (distPt(px, py, x, b) < HANDLE_RADIUS) return "bl"
    if (distPt(px, py, r, b) < HANDLE_RADIUS) return "br"
  }
  return null
}

function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
}

function hitTestShape(s: Shape, px: number, py: number): boolean {
  if (s.type === "arrow") {
    return pointToSegmentDist(px, py, s.x1, s.y1, s.x2, s.y2) < HIT_TOLERANCE
  }
  // Box — hit if inside or near border
  const x = Math.min(s.x1, s.x2)
  const y = Math.min(s.y1, s.y2)
  const w = Math.abs(s.x2 - s.x1)
  const h = Math.abs(s.y2 - s.y1)
  return px >= x - HIT_TOLERANCE && px <= x + w + HIT_TOLERANCE &&
         py >= y - HIT_TOLERANCE && py <= y + h + HIT_TOLERANCE
}

// ── Drawing Helpers ──────────────────────────────────────────────────────────

function drawArrow(ctx: CanvasRenderingContext2D, s: Shape, isPreview: boolean, isSelected: boolean) {
  const dx = s.x2 - s.x1
  const dy = s.y2 - s.y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 5) return
  const angle = Math.atan2(dy, dx)
  const headLen = Math.min(28, len * 0.3)
  const headAngle = Math.PI / 7

  const color = isSelected ? COLORS.selected : COLORS.primary

  ctx.save()
  ctx.globalAlpha = isPreview ? 0.5 : 1

  // White outline for contrast on dark images
  ctx.strokeStyle = COLORS.outline
  ctx.lineWidth = 6
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.shadowColor = COLORS.shadow
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.moveTo(s.x1, s.y1)
  ctx.lineTo(s.x2, s.y2)
  ctx.stroke()
  ctx.shadowBlur = 0

  // Main colored shaft
  ctx.strokeStyle = color
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.moveTo(s.x1, s.y1)
  ctx.lineTo(s.x2 - (headLen * 0.5) * Math.cos(angle), s.y2 - (headLen * 0.5) * Math.sin(angle))
  ctx.stroke()

  // Arrowhead — white outline
  ctx.fillStyle = COLORS.outline
  ctx.shadowColor = COLORS.shadow
  ctx.shadowBlur = 4
  ctx.beginPath()
  ctx.moveTo(s.x2 + 2 * Math.cos(angle), s.y2 + 2 * Math.sin(angle))
  ctx.lineTo(s.x2 - (headLen + 2) * Math.cos(angle - headAngle), s.y2 - (headLen + 2) * Math.sin(angle - headAngle))
  ctx.lineTo(s.x2 - (headLen * 0.4) * Math.cos(angle), s.y2 - (headLen * 0.4) * Math.sin(angle))
  ctx.lineTo(s.x2 - (headLen + 2) * Math.cos(angle + headAngle), s.y2 - (headLen + 2) * Math.sin(angle + headAngle))
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0

  // Arrowhead — colored fill
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(s.x2, s.y2)
  ctx.lineTo(s.x2 - headLen * Math.cos(angle - headAngle), s.y2 - headLen * Math.sin(angle - headAngle))
  ctx.lineTo(s.x2 - (headLen * 0.35) * Math.cos(angle), s.y2 - (headLen * 0.35) * Math.sin(angle))
  ctx.lineTo(s.x2 - headLen * Math.cos(angle + headAngle), s.y2 - headLen * Math.sin(angle + headAngle))
  ctx.closePath()
  ctx.fill()

  // Start dot
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(s.x1, s.y1, 5, 0, Math.PI * 2)
  ctx.fill()

  // Selection handles
  if (isSelected) {
    for (const [hx, hy] of [[s.x1, s.y1], [s.x2, s.y2]] as const) {
      ctx.strokeStyle = COLORS.selected
      ctx.fillStyle = "white"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(hx, hy, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }

  ctx.restore()
}

function drawBox(ctx: CanvasRenderingContext2D, s: Shape, isPreview: boolean, isSelected: boolean) {
  const x = Math.min(s.x1, s.x2)
  const y = Math.min(s.y1, s.y2)
  const w = Math.abs(s.x2 - s.x1)
  const h = Math.abs(s.y2 - s.y1)
  if (w < 4 || h < 4) return

  const color = isSelected ? COLORS.selected : COLORS.primary
  const fillColor = isSelected ? COLORS.selectedLight : COLORS.primaryLight
  const r = 4 // corner radius

  ctx.save()
  ctx.globalAlpha = isPreview ? 0.5 : 1

  // Shadow
  ctx.shadowColor = COLORS.shadow
  ctx.shadowBlur = 8

  // Fill
  ctx.fillStyle = fillColor
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
  ctx.shadowBlur = 0

  // White outline for contrast
  ctx.strokeStyle = COLORS.outline
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.stroke()

  // Colored border
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.stroke()

  // Corner handles
  const corners: [number, number][] = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]
  for (const [cx, cy] of corners) {
    ctx.fillStyle = "white"
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, isSelected ? 6 : 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  ctx.restore()
}

function drawShape(ctx: CanvasRenderingContext2D, s: Shape, isPreview: boolean, isSelected: boolean) {
  if (s.type === "arrow") drawArrow(ctx, s, isPreview, isSelected)
  else drawBox(ctx, s, isPreview, isSelected)
}

// ── Component ────────────────────────────────────────────────────────────────

export function RevisionModal({
  requestTitle,
  designImageUrl,
  assetFileName,
  onClose,
  onSubmit,
}: RevisionModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [tool, setTool] = useState<ToolType>("arrow")
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragHandle, setDragHandle] = useState<HandleId | null>(null)
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [previewShape, setPreviewShape] = useState<Shape | null>(null)
  const [reason, setReason] = useState("")
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [reasonTouched, setReasonTouched] = useState(false)

  // Load the design image
  useEffect(() => {
    if (!designImageUrl) {
      setImageLoaded(true)
      return
    }
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      bgImageRef.current = img
      setImageLoaded(true)
    }
    img.onerror = () => setImageLoaded(true)
    img.src = designImageUrl
  }, [designImageUrl])

  // Keyboard: Delete selected shape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (selectedIndex !== null && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault()
        setShapes((prev) => prev.filter((_, i) => i !== selectedIndex))
        setSelectedIndex(null)
      }
      if (e.key === "Escape") {
        setSelectedIndex(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedIndex])

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, CW, CH)

    if (bgImageRef.current) {
      const img = bgImageRef.current
      const scale = Math.min(CW / img.width, CH / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      const dx = (CW - dw) / 2
      const dy = (CH - dh) / 2
      ctx.fillStyle = "#F3F4F6"
      ctx.fillRect(0, 0, CW, CH)
      ctx.drawImage(img, dx, dy, dw, dh)
    } else {
      ctx.fillStyle = "#F3F4F6"
      ctx.fillRect(0, 0, CW, CH)
      ctx.fillStyle = "#D1D5DB"
      ctx.font = "bold 16px 'DM Sans', system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(assetFileName ?? "Design Preview", CW / 2, CH / 2 - 12)
      ctx.fillStyle = "#9CA3AF"
      ctx.font = "13px 'DM Sans', system-ui, sans-serif"
      ctx.fillText("No image available — annotate to mark areas", CW / 2, CH / 2 + 12)
    }

    // Draw shapes
    shapes.forEach((s, i) => drawShape(ctx, s, false, i === selectedIndex))
    if (previewShape) drawShape(ctx, previewShape, true, false)
  }, [shapes, previewShape, assetFileName, imageLoaded, selectedIndex])

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (CW / rect.width),
      y: (e.clientY - rect.top) * (CH / rect.height),
    }
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e)

    // 1) If a shape is selected, check if clicking a handle to resize
    if (selectedIndex !== null) {
      const s = shapes[selectedIndex]!
      const handle = hitTestHandle(s, pos.x, pos.y)
      if (handle) {
        setDragging(true)
        setDragHandle(handle)
        return
      }
    }

    // 2) Check if clicking on any existing shape (select + start move)
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (hitTestShape(shapes[i]!, pos.x, pos.y)) {
        setSelectedIndex(i)
        setDragging(true)
        setDragHandle(null)
        const s = shapes[i]!
        const cx = (s.x1 + s.x2) / 2
        const cy = (s.y1 + s.y2) / 2
        setDragOffset({ dx: pos.x - cx, dy: pos.y - cy })
        return
      }
    }

    // 3) Clicked empty space — deselect
    setSelectedIndex(null)

    // If select tool, nothing else to do
    if (tool === "select") return

    // Start drawing new shape
    setDrawing(true)
    setStartPos(pos)
    setPreviewShape({ type: tool, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y })
  }, [getPos, tool, shapes, selectedIndex])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e)

    // Handle resize (dragging a specific handle point)
    if (dragging && selectedIndex !== null && dragHandle) {
      setShapes((prev) => prev.map((sh, i) => {
        if (i !== selectedIndex) return sh
        if (sh.type === "arrow") {
          // p1 = start, p2 = tip
          if (dragHandle === "p1") return { ...sh, x1: pos.x, y1: pos.y }
          if (dragHandle === "p2") return { ...sh, x2: pos.x, y2: pos.y }
        } else {
          // Box corners: need to figure out which x/y to update
          // Normalize: x1,y1 = stored as-is (may not be top-left)
          // We track which corner maps to which pair
          const minX = Math.min(sh.x1, sh.x2)
          const maxX = Math.max(sh.x1, sh.x2)
          const minY = Math.min(sh.y1, sh.y2)
          const maxY = Math.max(sh.y1, sh.y2)
          switch (dragHandle) {
            case "tl": return { ...sh, x1: pos.x, y1: pos.y, x2: maxX, y2: maxY }
            case "tr": return { ...sh, x1: minX, y1: pos.y, x2: pos.x, y2: maxY }
            case "bl": return { ...sh, x1: pos.x, y1: minY, x2: maxX, y2: pos.y }
            case "br": return { ...sh, x1: minX, y1: minY, x2: pos.x, y2: pos.y }
          }
        }
        return sh
      }))
      return
    }

    // Whole-shape move
    if (dragging && selectedIndex !== null && dragOffset) {
      const s = shapes[selectedIndex]!
      const cx = (s.x1 + s.x2) / 2
      const cy = (s.y1 + s.y2) / 2
      const moveX = (pos.x - dragOffset.dx) - cx
      const moveY = (pos.y - dragOffset.dy) - cy
      setShapes((prev) => prev.map((sh, i) =>
        i === selectedIndex
          ? { ...sh, x1: sh.x1 + moveX, y1: sh.y1 + moveY, x2: sh.x2 + moveX, y2: sh.y2 + moveY }
          : sh,
      ))
      return
    }

    if (!drawing || !startPos) return
    setPreviewShape({ type: tool as "arrow" | "box", x1: startPos.x, y1: startPos.y, x2: pos.x, y2: pos.y })
  }, [dragging, selectedIndex, dragHandle, dragOffset, drawing, startPos, getPos, tool, shapes])

  const onMouseUp = useCallback(() => {
    if (dragging) {
      setDragging(false)
      setDragHandle(null)
      setDragOffset(null)
      return
    }

    if (!drawing || !startPos) return
    if (previewShape) {
      const ddx = previewShape.x2 - previewShape.x1
      const ddy = previewShape.y2 - previewShape.y1
      if (Math.sqrt(ddx * ddx + ddy * ddy) > 8) {
        setShapes((prev) => [...prev, previewShape])
      }
    }
    setDrawing(false)
    setPreviewShape(null)
    setStartPos(null)
  }, [dragging, drawing, startPos, previewShape])

  const onMouseLeave = useCallback(() => {
    if (drawing) {
      setDrawing(false)
      setPreviewShape(null)
      setStartPos(null)
    }
    if (dragging) {
      setDragging(false)
      setDragHandle(null)
      setDragOffset(null)
    }
  }, [drawing, dragging])

  const handleSubmit = useCallback(() => {
    setReasonTouched(true)
    if (!reason) return
    // Deselect before export so no blue selection handles in output
    setSelectedIndex(null)
    const canvas = canvasRef.current
    if (!canvas) return
    // Small delay to let deselect re-render
    requestAnimationFrame(() => {
      const annotatedUrl = canvas.toDataURL("image/png")
      setSubmitted(true)
      setTimeout(() => {
        onSubmit({
          annotatedImageUrl: annotatedUrl,
          reason,
          comment,
          shapesCount: shapes.length,
        })
      }, 600)
    })
  }, [reason, comment, shapes.length, onSubmit])

  const deleteSelected = useCallback(() => {
    if (selectedIndex !== null) {
      setShapes((prev) => prev.filter((_, i) => i !== selectedIndex))
      setSelectedIndex(null)
    }
  }, [selectedIndex])

  const canSubmit = reason.trim() !== ""
  const hasAnnotations = shapes.length > 0

  const cursor = dragging ? "grabbing" : selectedIndex !== null ? "grab" : "crosshair"

  const tools = [
    { id: "arrow" as const, label: "Arrow", icon: MoveRight },
    { id: "box" as const, label: "Box", icon: Square },
  ]

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      data-testid="revision-modal-overlay"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[95vh] flex-col overflow-hidden rounded-lg border bg-card shadow-2xl"
        style={{ width: `min(${LAYOUT.revision.modalMaxWidth}px, 94vw)` }}
        data-testid="revision-modal"
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-3.5">
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: COLORS.primary }}
            >
              Request Revision
            </div>
            <div
              className="text-base font-medium text-foreground"
              style={{ fontFamily: "var(--brand-font-display)" }}
            >
              {requestTitle}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 text-muted-foreground hover:text-foreground"
            data-testid="revision-modal-close"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* ── Toolbar ────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-5 py-2">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Tool
          </span>
          {tools.map((t) => {
            const active = tool === t.id
            return (
              <Button
                key={t.id}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => setTool(t.id)}
                className={cn("h-7 gap-1.5 text-xs", active && "text-white")}
                style={active ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary } : undefined}
                data-testid={`revision-tool-${t.id}`}
              >
                <t.icon className="size-3.5" />
                {t.label}
              </Button>
            )
          })}

          <div className="mx-1 h-5 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShapes((s) => s.slice(0, -1))}
            disabled={shapes.length === 0}
            className="h-7 gap-1 text-xs"
            data-testid="revision-undo"
          >
            <Undo2 className="size-3.5" />
            Undo
          </Button>
          {selectedIndex !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteSelected}
              className="h-7 gap-1 text-xs text-red-500 hover:text-red-600"
              data-testid="revision-delete-selected"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShapes([]); setSelectedIndex(null) }}
            disabled={shapes.length === 0}
            className="h-7 gap-1 text-xs"
            data-testid="revision-clear"
          >
            <Trash2 className="size-3.5" />
            Clear All
          </Button>

          <div className="ml-auto flex items-center gap-2">
            {selectedIndex !== null && (
              <span className="text-[10px] text-blue-500 font-medium">
                Selected — drag to move, Delete to remove
              </span>
            )}
            {hasAnnotations ? (
              <Badge variant="secondary" className="text-[10px]">
                {shapes.length} annotation{shapes.length > 1 ? "s" : ""}
              </Badge>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Click and drag to annotate
              </span>
            )}
          </div>
        </div>

        {/* ── Canvas ─────────────────────────────────── */}
        <div className="relative shrink-0 bg-muted/20 px-5 py-4">
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            className="block w-full rounded-md border shadow-sm"
            style={{ height: "auto", cursor, userSelect: "none" }}
            data-testid="revision-canvas"
          />
        </div>

        {/* ── Reason + Notes ─────────────────────────── */}
        <div className="flex shrink-0 gap-4 border-t px-5 py-4">
          <div className="w-56 shrink-0">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={cn(
                "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors",
                "focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)]",
                !reason && reasonTouched && "border-red-400",
              )}
              data-testid="revision-reason"
            >
              <option value="">Select reason...</option>
              {REVISION_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {!reason && reasonTouched && (
              <p className="mt-1 text-[10px] text-red-500">Please select a reason</p>
            )}
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Additional Notes
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the change in detail..."
              rows={2}
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand-accent)] focus:ring-1 focus:ring-[var(--brand-accent)]"
              data-testid="revision-comment"
            />
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-t bg-muted/20 px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground"
            data-testid="revision-cancel"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {!hasAnnotations && (
              <span className="text-[11px] text-muted-foreground">
                No annotations added yet
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={(!canSubmit && reasonTouched) || submitted}
              className="px-6 text-white"
              style={{ backgroundColor: canSubmit ? COLORS.primary : undefined }}
              data-testid="revision-submit"
            >
              {submitted
                ? "Submitting..."
                : `Submit Revision${hasAnnotations ? ` (${shapes.length})` : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
