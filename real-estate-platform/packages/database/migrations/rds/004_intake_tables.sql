-- 004_intake_tables.sql
-- Marketing intake module: adds role to agents, creates intake workflow tables

-- ── 1. Extend agents table ──────────────────────────────────────────────────
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'agent';

-- ── 2. intake_requests ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intake_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES agents(id),
  title         TEXT NOT NULL,
  material_type TEXT NOT NULL,
  brief         TEXT,
  due_date      DATE,
  is_rush       BOOLEAN NOT NULL DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'submitted',
  queue_number  SERIAL,
  assigned_to   UUID REFERENCES agents(id),
  sla_deadline  TIMESTAMPTZ,
  sla_breached  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. intake_messages (per-request chat) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS intake_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES intake_requests(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES agents(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. intake_files ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intake_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES intake_requests(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES agents(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. intake_status_log ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intake_status_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES intake_requests(id) ON DELETE CASCADE,
  old_status  TEXT,
  new_status  TEXT NOT NULL,
  changed_by  UUID NOT NULL REFERENCES agents(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6. intake_kpi_snapshots ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intake_kpi_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  open_requests     INT NOT NULL DEFAULT 0,
  avg_cycle_days    NUMERIC(6,2),
  sla_breach_count  INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 7. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_intake_requests_requester ON intake_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_intake_requests_assigned ON intake_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_intake_requests_status ON intake_requests(status);
CREATE INDEX IF NOT EXISTS idx_intake_messages_request ON intake_messages(request_id, created_at);
CREATE INDEX IF NOT EXISTS idx_intake_files_request ON intake_files(request_id);
CREATE INDEX IF NOT EXISTS idx_intake_status_log_request ON intake_status_log(request_id);

-- ── 8. Seed demo users ──────────────────────────────────────────────────────
-- Upsert three demo users for Phase 1
INSERT INTO agents (id, name, email, role, brokerage_name, tier, active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Yong Choi', 'yong@demo.local', 'agent', 'Russ Lyon Sothebys', 'premium', true),
  ('a0000000-0000-0000-0000-000000000002', 'Lex Baum', 'lex@demo.local', 'marketing_manager', 'Russ Lyon Sothebys', 'premium', true),
  ('a0000000-0000-0000-0000-000000000003', 'David Kim', 'david@demo.local', 'executive', 'Russ Lyon Sothebys', 'premium', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  active = EXCLUDED.active;
