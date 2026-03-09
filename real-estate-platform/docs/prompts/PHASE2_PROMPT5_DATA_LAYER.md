# Phase 2 — Prompt 5: Data Layer
# Claude Code — run from monorepo root: real-estate-platform/
# Build exactly what is specified. No alternatives. Flag blockers and continue.

---

## CONTEXT

Completed so far:
- P2-1 through P2-4: Full component system built, all views rendering with mock data
- All 4 dashboards functional at `/requests`, `/triage`, `/queue`, `/reports`
- `lib/mock-data.ts` contains all typed constants extracted from IntakeUI.jsx

This is the final functional prompt. After this:
- Real Neon DB data replaces mock data
- Chat is live with real persistence + polling
- All three logins see real populated data
- `IntakeUI.jsx` and `IntakeClient.tsx` are deleted

---

## READ FIRST

Before writing any code, read:
1. `packages/database/src/schema.sql` — existing tables, understand the `pg` pool pattern and how pool is exported
2. `packages/database/src/migrations/004_intake_tables.sql` — the intake schema (intake_requests, intake_messages, intake_files, intake_status_log, intake_kpi_snapshots, intake_material_type). Note the exact column names — they differ from spec (see table below).
3. `apps/platform/auth.ts` — current demo users, note the email domain used (`@platform.local` or `@demo.local`)
4. `apps/platform/app/actions/intake.ts` — existing 9 server actions, understand their shape
5. `apps/platform/app/api/messages/[requestId]/route.ts` — existing polling endpoint

**Column name reference** (built names differ from original spec):

| Spec name              | Actual column name   |
|------------------------|----------------------|
| `intake_request`       | `intake_requests`    |
| `assigned_designer_id` | `assigned_to`        |
| `intake_request_message` | `intake_messages`  |
| `intake_request_step`  | `intake_status_log`  |
| `intake_request_asset` | `intake_files`       |
| `sender_agent_id`      | `sender_id`          |
| `changed_by_agent_id`  | `changed_by`         |

---

## STEP 1 — Fix Email Mismatch

The demo users in `auth.ts` use one email domain, but the `agents` table seed likely uses another. This causes logins to return null sessions.

Read `auth.ts` to find the exact domain used (likely `@platform.local`).
Read the agents seed in `packages/database/src/migrations/` or `schema.sql` to find what domain is seeded (likely `@demo.local`).

Fix whichever is wrong to make them match. The source of truth is the `agents` table — update `auth.ts` to use whatever domain is in the DB, or create a new migration that updates the agent emails.

**Do not change passwords.** Only fix the email domain so the lookup succeeds.

After fixing, document what the mismatch was and what you changed.

---

## STEP 2 — Run Migration

Run the intake tables migration against Neon. Read the connection string from the environment.

```bash
cd real-estate-platform
npx tsx packages/database/src/db-migrate.ts
```

If that script doesn't exist or fails, run the SQL directly:

```bash
cd real-estate-platform
npx tsx -e "
const { pool } = require('./packages/database/src/index');
const fs = require('fs');
const sql = fs.readFileSync('./packages/database/src/migrations/004_intake_tables.sql', 'utf8');
pool.query(sql).then(() => { console.log('Migration complete'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
"
```

Verify the tables exist:
```bash
npx tsx -e "
const { pool } = require('./packages/database/src/index');
pool.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'intake%'\").then(r => { console.log(r.rows); process.exit(0); });
"
```

Expected tables: `intake_requests`, `intake_messages`, `intake_files`, `intake_status_log`, `intake_kpi_snapshots`, `intake_material_type`.

---

## STEP 3 — Seed Script

Create `packages/database/src/seed-intake.ts`.

This script populates the DB with realistic demo data. Run it after migration.

The seed must create:

### Agents (verify they exist, insert if missing)
```
yong@[domain]   — role: agent,             name: Yong Choi
lex@[domain]    — role: marketing_manager, name: Lex Baum
david@[domain]  — role: executive,         name: David Kim
marcus@[domain] — role: designer,          name: Marcus Webb
```
Use `INSERT ... ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role` — safe to re-run.

### Material Types
Seed `intake_material_type` with: Flyer, Social Pack, Email Campaign, Video Script, Brochure, Report, Signage, Other

### Intake Requests (20 requests)
Distribute across all statuses. Use realistic luxury real estate titles:

