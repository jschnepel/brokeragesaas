import { query, queryOne } from "@/lib/db";
import type { AgentRow } from "@/lib/types";

export const AgentService = {
  async getAll(): Promise<AgentRow[]> {
    const res = await query<AgentRow>(
      `SELECT id, name, email, role, created_at FROM agents ORDER BY name`
    );
    return res.rows;
  },

  async getById(id: string): Promise<AgentRow | null> {
    return queryOne<AgentRow>(
      `SELECT id, name, email, role, created_at FROM agents WHERE id = $1`,
      [id]
    );
  },

  async getDesigners(): Promise<AgentRow[]> {
    const res = await query<AgentRow>(
      `SELECT id, name, email, role, created_at FROM agents WHERE role = 'designer' ORDER BY name`
    );
    return res.rows;
  },

  async getByRole(role: string): Promise<AgentRow[]> {
    const res = await query<AgentRow>(
      `SELECT id, name, email, role, created_at FROM agents WHERE role = $1 ORDER BY name`,
      [role]
    );
    return res.rows;
  },
};
