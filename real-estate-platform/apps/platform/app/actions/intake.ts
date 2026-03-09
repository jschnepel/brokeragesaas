"use server";

import { query, queryOne } from "@platform/database";
import { auth } from "@/auth";

// ── Types ───────────────────────────────────────────────────────────────────

interface IntakeRequest {
  id: string;
  requester_id: string;
  title: string;
  material_type: string;
  brief: string | null;
  due_date: string | null;
  is_rush: boolean;
  status: string;
  queue_number: number;
  assigned_to: string | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  created_at: string;
  updated_at: string;
  requester_name?: string;
  assigned_name?: string;
}

interface IntakeMessage {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function computeSlaDeadline(dueDate: string | null, isRush: boolean): string {
  const base = dueDate ? new Date(dueDate) : new Date();
  if (!dueDate) {
    base.setDate(base.getDate() + (isRush ? 3 : 7));
  }
  return base.toISOString();
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getRequests(filters?: {
  status?: string;
  requester_id?: string;
  assigned_to?: string;
}): Promise<IntakeRequest[]> {
  let sql = `
    SELECT r.*,
           req.name AS requester_name,
           asgn.name AS assigned_name
    FROM intake_requests r
    LEFT JOIN agents req ON req.id = r.requester_id
    LEFT JOIN agents asgn ON asgn.id = r.assigned_to
    WHERE 1=1
  `;
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.status) {
    sql += ` AND r.status = $${idx++}`;
    params.push(filters.status);
  }
  if (filters?.requester_id) {
    sql += ` AND r.requester_id = $${idx++}`;
    params.push(filters.requester_id);
  }
  if (filters?.assigned_to) {
    sql += ` AND r.assigned_to = $${idx++}`;
    params.push(filters.assigned_to);
  }

  sql += " ORDER BY r.created_at DESC";

  const result = await query<IntakeRequest>(sql, params);
  return result.rows;
}

export async function getRequestById(
  id: string
): Promise<IntakeRequest | null> {
  const result = await queryOne<IntakeRequest>(
    `SELECT r.*,
            req.name AS requester_name,
            asgn.name AS assigned_name
     FROM intake_requests r
     LEFT JOIN agents req ON req.id = r.requester_id
     LEFT JOIN agents asgn ON asgn.id = r.assigned_to
     WHERE r.id = $1`,
    [id]
  );
  return result ?? null;
}

export async function createRequest(data: {
  title: string;
  material_type: string;
  brief?: string;
  due_date?: string;
  is_rush?: boolean;
}): Promise<IntakeRequest> {
  const user = await requireAuth();
  const slaDeadline = computeSlaDeadline(
    data.due_date ?? null,
    data.is_rush ?? false
  );

  const result = await queryOne<IntakeRequest>(
    `INSERT INTO intake_requests (requester_id, title, material_type, brief, due_date, is_rush, status, sla_deadline)
     VALUES ($1, $2, $3, $4, $5, $6, 'submitted', $7)
     RETURNING *`,
    [
      user.id,
      data.title,
      data.material_type,
      data.brief ?? null,
      data.due_date ?? null,
      data.is_rush ?? false,
      slaDeadline,
    ]
  );

  if (!result) throw new Error("Failed to create request");

  // Log status
  await query(
    `INSERT INTO intake_status_log (request_id, old_status, new_status, changed_by)
     VALUES ($1, NULL, 'submitted', $2)`,
    [result.id, user.id]
  );

  return result;
}

export async function updateRequestStatus(
  requestId: string,
  newStatus: string
): Promise<IntakeRequest | null> {
  const user = await requireAuth();

  const existing = await queryOne<IntakeRequest>(
    "SELECT status FROM intake_requests WHERE id = $1",
    [requestId]
  );
  if (!existing) throw new Error("Request not found");

  const result = await queryOne<IntakeRequest>(
    `UPDATE intake_requests
     SET status = $1, updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [newStatus, requestId]
  );

  await query(
    `INSERT INTO intake_status_log (request_id, old_status, new_status, changed_by)
     VALUES ($1, $2, $3, $4)`,
    [requestId, existing.status, newStatus, user.id]
  );

  return result ?? null;
}

export async function assignRequest(
  requestId: string,
  assigneeId: string
): Promise<IntakeRequest | null> {
  const user = await requireAuth();

  const result = await queryOne<IntakeRequest>(
    `UPDATE intake_requests
     SET assigned_to = $1, status = CASE WHEN status = 'submitted' THEN 'assigned' ELSE status END, updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [assigneeId, requestId]
  );

  if (result) {
    await query(
      `INSERT INTO intake_status_log (request_id, old_status, new_status, changed_by)
       VALUES ($1, 'submitted', 'assigned', $2)`,
      [requestId, user.id]
    );
  }

  return result ?? null;
}

export async function cancelRequest(
  requestId: string
): Promise<IntakeRequest | null> {
  return updateRequestStatus(requestId, "cancelled");
}

// ── KPIs ────────────────────────────────────────────────────────────────────

export async function getKPIs() {
  const openResult = await queryOne<{ count: string }>(
    "SELECT COUNT(*) AS count FROM intake_requests WHERE status NOT IN ('completed', 'cancelled')"
  );

  const avgCycleResult = await queryOne<{ avg_days: string | null }>(
    `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::numeric(6,2) AS avg_days
     FROM intake_requests WHERE status = 'completed'`
  );

  const breachResult = await queryOne<{ count: string }>(
    "SELECT COUNT(*) AS count FROM intake_requests WHERE sla_breached = true"
  );

  const completedResult = await queryOne<{ count: string }>(
    "SELECT COUNT(*) AS count FROM intake_requests WHERE status = 'completed'"
  );

  return {
    openRequests: parseInt(openResult?.count ?? "0"),
    avgCycleDays: parseFloat(avgCycleResult?.avg_days ?? "0"),
    slaBreachCount: parseInt(breachResult?.count ?? "0"),
    completedCount: parseInt(completedResult?.count ?? "0"),
  };
}

// ── Messages ────────────────────────────────────────────────────────────────

export async function getMessages(
  requestId: string
): Promise<IntakeMessage[]> {
  const result = await query<IntakeMessage>(
    `SELECT m.*, a.name AS sender_name
     FROM intake_messages m
     LEFT JOIN agents a ON a.id = m.sender_id
     WHERE m.request_id = $1
     ORDER BY m.created_at ASC`,
    [requestId]
  );
  return result.rows;
}

export async function sendMessage(
  requestId: string,
  body: string
): Promise<IntakeMessage> {
  const user = await requireAuth();

  const result = await queryOne<IntakeMessage>(
    `INSERT INTO intake_messages (request_id, sender_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [requestId, user.id, body]
  );

  if (!result) throw new Error("Failed to send message");
  return result;
}
