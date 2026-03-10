export const ROLES = {
  AGENT: "agent",
  DESIGNER: "designer",
  MARKETING_MANAGER: "marketing_manager",
  EXECUTIVE: "executive",
  PLATFORM_ADMIN: "platform_admin",
} as const;

export const REQUEST_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  IN_REVIEW: "in_review",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  AWAITING_MATERIALS: "awaiting_materials",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const MATERIAL_TYPES = [
  "Flyer",
  "Social Pack",
  "Email Campaign",
  "Video Script",
  "Brochure",
  "Report",
  "Signage",
  "Other",
] as const;

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  REQUESTS: "/requests",
  REQUEST_DETAIL: "/requests", // append /{id}
  TRIAGE: "/triage",
  QUEUE: "/queue",
  QUEUE_DETAIL: "/queue", // append /{id}
  REPORTS: "/reports",
  COMPONENT_LIBRARY: "/component-library",
  DESIGN_SYSTEM: "/design-system",
  LYONSDEN: "/lyonsden",
  CONTACTS: "/contacts",
  LISTINGS: "/listings",
  PRIDES: "/prides",
  ORGCHART: "/orgchart",
  ANALYTICS: "/analytics",
  SETTINGS: "/settings",
  EMAIL: "/email",
  MESSAGING: "/messaging",
} as const;

export const TENANT_ID = "russ-lyon";

export const SLA_HOURS = {
  standard: 72,
  rush: 24,
} as const;

export const CHAT_POLL_INTERVAL = 3000;
export const PAGE_SIZE = 20;
