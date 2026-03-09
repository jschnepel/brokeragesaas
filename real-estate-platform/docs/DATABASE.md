# DATABASE.md — Schema Reference & Migration Log
# Real Estate Platform — Echelon Point LLC
# Update when: any migration is added or run, schema changes, new indexes added
# Last Updated: 2026-03-09

---

## ENVIRONMENTS

| Environment | Provider | Branch/Schema | Notes                                        |
|-------------|----------|---------------|----------------------------------------------|
| Local dev   | Neon     | dev branch    | `DATABASE_URL` in .env.local                 |
| Staging     | Neon     | staging branch| `DATABASE_URL` in Amplify staging env vars   |
| Production  | Neon     | main branch   | `DATABASE_URL` in Amplify prod env vars      |
| ARMLS mirror| AWS RDS  | —             | Backlog P3-2, not yet active                 |

Never point local dev at production. Never seed or run ad-hoc queries on production without a migration.

---

## MIGRATION LOG

All migrations live in `packages/database/src/migrations/`. Applied by the migration runner which tracks state in `schema_migrations`.

| Migration File                  | Status         | Applied       | Tables Created / Modified               |
|---------------------------------|----------------|---------------|------------------------------------------|
| `001_initial_schema.sql`        | ✅ Applied all  | 2026-02-15    | Core schema, extensions                  |
| `002_agents.sql`                | ✅ Applied all  | 2026-02-15    | `agents`                                 |
| `003_listings.sql`              | ✅ Applied all  | 2026-02-18    | `listings` (placeholder)                 |
| `004_intake_tables.sql`         | ✅ Applied all  | 2026-02-20    | `intake_requests`, `intake_messages`, `intake_files`, `intake_status_log`, `intake_kpi_snapshots`, `intake_material_type` |
| `005_tenant_themes.sql`         | ⏳ Written, not run | —        | `tenant_themes`                          |
| `006_sphere.sql`                | ⏳ Backlog     | —             | sphere tables (P4-2)                     |
| `007_competitive_intel.sql`     | ⏳ Backlog     | —             | intel tables (P4-3)                      |
| `008_multi_tenant.sql`          | ⏳ Backlog     | —             | tenant hierarchy (P4-5)                  |
| ARMLS listings mirror           | 🚫 Blocked     | —             | RDS only, pending Spark approval         |

---

## SCHEMA REFERENCE

### `agents`
Platform users. All authenticated roles.

```sql
CREATE TABLE agents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL,          -- agent | designer | marketing_manager | executive | platform_admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Demo users (seeded):**
| Name        | Email              | Role                | Password |
|-------------|--------------------|--------------------|----------|
| Yong Choi   | yong@[domain]      | agent               | yong     |
| Lex Baum    | lex@[domain]       | marketing_manager   | lex      |
| David Kim   | david@[domain]     | executive           | david    |
| Marcus Webb | marcus@[domain]    | designer            | —        |

**Note:** Email domain is either `@platform.local` or `@demo.local` — check `auth.ts` to confirm which is active. They must match.

---

### `intake_requests`
Marketing request records.

```sql
CREATE TABLE intake_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  material_type    TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'submitted',
  is_rush          BOOLEAN NOT NULL DEFAULT false,
  brief            TEXT NOT NULL,
  notes            TEXT,
  requester_id     UUID NOT NULL REFERENCES agents(id),
  assigned_to      UUID REFERENCES agents(id),      -- designer or manager
  sla_deadline     TIMESTAMPTZ,
  feasibility_flag BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Valid statuses:** `draft` | `submitted` | `in_review` | `assigned` | `in_progress` | `awaiting_materials` | `completed` | `cancelled`

**Computed field (SQL only, not stored):**
```sql
sla_deadline IS NOT NULL
  AND sla_deadline < NOW()
  AND status NOT IN ('completed', 'cancelled')
AS sla_breached
```

---

### `intake_messages`
Chat messages per request.

```sql
CREATE TABLE intake_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES intake_requests(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES agents(id),
  content    TEXT NOT NULL,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intake_messages_request_id ON intake_messages(request_id);
CREATE INDEX idx_intake_messages_sent_at    ON intake_messages(sent_at);
```

---

