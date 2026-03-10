import { query, queryOne } from "@/lib/db";
import type { RequestRow, RequestWithDetails, RequestFilters, MessageRow, FileRow } from "@/lib/types";
import { SLA_HOURS } from "@/lib/constants";

export const RequestService = {
  async getAll(filters?: RequestFilters): Promise<RequestRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters?.status) {
      conditions.push(`r.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters?.assignedTo) {
      conditions.push(`r.assigned_to = $${idx++}`);
      params.push(filters.assignedTo);
    }
    if (filters?.requesterId) {
      conditions.push(`r.requester_id = $${idx++}`);
      params.push(filters.requesterId);
    }
    if (filters?.materialType) {
      conditions.push(`r.material_type = $${idx++}`);
      params.push(filters.materialType);
    }
    if (filters?.isRush !== undefined) {
      conditions.push(`r.is_rush = $${idx++}`);
      params.push(filters.isRush);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const res = await query<RequestRow>(
      `SELECT r.*,
              req.name AS requester_name,
              des.name AS assigned_name,
              hero.file_url AS hero_image_url
       FROM intake_requests r
       LEFT JOIN agents req ON req.id = r.requester_id
       LEFT JOIN agents des ON des.id = r.assigned_to
       LEFT JOIN LATERAL (
         SELECT f.file_url FROM intake_files f
         WHERE f.request_id = r.id
           AND f.file_name ~* '\\.(jpg|jpeg|png|webp|gif|svg)$'
         ORDER BY f.created_at DESC LIMIT 1
       ) hero ON true
       ${where}
       ORDER BY r.created_at DESC`,
      params
    );
    return res.rows;
  },

  async getById(id: string): Promise<RequestWithDetails | null> {
    const row = await queryOne<RequestRow>(
      `SELECT r.*,
              req.name AS requester_name,
              des.name AS assigned_name
       FROM intake_requests r
       LEFT JOIN agents req ON req.id = r.requester_id
       LEFT JOIN agents des ON des.id = r.assigned_to
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
         ORDER BY f.created_at ASC`,
        [id]
      ),
    ]);

    return {
      ...row,
      messages: msgs.rows,
      files: files.rows,
    };
  },

  async create(data: {
    requester_id: string;
    title: string;
    material_type: string;
    brief?: string;
    due_date?: string;
    is_rush?: boolean;
  }): Promise<RequestRow> {
    const slaHours = data.is_rush ? SLA_HOURS.rush : SLA_HOURS.standard;

    const row = await queryOne<RequestRow>(
      `INSERT INTO intake_requests (requester_id, title, material_type, brief, due_date, is_rush, status, sla_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, 'submitted', NOW() + interval '1 hour' * $7)
       RETURNING *`,
      [
        data.requester_id,
        data.title,
        data.material_type,
        data.brief ?? null,
        data.due_date ?? null,
        data.is_rush ?? false,
        slaHours,
      ]
    );

    if (!row) throw new Error("Failed to create request");

    // Log the initial status
    await query(
      `INSERT INTO intake_status_log (request_id, old_status, new_status, changed_by)
       VALUES ($1, NULL, 'submitted', $2)`,
      [row.id, data.requester_id]
    );

    return row;
  },

  async updateStatus(requestId: string, newStatus: string, changedBy: string): Promise<RequestRow | null> {
    const current = await queryOne<RequestRow>(
      `SELECT * FROM intake_requests WHERE id = $1`,
      [requestId]
    );
    if (!current) return null;

    const row = await queryOne<RequestRow>(
      `UPDATE intake_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, requestId]
    );

    await query(
      `INSERT INTO intake_status_log (request_id, old_status, new_status, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [requestId, current.status, newStatus, changedBy]
    );

    return row;
  },

  async assign(requestId: string, assigneeId: string, changedBy: string): Promise<RequestRow | null> {
    const current = await queryOne<RequestRow>(
      `SELECT * FROM intake_requests WHERE id = $1`,
      [requestId]
    );
    if (!current) return null;

    const row = await queryOne<RequestRow>(
      `UPDATE intake_requests SET assigned_to = $1, status = 'assigned', updated_at = NOW() WHERE id = $2 RETURNING *`,
      [assigneeId, requestId]
    );

    await query(
      `INSERT INTO intake_status_log (request_id, old_status, new_status, changed_by)
       VALUES ($1, $2, 'assigned', $3)`,
      [requestId, current.status, changedBy]
    );

    return row;
  },
};
