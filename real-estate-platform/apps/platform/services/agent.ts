import { query, queryOne } from "@platform/database";

export interface AgentRow {
  id: string;
  name: string;
  email: string;
  role: string;
  office: string | null;
  phone: string | null;
  created_at: string;
}

export const AgentService = {
  async getById(id: string): Promise<AgentRow | null> {
    const result = await queryOne<AgentRow>(
      "SELECT * FROM agents WHERE id = $1",
      [id]
    );
    return result ?? null;
  },

  async getDesigners(): Promise<AgentRow[]> {
    const result = await query<AgentRow>(
      "SELECT * FROM agents WHERE role IN ('marketing_manager', 'designer') ORDER BY name"
    );
    return result.rows;
  },

  async getAll(): Promise<AgentRow[]> {
    const result = await query<AgentRow>(
      "SELECT * FROM agents ORDER BY name"
    );
    return result.rows;
  },
};
