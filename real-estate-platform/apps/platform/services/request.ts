import { query, queryOne } from "@platform/database";

// ── Types ───────────────────────────────────────────────────────────────────

export interface RequestRow {
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
  requester_name: string | null;
  assigned_name: string | null;
}

export interface RequestWithDetails extends RequestRow {
  messages: MessageRow[];
  files: FileRow[];
}

export interface MessageRow {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name: string | null;
  sender_role: string | null;
}

export interface FileRow {
  id: string;
  request_id: string;
  file_name: string;
  file_type: string;
  file_url: string | null;
  uploaded_by: string;
  uploaded_at: string;
  uploader_name: string | null;
}

export interface StatusLogRow {
  id: string;
  request_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  created_at: string;
  changed_by_name: string | null;
}

export interface RequestFilters {
  status?: string;
  requester_id?: string;
  assigned_to?: string;
}

// ── Service ─────────────────────────────────────────────────────────────────

export const RequestService = {
  async getAll(filters?: RequestFilters): Promise<RequestRow[]> {
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
    const result = await query<RequestRow>(sql, params);
    return result.rows;
  },

  async getById(id: string): Promise<RequestWithDetails | null> {
    const row = await queryOne<RequestRow>(
      `SELECT r.*,
              req.name AS requester_name,
              asgn.name AS assigned_name
       FROM intake_requests r
       LEFT JOIN agents req ON req.id = r.requester_id
       LEFT JOIN agents asgn ON asgn.id = r.assigned_to
       WHERE r.id = $1`,
      [id]
    );
    if (!row) return null;

    const [msgs, files] = await Promise.all([
      query<MessageRow>(
        `SELECT m.*, a.name AS sender_name, a.role AS sender_role
         FROM intake_messages m
         LEFT JOIN agents a ON a.id = m.sender_id
         WHERE m.request_id = $1
         ORDER BY m.created_at ASC`,
        [id]
      ),
      query<FileRow>(
        `SELECT f.*, a.name AS uploader_name
         FROM intake_files f
         LEFT JOIN agents a ON a.id = f.uploaded_by
         WHERE f.request_id = $1
         ORDER BY f.uploaded_at ASC`,
        [id]
      ),
    ]);

    return { ...row, messages: msgs.rows, files: files.rows };
  },

  async create(data: {
    requester_id: string;
    title: string;
    material_type: string;
    brief?: string;
    due_date?: string;
    is_rush?: boolean;
  }): Promise<RequestRow> {
    const slaDeadline = computeSlaDeadline(data.due_date ?? null, data.is_rush ?? false);

    const result = await queryOne<RequestRow>(
      `INSERT INTO intake_requests (requester_id, title, material_type, brief, due_date, is_rush, status, sla_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, 'submitted', $7)
       RETURNING *`,
      [data.requester_id, data.title, data.material_type, data.brief ?? null, data.due_date ?? null, data.is_rush ?? false, slaDeadline]
    );

    if (!result) throw new Error("Failed to create request");

    await query(
      `INSERT INTO intake_status_log (request_id, old_status, new_status, changed_by)
       VALUES ($1, NULL, 'submitted', $2)`,
      [result.id, data.requester_id]
    );

    return result;
  },

  async updateStatus(requestId: string, newStatus: string, changedBy: string): Promise<RequestRow | null> {
    const existing = await queryOne<{ status: string }>(
      "SELECT status FROM intake_requests WHERE id = $1",
      [requestId]
    );
    if (!existing) throw new Error("Request not found");

    const result = await queryOne<RequestRow>(
      `UPDATE intake_requests SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [newStatus, requestId]
    );

    await query(
      `INSERT INTO intake_status_log (request_id, old_status, new_status, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [requestId, existing.status, newStatus, changedBy]
    );

    return result ?? null;
  },

  async assign(requestId: string, assigneeId: string, changedBy: string): Promise<RequestRow | null> {
    const result = await queryOne<RequestRow>(
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
        [requestId, changedBy]
      );
    }

    return result ?? null;
  },

  async getStatusLog(requestId: string): Promise<StatusLogRow[]> {
    const result = await query<StatusLogRow>(
      `SELECT sl.*, a.name AS changed_by_name
       FROM intake_status_log sl
       LEFT JOIN agents a ON a.id = sl.changed_by
       WHERE sl.request_id = $1
       ORDER BY sl.created_at ASC`,
      [requestId]
    );
    return result.rows;
  },
};

function computeSlaDeadline(dueDate: string | null, isRush: boolean): string {
  const base = dueDate ? new Date(dueDate) : new Date();
  if (!dueDate) {
    base.setDate(base.getDate() + (isRush ? 3 : 7));
  }
  return base.toISOString();
}
