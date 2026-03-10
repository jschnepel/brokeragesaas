/**
 * Dashboard mock data — placeholder until real data integration.
 * Structured per role so each dashboard can import what it needs.
 */

// ── Agent KPIs ───────────────────────────────────────────────────────────────

export interface AgentKPI {
  label: string
  value: string
  target: string
  progress: number
  signal: "on-track" | "behind" | "ahead"
  signalText: string
}

export const AGENT_KPIS: AgentKPI[] = [
  {
    label: "GCI YTD",
    value: "$312,400",
    target: "$500,000",
    progress: 62,
    signal: "on-track",
    signalText: "On pace for $510K",
  },
  {
    label: "Volume YTD",
    value: "$14.2M",
    target: "$25M",
    progress: 57,
    signal: "on-track",
    signalText: "+8% vs last year",
  },
  {
    label: "Active Listings",
    value: "7",
    target: "10",
    progress: 70,
    signal: "ahead",
    signalText: "2 pending close",
  },
  {
    label: "Avg DOM",
    value: "18",
    target: "30",
    progress: 40,
    signal: "ahead",
    signalText: "Market avg: 34",
  },
]

// ── Agent Sales Data ─────────────────────────────────────────────────────────

export interface QuarterlyData {
  quarter: string
  listings: number
  closings: number
  volume: number
}

export const QUARTERLY_SALES: QuarterlyData[] = [
  { quarter: "Q1 '25", listings: 8, closings: 5, volume: 3200000 },
  { quarter: "Q2 '25", listings: 12, closings: 9, volume: 5100000 },
  { quarter: "Q3 '25", listings: 10, closings: 7, volume: 4800000 },
  { quarter: "Q4 '25", listings: 6, closings: 4, volume: 2900000 },
  { quarter: "Q1 '26", listings: 9, closings: 6, volume: 4200000 },
]

export interface YoYData {
  month: string
  thisYear: number
  lastYear: number
}

export const YOY_VOLUME: YoYData[] = [
  { month: "Jan", thisYear: 1200000, lastYear: 980000 },
  { month: "Feb", thisYear: 1400000, lastYear: 1100000 },
  { month: "Mar", thisYear: 1600000, lastYear: 1350000 },
  { month: "Apr", thisYear: 0, lastYear: 1500000 },
  { month: "May", thisYear: 0, lastYear: 1800000 },
  { month: "Jun", thisYear: 0, lastYear: 2100000 },
]

// ── Calendar Events ──────────────────────────────────────────────────────────

export type EventType = "showing" | "closing" | "open-house" | "meeting" | "deadline"

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: EventType
}

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "e1", title: "Showing — 4521 E Lincoln Dr", date: "2026-03-10", time: "10:00 AM", type: "showing" },
  { id: "e2", title: "Closing — 7890 N Scottsdale Rd", date: "2026-03-10", time: "2:00 PM", type: "closing" },
  { id: "e3", title: "Open House — 123 E Camelback", date: "2026-03-12", time: "11:00 AM", type: "open-house" },
  { id: "e4", title: "Team Meeting", date: "2026-03-13", time: "9:00 AM", type: "meeting" },
  { id: "e5", title: "Listing Photos Due", date: "2026-03-14", time: "5:00 PM", type: "deadline" },
  { id: "e6", title: "Showing — 555 E Pinnacle Peak", date: "2026-03-15", time: "1:00 PM", type: "showing" },
  { id: "e7", title: "Broker Open — 999 N 40th St", date: "2026-03-17", time: "10:00 AM", type: "open-house" },
  { id: "e8", title: "Closing — 2200 E Osborn Rd", date: "2026-03-20", time: "3:00 PM", type: "closing" },
]

// ── Active Requests ──────────────────────────────────────────────────────────

export interface DashRequest {
  id: string
  queueNumber: number
  title: string
  materialType: string
  status: string
  statusLabel: string
  isRush: boolean
  submittedAt: string
  dueDate: string | null
  assignedTo: string | null
  designerName: string | null
}

