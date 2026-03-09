import { query, queryOne } from "@platform/database";

export interface KPIs {
  openRequests: number;
  avgCycleDays: number;
  slaBreachCount: number;
  completedCount: number;
  rushActiveCount: number;
  unassignedCount: number;
}

export interface VolumeWeek {
  week: string;
  submitted: number;
  completed: number;
}

export interface DesignerLoad {
  designer_id: string;
  designer_name: string;
  active: number;
  completed: number;
  breached: number;
}

export interface MaterialBreakdown {
  material_type: string;
  count: number;
}

export const AnalyticsService = {
  async getKPIs(): Promise<KPIs> {
    const [open, avgCycle, breach, completed, rush, unassigned] = await Promise.all([
      queryOne<{ count: string }>(
        "SELECT COUNT(*) AS count FROM intake_requests WHERE status NOT IN ('completed', 'cancelled')"
      ),
      queryOne<{ avg_days: string | null }>(
        `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::numeric(6,2) AS avg_days
         FROM intake_requests WHERE status = 'completed'`
      ),
      queryOne<{ count: string }>(
        "SELECT COUNT(*) AS count FROM intake_requests WHERE sla_breached = true"
      ),
      queryOne<{ count: string }>(
        "SELECT COUNT(*) AS count FROM intake_requests WHERE status = 'completed'"
      ),
      queryOne<{ count: string }>(
        "SELECT COUNT(*) AS count FROM intake_requests WHERE is_rush = true AND status NOT IN ('completed', 'cancelled')"
      ),
      queryOne<{ count: string }>(
        "SELECT COUNT(*) AS count FROM intake_requests WHERE assigned_to IS NULL AND status NOT IN ('completed', 'cancelled')"
      ),
    ]);

    return {
      openRequests: parseInt(open?.count ?? "0"),
      avgCycleDays: parseFloat(avgCycle?.avg_days ?? "0"),
      slaBreachCount: parseInt(breach?.count ?? "0"),
      completedCount: parseInt(completed?.count ?? "0"),
      rushActiveCount: parseInt(rush?.count ?? "0"),
      unassignedCount: parseInt(unassigned?.count ?? "0"),
    };
  },

  async getVolumeByWeek(weeks: number = 12): Promise<VolumeWeek[]> {
    const result = await query<VolumeWeek>(
      `SELECT
         to_char(date_trunc('week', created_at), 'Mon DD') AS week,
         COUNT(*) FILTER (WHERE true) AS submitted,
         COUNT(*) FILTER (WHERE status = 'completed') AS completed
       FROM intake_requests
       WHERE created_at >= now() - interval '1 week' * $1
       GROUP BY date_trunc('week', created_at)
       ORDER BY date_trunc('week', created_at)`,
      [weeks]
    );
    return result.rows;
  },

  async getByDesigner(): Promise<DesignerLoad[]> {
    const result = await query<DesignerLoad>(
      `SELECT
         a.id AS designer_id,
         a.name AS designer_name,
         COUNT(*) FILTER (WHERE r.status NOT IN ('completed', 'cancelled')) AS active,
         COUNT(*) FILTER (WHERE r.status = 'completed') AS completed,
         COUNT(*) FILTER (WHERE r.sla_breached = true AND r.status NOT IN ('completed', 'cancelled')) AS breached
       FROM agents a
       LEFT JOIN intake_requests r ON r.assigned_to = a.id
       WHERE a.role IN ('marketing_manager', 'designer')
       GROUP BY a.id, a.name
       ORDER BY a.name`
    );
    return result.rows;
  },

  async getMaterialBreakdown(): Promise<MaterialBreakdown[]> {
    const result = await query<MaterialBreakdown>(
      `SELECT material_type, COUNT(*) AS count
       FROM intake_requests
       WHERE status NOT IN ('cancelled')
       GROUP BY material_type
       ORDER BY count DESC`
    );
    return result.rows;
  },
};
