"use server";

import { auth } from "@/auth";
import { RequestService, MessageService, AgentService, AnalyticsService } from "@/services";
import type { RequestRow, RequestWithDetails, RequestFilters } from "@/services";
import type { KPIs, VolumeWeek, DesignerLoad, MaterialBreakdown } from "@/services";
import type { AgentRow } from "@/services";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

// ── DTO Transform ───────────────────────────────────────────────────────────

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

function toRequestDTO(row: RequestRow): RequestDTO {
  return {
    id: row.id,
    queueNumber: row.queue_number,
    title: row.title,
    materialType: row.material_type,
    status: row.status,
    isRush: row.is_rush,
    requesterName: row.requester_name ?? "Unknown",
    designerName: row.assigned_name ?? null,
    dueDate: row.due_date,
    submittedAt: row.created_at,
    slaDeadline: row.sla_deadline,
    slaBreached: row.sla_breached,
    brief: row.brief,
    assignedTo: row.assigned_to,
    requesterId: row.requester_id,
    messages: [],
    files: [],
  };
}

function toDetailDTO(row: RequestWithDetails): RequestDTO {
  return {
    ...toRequestDTO(row),
    messages: row.messages.map(m => ({
      id: m.id,
      senderName: m.sender_name ?? "Unknown",
      senderRole: m.sender_role ?? "agent",
      body: m.body,
      createdAt: m.created_at,
      senderId: m.sender_id,
    })),
    files: row.files.map(f => ({
      id: f.id,
      fileName: f.file_name,
      fileType: f.file_type,
      url: f.file_url,
      uploadedBy: f.uploader_name ?? "Unknown",
      uploadedAt: f.uploaded_at,
    })),
  };
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getRequests(filters?: RequestFilters): Promise<RequestDTO[]> {
  const rows = await RequestService.getAll(filters);
  return rows.map(toRequestDTO);
}

export async function getRequestById(id: string): Promise<RequestDTO | null> {
  const row = await RequestService.getById(id);
  return row ? toDetailDTO(row) : null;
}

export async function createRequest(data: {
  title: string;
  material_type: string;
  brief?: string;
  due_date?: string;
  is_rush?: boolean;
}): Promise<RequestDTO> {
  const user = await requireAuth();
  const row = await RequestService.create({
    requester_id: user.id,
    title: data.title,
    material_type: data.material_type,
    brief: data.brief,
    due_date: data.due_date,
    is_rush: data.is_rush,
  });
  return toRequestDTO(row);
}

export async function updateRequestStatus(
  requestId: string,
  newStatus: string
): Promise<RequestDTO | null> {
  const user = await requireAuth();
  const row = await RequestService.updateStatus(requestId, newStatus, user.id);
  return row ? toRequestDTO(row) : null;
}

export async function assignRequest(
  requestId: string,
  assigneeId: string
): Promise<RequestDTO | null> {
  const user = await requireAuth();
  const row = await RequestService.assign(requestId, assigneeId, user.id);
  return row ? toRequestDTO(row) : null;
}

export async function cancelRequest(requestId: string): Promise<RequestDTO | null> {
  return updateRequestStatus(requestId, "cancelled");
}

// ── KPIs & Analytics ────────────────────────────────────────────────────────

export async function getKPIs(): Promise<KPIs> {
  return AnalyticsService.getKPIs();
}

export async function getVolumeByWeek(weeks?: number): Promise<VolumeWeek[]> {
  return AnalyticsService.getVolumeByWeek(weeks);
}

export async function getDesignerLoad(): Promise<DesignerLoad[]> {
  return AnalyticsService.getByDesigner();
}

export async function getMaterialBreakdown(): Promise<MaterialBreakdown[]> {
  return AnalyticsService.getMaterialBreakdown();
}

// ── Messages ────────────────────────────────────────────────────────────────

export async function getMessages(requestId: string): Promise<MessageDTO[]> {
  const rows = await MessageService.getByRequest(requestId);
  return rows.map(m => ({
    id: m.id,
    senderName: m.sender_name ?? "Unknown",
    senderRole: m.sender_role ?? "agent",
    body: m.body,
    createdAt: m.created_at,
    senderId: m.sender_id,
  }));
}

export async function sendMessage(requestId: string, body: string): Promise<MessageDTO> {
  const user = await requireAuth();
  const m = await MessageService.send(requestId, user.id, body);
  return {
    id: m.id,
    senderName: m.sender_name ?? "Unknown",
    senderRole: m.sender_role ?? "agent",
    body: m.body,
    createdAt: m.created_at,
    senderId: m.sender_id,
  };
}

export async function getRecentMessages(limit?: number) {
  return MessageService.getRecentAcrossRequests(limit);
}

// ── Agents ──────────────────────────────────────────────────────────────────

export async function getDesigners(): Promise<AgentRow[]> {
  return AgentService.getDesigners();
}