export const ACTIVE_REQUESTS: DashRequest[] = [
  { id: "r1", queueNumber: 42, title: "4521 E Lincoln Dr — Just Listed Flyer", materialType: "Flyer", status: "in_progress", statusLabel: "In Progress", isRush: false, submittedAt: "2026-03-05", dueDate: "2026-03-12", assignedTo: "d1", designerName: "Marcus Chen" },
  { id: "r2", queueNumber: 43, title: "Open House Social Pack", materialType: "Social Pack", status: "assigned", statusLabel: "Assigned", isRush: true, submittedAt: "2026-03-08", dueDate: "2026-03-11", assignedTo: "d1", designerName: "Marcus Chen" },
  { id: "r3", queueNumber: 44, title: "Quarterly Market Report", materialType: "Report", status: "in_review", statusLabel: "In Review", isRush: false, submittedAt: "2026-03-07", dueDate: "2026-03-15", assignedTo: null, designerName: null },
  { id: "r4", queueNumber: 45, title: "New Listing Email Campaign", materialType: "Email Campaign", status: "submitted", statusLabel: "Submitted", isRush: false, submittedAt: "2026-03-09", dueDate: "2026-03-18", assignedTo: null, designerName: null },
  { id: "r5", queueNumber: 46, title: "Desert Mountain Brochure", materialType: "Brochure", status: "awaiting_materials", statusLabel: "Awaiting Materials", isRush: false, submittedAt: "2026-03-02", dueDate: "2026-03-14", assignedTo: "d2", designerName: "Sarah Kim" },
]

// ── Messages ─────────────────────────────────────────────────────────────────

export type MessageChannel = "platform" | "email" | "dm"

export interface DashMessage {
  id: string
  senderName: string
  senderRole: string
  channel: MessageChannel
  preview: string
  timestamp: string
  unread: boolean
}

export const RECENT_MESSAGES: DashMessage[] = [
  { id: "m1", senderName: "Lex Baum", senderRole: "Marketing Manager", channel: "platform", preview: "Your flyer design is ready for review. Take a look when you can.", timestamp: "2026-03-10T09:15:00", unread: true },
  { id: "m2", senderName: "Marcus Chen", senderRole: "Designer", channel: "platform", preview: "Updated the social pack with your notes. V2 attached.", timestamp: "2026-03-10T08:45:00", unread: true },
  { id: "m3", senderName: "Sarah Johnson", senderRole: "Client", channel: "email", preview: "Hi Yong, can we schedule a showing for this Saturday?", timestamp: "2026-03-09T16:30:00", unread: false },
  { id: "m4", senderName: "David Kim", senderRole: "Executive", channel: "dm", preview: "Great job on the Q4 numbers. Let's talk about your 2026 goals.", timestamp: "2026-03-09T14:00:00", unread: false },
  { id: "m5", senderName: "Tom Bradley", senderRole: "Agent", channel: "dm", preview: "Do you have the lockbox code for the Pinnacle Peak showing?", timestamp: "2026-03-08T11:20:00", unread: false },
]

// ── Upcoming Events ──────────────────────────────────────────────────────────

export interface UpcomingEvent {
  id: string
  title: string
  date: string
  time: string
  type: EventType
}

export const UPCOMING_EVENTS: UpcomingEvent[] = [
  { id: "ue1", title: "Showing — 4521 E Lincoln Dr", date: "2026-03-10", time: "10:00 AM", type: "showing" },
  { id: "ue2", title: "Closing — 7890 N Scottsdale Rd", date: "2026-03-10", time: "2:00 PM", type: "closing" },
  { id: "ue3", title: "Open House — 123 E Camelback", date: "2026-03-12", time: "11:00 AM", type: "open-house" },
  { id: "ue4", title: "Team Meeting", date: "2026-03-13", time: "9:00 AM", type: "meeting" },
  { id: "ue5", title: "Listing Photos Due", date: "2026-03-14", time: "5:00 PM", type: "deadline" },
]

