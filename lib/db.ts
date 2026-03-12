/**
 * Mock database layer — returns realistic in-memory data so the app
 * runs without Neon (or any database).  Swap back to db.real.ts when ready.
 */

import type { QueryResultRow } from "@neondatabase/serverless";

// ── Seed data ────────────────────────────────────────────────────────────────

const AGENTS = [
  { id: "a0000000-0000-0000-0000-000000000001", name: "Yong Choi", email: "yong@demo.local", role: "agent", created_at: "2025-01-10T00:00:00Z" },
  { id: "a0000000-0000-0000-0000-000000000002", name: "Lex Baum", email: "lex@demo.local", role: "marketing_manager", created_at: "2025-01-10T00:00:00Z" },
  { id: "a0000000-0000-0000-0000-000000000003", name: "David Kim", email: "david@demo.local", role: "executive", created_at: "2025-01-10T00:00:00Z" },
  { id: "a0000000-0000-0000-0000-000000000004", name: "Marcus Chen", email: "marcus@demo.local", role: "designer", created_at: "2025-01-10T00:00:00Z" },
  { id: "a0000000-0000-0000-0000-000000000005", name: "Sarah Lopez", email: "sarah@demo.local", role: "designer", created_at: "2025-02-01T00:00:00Z" },
  { id: "a0000000-0000-0000-0000-000000000006", name: "James Park", email: "james@demo.local", role: "agent", created_at: "2025-02-15T00:00:00Z" },
];

const now = new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

