"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  Clock,
  CheckCircle,
  Timer,
  Plus,
  Send,
  AlertTriangle,
  X,
  Layers,
  User,
  Calendar,
  UserCheck,
  Share2,
  Mail,
  Video,
  BookOpen,
  BarChart3,
  Flag,
  MoreHorizontal,
  Zap,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { MATERIAL_TYPES, REQUEST_STATUS } from "@/lib/constants"
import { createRequest, cancelRequest, getMessages, sendMessage } from "@/actions/intake"
import { Request, KPIDashboard, ChatManager } from "@/lib/models"
import { FileUpload } from "@/components/FileUpload"
import type { RequestDTO, KPIs, MessageDTO, FileDTO } from "@/lib/types"
import { QuickActionSheet } from "@/components/features/QuickActionSheet"

/* ── Material Type Config ──────────────────────────────────────────────── */

interface MaterialTypeConfig {
  icon: LucideIcon
  description: string
}

const MATERIAL_TYPE_CONFIG: Record<string, MaterialTypeConfig> = {
  Flyer: { icon: FileText, description: "Print-ready flyers for events and listings" },
  "Social Pack": { icon: Share2, description: "Multi-platform social media graphics" },
  "Email Campaign": { icon: Mail, description: "Branded email templates and content" },
  "Video Script": { icon: Video, description: "Scripts for property tours and brand videos" },
  Brochure: { icon: BookOpen, description: "Multi-page brochures and booklets" },
  Report: { icon: BarChart3, description: "Data-driven market and performance reports" },
  Signage: { icon: Flag, description: "Yard signs, banners, and directional signage" },
  Other: { icon: MoreHorizontal, description: "Custom requests and special projects" },
}

function getMaterialIcon(type: string): LucideIcon {
  return MATERIAL_TYPE_CONFIG[type]?.icon ?? FileText
}

/* ── Workflow Steps ────────────────────────────────────────────────────── */

const WORKFLOW_STEPS = [
  { key: REQUEST_STATUS.SUBMITTED, label: "Submitted" },
  { key: REQUEST_STATUS.IN_REVIEW, label: "In Review" },
  { key: REQUEST_STATUS.ASSIGNED, label: "Assigned" },
  { key: REQUEST_STATUS.IN_PROGRESS, label: "In Progress" },
  { key: REQUEST_STATUS.COMPLETED, label: "Completed" },
] as const

/* ── Social Platforms ─────────────────────────────────────────────────── */

const SOCIAL_PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "Twitter"] as const

/* ── Video Styles ─────────────────────────────────────────────────────── */

const VIDEO_STYLES = ["Testimonial", "Property Tour", "Brand"] as const

/* ── Data Periods ─────────────────────────────────────────────────────── */

const DATA_PERIODS = ["Monthly", "Quarterly", "Annual"] as const

/* ── Dynamic Fields State ─────────────────────────────────────────────── */

interface DynamicFields {
  dimensions: string
  quantity: string
  platforms: string[]
  subjectLine: string
  audienceSegment: string
  durationTarget: string
  videoStyle: string
  dataPeriod: string
  additionalDetails: string
}

const EMPTY_DYNAMIC_FIELDS: DynamicFields = {
  dimensions: "",
  quantity: "",
  platforms: [],
  subjectLine: "",
  audienceSegment: "",
  durationTarget: "",
  videoStyle: "",
  dataPeriod: "",
  additionalDetails: "",
}

/* ── Status Badge ──────────────────────────────────────────────────────── */

function StatusBadge({ request }: { request: Request }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", request.statusColor)}>
      {request.statusLabel}
    </span>
  )
}

/* ── KPI Cards ─────────────────────────────────────────────────────────── */

