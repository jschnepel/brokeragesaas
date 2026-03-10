"use client"

import {
  FileText,
  Clock,
  CheckCircle,
  Timer,
  AlertTriangle,
  Zap,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { KPIDashboard, DesignerCapacity } from "@/lib/models"
import { CHART_COLORS, CHART_STYLE } from "@/lib/config"
import type { KPIs, VolumeWeek, MaterialBreakdown, DesignerLoad } from "@/lib/types"

const volumeChartConfig = {
  submitted: {
    label: "Submitted",
    color: CHART_COLORS.primary,
  },
  completed: {
    label: "Completed",
    color: CHART_COLORS.secondary,
  },
} satisfies ChartConfig

interface Props {
  kpis: KPIs
  volume: VolumeWeek[]
  materials: MaterialBreakdown[]
  designerLoad: DesignerLoad[]
}

function formatWeekLabel(week: string): string {
  const date = new Date(week)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function KPICard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export function ReportsClient({ kpis, volume, materials, designerLoad }: Props) {
  const dashboard = KPIDashboard.from(kpis)
  const capacities = DesignerCapacity.fromLoads(designerLoad)
  const maxActive = DesignerCapacity.maxActive(capacities)

  const volumeData = volume.map((w) => ({
    ...w,
    weekLabel: formatWeekLabel(w.week),
  }))

  const materialChartConfig = materials.reduce<ChartConfig>((acc, m, i) => {
    acc[m.materialType] = {
      label: m.materialType,
      color: CHART_COLORS.palette[i % CHART_COLORS.palette.length],
    }
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Reports</h1>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          label="Total Requests"
          value={dashboard.totalRequests}
          icon={<FileText className="size-5" />}
        />
        <KPICard
          label="Open"
          value={dashboard.openRequests}
          icon={<Clock className="size-5" />}
        />
        <KPICard
          label="Completed"
          value={dashboard.completedRequests}
          icon={<CheckCircle className="size-5" />}
        />
        <KPICard
          label="Avg Turnaround"
          value={dashboard.avgTurnaroundDisplay}
          icon={<Timer className="size-5" />}
        />
        <KPICard
          label="SLA Breach Rate"
          value={dashboard.slaBreachDisplay}
          icon={<AlertTriangle className="size-5" />}
        />
        <KPICard
          label="Rush %"
          value={dashboard.rushDisplay}
          icon={<Zap className="size-5" />}
        />
      </div>

      {/* Row 2: Volume Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Request Volume</CardTitle>
          <CardDescription>Submitted vs completed over the last 12 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={volumeChartConfig} className="h-72 w-full">
            <AreaChart data={volumeData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="fillSubmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={CHART_STYLE.areaOpacityStart} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={CHART_STYLE.areaOpacityEnd} />
                </linearGradient>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.secondary} stopOpacity={CHART_STYLE.areaOpacityStart} />
                  <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={CHART_STYLE.areaOpacityEnd} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray={CHART_STYLE.gridDash} className="stroke-muted" />
              <XAxis
                dataKey="weekLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="submitted"
                stroke={CHART_COLORS.primary}
                fill="url(#fillSubmitted)"
                strokeWidth={CHART_STYLE.areaStrokeWidth}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke={CHART_COLORS.secondary}
                fill="url(#fillCompleted)"
                strokeWidth={CHART_STYLE.areaStrokeWidth}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Row 3: Material Breakdown + Designer Workload */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Material Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Material Breakdown</CardTitle>
            <CardDescription>Requests by material type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={materialChartConfig} className="mx-auto h-72 w-full">
              <PieChart>
                <Pie
                  data={materials}
                  dataKey="count"
                  nameKey="materialType"
                  cx="50%"
                  cy="50%"
                  outerRadius={CHART_STYLE.donutOuterRadius}
                  innerRadius={CHART_STYLE.donutInnerRadius}
                  paddingAngle={CHART_STYLE.donutPaddingAngle}
                  label={({ materialType, percentage }: { materialType: string; percentage: number }) =>
                    `${materialType} ${percentage.toFixed(0)}%`
                  }
                  labelLine={{ stroke: "#6b7280" }}
                >
                  {materials.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="materialType" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Designer Workload */}
        <Card>
          <CardHeader>
            <CardTitle>Designer Workload</CardTitle>
            <CardDescription>Active and completed assignments per designer</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Designer</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[120px]">Load</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capacities.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right">{c.activeCount}</TableCell>
                    <TableCell className="text-right">{c.completedCount}</TableCell>
                    <TableCell className="text-right">{c.totalCount}</TableCell>
                    <TableCell>
                      <Progress
                        value={c.percentage(maxActive)}
                        style={{
                          ["--progress-from" as string]: CHART_COLORS.primary,
                          ["--progress-to" as string]: CHART_COLORS.secondary,
                        }}
                        className="[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-[var(--progress-from)] [&_[data-slot=progress-indicator]]:to-[var(--progress-to)]"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