// ── Action Items ─────────────────────────────────────────────────────────────

export type Priority = "high" | "medium" | "low"

export interface ActionItem {
  id: string
  label: string
  priority: Priority
  dueDate: string
  completed: boolean
}

export const ACTION_ITEMS: ActionItem[] = [
  { id: "a1", label: "Review flyer proof from Marcus", priority: "high", dueDate: "2026-03-10", completed: false },
  { id: "a2", label: "Upload listing photos for Desert Mountain", priority: "high", dueDate: "2026-03-11", completed: false },
  { id: "a3", label: "Approve social pack copy", priority: "medium", dueDate: "2026-03-12", completed: false },
  { id: "a4", label: "Schedule photographer for new listing", priority: "medium", dueDate: "2026-03-13", completed: true },
  { id: "a5", label: "Send thank you note to closing client", priority: "low", dueDate: "2026-03-15", completed: true },
]

// ── Designer Dashboard Data ──────────────────────────────────────────────────

export interface DesignerKPI {
  label: string
  value: number
  subText: string
}

export const DESIGNER_KPIS: DesignerKPI[] = [
  { label: "My Queue", value: 8, subText: "3 assigned today" },
  { label: "In Progress", value: 3, subText: "1 started this hour" },
  { label: "In Review", value: 2, subText: "Awaiting feedback" },
  { label: "SLA Breached", value: 1, subText: "1 overdue by 4h" },
]

export interface DesignerTask {
  id: string
  label: string
  completed: boolean
  dueTime: string
}

export const DESIGNER_TASKS: DesignerTask[] = [
  { id: "dt1", label: "Finalize Yong's flyer layout", completed: false, dueTime: "11:00 AM" },
  { id: "dt2", label: "Export social pack assets", completed: false, dueTime: "1:00 PM" },
  { id: "dt3", label: "Send brochure proof to Lex", completed: false, dueTime: "3:00 PM" },
  { id: "dt4", label: "Review email template specs", completed: true, dueTime: "9:00 AM" },
]

export interface ActivityEntry {
  id: string
  text: string
  timestamp: string
}

export const DESIGNER_ACTIVITY: ActivityEntry[] = [
  { id: "da1", text: "Assigned: Open House Social Pack (#043)", timestamp: "9:15 AM" },
  { id: "da2", text: "Completed: Market Report layout (#039)", timestamp: "8:45 AM" },
  { id: "da3", text: "Comment from Lex on brochure proof", timestamp: "8:20 AM" },
  { id: "da4", text: "Rush request received: Email Campaign (#047)", timestamp: "Yesterday" },
]

// ── Manager Dashboard Data ───────────────────────────────────────────────────

export interface ManagerKPI {
  label: string
  value: string
  target: string
  progress: number
  signal: "on-track" | "behind" | "ahead"
  signalText: string
}

export const MANAGER_KPIS: ManagerKPI[] = [
  { label: "Open Requests", value: "24", target: "30 capacity", progress: 80, signal: "on-track", signalText: "6 slots remaining" },
  { label: "SLA Compliance", value: "94%", target: "95%", progress: 94, signal: "behind", signalText: "1 breach this week" },
  { label: "Rush Active", value: "3", target: "5 max", progress: 60, signal: "on-track", signalText: "Avg turnaround: 18h" },
  { label: "Completed MTD", value: "47", target: "60 goal", progress: 78, signal: "on-track", signalText: "+12% vs last month" },
]

export interface DesignerCapacityRow {
  id: string
  name: string
  activeCount: number
  maxCapacity: number
  avgTurnaroundByType: Record<string, number>
}

export const DESIGNER_CAPACITY: DesignerCapacityRow[] = [
  { id: "d1", name: "Marcus Chen", activeCount: 5, maxCapacity: 8, avgTurnaroundByType: { Flyer: 12, "Social Pack": 18, Brochure: 24 } },
  { id: "d2", name: "Sarah Kim", activeCount: 4, maxCapacity: 8, avgTurnaroundByType: { Flyer: 10, "Email Campaign": 16, Report: 20 } },
  { id: "d3", name: "Alex Rivera", activeCount: 7, maxCapacity: 8, avgTurnaroundByType: { Flyer: 14, "Social Pack": 20, Signage: 8 } },
]

