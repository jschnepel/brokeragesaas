import { MATERIAL_TYPES } from "@/lib/constants"

// ── Types ────────────────────────────────────────────────────────────────────

export interface MaterialSetting {
  id: string
  name: string
  slaHours: number
  active: boolean
}

export interface RushFee {
  materialType: string
  multiplier: number
}

export interface Designer {
  id: string
  name: string
  email: string
  capacity: number
  active: boolean
}

export interface Office {
  id: string
  name: string
  code: string
  manager: string
  active: boolean
}

export interface NotifRule {
  id: string
  event: string
  label: string
  email: boolean
  push: boolean
}

export type FieldVisibility = "required" | "optional" | "hidden"

export interface FieldConfig {
  id: string
  name: string
  label: string
  type: FieldVisibility
}

export interface UnassignedRequest {
  id: string
  title: string
  materialType: string
  assignedTo: string
}

// ── Mock Data ────────────────────────────────────────────────────────────────

export const INIT_MATERIALS: MaterialSetting[] = MATERIAL_TYPES.map(
  (name, i) => ({
    id: `mat-${i + 1}`,
    name,
    slaHours: name === "Video Script" ? 96 : name === "Other" ? 48 : 72,
    active: name !== "Other",
  })
)

export const INIT_RUSH_FEES: RushFee[] = MATERIAL_TYPES.map((name) => ({
  materialType: name,
  multiplier: name === "Video Script" ? 2.0 : name === "Brochure" ? 1.75 : 1.5,
}))

export const INIT_DESIGNERS: Designer[] = [
  { id: "d-1", name: "Marcus Chen", email: "marcus@russlyon.com", capacity: 8, active: true },
  { id: "d-2", name: "Sophia Williams", email: "sophia@russlyon.com", capacity: 6, active: true },
  { id: "d-3", name: "Alex Rivera", email: "alex@russlyon.com", capacity: 10, active: true },
  { id: "d-4", name: "Jordan Patel", email: "jordan@russlyon.com", capacity: 5, active: false },
]

export const INIT_OFFICES: Office[] = [
  { id: "o-1", name: "Scottsdale", code: "SCT", manager: "Lisa Monroe", active: true },
  { id: "o-2", name: "Paradise Valley", code: "PV", manager: "David Grant", active: true },
  { id: "o-3", name: "Carefree", code: "CF", manager: "Rachel Torres", active: true },
  { id: "o-4", name: "Sedona", code: "SED", manager: "Mark Jensen", active: true },
  { id: "o-5", name: "Tucson", code: "TUC", manager: "Nina Wells", active: false },
]

export const NOTIF_RULES: NotifRule[] = [
  { id: "n-1", event: "request_submitted", label: "New request submitted", email: true, push: true },
  { id: "n-2", event: "request_assigned", label: "Request assigned to designer", email: true, push: false },
  { id: "n-3", event: "request_completed", label: "Request marked complete", email: true, push: true },
  { id: "n-4", event: "sla_warning", label: "SLA breach warning (< 4 hrs)", email: true, push: true },
  { id: "n-5", event: "sla_breached", label: "SLA breached", email: true, push: true },
  { id: "n-6", event: "comment_added", label: "New comment on request", email: false, push: true },
  { id: "n-7", event: "rush_submitted", label: "Rush request submitted", email: true, push: true },
]

export const ALL_FIELDS: FieldConfig[] = [
  { id: "f-1", name: "title", label: "Request Title", type: "required" },
  { id: "f-2", name: "materialType", label: "Material Type", type: "required" },
  { id: "f-3", name: "brief", label: "Creative Brief", type: "required" },
  { id: "f-4", name: "dueDate", label: "Due Date", type: "optional" },
  { id: "f-5", name: "isRush", label: "Rush Flag", type: "optional" },
  { id: "f-6", name: "listingAddress", label: "Listing Address", type: "optional" },
  { id: "f-7", name: "mlsNumber", label: "MLS Number", type: "hidden" },
  { id: "f-8", name: "brandOverride", label: "Brand Override", type: "hidden" },
  { id: "f-9", name: "targetAudience", label: "Target Audience", type: "optional" },
  { id: "f-10", name: "budget", label: "Budget", type: "hidden" },
]

export const INIT_UNASSIGNED: UnassignedRequest[] = [
  { id: "u-1", title: "Spring Open House Flyer", materialType: "Flyer", assignedTo: "" },
  { id: "u-2", title: "Desert Ridge Social Pack", materialType: "Social Pack", assignedTo: "" },
  { id: "u-3", title: "Luxury Listing Brochure", materialType: "Brochure", assignedTo: "" },
  { id: "u-4", title: "Monthly Market Report", materialType: "Report", assignedTo: "" },
]