### `intake_files`
File attachments per request.

```sql
CREATE TABLE intake_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES intake_requests(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  file_type   TEXT NOT NULL,         -- reference_image | deliverable | brief_doc
  uploaded_by UUID NOT NULL REFERENCES agents(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `intake_status_log`
Immutable audit trail of status transitions.

```sql
CREATE TABLE intake_status_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES intake_requests(id) ON DELETE CASCADE,
  from_status   TEXT,
  to_status     TEXT NOT NULL,
  changed_by    UUID NOT NULL REFERENCES agents(id),
  notes         TEXT,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `intake_kpi_snapshots`
Pre-computed KPI snapshots for executive dashboard performance.

```sql
CREATE TABLE intake_kpi_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date    DATE NOT NULL,
  open_count       INT NOT NULL DEFAULT 0,
  completed_mtd    INT NOT NULL DEFAULT 0,
  sla_compliance   NUMERIC(5,2),    -- percentage
  rush_active      INT NOT NULL DEFAULT 0,
  avg_turnaround   NUMERIC(6,2),    -- days
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_kpi_snapshot_date ON intake_kpi_snapshots(snapshot_date);
```

---

### `intake_material_type`
Lookup table for material types.

```sql
CREATE TABLE intake_material_type (
  id    SERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE
);
```

**Seeded values:** Flyer, Social Pack, Email Campaign, Video Script, Brochure, Report, Signage, Other

---

### `tenant_themes`
Per-tenant brand token storage. Powers the token editor (P2-6).

```sql
CREATE TABLE tenant_themes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  TEXT NOT NULL UNIQUE,
  theme_name TEXT NOT NULL DEFAULT 'Custom',
  tokens     JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Seeded tenants:**
| tenant_id         | theme_name              |
|-------------------|-------------------------|
| `russ-lyon`       | Russ Lyon Sotheby's     |
| `russ-lyon-dark`  | Dark Elegance           |
| `russ-lyon-modern`| Modern Professional     |

**Token keys in JSONB:**
`brand-primary`, `brand-primary-dark`, `brand-accent`, `brand-surface`, `brand-surface-alt`,
`brand-dark`, `brand-sidebar`, `brand-font-display`, `brand-font-body`, `brand-font-mono`,
`brand-radius`, `brand-glow-opacity`, `brand-card-blur`, `brand-sidebar-width`

---

### `schema_migrations`
Migration runner state tracking.

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## SEED SCRIPTS

| Script                                        | Purpose                                   | Safe to re-run? |
|-----------------------------------------------|-------------------------------------------|-----------------|
| `packages/database/src/seed-intake.ts`        | 20 requests, 4 agents, messages, files    | Yes (ON CONFLICT DO UPDATE/NOTHING) |

**Never run seed scripts against production.**

---

## COMMON QUERIES (Reference)

### Get all requests with designer name + SLA breach status
```sql
SELECT
  r.*,
  req.name  AS requester_name,
  des.name  AS designer_name,
  (
    r.sla_deadline IS NOT NULL
    AND r.sla_deadline < NOW()
    AND r.status NOT IN ('completed', 'cancelled')
  ) AS sla_breached
FROM intake_requests r
JOIN agents req ON req.id = r.requester_id
LEFT JOIN agents des ON des.id = r.assigned_to
ORDER BY r.created_at DESC;
```

### Get chat messages for a request
```sql
SELECT
  m.*,
  a.name AS sender_name,
  UPPER(LEFT(a.name, 2)) AS sender_initials
FROM intake_messages m
JOIN agents a ON a.id = m.sender_id
WHERE m.request_id = $1
ORDER BY m.sent_at ASC;
```

### SLA compliance (last 30 days)
```sql
SELECT
  COUNT(*) FILTER (
    WHERE sla_deadline IS NOT NULL
    AND updated_at >= sla_deadline
    AND status = 'completed'
  )::NUMERIC
  /
  NULLIF(COUNT(*) FILTER (WHERE status = 'completed'), 0)
  * 100 AS sla_compliance_pct
FROM intake_requests
WHERE created_at >= NOW() - INTERVAL '30 days';
```

---

*Update this file whenever a migration is written or applied, or when the schema changes.*