```
1.  "16020 N Horseshoe Dr — Open House Flyer"          yong  submitted      standard  no designer
2.  "Desert Mountain Spring Social Pack"                yong  in_progress    standard  marcus
3.  "Q1 Market Report — Scottsdale Luxury"             yong  completed      standard  lex
4.  "Silverleaf Listing — Email Campaign"              yong  assigned       rush      marcus
5.  "7220 E Crimson Canyon — Brochure"                 yong  awaiting_materials standard lex
6.  "Estancia Club Social Pack"                        yong  in_review      rush      marcus
7.  "The Boulders Open House Signage"                  yong  cancelled      standard  null
8.  "DC Ranch Spring Mailer"                           yong  completed      standard  lex
9.  "Troon North Video Script"                         yong  submitted      rush      null
10. "Paradise Valley Estate — Brochure"                yong  in_progress    standard  marcus
11. "North Scottsdale Luxury Report Q2"                yong  completed      standard  lex
12. "Gainey Ranch Open House Flyer"                    yong  submitted      standard  null
13. "Whisper Rock Listing Social Pack"                 yong  assigned       rush      marcus
14. "McDowell Mountain Ranch Email"                    yong  in_review      standard  lex
15. "Pinnacle Peak Estate — Flyer"                     yong  completed      standard  marcus
16. "Desert Highlands Listing Brochure"                yong  in_progress    rush      marcus
17. "Arcadia Luxury Video Script"                      yong  awaiting_materials rush   lex
18. "Carefree Canyon Social Pack"                      yong  submitted      standard  null
19. "Scottsdale Waterfront Open House"                 yong  in_review      standard  marcus
20. "Moon Valley Estate — Email Campaign"              yong  cancelled      standard  null
```

Set `sla_deadline` to realistic values:
- submitted/assigned: now + 48h
- in_progress: now + 24h (some breached: now - 2h)
- in_review: now + 6h
- completed/cancelled: null

Set `created_at` to spread over the past 30 days.

### Intake Messages (6–8 per active request)
For requests 1–2, 4, 6, 9–10, 13–14, 16–17, 19: seed realistic back-and-forth messages.

Examples for request 2 ("Desert Mountain Spring Social Pack"):
```
yong  → "Hi, I need this for the Spring event on March 15th. Can we do 6 posts total?"
lex   → "Got it. Assigning to Marcus. Marcus, please confirm you can hit the 15th."
marcus → "Confirmed. Starting on the carousel post first. Will have a draft by EOD tomorrow."
yong  → "Perfect. I've uploaded reference photos to the files section."
marcus → "Received. One question — should we use the community's brand colors or Russ Lyon's?"
yong  → "Mix both. RL brand primary, Desert Mountain secondary."
marcus → "Makes sense. Draft coming tomorrow morning."
lex   → "Great. Yong, I'll notify you when the draft is ready for review."
```

Use realistic timestamps spread across the last 48h per request.

### Intake Status Logs
For each request with status beyond `submitted`, insert status transition log entries.

### Intake Files
For in_progress and review requests, insert 1–2 file records using Unsplash luxury real estate URLs:
```
https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800  (luxury exterior)
https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800  (pool/outdoor)
https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800  (modern home)
https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800  (interior)
https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800   (luxury kitchen)
```
Use `file_type: 'reference_image'`, `file_url` = unsplash URL, `file_name` = descriptive name.

### Run the seed
```bash
cd real-estate-platform
npx tsx packages/database/src/seed-intake.ts
```

Verify row counts:
```sql
SELECT 'agents' as t, count(*) FROM agents
UNION ALL SELECT 'intake_requests', count(*) FROM intake_requests
UNION ALL SELECT 'intake_messages', count(*) FROM intake_messages
UNION ALL SELECT 'intake_files', count(*) FROM intake_files
UNION ALL SELECT 'intake_status_log', count(*) FROM intake_status_log;
```

Expected: agents ≥4, requests=20, messages≥48, files≥10, status_log≥20.

---

## STEP 4 — Service Classes

Create `apps/platform/services/` with 4 service files.

### `apps/platform/services/RequestService.ts`

```ts
import { pool } from '@platform/database';

export interface IntakeRequest {
  id: string;
  title: string;
  materialType: string;
  status: string;
  isRush: boolean;
  brief: string;
  notes?: string;
  requesterId: string;
  requesterName: string;
  assignedTo?: string;
  designerName?: string;
  slaDeadline?: string;
  slaBreached: boolean;
  feasibilityFlag: boolean;
  createdAt: string;
  updatedAt: string;
  referenceFiles?: Array<{ url: string; name: string }>;
  lastMessage?: { preview: string; sentAt: string };
}

export class RequestService {
  static async getByRequester(agentId: string): Promise<IntakeRequest[]>
  static async getAll(): Promise<IntakeRequest[]>
  static async getById(id: string): Promise<IntakeRequest | null>
  static async create(data: { title: string; materialType: string; isRush: boolean; brief: string; notes?: string; requesterId: string; dueDate?: string }): Promise<IntakeRequest>
  static async assign(id: string, designerId: string, by: string): Promise<void>
  static async transition(id: string, newStatus: string, by: string, notes?: string): Promise<void>
  static async cancel(id: string, reason: string, by: string): Promise<void>
  static async setFeasibilityFlag(id: string, flagged: boolean, by: string): Promise<void>
}
```

