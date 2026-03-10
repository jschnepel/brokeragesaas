import { query, queryOne } from "@/lib/db";
import type { KPIs, VolumeWeek, DesignerLoad, MaterialBreakdown } from "@/lib/types";

export const AnalyticsService = {
  async getKPIs(): Promise<KPIs> {
    const row = await queryOne<{
      total: string;
      open: string;
      completed: string;
      avg_hours: string | null;
      breach_rate: string | null;
      rush_pct: string | null;
    }>(
      `SELECT
         count(*) AS total,
         count(*) FILTER (WHERE status NOT IN ('completed','cancelled')) AS open,
         count(*) FILTER (WHERE status = 'completed') AS completed,
         EXTRACT(EPOCH FROM avg(updated_at - created_at) FILTER (WHERE status = 'completed')) / 3600 AS avg_hours,
         (count(*) FILTER (WHERE sla_breached = true))::float / NULLIF(count(*), 0) AS breach_rate,
         (count(*) FILTER (WHERE is_rush = true))::float / NULLIF(count(*), 0) AS rush_pct
       FROM intake_requests`
    );

    return {
      totalRequests: parseInt(row?.total ?? "0"),
      openRequests: parseInt(row?.open ?? "0"),
      completedRequests: parseInt(row?.completed ?? "0"),
      avgTurnaroundHours: parseFloat(row?.avg_hours ?? "0"),
      slaBreachRate: parseFloat(row?.breach_rate ?? "0"),
      rushPercentage: parseFloat(row?.rush_pct ?? "0"),
    };
  },

  async getVolumeByWeek(weeks = 12): Promise<VolumeWeek[]> {
    const res = await query<{ week: string; submitted: string; completed: string }>(
      `SELECT
         to_char(date_trunc('week', created_at), 'YYYY-MM-DD') AS week,
         count(*) AS submitted,
         count(*) FILTER (WHERE status = 'completed') AS completed
       FROM intake_requests
       WHERE created_at >= NOW() - interval '1 week' * $1
       GROUP BY date_trunc('week', created_at)
       ORDER BY week`,
      [weeks]
    );
    return res.rows.map((r) => ({
      week: r.week,
      submitted: parseInt(r.submitted),
      completed: parseInt(r.completed),
    }));
  },

  async getByDesigner(): Promise<DesignerLoad[]> {
    const res = await query<{
      designer_id: string;
      designer_name: string;
      active_count: string;
      completed_count: string;
    }>(
      `SELECT
         a.id AS designer_id,
         a.name AS designer_name,
         count(*) FILTER (WHERE r.status NOT IN ('completed','cancelled')) AS active_count,
         count(*) FILTER (WHERE r.status = 'completed') AS completed_count
       FROM agents a
       LEFT JOIN intake_requests r ON r.assigned_to = a.id
       WHERE a.role = 'designer'
       GROUP BY a.id, a.name
       ORDER BY a.name`
    );
    return res.rows.map((r) => ({
      designerId: r.designer_id,
      designerName: r.designer_name,
      activeCount: parseInt(r.active_count),
      completedCount: parseInt(r.completed_count),
    }));
  },

  async getMaterialBreakdown(): Promise<MaterialBreakdown[]> {
    const res = await query<{ material_type: string; count: string; pct: string }>(
      `SELECT
         material_type,
         count(*) AS count,
         (count(*)::float / NULLIF((SELECT count(*) FROM intake_requests), 0)) AS pct
       FROM intake_requests
       GROUP BY material_type
       ORDER BY count DESC`
    );
    return res.rows.map((r) => ({
      materialType: r.material_type,
      count: parseInt(r.count),
      percentage: parseFloat(r.pct),
    }));
  },
};
