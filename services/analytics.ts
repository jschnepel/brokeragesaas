import { query, queryOne } from "@/lib/db";
import type { KPIs, VolumeWeek, DesignerLoad, MaterialBreakdown, TeamHealth, IntakeQueueItem } from "@/lib/types";

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

  async getVolumeByWeek(weeks = 12, assignedTo?: string): Promise<VolumeWeek[]> {
    const conditions = ["created_at >= NOW() - interval '1 week' * $1"];
    const params: unknown[] = [weeks];
    if (assignedTo) {
      conditions.push(`assigned_to = $2`);
      params.push(assignedTo);
    }
    const where = conditions.join(" AND ");
    const res = await query<{ week: string; submitted: string; completed: string }>(
      `SELECT
         to_char(date_trunc('week', created_at), 'YYYY-MM-DD') AS week,
         count(*) AS submitted,
         count(*) FILTER (WHERE status = 'completed') AS completed
       FROM intake_requests
       WHERE ${where}
       GROUP BY date_trunc('week', created_at)
       ORDER BY week`,
      params
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

  async getTeamHealth(): Promise<TeamHealth> {
    const row = await queryOne<{
      revision_rate: string | null;
      sla_compliance: string | null;
      req_per_designer: string | null;
      avg_completion_days: string | null;
    }>(
      `SELECT
         (count(*) FILTER (WHERE status = 'revision'))::float / NULLIF(count(*), 0) * 100 AS revision_rate,
         (count(*) FILTER (WHERE status = 'completed' AND sla_breached = false))::float / NULLIF(count(*) FILTER (WHERE status = 'completed'), 0) * 100 AS sla_compliance,
         count(*) FILTER (WHERE status NOT IN ('completed','cancelled','draft'))::float / NULLIF((SELECT count(*) FROM agents WHERE role = 'designer'), 0) AS req_per_designer,
         EXTRACT(EPOCH FROM avg(updated_at - created_at) FILTER (WHERE status = 'completed')) / 86400 AS avg_completion_days
       FROM intake_requests`
    );

    return {
      revisionRate: parseFloat(row?.revision_rate ?? "0"),
      slaCompliance: parseFloat(row?.sla_compliance ?? "100"),
      reqPerDesigner: parseFloat(row?.req_per_designer ?? "0"),
      avgCompletionDays: parseFloat(row?.avg_completion_days ?? "0"),
    };
  },

  async getIntakeQueue(): Promise<IntakeQueueItem[]> {
    const res = await query<{
      id: string;
      queue_number: number;
      title: string;
      requester_name: string | null;
      office: string;
      material_type: string;
      is_rush: boolean;
      submitted_at: string;
      due_date: string | null;
      brief: string | null;
      attachments: string;
    }>(
      `SELECT
         r.id, r.queue_number, r.title,
         a.name AS requester_name,
         COALESCE(a.email, '') AS office,
         r.material_type, r.is_rush,
         r.created_at AS submitted_at,
         r.due_date, r.brief,
         (SELECT count(*) FROM intake_files f WHERE f.request_id = r.id) AS attachments
       FROM intake_requests r
       LEFT JOIN agents a ON a.id = r.requester_id
       WHERE r.status = 'submitted'
       ORDER BY r.is_rush DESC, r.created_at ASC`
    );

    return res.rows.map((r) => {
      // Extract office from email domain or default to 'Scottsdale'
      let office = "Scottsdale";
      if (r.office && r.office.includes("@")) {
        const domain = r.office.split("@")[1]?.split(".")[0];
        if (domain) office = domain.charAt(0).toUpperCase() + domain.slice(1);
      }

      return {
        id: r.id,
        queueNumber: r.queue_number,
        title: r.title,
        requesterName: r.requester_name ?? "Unknown",
        office,
        materialType: r.material_type,
        isRush: r.is_rush,
        submittedAt: r.submitted_at,
        dueDate: r.due_date,
        estimatedPages: 1,
        brief: r.brief,
        attachments: parseInt(r.attachments),
      };
    });
  },
};