const REQUESTS = [
  { id: "r0000001", queue_number: 1001, title: "Desert Mountain Luxury Flyer", material_type: "Flyer", status: "completed", is_rush: false, brief: "Full-page flyer for $4.2M listing at Desert Mountain, featuring aerial photography and course views.", notes: null, requester_id: "a0000000-0000-0000-0000-000000000001", assigned_to: "a0000000-0000-0000-0000-000000000004", due_date: daysAgo(-2), sla_deadline: daysAgo(5), sla_breached: false, created_at: daysAgo(10), updated_at: daysAgo(3) },
  { id: "r0000002", queue_number: 1002, title: "Scottsdale Q1 Market Report", material_type: "Report", status: "in_progress", is_rush: false, brief: "Quarterly market report with charts, median price trends, and inventory analysis for Scottsdale zip codes.", notes: null, requester_id: "a0000000-0000-0000-0000-000000000003", assigned_to: "a0000000-0000-0000-0000-000000000005", due_date: daysAgo(-5), sla_deadline: daysAgo(-1), sla_breached: false, created_at: daysAgo(7), updated_at: daysAgo(1) },
  { id: "r0000003", queue_number: 1003, title: "New Listing Social Pack — Pinnacle Peak", material_type: "Social Pack", status: "assigned", is_rush: true, brief: "Instagram carousel + story templates for new $2.8M Pinnacle Peak listing. Rush — open house Saturday.", notes: null, requester_id: "a0000000-0000-0000-0000-000000000001", assigned_to: "a0000000-0000-0000-0000-000000000004", due_date: daysAgo(-1), sla_deadline: daysAgo(0), sla_breached: false, created_at: daysAgo(2), updated_at: daysAgo(1) },
  { id: "r0000004", queue_number: 1004, title: "Spring Email Campaign — Luxury Sellers", material_type: "Email Campaign", status: "submitted", is_rush: false, brief: "Targeted email to luxury homeowners in 85262 and 85255 about current market conditions and seller advantage.", notes: null, requester_id: "a0000000-0000-0000-0000-000000000006", assigned_to: null, due_date: daysAgo(-7), sla_deadline: daysAgo(-3), sla_breached: false, created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: "r0000005", queue_number: 1005, title: "Open House Signage — Troon Village", material_type: "Signage", status: "submitted", is_rush: true, brief: "Directional signs + A-frame for open house this weekend at Troon Village.", notes: null, requester_id: "a0000000-0000-0000-0000-000000000001", assigned_to: null, due_date: daysAgo(-1), sla_deadline: daysAgo(0), sla_breached: false, created_at: daysAgo(0), updated_at: daysAgo(0) },
  { id: "r0000006", queue_number: 1006, title: "Agent Bio Video Script — Yong Choi", material_type: "Video Script", status: "awaiting_materials", is_rush: false, brief: "30-second intro video script for Yong's agent profile. Needs headshot and brand guidelines.", notes: null, requester_id: "a0000000-0000-0000-0000-000000000001", assigned_to: "a0000000-0000-0000-0000-000000000005", due_date: daysAgo(-10), sla_deadline: daysAgo(-5), sla_breached: false, created_at: daysAgo(14), updated_at: daysAgo(5) },
  { id: "r0000007", queue_number: 1007, title: "Luxury Brochure — DC Ranch", material_type: "Brochure", status: "completed", is_rush: false, brief: "8-page property brochure for $5.1M DC Ranch estate. Include floor plan and community amenities.", notes: null, requester_id: "a0000000-0000-0000-0000-000000000006", assigned_to: "a0000000-0000-0000-0000-000000000004", due_date: daysAgo(5), sla_deadline: daysAgo(8), sla_breached: false, created_at: daysAgo(20), updated_at: daysAgo(8) },
  { id: "r0000008", queue_number: 1008, title: "Market Snapshot Flyer — Paradise Valley", material_type: "Flyer", status: "completed", is_rush: true, brief: "One-page stats flyer for Paradise Valley market. Rush for client presentation.", notes: null, requester_id: "a0000000-0000-0000-0000-000000000003", assigned_to: "a0000000-0000-0000-0000-000000000005", due_date: daysAgo(12), sla_deadline: daysAgo(13), sla_breached: false, created_at: daysAgo(15), updated_at: daysAgo(13) },
  { id: "r0000009", queue_number: 1009, title: "Holiday Social Pack", material_type: "Social Pack", status: "cancelled", is_rush: false, brief: "Holiday-themed social media templates. Cancelled — client changed direction.", notes: "Client decided to go with a different approach.", requester_id: "a0000000-0000-0000-0000-000000000006", assigned_to: "a0000000-0000-0000-0000-000000000004", due_date: daysAgo(25), sla_deadline: daysAgo(22), sla_breached: false, created_at: daysAgo(30), updated_at: daysAgo(25) },
  { id: "r0000010", queue_number: 1010, title: "Quarterly Newsletter — Russ Lyon", material_type: "Email Campaign", status: "revision", is_rush: false, brief: "Company-wide quarterly newsletter. Needs updated headcount and sales figures.", notes: null, requester_id: "a0000000-0000-0000-0000-000000000003", assigned_to: "a0000000-0000-0000-0000-000000000005", due_date: daysAgo(-3), sla_deadline: daysAgo(-1), sla_breached: false, created_at: daysAgo(8), updated_at: daysAgo(2) },
];

