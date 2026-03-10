import { query, queryOne } from "@/lib/db";
import type { FileRow } from "@/lib/types";

export const FileService = {
  async getByRequest(requestId: string): Promise<FileRow[]> {
    const res = await query<FileRow>(
      `SELECT f.*, a.name AS uploader_name
       FROM intake_files f
       LEFT JOIN agents a ON a.id = f.uploaded_by
       WHERE f.request_id = $1
       ORDER BY f.created_at ASC`,
      [requestId]
    );
    return res.rows;
  },

  async create(data: {
    request_id: string;
    file_name: string;
    file_url: string;
    uploaded_by: string;
  }): Promise<FileRow> {
    const row = await queryOne<FileRow>(
      `WITH ins AS (
         INSERT INTO intake_files (request_id, file_name, file_url, uploaded_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *
       )
       SELECT ins.*, a.name AS uploader_name
       FROM ins
       LEFT JOIN agents a ON a.id = ins.uploaded_by`,
      [data.request_id, data.file_name, data.file_url, data.uploaded_by]
    );
    if (!row) throw new Error("Failed to create file record");
    return row;
  },
};
