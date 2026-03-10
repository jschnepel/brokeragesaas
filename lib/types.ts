import type { REQUEST_STATUS, MATERIAL_TYPES, ROLES } from "./constants";

export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];
export type MaterialType = (typeof MATERIAL_TYPES)[number];
export type PlatformRole = (typeof ROLES)[keyof typeof ROLES];

// Base type for DB rows (satisfies QueryResultRow constraint)
type Row = { [key: string]: unknown };

// ── DB Row Types ──────────────────────────────────────────────────────────

export interface AgentRow extends Row {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface RequestRow extends Row {
  id: string;
  queue_number: number;
  title: string;
  material_type: string;
  status: string;
  is_rush: boolean;
  brief: string | null;
  notes: string | null;
  requester_id: string;
  requester_name: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  due_date: string | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  created_at: string;
  updated_at: string;
  hero_image_url?: string | null;
}

export interface RequestWithDetails extends RequestRow {
  messages: MessageRow[];
  files: FileRow[];
}

export interface MessageRow extends Row {
  id: string;
  request_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_role: string | null;
  body: string;
  created_at: string;
}

export interface FileRow extends Row {
  id: string;
  request_id: string;
  file_name: string;
  file_url: string | null;
  uploaded_by: string;
  uploader_name: string | null;
  created_at: string;
}

export interface StatusLogRow extends Row {
  id: string;
  request_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  changer_name: string | null;
  created_at: string;
}

// ── Analytics Types ───────────────────────────────────────────────────────

export interface KPIs {
  totalRequests: number;
  openRequests: number;
  completedRequests: number;
  avgTurnaroundHours: number;
  slaBreachRate: number;
  rushPercentage: number;
}

export interface VolumeWeek {
  week: string;
  submitted: number;
  completed: number;
}

export interface DesignerLoad {
  designerId: string;
  designerName: string;
  activeCount: number;
  completedCount: number;
}

export interface MaterialBreakdown {
  materialType: string;
  count: number;
  percentage: number;
}

export interface TeamHealth {
  revisionRate: number;
  slaCompliance: number;
  reqPerDesigner: number;
  avgCompletionDays: number;
}

export interface OfficeBreakdown {
  office: string;
  count: number;
  percentage: number;
}

export interface IntakeQueueItem {
  id: string;
  queueNumber: number;
  title: string;
  requesterName: string;
  office: string;
  materialType: string;
  isRush: boolean;
  submittedAt: string;
  dueDate: string | null;
  estimatedPages: number;
  brief: string | null;
  attachments: number;
}

// ── DTO Types (for client) ────────────────────────────────────────────────

export interface RequestDTO {
  id: string;
  queueNumber: number;
  title: string;
  materialType: string;
  status: string;
  isRush: boolean;
  requesterName: string;
  designerName: string | null;
  dueDate: string | null;
  submittedAt: string;
  slaDeadline: string | null;
  slaBreached: boolean;
  brief: string | null;
  assignedTo: string | null;
  requesterId: string;
  heroImageUrl?: string | null;
  messages: MessageDTO[];
  files: FileDTO[];
}

export interface MessageDTO {
  id: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
  senderId: string;
}

export interface FileDTO {
  id: string;
  fileName: string;
  fileType: string;
  url: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

// ── Detail Page Types ─────────────────────────────────────────────────────

export interface StatusLogDTO {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy: string;
  changerName: string;
  createdAt: string;
}

export type ViewerRole = "agent" | "designer" | "marketing_manager" | "executive";

export type DetailTab = "thread" | "activity";

// ── Filter Types ──────────────────────────────────────────────────────────

export interface RequestFilters {
  status?: string;
  assignedTo?: string;
  requesterId?: string;
  materialType?: string;
  isRush?: boolean;
}