export interface TriageItem {
  id: string
  queueNumber: number
  title: string
  materialType: string
  requesterName: string
  isRush: boolean
  submittedAt: string
}

export const TRIAGE_ITEMS: TriageItem[] = [
  { id: "t1", queueNumber: 48, title: "Scottsdale Open House Flyer", materialType: "Flyer", requesterName: "Yong Choi", isRush: false, submittedAt: "2026-03-10T08:30:00" },
  { id: "t2", queueNumber: 49, title: "Paradise Valley Listing Video", materialType: "Video Script", requesterName: "Tom Bradley", isRush: true, submittedAt: "2026-03-10T09:00:00" },
  { id: "t3", queueNumber: 50, title: "Monthly Newsletter Template", materialType: "Email Campaign", requesterName: "Lisa Park", isRush: false, submittedAt: "2026-03-09T16:45:00" },
]

export interface NeedsAttentionItem {
  id: string
  title: string
  reason: string
  severity: "critical" | "warning" | "info"
}

export const NEEDS_ATTENTION: NeedsAttentionItem[] = [
  { id: "na1", title: "#041 — Camelback Brochure", reason: "SLA breach in 2 hours", severity: "critical" },
  { id: "na2", title: "#038 — Email Campaign", reason: "Awaiting materials for 3 days", severity: "warning" },
  { id: "na3", title: "#045 — Listing Photos", reason: "Designer at capacity", severity: "info" },
]

// ── Volume/SLA chart data ────────────────────────────────────────────────────

export interface VolumeChartData {
  week: string
  submitted: number
  completed: number
}

export const VOLUME_CHART: VolumeChartData[] = [
  { week: "Feb 10", submitted: 12, completed: 10 },
  { week: "Feb 17", submitted: 15, completed: 13 },
  { week: "Feb 24", submitted: 11, completed: 14 },
  { week: "Mar 3", submitted: 18, completed: 12 },
  { week: "Mar 10", submitted: 14, completed: 9 },
]

export interface SLAChartData {
  week: string
  compliance: number
  breaches: number
}

export const SLA_CHART: SLAChartData[] = [
  { week: "Feb 10", compliance: 96, breaches: 1 },
  { week: "Feb 17", compliance: 93, breaches: 2 },
  { week: "Feb 24", compliance: 98, breaches: 0 },
  { week: "Mar 3", compliance: 91, breaches: 3 },
  { week: "Mar 10", compliance: 94, breaches: 1 },
]

export interface ByTypeChartData {
  type: string
  count: number
}

export const BY_TYPE_CHART: ByTypeChartData[] = [
  { type: "Flyer", count: 18 },
  { type: "Social Pack", count: 12 },
  { type: "Email", count: 8 },
  { type: "Brochure", count: 6 },
  { type: "Report", count: 4 },
  { type: "Other", count: 3 },
]

// ── Executive Dashboard Data ─────────────────────────────────────────────────

export interface ExecKPI {
  label: string
  value: number
  subText: string
}

export const EXEC_KPIS: ExecKPI[] = [
  { label: "Open Requests", value: 24, subText: "8 assigned, 16 queued" },
  { label: "In Review", value: 5, subText: "Avg wait: 4h" },
  { label: "Rush Requests", value: 3, subText: "All within SLA" },
  { label: "SLA Breached", value: 1, subText: "1 overdue by 4h" },
]

export interface DesignerWorkload {
  name: string
  active: number
  capacity: number
}

export const DESIGNER_WORKLOADS: DesignerWorkload[] = [
  { name: "Marcus Chen", active: 5, capacity: 8 },
  { name: "Sarah Kim", active: 4, capacity: 8 },
  { name: "Alex Rivera", active: 7, capacity: 8 },
]