function KPIRow({ kpis }: { kpis: KPIs }) {
  const dashboard = KPIDashboard.from(kpis)

  const slaBreachColor =
    dashboard.slaBreachSeverity === "critical"
      ? "text-red-600"
      : dashboard.slaBreachSeverity === "warning"
        ? "text-amber-600"
        : "text-foreground"

  const rushColor =
    dashboard.rushSeverity === "critical"
      ? "text-red-600"
      : dashboard.rushSeverity === "warning"
        ? "text-amber-600"
        : "text-foreground"

  const items = [
    { label: "Total Requests", value: dashboard.totalRequests, icon: FileText, color: "text-foreground" },
    { label: "Open", value: dashboard.openRequests, icon: Clock, color: "text-foreground" },
    { label: "Completed", value: dashboard.completedRequests, icon: CheckCircle, color: "text-foreground" },
    { label: "Avg Turnaround", value: dashboard.avgTurnaroundDisplay, icon: Timer, color: "text-foreground" },
    { label: "SLA Breach Rate", value: dashboard.slaBreachDisplay, icon: AlertTriangle, color: slaBreachColor },
    { label: "Rush %", value: dashboard.rushDisplay, icon: Zap, color: rushColor },
  ] as const

  return (
    <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{item.label}</span>
              <item.icon className={cn("size-3.5", item.color === "text-foreground" ? "text-muted-foreground" : item.color)} />
            </div>
            <CardTitle className={cn("text-xl font-semibold tabular-nums", item.color)}>
              {item.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

/* ── Request Card (visual grid) ────────────────────────────────────────── */

function getHeroImage(request: Request): string | null {
  // Use hero image from the DB query (lateral join) if available
  if (request.heroImageUrl) return request.heroImageUrl
  // Fallback to local files array
  const imageExts = ["jpg", "jpeg", "png", "webp", "gif", "svg"]
  const imageFile = request.files.find((f) => {
    const ext = f.fileName.split(".").pop()?.toLowerCase() ?? ""
    return imageExts.includes(ext) && f.url
  })
  return imageFile?.url ?? null
}

function RequestCard({
  request,
  onClick,
}: {
  request: Request
  onClick: () => void
}) {
  const Icon = getMaterialIcon(request.materialType)
  const heroUrl = getHeroImage(request)

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:shadow-lg hover:border-[var(--brand-accent)]/30"
      onClick={onClick}
      data-testid={`request-card-${request.id}`}
    >
      {/* Hero image / placeholder */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {heroUrl ? (
          <img
            src={heroUrl}
            alt={request.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/60">
            <Icon className="size-10 text-muted-foreground/30" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40">
              {request.materialType}
            </span>
          </div>
        )}
        {/* Status overlay */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <StatusBadge request={request} />
          {request.isRush && (
            <Badge variant="destructive" className="text-[10px]">
              <Zap className="mr-0.5 size-3" /> Rush
            </Badge>
          )}
        </div>
        {/* SLA overlay */}
        <div className="absolute top-2.5 right-2.5">
          <span className={cn(
            "rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold font-mono backdrop-blur-sm",
            request.slaDisplayColor,
          )}>
            {request.slaDisplay}
          </span>
        </div>
      </div>

      {/* Details below image */}
      <div className="p-3.5">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">{request.queueLabel}</span>
          <span className="text-[10px] text-muted-foreground">&middot;</span>
          <span className="text-[10px] text-muted-foreground">{request.materialType}</span>
        </div>
        <h3 className="truncate text-sm font-medium leading-snug">{request.title}</h3>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Due {request.dueDateFormatted}</span>
          <span>{request.designerName ?? "Unassigned"}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Wizard Step 1: Choose Material Type ──────────────────────────────── */

function WizardStep1({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (type: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {MATERIAL_TYPES.map((mt) => {
        const config = MATERIAL_TYPE_CONFIG[mt]
        const Icon = config?.icon ?? FileText
        const isSelected = selected === mt

        return (
          <button
            key={mt}
            type="button"
            onClick={() => onSelect(mt)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors duration-150",
              isSelected
                ? "border-[var(--brand-navy,#0F2B4F)] bg-[var(--brand-navy,#0F2B4F)]/5"
                : "border-transparent bg-muted/40 hover:bg-muted/70",
            )}
          >
            <Icon className={cn("size-6", isSelected ? "text-[var(--brand-navy,#0F2B4F)]" : "text-muted-foreground")} />
            <span className={cn("text-sm font-medium", isSelected ? "text-[var(--brand-navy,#0F2B4F)]" : "text-foreground")}>
              {mt}
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              {config?.description ?? ""}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Wizard Step 2: Request Details ───────────────────────────────────── */

function WizardStep2({
  materialType,
  title,
  setTitle,
  dueDate,
  setDueDate,
  isRush,
  setIsRush,
  brief,
  setBrief,
  dynamicFields,
  setDynamicFields,
}: {
  materialType: string
  title: string
  setTitle: (v: string) => void
  dueDate: string
  setDueDate: (v: string) => void
  isRush: boolean
  setIsRush: (v: boolean) => void
  brief: string
  setBrief: (v: string) => void
  dynamicFields: DynamicFields
  setDynamicFields: (fn: (prev: DynamicFields) => DynamicFields) => void
}) {
  const needsDimensions = ["Flyer", "Brochure", "Signage"].includes(materialType)
  const isSocialPack = materialType === "Social Pack"
  const isEmailCampaign = materialType === "Email Campaign"
  const isVideoScript = materialType === "Video Script"
  const isReport = materialType === "Report"
  const isOther = materialType === "Other"

  function togglePlatform(platform: string) {
    setDynamicFields((prev) => {
      const has = prev.platforms.includes(platform)
      return {
        ...prev,
        platforms: has
          ? prev.platforms.filter((p) => p !== platform)
          : [...prev.platforms, platform],
      }
    })
  }

  return (
    <div className="grid gap-4">
      {/* Title */}
      <div className="grid gap-2">
        <Label htmlFor="wiz-title">Title *</Label>
        <Input
          id="wiz-title"
          placeholder="e.g. Spring Open House Flyer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Due date */}
      <div className="grid gap-2">
        <Label htmlFor="wiz-due">Due Date</Label>
        <Input
          id="wiz-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      {/* Rush toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="wiz-rush"
          checked={isRush}
          onCheckedChange={setIsRush}
        />
        <Label htmlFor="wiz-rush" className="cursor-pointer">
          Rush — 24h SLA
        </Label>
      </div>

      {/* Brief */}
      <div className="grid gap-2">
        <Label htmlFor="wiz-brief">Brief</Label>
        <Textarea
          id="wiz-brief"
          placeholder="Describe what you need..."
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={4}
        />
      </div>

      {/* Dynamic fields: Flyer / Brochure / Signage */}
      {needsDimensions && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="wiz-dimensions">Dimensions</Label>
              <Input
                id="wiz-dimensions"
                placeholder='e.g. 8.5" x 11"'
                value={dynamicFields.dimensions}
                onChange={(e) =>
                  setDynamicFields((prev) => ({ ...prev, dimensions: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wiz-quantity">Quantity</Label>
              <Input
                id="wiz-quantity"
                type="number"
                placeholder="e.g. 500"
                value={dynamicFields.quantity}
                onChange={(e) =>
                  setDynamicFields((prev) => ({ ...prev, quantity: e.target.value }))
                }
              />
            </div>
          </div>
        </>
      )}

      {/* Dynamic fields: Social Pack */}
      {isSocialPack && (
        <>
          <Separator />
          <div className="grid gap-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <label key={platform} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={dynamicFields.platforms.includes(platform)}
                    onCheckedChange={() => togglePlatform(platform)}
                  />
                  <span className="text-sm">{platform}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Dynamic fields: Email Campaign */}
      {isEmailCampaign && (
        <>
          <Separator />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="wiz-subject">Subject Line</Label>
              <Input
                id="wiz-subject"
                placeholder="e.g. Your Dream Home Awaits"
                value={dynamicFields.subjectLine}
                onChange={(e) =>
                  setDynamicFields((prev) => ({ ...prev, subjectLine: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wiz-audience">Audience Segment</Label>
              <Input
                id="wiz-audience"
                placeholder="e.g. Active Buyers — Scottsdale"
                value={dynamicFields.audienceSegment}
                onChange={(e) =>
                  setDynamicFields((prev) => ({ ...prev, audienceSegment: e.target.value }))
                }
              />
            </div>
          </div>
        </>
      )}

      {/* Dynamic fields: Video Script */}
      {isVideoScript && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="wiz-duration">Duration Target</Label>
              <Input
                id="wiz-duration"
                placeholder="e.g. 60 seconds"
                value={dynamicFields.durationTarget}
                onChange={(e) =>
                  setDynamicFields((prev) => ({ ...prev, durationTarget: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Style</Label>
              <Select
                value={dynamicFields.videoStyle}
                onValueChange={(val) =>
                  setDynamicFields((prev) => ({ ...prev, videoStyle: val as string }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select style..." />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_STYLES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {/* Dynamic fields: Report */}
      {isReport && (
        <>
          <Separator />
          <div className="grid gap-2">
            <Label>Data Period</Label>
            <Select
              value={dynamicFields.dataPeriod}
              onValueChange={(val) =>
                setDynamicFields((prev) => ({ ...prev, dataPeriod: val as string }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select period..." />
              </SelectTrigger>
              <SelectContent>
                {DATA_PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Dynamic fields: Other */}
      {isOther && (
        <>
          <Separator />
          <div className="grid gap-2">
            <Label htmlFor="wiz-additional">Additional Details</Label>
            <Textarea
              id="wiz-additional"
              placeholder="Describe your custom request..."
              value={dynamicFields.additionalDetails}
              onChange={(e) =>
                setDynamicFields((prev) => ({ ...prev, additionalDetails: e.target.value }))
              }
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  )
}

/* ── Wizard Step 3: Review & Submit ───────────────────────────────────── */

function WizardStep3({
  materialType,
  title,
  dueDate,
  isRush,
  brief,
  dynamicFields,
  onEdit,
}: {
  materialType: string
  title: string
  dueDate: string
  isRush: boolean
  brief: string
  dynamicFields: DynamicFields
  onEdit: () => void
}) {
  const Icon = getMaterialIcon(materialType)
  const needsDimensions = ["Flyer", "Brochure", "Signage"].includes(materialType)
  const isSocialPack = materialType === "Social Pack"
  const isEmailCampaign = materialType === "Email Campaign"
  const isVideoScript = materialType === "Video Script"
  const isReport = materialType === "Report"
  const isOther = materialType === "Other"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Review your request</h3>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {/* Material type */}
          <div className="flex items-center gap-2">
            <Icon className="size-5 text-[var(--brand-navy,#0F2B4F)]" />
            <span className="text-sm font-medium">{materialType}</span>
          </div>

          <Separator />

          {/* Main details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Title</p>
              <p className="font-medium">{title}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="font-medium">
                {dueDate
                  ? new Date(dueDate + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No date set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rush</p>
              <p className="font-medium">{isRush ? "Yes — 24h SLA" : "No"}</p>
            </div>
          </div>

          {/* Brief */}
          {brief && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Brief</p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{brief}</p>
              </div>
            </>
          )}

          {/* Dynamic field previews */}
          {needsDimensions && (dynamicFields.dimensions || dynamicFields.quantity) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {dynamicFields.dimensions && (
                  <div>
                    <p className="text-xs text-muted-foreground">Dimensions</p>
                    <p className="font-medium">{dynamicFields.dimensions}</p>
                  </div>
                )}
                {dynamicFields.quantity && (
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="font-medium">{dynamicFields.quantity}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {isSocialPack && dynamicFields.platforms.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Platforms</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {dynamicFields.platforms.map((p) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {isEmailCampaign && (dynamicFields.subjectLine || dynamicFields.audienceSegment) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {dynamicFields.subjectLine && (
                  <div>
                    <p className="text-xs text-muted-foreground">Subject Line</p>
                    <p className="font-medium">{dynamicFields.subjectLine}</p>
                  </div>
                )}
                {dynamicFields.audienceSegment && (
                  <div>
                    <p className="text-xs text-muted-foreground">Audience Segment</p>
                    <p className="font-medium">{dynamicFields.audienceSegment}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {isVideoScript && (dynamicFields.durationTarget || dynamicFields.videoStyle) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {dynamicFields.durationTarget && (
                  <div>
                    <p className="text-xs text-muted-foreground">Duration Target</p>
                    <p className="font-medium">{dynamicFields.durationTarget}</p>
                  </div>
                )}
                {dynamicFields.videoStyle && (
                  <div>
                    <p className="text-xs text-muted-foreground">Style</p>
                    <p className="font-medium">{dynamicFields.videoStyle}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {isReport && dynamicFields.dataPeriod && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Data Period</p>
                <p className="text-sm font-medium">{dynamicFields.dataPeriod}</p>
              </div>
            </>
          )}

          {isOther && dynamicFields.additionalDetails && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Additional Details</p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">
                  {dynamicFields.additionalDetails}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ── New Request Wizard Dialog ─────────────────────────────────────────── */

function NewRequestDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (req: Request) => void
}) {
  const [step, setStep] = useState(1)
  const [materialType, setMaterialType] = useState("")
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [isRush, setIsRush] = useState(false)
  const [brief, setBrief] = useState("")
  const [dynamicFields, setDynamicFields] = useState<DynamicFields>(EMPTY_DYNAMIC_FIELDS)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setStep(1)
    setMaterialType("")
    setTitle("")
    setDueDate("")
    setIsRush(false)
    setBrief("")
    setDynamicFields(EMPTY_DYNAMIC_FIELDS)
  }

  function buildBrief(): string {
    const parts: string[] = []
    if (brief.trim()) parts.push(brief.trim())

    const needsDimensions = ["Flyer", "Brochure", "Signage"].includes(materialType)
    if (needsDimensions) {
      if (dynamicFields.dimensions) parts.push(`Dimensions: ${dynamicFields.dimensions}`)
      if (dynamicFields.quantity) parts.push(`Quantity: ${dynamicFields.quantity}`)
    }
    if (materialType === "Social Pack" && dynamicFields.platforms.length > 0) {
      parts.push(`Platforms: ${dynamicFields.platforms.join(", ")}`)
    }
    if (materialType === "Email Campaign") {
      if (dynamicFields.subjectLine) parts.push(`Subject Line: ${dynamicFields.subjectLine}`)
      if (dynamicFields.audienceSegment) parts.push(`Audience: ${dynamicFields.audienceSegment}`)
    }
    if (materialType === "Video Script") {
      if (dynamicFields.durationTarget) parts.push(`Duration: ${dynamicFields.durationTarget}`)
      if (dynamicFields.videoStyle) parts.push(`Style: ${dynamicFields.videoStyle}`)
    }
    if (materialType === "Report" && dynamicFields.dataPeriod) {
      parts.push(`Period: ${dynamicFields.dataPeriod}`)
    }
    if (materialType === "Other" && dynamicFields.additionalDetails) {
      parts.push(dynamicFields.additionalDetails)
    }

    return parts.join("\n")
  }

  async function handleSubmit() {
    if (!title.trim() || !materialType) return
    setSubmitting(true)
    try {
      const fullBrief = buildBrief()
      const dto = await createRequest({
        title: title.trim(),
        material_type: materialType,
        brief: fullBrief || undefined,
        due_date: dueDate || undefined,
        is_rush: isRush,
      })
      onCreated(Request.fromDTO(dto))
      reset()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const stepLabels = ["Material Type", "Details", "Review"]

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Request</DialogTitle>
          <DialogDescription>
            {step === 1 && "Choose the type of material you need."}
            {step === 2 && "Fill in the details for your request."}
            {step === 3 && "Review and submit your request."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-1">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1
            const isCurrent = step === stepNum
            const isComplete = step > stepNum
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors duration-150",
                    isCurrent && "bg-[var(--brand-navy,#0F2B4F)] text-white",
                    isComplete && "bg-emerald-500 text-white",
                    !isCurrent && !isComplete && "bg-muted text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="size-3.5" /> : stepNum}
                </div>
                <span className={cn("text-xs hidden sm:inline", isCurrent ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div className={cn("h-px flex-1", isComplete ? "bg-emerald-500" : "bg-border")} />
                )}
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Step content */}
        <div className="max-h-[60vh] overflow-y-auto px-1">
          {step === 1 && (
            <WizardStep1
              selected={materialType}
              onSelect={setMaterialType}
            />
          )}
          {step === 2 && (
            <WizardStep2
              materialType={materialType}
              title={title}
              setTitle={setTitle}
              dueDate={dueDate}
              setDueDate={setDueDate}
              isRush={isRush}
              setIsRush={setIsRush}
              brief={brief}
              setBrief={setBrief}
              dynamicFields={dynamicFields}
              setDynamicFields={setDynamicFields}
            />
          )}
          {step === 3 && (
            <WizardStep3
              materialType={materialType}
              title={title}
              dueDate={dueDate}
              isRush={isRush}
              brief={brief}
              dynamicFields={dynamicFields}
              onEdit={() => setStep(2)}
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 1 && (
            <>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                disabled={!materialType}
                onClick={() => setStep(2)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <Button
                disabled={!title.trim()}
                onClick={() => setStep(3)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="size-4" />
                Back
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Cancel Confirmation ───────────────────────────────────────────────── */

function CancelConfirmDialog({
  open,
  requestId,
  onClose,
  onCancelled,
}: {
  open: boolean
  requestId: string
  onClose: () => void
  onCancelled: () => void
}) {
  const [cancelling, setCancelling] = useState(false)

  async function handleConfirm() {
    setCancelling(true)
    try {
      await cancelRequest(requestId)
      onCancelled()
    } finally {
      setCancelling(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Cancel Request?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The request will be marked as cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Request</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Cancel Request"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* ── Chat Thread ───────────────────────────────────────────────────────── */

function ChatThread({
  requestId,
  initialMessages,
  currentUserId,
}: {
  requestId: string
  initialMessages: MessageDTO[]
  currentUserId: string
}) {
  const chatRef = useRef<ChatManager | null>(null)
  if (!chatRef.current || chatRef.current.requestId !== requestId) {
    chatRef.current = new ChatManager(requestId, currentUserId, getMessages, sendMessage)
  }
  const chat = chatRef.current

  const [messages, setMessages] = useState(() => chat.toDisplayMessages(initialMessages))
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chat.startPolling((freshDTOs) => {
      setMessages(chat.toDisplayMessages(freshDTOs))
    })
    return () => chat.stopPolling()
  }, [chat])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      const msgDTO = await chat.sendMessage(body)
      const [displayMsg] = chat.toDisplayMessages([msgDTO])
      setMessages((prev) => [...prev, displayMsg])
      setBody("")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Messages
      </h4>
      <div
        ref={scrollRef}
        className="flex max-h-60 flex-col gap-2 overflow-y-auto rounded-lg border bg-muted/30 p-3"
      >
        {messages.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No messages yet.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[80%] rounded-lg px-3 py-2 text-xs",
              m.isOwn
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-background ring-1 ring-foreground/10"
            )}
          >
            {!m.isOwn && (
              <p className="mb-0.5 font-medium text-muted-foreground">{m.senderName}</p>
            )}
            <p>{m.body}</p>
            <p className={cn("mt-1 text-[10px]", m.isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
              {m.formattedTime}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={sending || !body.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}

/* ── Workflow Stepper ──────────────────────────────────────────────────── */

function WorkflowStepper({ request }: { request: Request }) {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.key === request.status)
  const isCancelled = request.isCancelled

  return (
    <div className="flex items-center gap-1">
      {WORKFLOW_STEPS.map((ws, i) => {
        const isComplete = !isCancelled && currentIndex > i
        const isCurrent = !isCancelled && currentIndex === i
        const isFuture = isCancelled || currentIndex < i

        return (
          <div key={ws.key} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium transition-colors",
                  isComplete && "bg-emerald-500 text-white",
                  isCurrent && "bg-[var(--brand-navy,#0F2B4F)] text-white",
                  isFuture && "bg-muted text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="size-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] text-center leading-tight",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {ws.label}
              </span>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div className={cn("h-px flex-1 mt-[-14px]", isComplete ? "bg-emerald-500" : "bg-border")} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Request Detail Sheet ──────────────────────────────────────────────── */

function RequestDetailSheet({
  request,
  open,
  onClose,
  currentUserId,
  onCancel,
  onFileUpload,
}: {
  request: Request | null
  open: boolean
  onClose: () => void
  currentUserId: string
  onCancel: (id: string) => void
  onFileUpload: (requestId: string, file: FileDTO) => void
}) {
  if (!request) return null

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {request.queueLabel}
            </span>
            {request.isRush && <Badge variant="destructive">Rush</Badge>}
          </div>
          <SheetTitle>{request.title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          {/* Workflow stepper */}
          <WorkflowStepper request={request} />

          <Separator />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <div className="flex items-center gap-1.5">
                <Layers className="size-3.5 text-muted-foreground" />
                <span>{request.materialType}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge request={request} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Requester</p>
              <div className="flex items-center gap-1.5">
                <User className="size-3.5 text-muted-foreground" />
                <span>{request.requesterName}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Designer</p>
              <div className="flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-muted-foreground" />
                <span>{request.designerName ?? "Unassigned"}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>{request.dueDateLong}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SLA</p>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className={cn("font-medium", request.slaDisplayColor)}>
                  {request.slaDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Transition buttons */}
          {request.hasTransitions && (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Workflow Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {request.availableTransitions.map((t) => (
                    <Badge key={t.next} variant="outline" className="cursor-default text-xs">
                      {t.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Brief */}
          {request.brief && (
            <>
              <Separator />
              <div>
                <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Brief
                </h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.brief}</p>
              </div>
            </>
          )}

          {/* Files */}
          <Separator />
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Files
            </h4>
            {request.files.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {request.files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="size-3.5 text-muted-foreground" />
                      {f.url ? (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium underline hover:text-primary"
                          download={f.fileName}
                        >
                          {f.fileName}
                        </a>
                      ) : (
                        <span className="font-medium">{f.fileName}</span>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {f.uploadedBy} &middot; {Request.formatDate(f.uploadedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <FileUpload
              requestId={request.id}
              onUpload={(file) => onFileUpload(request.id, file)}
            />
          </div>

          {/* Chat thread */}
          <Separator />
          <ChatThread
            requestId={request.id}
            initialMessages={request.messages}
            currentUserId={currentUserId}
          />

          {/* Cancel button */}
          {request.isActive && (
            <>
              <Separator />
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => onCancel(request.id)}
              >
                <X className="size-4" />
                Cancel Request
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ── Request List ──────────────────────────────────────────────────────── */

function RequestList({
  requests,
  onSelect,
}: {
  requests: Request[]
  onSelect: (r: Request) => void
}) {
  if (requests.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No requests here.
      </p>
    )
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {requests.map((r) => (
        <RequestCard key={r.id} request={r} onClick={() => onSelect(r)} />
      ))}
    </div>
  )
}

/* ── Main Client ───────────────────────────────────────────────────────── */

interface Props {
  requests: RequestDTO[]
  kpis: KPIs
  currentUserId: string
}

export function RequestsClient({ requests: rawRequests, kpis, currentUserId }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<string>("active")
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<Request | null>(null)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [list, setList] = useState(() => Request.fromDTOs(rawRequests))

  const navigateToDetail = useCallback((r: Request) => {
    router.push(`/requests/${r.id}`)
  }, [router])

  const filtered = useMemo(() => {
    if (tab === "completed") return Request.filterCompleted(list)
    if (tab === "cancelled") return Request.filterCancelled(list)
    return Request.filterActive(list)
  }, [list, tab])

  const handleCreated = useCallback((req: Request) => {
    setList((prev) => [req, ...prev])
  }, [])

  const handleCancelled = useCallback(() => {
    setList((prev) =>
      prev.map((r) =>
        r.id === cancelTarget ? r.withStatus("cancelled") : r
      )
    )
    setCancelTarget(null)
    setSelected(null)
  }, [cancelTarget])

  const handleFileUpload = useCallback((requestId: string, file: FileDTO) => {
    setSelected((prev) => prev ? prev.withFile(file) : prev)
  }, [])

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <div
            className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ color: "var(--brand-accent)" }}
          >
            Marketing Requests
          </div>
          <h1
            className="text-2xl font-light tracking-tight"
            style={{ fontFamily: "var(--brand-font-display)", color: "var(--brand-primary)" }}
          >
            My Requests
          </h1>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-1.5">
          <Plus className="size-4" />
          New Request
        </Button>
      </div>

      {/* KPI row */}
      <KPIRow kpis={kpis} />

      {/* Tabs + list */}
      <Tabs value={tab} onValueChange={(val) => setTab(val as string)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <RequestList requests={filtered} onSelect={navigateToDetail} />
        </TabsContent>
        <TabsContent value="completed">
          <RequestList requests={filtered} onSelect={navigateToDetail} />
        </TabsContent>
        <TabsContent value="cancelled">
          <RequestList requests={filtered} onSelect={navigateToDetail} />
        </TabsContent>
      </Tabs>

      {/* New request wizard */}
      <NewRequestDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={handleCreated}
      />

      {/* Quick-action sheet */}
      <QuickActionSheet
        request={selected?.dto ?? null}
        open={!!selected}
        onClose={() => setSelected(null)}
        viewerRole="agent"
        loadingAction={false}
        onStatusUpdate={() => {}}
      />

      {/* Cancel confirmation */}
      {cancelTarget && (
        <CancelConfirmDialog
          open
          requestId={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  )
}
