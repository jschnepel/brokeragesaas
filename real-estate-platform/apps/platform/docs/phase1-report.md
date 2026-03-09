# Phase 1 — Working Prototype Report

> `apps/platform` | Marketing Intake Management System
> Generated: 2026-03-08

---

## Architecture Overview

```
apps/platform/                          Port 3002
├── auth.ts                             NextAuth v5, JWT, 3 demo users
├── middleware.ts                       Auth guard on all routes
├── next.config.js                      Turbopack, pg external
├── components/
│   ├── IntakeUI.jsx                    526 KB — full UI (mock data, recharts)
│   └── IntakeClient.tsx                Dynamic import wrapper (SSR: false)
├── app/
│   ├── layout.tsx                      Cormorant Garamond + DM Sans fonts
│   ├── page.tsx                        Role → redirect (agent→/requests, mgr→/triage, exec→/reports)
│   ├── providers.tsx                   SessionProvider
│   ├── login/page.tsx                  Branded login with demo hints
│   ├── requests/page.tsx               Agent view (auth-gated)
│   ├── triage/page.tsx                 Manager view (auth-gated)
│   ├── queue/page.tsx                  Designer view (auth-gated)
│   ├── reports/page.tsx                Executive view (auth-gated)
│   ├── actions/intake.ts              9 server actions (CRUD, KPIs, chat)
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── messages/[requestId]/route.ts   GET (polling) + POST
└── types/next-auth.d.ts               Session augmentation with role
```

---

## Dependencies (Resolved)

| Package | Declared | Resolved | Notes |
|---------|----------|----------|-------|
| `next` | ^16.1.6 | **16.1.6** | Matches premium-site |
| `react` | ^19.2.4 | **19.2.4** | Matches premium-site |
| `react-dom` | ^19.2.4 | **19.2.4** | Matches premium-site |
| `next-auth` | 5.0.0-beta.25 | **5.0.0-beta.25** | Beta — declares peer `next ^14‖^15`, works fine on 16 |
| `recharts` | ^2.15.3 | **2.15.4** | IntakeUI uses v2 API (PieChart, BarChart, LineChart) |
| `@platform/database` | workspace:* | link | Raw `pg` pool (max 5, SSL) |
| `@platform/shared` | workspace:* | link | Types + h3-js |
| `typescript` | ^5.3.3 | **5.9.3** | Strict mode, 0 type errors |

**Dev dependencies:** @types/node 20.19.33, @types/react 19.2.14, @types/react-dom 19.2.3

---

## Peer Dependency Status

| Package | Expects | Gets | Status |
|---------|---------|------|--------|
| next-auth 5.0.0-beta.25 | next ^14‖^15 | next 16.1.6 | **Warning** — works, beta hasn't declared v16 yet |
| recharts 2.15.4 | react ^16‖^17‖^18‖^19 | react 19.2.4 | **OK** |
| react-dom 19.2.4 | react 19.2.4 | react 19.2.4 | **OK** |

One pnpm warning (non-blocking): `next-auth 5.0.0-beta.25 ✕ unmet peer next@"^14.0.0-0 || ^15.0.0-0": found 16.1.6`

### Recharts Version Note

Two versions coexist in the monorepo lockfile — normal pnpm behavior:

| Consumer | Version | Why |
|----------|---------|-----|
| `apps/platform` | **2.15.4** | IntakeUI.jsx uses recharts v2 API |
| `packages/ui` | **3.7.0** | UI components use recharts v3 API |

No conflict — pnpm resolves independently per package.

---

## Auth System

| User | Login | Password | Role | UUID | Default Route |
|------|-------|----------|------|------|---------------|
| Yong Choi | `yong` | `yong` | `agent` | `a0000000-...-000000000001` | `/requests` |
| Lex Baum | `lex` | `lex` | `marketing_manager` | `a0000000-...-000000000002` | `/triage` |
| David Kim | `david` | `david` | `executive` | `a0000000-...-000000000003` | `/reports` |

