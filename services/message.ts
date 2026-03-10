import { query, queryOne } from "@/lib/db";
import type { MessageRow } from "@/lib/types";

export const MessageService = {
  async getByRequest(requestId: string): Promise<MessageRow[]> {
    const res = await query<MessageRow>(
      `SELECT m.*, a.name AS sender_name, a.role AS sender_role
       FROM intake_messages m
       LEFT JOIN agents a ON a.id = m.sender_id
       WHERE m.request_id = $1
       ORDER BY m.created_at ASC`,
      [requestId]
    );
    return res.rows;
  },

  async send(requestId: string, senderId: string, body: string): Promise<MessageRow> {
    const row = await queryOne<MessageRow>(
      `WITH ins AS (
         INSERT INTO intake_messages (request_id, sender_id, body)
         VALUES ($1, $2, $3)
         RETURNING *
       )
       SELECT ins.*, a.name AS sender_name, a.role AS sender_role
       FROM ins
       LEFT JOIN agents a ON a.id = ins.sender_id`,
      [requestId, senderId, body]
    );
    if (!row) throw new Error("Failed to send message");
    return row;
  },

  async getRecentAcrossRequests(limit = 10): Promise<MessageRow[]> {
    const res = await query<MessageRow>(
      `SELECT m.*, a.name AS sender_name, a.role AS sender_role
       FROM intake_messages m
       LEFT JOIN agents a ON a.id = m.sender_id
       ORDER BY m.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },
};
