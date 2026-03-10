"use client"

import { useState, useCallback, useTransition, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { assignRequest } from "@/actions/intake"
import { Request, KPIDashboard, DesignerCapacity, ChatManager } from "@/lib/models"
import { CHART_COLORS, CHART_STYLE, BRAND_COLORS } from "@/lib/config"
import {
  FileTextIcon, ClockIcon, CheckCircleIcon, TimerIcon,
  AlertTriangleIcon, ZapIcon, SearchIcon, UserIcon, InboxIcon,
} from "lucide-react"
import type {
  RequestDTO, KPIs, VolumeWeek, MaterialBreakdown,
  AgentRow, MessageRow,
} from "@/lib/types"

// ── Shared tooltip style ────────────────────────────────────────────────────

const tooltipStyle = {
  borderRadius: `${CHART_STYLE.tooltipRadius}px`,
  border: CHART_STYLE.tooltipBorder,
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  fontSize: `${CHART_STYLE.tooltipFontSize}px`,
} as const

// ── SLA border color helper ─────────────────────────────────────────────────

function slaBorderColor(status: "ok" | "warning" | "breached"): string {
  if (status === "breached") return "border-l-red-500"
  if (status === "warning") return "border-l-amber-500"
  return "border-l-emerald-500"
}

// ── Props ───────────────────────────────────────────────────────────────────

interface TriageClientProps {
  requests: RequestDTO[]
  kpis: KPIs
  volume: VolumeWeek[]
  materials: MaterialBreakdown[]
  recentMessages: MessageRow[]
  designers: AgentRow[]
  currentUserId: string
}

// ── Component ───────────────────────────────────────────────────────────────

export function TriageClient({
  requests: rawRequests,
  kpis,
  volume,
  materials,
  recentMessages,
  designers,
  currentUserId,
}: TriageClientProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [materialFilter, setMaterialFilter] = useState<string>("")

  // ── Domain models ───────────────────────────────────────────────────────

  const requests = useMemo(() => Request.fromDTOs(rawRequests), [rawRequests])
  const dashboard = useMemo(() => KPIDashboard.from(kpis), [kpis])

  const triageQueue = useMemo(() => {
    const triageable = Request.filterTriageable(requests)
    return triageable.sort((a, b) => {
      // Rush first
      if (a.isRush !== b.isRush) return a.isRush ? -1 : 1
      // SLA urgency: breached > warning > ok
      const slaOrder = { breached: 0, warning: 1, ok: 2 } as const
      const slaA = slaOrder[a.slaStatus]
      const slaB = slaOrder[b.slaStatus]
      if (slaA !== slaB) return slaA - slaB
      // Oldest first
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    })
  }, [requests])

  const capacities = useMemo(
    () => DesignerCapacity.computeFromRequests(designers, requests),
    [designers, requests],
  )

  const maxActive = useMemo(
    () => DesignerCapacity.maxActive(capacities),
    [capacities],
  )

  // ── Filtered requests for table ─────────────────────────────────────────

  const filteredRequests = useMemo(() => {
    let filtered = requests
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.requesterName.toLowerCase().includes(q) ||
          r.queueLabel.toLowerCase().includes(q) ||
          (r.designerName?.toLowerCase().includes(q) ?? false)
      )
    }
    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }
    if (materialFilter) {
      filtered = filtered.filter((r) => r.materialType === materialFilter)
    }
    return filtered
  }, [requests, searchQuery, statusFilter, materialFilter])

  // ── Unique values for filters ───────────────────────────────────────────

  const uniqueStatuses = useMemo(
    () => [...new Set(requests.map((r) => r.status))].sort(),
    [requests],
  )

  const uniqueMaterials = useMemo(
    () => [...new Set(requests.map((r) => r.materialType))].sort(),
    [requests],
  )

  // ── Handlers ────────────────────────────────────────────────────────────

  const openRequestDetail = useCallback((req: Request) => {
    setSelectedRequest(req)
    setSheetOpen(true)
  }, [])

  const handleAssign = useCallback(
    (requestId: string, designerId: string) => {
      startTransition(async () => {
        await assignRequest(requestId, designerId)
        setAssigningId(null)
      })
    },
    [],
  )

  const handleAssignNext = useCallback(
    (designerId: string) => {
      const next = triageQueue[0]
      if (!next) return
      handleAssign(next.id, designerId)
    },
    [triageQueue, handleAssign],
  )

  // ── Severity color helpers ──────────────────────────────────────────────

  function slaBreachColor(severity: "ok" | "warning" | "critical"): string {
    if (severity === "critical") return "text-red-600"
    if (severity === "warning") return "text-amber-600"
    return ""
  }

  function rushColor(severity: "ok" | "warning" | "critical"): string {
    if (severity === "critical") return "text-red-600"
    if (severity === "warning") return "text-amber-600"
    return ""
  }

  function isDueDatePast(dueDate: string | null): boolean {
    if (!dueDate) return false
    return new Date(dueDate).getTime() < Date.now()
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Triage Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Assign incoming requests and monitor team capacity
          </p>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">Total Requests</CardDescription>
            <FileTextIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{dashboard.totalRequests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">Open</CardDescription>
            <ClockIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{dashboard.openRequests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">Completed</CardDescription>
            <CheckCircleIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{dashboard.completedRequests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">Avg Turnaround</CardDescription>
            <TimerIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{dashboard.avgTurnaroundDisplay}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">SLA Breach Rate</CardDescription>
            <AlertTriangleIcon className={cn("size-4", slaBreachColor(dashboard.slaBreachSeverity) || "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <p className={cn("text-2xl font-semibold tabular-nums", slaBreachColor(dashboard.slaBreachSeverity))}>
              {dashboard.slaBreachDisplay}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-medium">Rush %</CardDescription>
            <ZapIcon className={cn("size-4", rushColor(dashboard.rushSeverity) || "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <p className={cn("text-2xl font-semibold tabular-nums", rushColor(dashboard.rushSeverity))}>
              {dashboard.rushDisplay}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Content (2 columns) ────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT: Triage Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Triage Queue</CardTitle>
              <Badge variant="secondary">{triageQueue.length}</Badge>
            </div>
            <CardDescription>
              Unassigned requests sorted by urgency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {triageQueue.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <InboxIcon className="size-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Queue empty — all requests assigned!
                  </p>
                </div>
              )}
              {triageQueue.map((req) => (
                <div
                  key={req.id}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-lg border border-l-4 p-3 transition-colors hover:bg-muted/50",
                    slaBorderColor(req.slaStatus),
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                    onClick={() => openRequestDetail(req)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground tabular-nums">
                        {req.queueLabel}
                      </span>
                      <span className="truncate text-sm font-medium">{req.title}</span>
                      {req.isRush && <Badge variant="destructive">Rush</Badge>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-semibold tabular-nums", req.slaDisplayColor)}>
                        {req.slaDisplay}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {req.materialType} &middot; {req.requesterName}
                    </span>
                  </button>

                  {assigningId === req.id ? (
                    <Select
                      onValueChange={(val) => { if (val) handleAssign(req.id, val) }}
                      defaultValue=""
                    >
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue placeholder="Pick designer" />
                      </SelectTrigger>
                      <SelectContent>
                        {designers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setAssigningId(req.id)}
                    >
                      Assign
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Designer Capacity */}
        <Card>
          <CardHeader>
            <CardTitle>Designer Capacity</CardTitle>
            <CardDescription>Active workload and availability per designer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {capacities.length === 0 && (
                <p className="text-sm text-muted-foreground">No designers found.</p>
              )}
              {capacities.map((cap) => {
                const pct = cap.percentage(maxActive)
                return (
                  <div key={cap.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback
                          className="text-xs font-medium text-white"
                          style={{ backgroundColor: BRAND_COLORS.navy }}
                        >
                          {cap.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{cap.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {cap.activeCount} active
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {cap.completedCount} done
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Progress value={pct}>
                      <span className="sr-only">{pct}% capacity</span>
                    </Progress>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {cap.utilizationLabel}
                      </span>
                      {triageQueue.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          disabled={isPending}
                          onClick={() => handleAssignNext(cap.id)}
                        >
                          Assign Next
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Request Volume</CardTitle>
            <CardDescription>Submitted vs completed by week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volume} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray={CHART_STYLE.gridDash} className="stroke-muted" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: CHART_STYLE.tickFontSize }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v)
                      return `${d.getMonth() + 1}/${d.getDate()}`
                    }}
                  />
                  <YAxis tick={{ fontSize: CHART_STYLE.tickFontSize }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: `${CHART_STYLE.legendFontSize}px` }} />
                  <Bar dataKey="submitted" fill={CHART_COLORS.primary} radius={CHART_STYLE.barRadius} name="Submitted" />
                  <Bar dataKey="completed" fill={CHART_COLORS.secondary} radius={CHART_STYLE.barRadius} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Material Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Material Breakdown</CardTitle>
            <CardDescription>Requests by material type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materials}
                    dataKey="count"
                    nameKey="materialType"
                    cx="50%"
                    cy="50%"
                    innerRadius={CHART_STYLE.donutInnerRadius}
                    outerRadius={CHART_STYLE.donutOuterRadius}
                    paddingAngle={CHART_STYLE.donutPaddingAngle}
                    strokeWidth={0}
                  >
                    {materials.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [`${value}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: `${CHART_STYLE.legendFontSize}px` }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── All Requests Table ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>{filteredRequests.length} of {requests.length} requests</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "")}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {uniqueStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={materialFilter} onValueChange={(val) => setMaterialFilter(val ?? "")}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="All materials" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All materials</SelectItem>
                {uniqueMaterials.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Designer</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No requests found.
                  </TableCell>
                </TableRow>
              )}
              {filteredRequests.map((req) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer"
                  onClick={() => openRequestDetail(req)}
                >
                  <TableCell className="tabular-nums text-muted-foreground">
                    {req.queueNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{req.title}</span>
                      {req.isRush && <Badge variant="destructive">Rush</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(req.statusColor)}>
                      {req.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{req.materialType}</TableCell>
                  <TableCell className="text-sm">{req.requesterName}</TableCell>
                  <TableCell className="text-sm">
                    {req.designerName ? (
                      <span>{req.designerName}</span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className={cn("text-sm tabular-nums", isDueDatePast(req.dueDate) && "text-red-600")}>
                    {req.dueDateFormatted}
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-sm tabular-nums", req.slaDisplayColor)}>
                      {req.slaDisplay}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Detail Sheet ────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg">
          {selectedRequest && (
            <>
              <SheetHeader>
                <SheetTitle>
                  <span className="text-muted-foreground">{selectedRequest.queueLabel}</span>{" "}
                  {selectedRequest.title}
                </SheetTitle>
                <SheetDescription>
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className={cn(selectedRequest.statusColor)}>
                      {selectedRequest.statusLabel}
                    </Badge>
                    {selectedRequest.isRush && <Badge variant="destructive">Rush</Badge>}
                  </span>
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 px-4">
                <div className="flex flex-col gap-6 pb-6">
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Type
                      </span>
                      <p className="mt-0.5 font-medium">{selectedRequest.materialType}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Status
                      </span>
                      <div className="mt-0.5">
                        <Badge variant="secondary" className={cn(selectedRequest.statusColor)}>
                          {selectedRequest.statusLabel}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Requester
                      </span>
                      <p className="mt-0.5 font-medium">{selectedRequest.requesterName}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Designer
                      </span>
                      <p className="mt-0.5 font-medium">
                        {selectedRequest.designerName ?? "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Due Date
                      </span>
                      <p className={cn("mt-0.5 font-medium", isDueDatePast(selectedRequest.dueDate) && "text-red-600")}>
                        {selectedRequest.dueDateLong}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        SLA
                      </span>
                      <p className={cn("mt-0.5 font-medium", selectedRequest.slaDisplayColor)}>
                        {selectedRequest.slaDisplay}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Submitted
                      </span>
                      <p className="mt-0.5 font-medium">{selectedRequest.submittedAtFormatted}</p>
                    </div>
                  </div>

                  {/* Brief */}
                  {selectedRequest.brief && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Brief
                        </h4>
                        <p className="text-sm leading-relaxed">{selectedRequest.brief}</p>
                      </div>
                    </>
                  )}

                  {/* Files */}
                  {selectedRequest.files.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Files ({selectedRequest.files.length})
                        </h4>
                        <div className="space-y-1.5">
                          {selectedRequest.files.map((f) => (
                            <div key={f.id} className="flex items-center gap-2 text-sm">
                              <FileTextIcon className="size-3.5 text-muted-foreground" />
                              <span className="truncate font-medium">{f.fileName}</span>
                              <span className="text-xs text-muted-foreground">{f.uploadedBy}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Messages */}
                  <Separator />
                  <div>
                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Messages ({selectedRequest.messages.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedRequest.messages.length === 0 && (
                        <p className="text-sm text-muted-foreground">No messages yet.</p>
                      )}
                      {selectedRequest.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex gap-3",
                            msg.senderId === currentUserId ? "flex-row-reverse" : "flex-row",
                          )}
                        >
                          <Avatar size="sm">
                            <AvatarFallback>{ChatManager.initials(msg.senderName)}</AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                              msg.senderId === currentUserId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted",
                            )}
                          >
                            <div className="mb-0.5 flex items-center gap-2">
                              <span className="text-xs font-medium opacity-80">
                                {msg.senderName}
                              </span>
                              <span className="text-xs opacity-60">
                                {ChatManager.timeAgo(msg.createdAt)}
                              </span>
                            </div>
                            <p>{msg.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assignment Action */}
                  {selectedRequest.canBeAssigned && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Assign Designer
                        </h4>
                        <div className="flex items-center gap-2">
                          <Select
                            onValueChange={(val) => {
                              if (val) handleAssign(selectedRequest.id, val)
                            }}
                            defaultValue=""
                          >
                            <SelectTrigger className="flex-1">
                              <UserIcon className="size-4 text-muted-foreground" />
                              <SelectValue placeholder="Select a designer..." />
                            </SelectTrigger>
                            <SelectContent>
                              {designers.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