Implement each method with direct `pool.query()` calls. The `getAll()` and `getByRequester()` queries should JOIN:
- `agents` on `requester_id` → `requesterName`
- `agents` on `assigned_to` → `designerName`
- subquery or lateral join on `intake_files` → `referenceFiles` (first 3)
- subquery on `intake_messages` → `lastMessage` (most recent)

`slaBreached` = `sla_deadline IS NOT NULL AND sla_deadline < NOW() AND status NOT IN ('completed','cancelled')`

### `apps/platform/services/MessageService.ts`

```ts
export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  content: string;
  sentAt: string;
}

export class MessageService {
  static async getByRequest(requestId: string): Promise<ChatMessage[]>
  static async send(requestId: string, senderId: string, content: string): Promise<ChatMessage>
}
```

`getByRequest` JOINs `agents` on `sender_id` to get `senderName`. Returns ordered by `sent_at ASC`.

### `apps/platform/services/AgentService.ts`

```ts
export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
}

export class AgentService {
  static async getById(id: string): Promise<Agent | null>
  static async getDesigners(): Promise<Agent[]>   // role = 'designer' OR role = 'marketing_manager'
  static async getAll(): Promise<Agent[]>
}
```

### `apps/platform/services/AnalyticsService.ts`

```ts
export class AnalyticsService {
  static async getKPIs(scope?: { agentId?: string }): Promise<{
    openCount: number;
    completedMTD: number;
    slaCompliance: number;  // percentage
    rushActive: number;
    avgTurnaroundDays: number;
  }>

  static async getVolumeByWeek(weeks: number): Promise<Array<{ week: string; submitted: number; completed: number }>>

  static async getByDesigner(): Promise<Array<{
    name: string;
    active: number;
    breached: number;
    avgDays: number;
  }>>

  static async getMaterialBreakdown(): Promise<Array<{ type: string; count: number }>>
}
```

Implement with real SQL. `slaCompliance` = requests completed on time / total completed * 100, last 30 days.

### `apps/platform/services/index.ts`

```ts
export { RequestService } from './RequestService';
export { MessageService } from './MessageService';
export { AgentService }   from './AgentService';
export { AnalyticsService } from './AnalyticsService';
```

---

## STEP 5 — Update Server Actions

Rewrite `apps/platform/app/actions/intake.ts` to use the service classes. Keep the same function signatures — views call these actions, not the services directly.

```ts
'use server';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { RequestService, MessageService } from '@/services';

export async function getRequests() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const role = session.user.role;
  if (role === 'agent') return RequestService.getByRequester(session.user.agentId);
  return RequestService.getAll();
}

export async function getRequestById(id: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  return RequestService.getById(id);
}

export async function createRequest(data: Parameters<typeof RequestService.create>[0]) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const result = await RequestService.create({ ...data, requesterId: session.user.agentId });
  revalidatePath('/requests');
  return result;
}

export async function assignRequest(id: string, designerId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  await RequestService.assign(id, designerId, session.user.agentId);
  revalidatePath('/triage');
  revalidatePath('/queue');
}

export async function transitionRequest(id: string, newStatus: string, notes?: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  await RequestService.transition(id, newStatus, session.user.agentId, notes);
  revalidatePath('/requests');
  revalidatePath('/triage');
  revalidatePath('/queue');
}

export async function cancelRequest(id: string, reason: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  await RequestService.cancel(id, reason, session.user.agentId);
  revalidatePath('/requests');
  revalidatePath('/triage');
}

export async function getMessages(requestId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  return MessageService.getByRequest(requestId);
}

export async function sendMessage(requestId: string, content: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  return MessageService.send(requestId, session.user.agentId, content);
}

export async function setFeasibilityFlag(id: string, flagged: boolean) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  await RequestService.setFeasibilityFlag(id, flagged, session.user.agentId);
  revalidatePath('/queue');
}
```

---

## STEP 6 — Wire Views to Live Data

Update each view component to use server actions instead of mock data.

**Pattern for each view:**

```tsx
'use client';
import { useEffect, useState, useTransition } from 'react';
import { getRequests, createRequest, cancelRequest, getMessages, sendMessage } from '@/app/actions/intake';

export function AgentDashboard({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getRequests().then(setRequests).finally(() => setLoading(false));
  }, []);

  // Pass real handlers to modals:
  const handleCreate = async (data) => {
    startTransition(async () => {
      await createRequest(data);
      const fresh = await getRequests();
      setRequests(fresh);
    });
  };

  const handleCancel = async (id, reason) => {
    startTransition(async () => {
      await cancelRequest(id, reason);
      const fresh = await getRequests();
      setRequests(fresh);
    });
  };
  // ...
}
```

