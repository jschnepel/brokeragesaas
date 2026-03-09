import { query, queryOne } from "@platform/database";

export interface MessageRow {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name: string | null;
  sender_role: string | null;
}

export const MessageService = {
  async getByRequest(requestId: string, after?: string): Promise<MessageRow[]> {
    let sql = `
      SELECT m.*, a.name AS sender_name, a.role AS sender_role
      FROM intake_messages m
      LEFT JOIN agents a ON a.id = m.sender_id
      WHERE m.request_id = $1
    `;
    const params: unknown[] = [requestId];

    if (after) {
      sql += ` AND m.created_at > $2`;
      params.push(after);
    }

    sql += " ORDER BY m.created_at ASC";
    const result = await query<MessageRow>(sql, params);
    return result.rows;
  },

  async send(requestId: string, senderId: string, body: string): Promise<MessageRow> {
    const result = await queryOne<MessageRow>(
      `WITH inserted AS (
         INSERT INTO intake_messages (request_id, sender_id, body)
         VALUES ($1, $2, $3)
         RETURNING *
       )
       SELECT i.*, a.name AS sender_name, a.role AS sender_role
       FROM inserted i
       LEFT JOIN agents a ON a.id = i.sender_id`,
      [requestId, senderId, body]
    );

    if (!result) throw new Error("Failed to send message");
    return result;
  },

  async getRecentAcrossRequests(limit: number = 10): Promise<(MessageRow & { request_title: string })[]> {
    const result = await query<MessageRow & { request_title: string }>(
      `SELECT m.*, a.name AS sender_name, a.role AS sender_role, r.title AS request_title
       FROM intake_messages m
       LEFT JOIN agents a ON a.id = m.sender_id
       LEFT JOIN intake_requests r ON r.id = m.request_id
       ORDER BY m.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },
};