- Strategy: JWT (no database sessions)
- Token carries: `id`, `role`
- Protected: everything except `/login`, `/api/auth/*`, static assets
- Custom sign-in page at `/login` with branded Russ Lyon UI and demo account hints

---

## Server Actions (9 exported functions)

Located in `app/actions/intake.ts`:

| Function | Auth | SQL | Returns |
|----------|------|-----|---------|
| `getRequests(filters?)` | No | SELECT + LEFT JOINs, optional WHERE on status/requester/assigned | `IntakeRequest[]` |
| `getRequestById(id)` | No | SELECT WHERE id | `IntakeRequest \| null` |
| `createRequest(data)` | Yes | INSERT + status log, computes SLA deadline (7d standard, 3d rush) | `IntakeRequest` |
| `updateRequestStatus(id, status)` | Yes | UPDATE + status log (old→new) | `IntakeRequest \| null` |
| `assignRequest(id, assigneeId)` | Yes | UPDATE assigned_to + auto-transition submitted→assigned | `IntakeRequest \| null` |
| `cancelRequest(id)` | Yes | Delegates to updateRequestStatus("cancelled") | `IntakeRequest \| null` |
| `getKPIs()` | No | 4 aggregate queries (open, avg cycle, breaches, completed) | `{ openRequests, avgCycleDays, slaBreachCount, completedCount }` |
| `getMessages(requestId)` | No | SELECT + JOIN agents, ordered ASC | `IntakeMessage[]` |
| `sendMessage(requestId, body)` | Yes | INSERT + fetch with sender name | `IntakeMessage` |

### Types

```typescript
interface IntakeRequest {
  id, requester_id, title, material_type, brief, due_date, is_rush,
  status, queue_number, assigned_to, sla_deadline, sla_breached,
  created_at, updated_at, requester_name?, assigned_name?
}

interface IntakeMessage {
  id, request_id, sender_id, body, created_at, sender_name?
}
```

---

## Chat API (REST, for polling)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/messages/[requestId]` | GET | Required | Fetch messages, optional `?after=ISO` for incremental polling |
| `/api/messages/[requestId]` | POST | Required | Send message `{ body }`, returns 201 with sender_name |

---

## Database Schema (004_intake_tables.sql)

**6 tables total** (1 altered, 5 new):

### agents (altered)

```sql
ALTER TABLE agents ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'agent';
```

### intake_requests

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `requester_id` | UUID | NOT NULL, REFERENCES agents(id) |
| `title` | TEXT | NOT NULL |
| `material_type` | TEXT | NOT NULL |
| `brief` | TEXT | nullable |
| `due_date` | DATE | nullable |
| `is_rush` | BOOLEAN | DEFAULT false |
| `status` | TEXT | DEFAULT 'submitted' |
| `queue_number` | SERIAL | auto-incremented |
| `assigned_to` | UUID | nullable, REFERENCES agents(id) |
| `sla_deadline` | TIMESTAMPTZ | nullable |
| `sla_breached` | BOOLEAN | DEFAULT false |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() |

### intake_messages

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `request_id` | UUID | NOT NULL, REFERENCES intake_requests(id) ON DELETE CASCADE |
| `sender_id` | UUID | NOT NULL, REFERENCES agents(id) |
| `body` | TEXT | NOT NULL |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |

### intake_files

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `request_id` | UUID | NOT NULL, REFERENCES intake_requests(id) ON DELETE CASCADE |
| `file_name` | TEXT | NOT NULL |
| `file_url` | TEXT | NOT NULL |
| `uploaded_by` | UUID | NOT NULL, REFERENCES agents(id) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |

### intake_status_log

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `request_id` | UUID | NOT NULL, REFERENCES intake_requests(id) ON DELETE CASCADE |
| `old_status` | TEXT | nullable |
| `new_status` | TEXT | NOT NULL |
| `changed_by` | UUID | NOT NULL, REFERENCES agents(id) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |

### intake_kpi_snapshots

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY |
| `snapshot_date` | DATE | DEFAULT CURRENT_DATE |
| `open_requests` | INT | DEFAULT 0 |
| `avg_cycle_days` | NUMERIC(6,2) | nullable |
| `sla_breach_count` | INT | DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |

### Indexes

```
idx_intake_requests_requester    ON intake_requests(requester_id)
idx_intake_requests_assigned     ON intake_requests(assigned_to)
idx_intake_requests_status       ON intake_requests(status)
idx_intake_messages_request      ON intake_messages(request_id, created_at)
idx_intake_files_request         ON intake_files(request_id)
idx_intake_status_log_request    ON intake_status_log(request_id)
```

### Seed Data

3 demo agents via UPSERT (`ON CONFLICT (email) DO UPDATE`):

| ID | Name | Email | Role |
|----|------|-------|------|
| `a0000000-...-000000000001` | Yong Choi | yong@demo.local | agent |
| `a0000000-...-000000000002` | Lex Baum | lex@demo.local | marketing_manager |
| `a0000000-...-000000000003` | David Kim | david@demo.local | executive |

**Migration status:** File created, **not yet executed** against Neon.

---

## IntakeUI Component Status

- **File:** `components/IntakeUI.jsx` (526 KB, ~8200 lines)
- **Directives:** `"use client"`, `// @ts-nocheck`, `/* eslint-disable */`
- **Canva:** All 3 `window.open("https://www.canva.com")` calls replaced with `void 0`
- **Data:** Currently uses hardcoded mock arrays (`MOCK_REQUESTS`, `DESIGNER_ALL_REQUESTS`, `INTAKE_QUEUE`)
- **Export:** `export default function MarketingIntakeApp()`
- **Charts:** recharts v2 (PieChart, BarChart, LineChart, ResponsiveContainer)
- **Type safety:** Bypassed via `.jsx` extension — strict TS doesn't check it
- **Key components inside:** RequesterDashboard, DesignerDashboard, ExecutiveView, ExecutiveSettings, RequestDetail (chat+assets+actions), NewRequestModal (3-step wizard), RevisionModal (canvas annotation), IntakeQueueTable, PersonalCalendar, SalesChartsTabs, and ~40 more sub-components

---

## Build & Type-Check Status

| Check | Result |
|-------|--------|
| `tsc --noEmit` (platform only) | **0 errors** |
| `next build` | **Success** — 8 routes, Turbopack, 3.3s compile |
| `pnpm install` | **Clean** — 1 expected peer warning |
| `pnpm type-check` (monorepo) | Platform passes; template-site has pre-existing error (unrelated) |

### Build Output

```
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/auth/[...nextauth]
├ ƒ /api/messages/[requestId]
├ ○ /login
├ ƒ /queue
├ ƒ /reports
├ ƒ /requests
└ ƒ /triage

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

---

## Deployment

### amplify.yml

- App root: `real-estate-platform/apps/platform`
- Pre-build: corepack enable, pnpm install --frozen-lockfile
- Build: pnpm build
- Artifacts: `.next/**/*`
- Cache: node_modules + .next/cache
- Required env vars: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`

### .env.local.example

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3002
```

---

## What's Wired vs. What Still Needs Wiring

| Feature | Status | Detail |
|---------|--------|--------|
| Auth flow | **Complete** | Login → JWT → role redirect |
| Route pages | **Complete** | 4 routes, all auth-gated |
| IntakeUI rendering | **Complete** | Pixel-perfect with mock data |
| Server actions | **Complete** | All 9 functions written, use @platform/database |
| Chat API | **Complete** | GET/POST with polling support |
| DB migration | **Created, not run** | 004_intake_tables.sql ready to execute |
| Mock → live data (Step 9) | **Not started** | IntakeUI needs `useEffect` calls to server actions |
| Polling chat (Step 10) | **Not started** | RequestDetail needs fetch loop to `/api/messages/[id]` |
| Amplify deploy | **Config created** | amplify.yml + .env.local.example ready |