**RequestDetail chat wiring:**
- On open: `getMessages(requestId)` → populate ChatThread
- Poll every 3 seconds while open: `setInterval(() => getMessages(requestId).then(setMessages), 3000)`
- Clear interval on close/unmount
- `onSend`: call `sendMessage(requestId, content)`, then refresh messages

**ManagerDashboard analytics wiring:**
- KPI tiles: call `getKPIs()` on mount from AnalyticsService via a new server action `getAnalyticsKPIs`
- Charts: call `getVolumeByWeek(12)`, `getMaterialBreakdown()` via new actions `getVolumeData`, `getMaterialData`
- Designer capacity: call `getByDesigner()` via new action `getDesignerCapacity`
- Add these analytics actions to `actions/intake.ts`

**DesignerDashboard wiring:**
- Load all requests via `getRequests()` (role=marketing_manager/designer gets all)
- Assign: call `assignRequest(id, designerId)` → refresh

**ExecutiveDashboard wiring:**
- KPIs: `getAnalyticsKPIs()`
- Charts: `getVolumeData()`, `getMaterialData()`
- All requests table: `getRequests()`

---

## STEP 7 — Update Polling API Route

The existing `app/api/messages/[requestId]/route.ts` handles GET (poll) and POST (send). Update it to use MessageService:

```ts
import { MessageService } from '@/services';

// GET — poll for new messages
export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const messages = await MessageService.getByRequest(params.requestId);
  return Response.json(messages);
}

// POST — send message
export async function POST(req, { params }) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { content } = await req.json();
  const message = await MessageService.send(params.requestId, session.user.agentId, content);
  return Response.json(message);
}
```

---

## STEP 8 — Delete Dead Code

Once all views are wired to live data and the build passes:

1. Delete `apps/platform/components/IntakeUI.jsx`
2. Delete `apps/platform/components/IntakeClient.tsx`
3. Delete `apps/platform/app/design-system/page.tsx` (optional — can keep as dev tool)
4. Remove any remaining imports of IntakeUI or IntakeClient from route pages

Run `pnpm type-check` after deletion to confirm no dangling imports.

---

## STEP 9 — Verify

```bash
cd apps/platform
pnpm type-check
pnpm build
```

Then test all three logins manually:

**Yong (agent):**
- Login → lands on `/requests`
- Sees real requests from DB (not mock data)
- Click a request card → RequestDetail opens with real chat messages
- Send a message → appears in thread within 3 seconds
- Create new request → appears in list
- Cancel a request → status updates

**Lex (marketing_manager):**
- Login → lands on `/triage`
- Sees real queue data, KPIs, designer capacity
- Assign a request → updates in queue
- Quick triage approve → status changes

**David (executive):**
- Login → lands on `/reports`
- Sees real KPIs computed from DB

Report:
1. `pnpm type-check` — 0 errors?
2. `pnpm build` — 0 errors? Route count?
3. Email mismatch — what was wrong, what was fixed?
4. Migration — which tables were created?
5. Seed — row counts for all 5 tables?
6. Do all 3 logins hit the correct dashboard?
7. Do real DB requests appear (not mock data)?
8. Does chat send + poll work for Yong?
9. Is `IntakeUI.jsx` deleted?

---

## CONSTRAINTS

- Service classes use `pool` from `@platform/database` — same pattern as existing schema.sql queries
- No Drizzle, no Prisma — raw `pool.query()` only
- Views call server actions, never services directly (keeps the server/client boundary clean)
- `useTransition` for mutations — keeps UI responsive during DB writes
- Polling interval must be cleared on component unmount — no memory leaks
- If a DB query fails, catch the error and fall back to empty array — never crash the view
- `slaBreached` is computed server-side in the SQL query, not client-side
- Do not add new npm packages in this prompt — everything needed is already installed
- If `@platform/database` pool import doesn't resolve from `apps/platform/services/`, check `tsconfig.json` paths and `package.json` workspace deps — `@platform/database` should already be in deps from Prompt 1

---

## WHAT SUCCESS LOOKS LIKE

```
apps/platform/
├── services/
│   ├── RequestService.ts    ✓ 8 methods, real SQL, JOINs agents + files + messages
│   ├── MessageService.ts    ✓ get + send, JOIN agents
│   ├── AgentService.ts      ✓ getById, getDesigners, getAll
│   ├── AnalyticsService.ts  ✓ KPIs, volume, byDesigner, materialBreakdown
│   └── index.ts
├── app/actions/intake.ts    ✓ 12 server actions, thin wrappers over services
├── components/views/        ✓ all 4 views wired to live data
└── [IntakeUI.jsx DELETED]   ✓
```

All 3 logins see real DB data. Chat persists and polls. New requests save. Status transitions work. The platform is a live functional system.