const MESSAGES = [
  { id: "m001", request_id: "r0000001", sender_id: "a0000000-0000-0000-0000-000000000001", body: "Here are the aerial shots from the photographer. Please use the sunset one as the hero image.", created_at: daysAgo(9) },
  { id: "m002", request_id: "r0000001", sender_id: "a0000000-0000-0000-0000-000000000004", body: "Got it — the sunset shot is stunning. I'll have the first draft ready by tomorrow.", created_at: daysAgo(8) },
  { id: "m003", request_id: "r0000001", sender_id: "a0000000-0000-0000-0000-000000000004", body: "Draft is ready for review. Let me know if you'd like any changes to the layout.", created_at: daysAgo(5) },
  { id: "m004", request_id: "r0000001", sender_id: "a0000000-0000-0000-0000-000000000001", body: "Looks perfect! Approved.", created_at: daysAgo(4) },
  { id: "m005", request_id: "r0000002", sender_id: "a0000000-0000-0000-0000-000000000003", body: "Can we include year-over-year comparison charts? The board presentation needs trend context.", created_at: daysAgo(6) },
  { id: "m006", request_id: "r0000002", sender_id: "a0000000-0000-0000-0000-000000000005", body: "Absolutely — I'll add YoY comparisons for median price, DOM, and inventory levels.", created_at: daysAgo(5) },
  { id: "m007", request_id: "r0000003", sender_id: "a0000000-0000-0000-0000-000000000001", body: "Open house is Saturday at 2pm — need these by Thursday EOD latest. Photos attached.", created_at: daysAgo(1) },
  { id: "m008", request_id: "r0000003", sender_id: "a0000000-0000-0000-0000-000000000004", body: "On it — I'll have the carousel and stories ready by Thursday morning.", created_at: daysAgo(1) },
  { id: "m009", request_id: "r0000006", sender_id: "a0000000-0000-0000-0000-000000000005", body: "I need your updated headshot and any specific talking points you want in the script.", created_at: daysAgo(6) },
  { id: "m010", request_id: "r0000010", sender_id: "a0000000-0000-0000-0000-000000000003", body: "The Q4 numbers are finalized — updating the brief with correct figures.", created_at: daysAgo(3) },
];

const FILES = [
  { id: "f001", request_id: "r0000001", file_name: "desert-mountain-aerial-sunset.jpg", file_url: null, uploaded_by: "a0000000-0000-0000-0000-000000000001", created_at: daysAgo(9) },
  { id: "f002", request_id: "r0000001", file_name: "desert-mountain-interior-01.jpg", file_url: null, uploaded_by: "a0000000-0000-0000-0000-000000000001", created_at: daysAgo(9) },
  { id: "f003", request_id: "r0000001", file_name: "flyer-draft-v1.pdf", file_url: null, uploaded_by: "a0000000-0000-0000-0000-000000000004", created_at: daysAgo(5) },
  { id: "f004", request_id: "r0000003", file_name: "pinnacle-peak-hero.jpg", file_url: null, uploaded_by: "a0000000-0000-0000-0000-000000000001", created_at: daysAgo(1) },
  { id: "f005", request_id: "r0000003", file_name: "pinnacle-peak-pool.jpg", file_url: null, uploaded_by: "a0000000-0000-0000-0000-000000000001", created_at: daysAgo(1) },
  { id: "f006", request_id: "r0000007", file_name: "dc-ranch-floor-plan.pdf", file_url: null, uploaded_by: "a0000000-0000-0000-0000-000000000006", created_at: daysAgo(19) },
  { id: "f007", request_id: "r0000007", file_name: "dc-ranch-brochure-final.pdf", file_url: null, uploaded_by: "a0000000-0000-0000-0000-000000000004", created_at: daysAgo(10) },
];

const THEMES = [
  {
    id: "t001",
    tenant_id: "russ-lyon",
    theme_name: "Russ Lyon Default",
    tokens: {
      "brand-primary": "#0C1C2E",
      "brand-primary-dark": "#081422",
      "brand-accent": "#BFA67A",
      "brand-surface": "#F9F8F6",
      "brand-surface-alt": "#EFEEE9",
      "brand-dark": "#0C1C2E",
      "brand-sidebar": "#0C1C2E",
      "brand-font-display": "Playfair Display",
      "brand-font-body": "Inter",
      "brand-font-mono": "JetBrains Mono",
      "brand-radius": "0.5rem",
      "brand-glow-opacity": "0.15",
      "brand-card-blur": "12px",
      "brand-sidebar-width": "280px",
    },
    created_at: "2025-01-01T00:00:00Z",
    updated_at: now,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function agentById(id: string) {
  return AGENTS.find((a) => a.id === id);
}

function enrichRequest(r: (typeof REQUESTS)[number]) {
  const req = agentById(r.requester_id);
  const des = r.assigned_to ? agentById(r.assigned_to) : null;
  const heroFile = FILES.find(
    (f) => f.request_id === r.id && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.file_name)
  );
  return {
    ...r,
    requester_name: req?.name ?? null,
    assigned_name: des?.name ?? null,
    hero_image_url: heroFile?.file_url ?? null,
  };
}

function enrichMessage(m: (typeof MESSAGES)[number]) {
  const sender = agentById(m.sender_id);
  return { ...m, sender_name: sender?.name ?? null, sender_role: sender?.role ?? null };
}

function enrichFile(f: (typeof FILES)[number]) {
  const uploader = agentById(f.uploaded_by);
  return { ...f, uploader_name: uploader?.name ?? null };
}

// ── Mock query / queryOne ────────────────────────────────────────────────────

let nextId = 100;

interface MockResult<T> {
  rows: T[];
  rowCount: number;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<MockResult<T>> {
  const sql = text.toLowerCase().trim();

  // ── AGENTS ──
  if (sql.includes("from agents") && !sql.includes("join")) {
    let rows = [...AGENTS];
    if (sql.includes("role in ('designer', 'marketing_manager')")) {
      rows = rows.filter((a) => a.role === "designer" || a.role === "marketing_manager");
    } else if (sql.includes("role = $1") && params?.[0]) {
      rows = rows.filter((a) => a.role === params![0]);
    } else if (sql.includes("where id = $1") && params?.[0]) {
      rows = rows.filter((a) => a.id === params![0]);
    }
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return { rows: rows as unknown as T[], rowCount: rows.length };
  }

  // ── REQUESTS (getAll) ──
  if (sql.includes("from intake_requests r") && sql.includes("left join agents req") && !sql.includes("where r.id = $1")) {
    let rows = REQUESTS.map(enrichRequest);
    // Apply filters from WHERE clause
    if (params && params.length > 0) {
      let pIdx = 0;
      if (sql.includes("r.status = $")) {
        rows = rows.filter((r) => r.status === params![pIdx]);
        pIdx++;
      }
      if (sql.includes("r.assigned_to = $")) {
        rows = rows.filter((r) => r.assigned_to === params![pIdx]);
        pIdx++;
      }
      if (sql.includes("r.requester_id = $")) {
        rows = rows.filter((r) => r.requester_id === params![pIdx]);
        pIdx++;
      }
      if (sql.includes("r.material_type = $")) {
        rows = rows.filter((r) => r.material_type === params![pIdx]);
        pIdx++;
      }
      if (sql.includes("r.is_rush = $")) {
        rows = rows.filter((r) => r.is_rush === params![pIdx]);
      }
    }
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { rows: rows as unknown as T[], rowCount: rows.length };
  }

  // ── REQUEST by ID ──
  if (sql.includes("from intake_requests r") && sql.includes("where r.id = $1")) {
    const r = REQUESTS.find((r) => r.id === params?.[0]);
    const rows = r ? [enrichRequest(r)] : [];
    return { rows: rows as unknown as T[], rowCount: rows.length };
  }

  // ── MESSAGES by request ──
  if (sql.includes("from intake_messages m") && sql.includes("where m.request_id = $1")) {
    const rows = MESSAGES.filter((m) => m.request_id === params?.[0])
      .map(enrichMessage)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { rows: rows as unknown as T[], rowCount: rows.length };
  }

  // ── MESSAGES recent ──
  if (sql.includes("from intake_messages m") && sql.includes("limit $1")) {
    const limit = (params?.[0] as number) || 10;
    const rows = MESSAGES.map(enrichMessage)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
    return { rows: rows as unknown as T[], rowCount: rows.length };
  }

  // ── FILES by request ──
  if (sql.includes("from intake_files f") && sql.includes("where f.request_id = $1")) {
    const rows = FILES.filter((f) => f.request_id === params?.[0])
      .map(enrichFile)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { rows: rows as unknown as T[], rowCount: rows.length };
  }

  // ── ANALYTICS: KPIs ──
  if (sql.includes("avg_hours") && sql.includes("breach_rate")) {
    const total = REQUESTS.length;
    const open = REQUESTS.filter((r) => !["completed", "cancelled"].includes(r.status)).length;
    const completed = REQUESTS.filter((r) => r.status === "completed").length;
    const rush = REQUESTS.filter((r) => r.is_rush).length;
    const breached = REQUESTS.filter((r) => r.sla_breached).length;
    const rows = [{
      total: String(total),
      open: String(open),
      completed: String(completed),
      avg_hours: "36.5",
      breach_rate: String(breached / (total || 1)),
      rush_pct: String(rush / (total || 1)),
    }];
    return { rows: rows as unknown as T[], rowCount: 1 };
  }

  // ── ANALYTICS: volume by week ──
  if (sql.includes("date_trunc('week'") && sql.includes("group by")) {
    const weeks: { week: string; submitted: string; completed: string }[] = [];
    const numWeeks = (params?.[0] as number) || 12;
    for (let i = numWeeks - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 7 * 86400000);
      d.setDate(d.getDate() - d.getDay() + 1); // Monday
      weeks.push({
        week: d.toISOString().slice(0, 10),
        submitted: String(Math.floor(Math.random() * 5) + 1),
        completed: String(Math.floor(Math.random() * 4)),
      });
    }
    return { rows: weeks as unknown as T[], rowCount: weeks.length };
  }

  // ── ANALYTICS: designer load ──
  if (sql.includes("from agents a") && sql.includes("left join intake_requests r") && sql.includes("role = 'designer'")) {
    const designers = AGENTS.filter((a) => a.role === "designer");
    const rows = designers.map((d) => {
      const reqs = REQUESTS.filter((r) => r.assigned_to === d.id);
      return {
        designer_id: d.id,
        designer_name: d.name,
        active_count: String(reqs.filter((r) => !["completed", "cancelled"].includes(r.status)).length),
        completed_count: String(reqs.filter((r) => r.status === "completed").length),
      };
    });
    return { rows: rows as unknown as T[], rowCount: rows.length };
  }

  // ── ANALYTICS: material breakdown ──
  if (sql.includes("group by material_type")) {
    const counts: Record<string, number> = {};
    for (const r of REQUESTS) {
      counts[r.material_type] = (counts[r.material_type] || 0) + 1;
    }
    const total = REQUESTS.length;
    const rows = Object.entries(counts)
      .map(([mt, c]) => ({ material_type: mt, count: String(c), pct: String(c / total) }))
      .sort((a, b) => parseInt(b.count) - parseInt(a.count));
    return { rows: rows as unknown as T[], rowCount: rows.length };
  }

  // ── ANALYTICS: team health ──
  if (sql.includes("revision_rate") && sql.includes("sla_compliance")) {
    const rows = [{
      revision_rate: "8.5",
      sla_compliance: "94.2",
      req_per_designer: "3.0",
      avg_completion_days: "4.2",
    }];
    return { rows: rows as unknown as T[], rowCount: 1 };
  }

  // ── ANALYTICS: intake queue ──
  if (sql.includes("from intake_requests r") && sql.includes("where r.status = 'submitted'")) {
    const submitted = REQUESTS.filter((r) => r.status === "submitted").map((r) => {
      const req = agentById(r.requester_id);
      const attachments = FILES.filter((f) => f.request_id === r.id).length;
      return {
        id: r.id,
        queue_number: r.queue_number,
        title: r.title,
        requester_name: req?.name ?? null,
        office: req?.email ?? "",
        material_type: r.material_type,
        is_rush: r.is_rush,
        submitted_at: r.created_at,
        due_date: r.due_date,
        brief: r.brief,
        attachments: String(attachments),
      };
    });
    submitted.sort((a, b) => (a.is_rush === b.is_rush ? 0 : a.is_rush ? -1 : 1));
    return { rows: submitted as unknown as T[], rowCount: submitted.length };
  }

  // ── THEMES ──
  if (sql.includes("from tenant_themes")) {
    let rows = [...THEMES];
    if (sql.includes("where tenant_id = $1") && params?.[0]) {
      rows = rows.filter((t) => t.tenant_id === params![0]);
    }
    return { rows: rows as unknown as T[], rowCount: rows.length };
  }

  // ── INSERT: request ──
  if (sql.includes("insert into intake_requests")) {
    const id = `r${String(++nextId).padStart(7, "0")}`;
    const row = {
      id,
      queue_number: 1010 + nextId,
      title: params?.[1] ?? "New Request",
      material_type: params?.[2] ?? "Other",
      status: "submitted",
      is_rush: params?.[5] ?? false,
      brief: params?.[3] ?? null,
      notes: null,
      requester_id: params?.[0] ?? "",
      requester_name: agentById(params?.[0] as string)?.name ?? null,
      assigned_to: null,
      assigned_name: null,
      due_date: params?.[4] ?? null,
      sla_deadline: new Date(Date.now() + 72 * 3600000).toISOString(),
      sla_breached: false,
      created_at: now,
      updated_at: now,
    };
    return { rows: [row] as unknown as T[], rowCount: 1 };
  }

  // ── INSERT: message ──
  if (sql.includes("insert into intake_messages")) {
    const sender = agentById(params?.[1] as string);
    const row = {
      id: `m${++nextId}`,
      request_id: params?.[0],
      sender_id: params?.[1],
      sender_name: sender?.name ?? null,
      sender_role: sender?.role ?? null,
      body: params?.[2],
      created_at: now,
    };
    return { rows: [row] as unknown as T[], rowCount: 1 };
  }

  // ── INSERT: file ──
  if (sql.includes("insert into intake_files")) {
    const uploader = agentById(params?.[3] as string);
    const row = {
      id: `f${++nextId}`,
      request_id: params?.[0],
      file_name: params?.[1],
      file_url: params?.[2],
      uploaded_by: params?.[3],
      uploader_name: uploader?.name ?? null,
      created_at: now,
    };
    return { rows: [row] as unknown as T[], rowCount: 1 };
  }

  // ── INSERT: status log (fire-and-forget) ──
  if (sql.includes("insert into intake_status_log")) {
    return { rows: [] as unknown as T[], rowCount: 1 };
  }

  // ── UPDATE: request ──
  if (sql.includes("update intake_requests")) {
    const id = params?.[1] ?? params?.[0];
    const r = REQUESTS.find((r) => r.id === id);
    if (r) {
      const row = { ...enrichRequest(r), updated_at: now };
      if (sql.includes("set status = $1")) row.status = params?.[0] as string;
      if (sql.includes("set assigned_to = $1")) {
        row.assigned_to = params?.[0] as string;
        row.status = "assigned";
        row.assigned_name = agentById(params?.[0] as string)?.name ?? null;
      }
      return { rows: [row] as unknown as T[], rowCount: 1 };
    }
    return { rows: [] as unknown as T[], rowCount: 0 };
  }

  // ── INSERT/UPSERT: theme ──
  if (sql.includes("insert into tenant_themes")) {
    return { rows: [] as unknown as T[], rowCount: 1 };
  }

  // ── SELECT * from intake_requests WHERE id (for updateStatus/assign lookup) ──
  if (sql.includes("from intake_requests where id = $1")) {
    const r = REQUESTS.find((r) => r.id === params?.[0]);
    const rows = r ? [{ ...r }] : [];
    return { rows: rows as unknown as T[], rowCount: rows.length };
  }

  // ── Fallback ──
  console.warn("[mock-db] Unmatched query:", sql.slice(0, 80));
  return { rows: [] as unknown as T[], rowCount: 0 };
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const res = await query<T>(text, params);
  return res.rows[0] || null;
}

// Export a no-op pool for compatibility
export const pool = {
  query: query as unknown,
  end: async () => {},
};
