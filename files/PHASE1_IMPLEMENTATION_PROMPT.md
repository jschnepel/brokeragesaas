# Phase 1 Implementation — Claude Code Prompt
# Run from the monorepo root: real-estate-platform/
# This prompt is prescriptive. Follow it exactly. Do not redesign the architecture.

---

## WHAT YOU ARE BUILDING

A working marketing intake platform for Russ Lyon Sotheby's International Realty.

**Demo users:**
- **Yong Choi** — Agent view (submits requests, tracks status, chats on own requests)
- **Lex Harmon** — Designer + Marketing Manager view (triages intake, manages queue, sees all requests, analytics)

**What "working" means for Phase 1:**
- Real data persisted to Neon Postgres
- Real threaded chat per request (SSE, no polling)
- Full request lifecycle: Submit → Triage → Assign → In Progress → Review → Approve → Complete → Cancel
- /lex analytics tools (Market Share, Data Explorer, Report Builder) running inside the platform
- Role-based views: Yong sees agent dashboard, Lex sees designer/manager dashboard
- Password-gated URL for Amplify sharing
- All data scoped to `tenant_id = '00000000-0000-0000-0000-000000000001'` (Yong's tenant)

---

## READ BEFORE WRITING ANYTHING

Read these files first. Do not skip this step.

```
real-estate-platform/apps/premium-site/
  app/(routes)/listings/actions.ts          ← Server Action pattern to follow
  app/(routes)/listings/page.tsx            ← Page pattern to follow
  next.config.js                            ← Existing config (do not break it)
  package.json                              ← Existing deps

real-estate-platform/packages/database/
  src/schema.sql                            ← Neon tables (9 existing)
  src/db.ts                                 ← pg pool — use this exact pattern
  src/migrations/                           ← Migration files — follow numbering

lex/src/
  components/                              ← All 47 components — read structure
  store/                                   ← 4 Zustand stores
  lib/                                     ← fileProcessor.ts, genericParser.ts, constants.ts
  App.tsx                                  ← Routing and top-level structure
  package.json                             ← Deps to add to premium-site
```

Also read:
- `real-estate-platform/apps/premium-site/app/layout.tsx` — root layout
- `real-estate-platform/apps/premium-site/app/(routes)/layout.tsx` — routes layout (if exists)
- `real-estate-platform/apps/premium-site/middleware.ts` — if exists
- `real-estate-platform/apps/backend/src/api/auth/` — NextAuth stub (understand what's there)

The intake UI prototype file (`IntakeUI.jsx` or `intake-ui.jsx`) should be present in the repo.
If not found, halt and report its absence — do not proceed without it.

---

## STEP 1 — DATABASE MIGRATION

Create file: `real-estate-platform/packages/database/src/migrations/004_intake_tables.sql`

Write the full SQL for these 10 tables targeting Neon Postgres. Follow the exact column naming and constraint patterns from `schema.sql` (UUID primary keys, `created_at TIMESTAMPTZ DEFAULT NOW()`, foreign keys with ON DELETE CASCADE where appropriate).

```
intake_material_type      -- seed with: Flyer, Social Pack, Report, Video, Brochure, Postcard
intake_sla_config         -- SLA hours per material_type_id + urgency level (standard/rush)
intake_request            -- core entity: tenant_id, agent_id, designer_id, material_type_id,
                          --   title, brief, mls_id, listing_address, due_date,
                          --   status (submitted|assigned|in_progress|awaiting_materials|
                          --           review|approved|completed|cancelled),
                          --   is_rush BOOLEAN, feasibility_flag (none|amber|red),
                          --   feasibility_note TEXT, cancel_reason TEXT,
                          --   cancelled_by (agent|manager), queue_number SERIAL
intake_request_step       -- status history: request_id, from_status, to_status,
                          --   changed_by_id, changed_by_name, note, created_at
intake_request_message    -- chat: request_id, author_id, author_name, author_role,
                          --   body TEXT, created_at
intake_request_asset      -- attachments: request_id, s3_key, filename, mime_type,
                          --   size_bytes, uploaded_by_id, url, created_at
intake_listing_cache      -- mls_id, address, list_price, status, bedrooms, bathrooms,
                          --   sqft, thumbnail_url, tenant_id, cached_at
intake_google_connection  -- user_id, access_token, refresh_token, token_expiry, scope,
                          --   tenant_id, created_at, updated_at
intake_sla_notification   -- request_id, type (warning|breached), sent_at, channel
intake_rush_fee_approval  -- request_id, fee_amount, requested_by_id, approved_by_id,
                          --   status (pending|approved|denied), created_at, resolved_at
```

Add seed data for `intake_material_type` and `intake_sla_config` at the bottom of the migration.

SLA defaults:
- Flyer: standard=48h, rush=24h
- Social Pack: standard=72h, rush=36h
- Report: standard=96h, rush=48h
- Video: standard=120h, rush=72h
- Brochure: standard=96h, rush=48h
- Postcard: standard=48h, rush=24h

Run migration after writing it:
```bash
tsx real-estate-platform/scripts/db-migrate.ts
# or whatever the existing migration command is — check scripts/ directory
```

---

## STEP 2 — DEMO AUTH (COOKIE-BASED ROLE SWITCHER)

No NextAuth. No Cognito. A demo login page with two buttons.

### 2a. Middleware

Create: `real-estate-platform/apps/premium-site/middleware.ts`

Logic:
1. If request path starts with `/intake` and cookie `intake_demo_role` is not set → redirect to `/intake/login`
2. If `INTAKE_PREVIEW_PASSWORD` env var is set and request has no `intake_access` cookie that matches → redirect to `/intake/login` first (password check happens on login page)
3. Pass through everything else

```typescript
// Protect all /intake/* routes
// Cookie: intake_demo_role = 'agent' | 'designer' | 'manager'
// Cookie: intake_access = hash of INTAKE_PREVIEW_PASSWORD (for URL gating)
// Public exceptions: /intake/login
```

### 2b. Login Page

Create: `real-estate-platform/apps/premium-site/app/(routes)/intake/login/page.tsx`

A clean, branded login page (navy background, gold accents — match IntakeUI design system):

**Password gate section** (shown if `INTAKE_PREVIEW_PASSWORD` is set):
- Single password input + "Enter" button
- On correct password → set `intake_access` cookie (7-day expiry) → show role picker

**Role picker section** (shown after password, or always if no password set):
- Two large clickable cards side by side:
  - **"Yong Choi — Agent"** (avatar placeholder, subtitle: "Submit and track marketing requests")
  - **"Lex Harmon — Designer & Manager"** (avatar placeholder, subtitle: "Manage the design queue and analytics")
- Clicking a card sets `intake_demo_role` cookie and redirects to `/intake`
- Bottom note: "Demo environment — all data is live but scoped to Russ Lyon Sotheby's prototype"

### 2c. Role Context

Create: `real-estate-platform/apps/premium-site/app/(routes)/intake/lib/role.ts`

Server-side helper:
```typescript
export type IntakeRole = 'agent' | 'designer' | 'manager';

export interface IntakeUser {
  role: IntakeRole;
  name: string;
  id: string;
  tenantId: string;
}

const DEMO_USERS: Record<IntakeRole, IntakeUser> = {
  agent: {
    role: 'agent',
    name: 'Yong Choi',
    id: 'agent-yong-choi',
    tenantId: '00000000-0000-0000-0000-000000000001',
  },
  designer: {
    role: 'designer',
    name: 'Lex Harmon',
    id: 'designer-lex-harmon',
    tenantId: '00000000-0000-0000-0000-000000000001',
  },
  manager: {
    role: 'manager',
    name: 'Lex Harmon',
    id: 'designer-lex-harmon',
    tenantId: '00000000-0000-0000-0000-000000000001',
  },
};

export async function getCurrentUser(cookies: ReadonlyRequestCookies): Promise<IntakeUser> {
  const role = (cookies.get('intake_demo_role')?.value ?? 'agent') as IntakeRole;
  return DEMO_USERS[role] ?? DEMO_USERS.agent;
}
```

---

## STEP 3 — INTAKE ROUTE STRUCTURE

Create this directory tree under `real-estate-platform/apps/premium-site/app/(routes)/intake/`:

```
intake/
  login/
    page.tsx                    ← Step 2b
  layout.tsx                    ← Sidebar nav + top bar (from IntakeUI design)
  page.tsx                      ← Role-based redirect: agent→/intake/requests, manager→/intake/triage
  requests/
    page.tsx                    ← Agent: My Requests grid (from IntakeUI RequesterDashboard)
    new/
      page.tsx                  ← Agent: New request form (from IntakeUI NewRequestModal)
    [id]/
      page.tsx                  ← Request detail + chat + assets (from IntakeUI RequestDetail)
  triage/
    page.tsx                    ← Manager: Intake triage queue (from IntakeUI IntakeQueueTable)
  queue/
    page.tsx                    ← Designer: Design queue (from IntakeUI DesignerDashboard)
  reports/
    page.tsx                    ← Operations overview (from IntakeUI ExecutiveView + BarChartPanel)
    designers/
      page.tsx                  ← Designer performance
    sla/
      page.tsx                  ← SLA compliance
  analytics/
    page.tsx                    ← Analytics landing (links to the 3 tools)
    market-share/
      page.tsx                  ← Lex Market Share Report (Step 5)
    explorer/
      page.tsx                  ← Lex Data Explorer (Step 5)
    builder/
      page.tsx                  ← Lex Report Builder (Step 5)
  feed/
    page.tsx                    ← Lyon's Den (from IntakeUI LyonsDenPage)
  directory/
    page.tsx                    ← Org chart + profile drawer (from IntakeUI OrgChartPage)
  lib/
    role.ts                     ← Step 2c
    db.ts                       ← Intake-specific DB queries (wraps @platform/database pool)
    actions.ts                  ← All Server Actions
    sla.ts                      ← SLA state computation helpers
    sse.ts                      ← SSE utilities
```

### layout.tsx

The intake layout wraps all intake pages. It:
- Reads `intake_demo_role` cookie to determine current user
- Renders the sidebar nav from IntakeUI (224px navy sidebar)
- Renders the top bar (breadcrumb + global search + date)
- Renders a role switcher badge in the sidebar footer showing current user + "Switch Role" link back to `/intake/login`
- Is a Server Component (reads cookies server-side) but renders the `IntakeShell` client component for interactive nav

---

## STEP 4 — INTAKEUI INTEGRATION

### 4a. Place the file

The IntakeUI prototype is a monolithic ~8,200 line self-contained React component.

Place it at: `real-estate-platform/apps/premium-site/app/(routes)/intake/IntakeUI.tsx`

Add `"use client"` as the first line.

### 4b. Create the dynamic wrapper

Create: `real-estate-platform/apps/premium-site/app/(routes)/intake/IntakeShell.tsx`

```typescript
"use client";
import dynamic from "next/dynamic";

const IntakeUI = dynamic(() => import("./IntakeUI"), {
  ssr: false,
  loading: () => <IntakeLoadingScreen />,
});

export default function IntakeShell() {
  return <IntakeUI />;
}
```

### 4c. Data bridge

The IntakeUI currently uses mock constants for all data. Do NOT refactor the entire component.
Instead, add a data bridge at the top of IntakeUI.tsx:

```typescript
// The window.__INTAKE_DATA__ bridge allows server-fetched data to be passed
// into the client component without prop-drilling through the monolith.
// Replace mock constants by checking this bridge first.
declare global {
  interface Window {
    __INTAKE_DATA__?: {
      requests?: IntakeRequest[];
      currentUser?: IntakeUser;
      designerQueue?: IntakeRequest[];
    };
  }
}
```

For Phase 1, pages that need real data pass it via a script tag in the page:
```typescript
// In page.tsx (server component):
const requests = await getRequests(user.tenantId, user.id, user.role);
// Inject into window before IntakeShell renders
```

This approach lets us replace mock data incrementally without rewriting the whole component.

---

## STEP 5 — /LEX ANALYTICS INTEGRATION

### 5a. Copy source files

```bash
# From repo root
cp -r lex/src/components real-estate-platform/apps/premium-site/app/(routes)/intake/analytics/_components
cp -r lex/src/store      real-estate-platform/apps/premium-site/app/(routes)/intake/analytics/_store
cp -r lex/src/lib        real-estate-platform/apps/premium-site/app/(routes)/intake/analytics/_lib
cp -r lex/src/assets     real-estate-platform/apps/premium-site/app/(routes)/intake/analytics/_assets
```

### 5b. Fix imports

After copying, update all relative imports in the copied files:
- `../lib/` → `./_lib/`
- `../store/` → `./_store/`
- `../components/` → `./_components/`
- Any Vite-specific imports (e.g. `import.meta.glob`) → Next.js equivalents

Vite glob imports for hero images: Replace `import.meta.glob('/assets/**')` with a static manifest or `require.context` equivalent. If complex, replace with a hardcoded image list for Phase 1.

### 5c. Create route pages

Each analytics page is a simple `"use client"` wrapper around the corresponding Lex component:

**`analytics/market-share/page.tsx`:**
```typescript
"use client";
import dynamic from "next/dynamic";
const MarketShareApp = dynamic(
  () => import("../_components/ChartView"),  // adjust to actual component
  { ssr: false }
);
export default function MarketSharePage() {
  return <MarketShareApp />;
}
```

Repeat for `explorer/page.tsx` (DataExplorer) and `builder/page.tsx` (ReportBuilder).

### 5d. Install missing deps

```bash
cd real-estate-platform
pnpm add --filter @real-estate/premium-site chart.js d3 d3-sankey xlsx html2canvas-pro jspdf jszip file-saver zustand
pnpm add --filter @real-estate/premium-site -D @types/d3 @types/d3-sankey @types/file-saver
```

Note: `recharts` is already in `@platform/ui` — no need to add separately.

### 5e. Analytics landing page

`analytics/page.tsx` — a simple server component with three large cards:
- Market Share Report (description: "Upload ARMLS market share CSV to generate branded competitive analysis")
- Data Explorer (description: "Load any CSV or XLSX to build custom charts")
- Report Builder (description: "Drag-and-drop report builder with 8 aggregation functions")

---

## STEP 6 — SERVER ACTIONS

Create: `real-estate-platform/apps/premium-site/app/(routes)/intake/lib/actions.ts`

Follow the exact pattern from `apps/premium-site/app/(routes)/listings/actions.ts`:
- `"use server"` directive
- Import pool from `@platform/database`
- Use parameterized queries (`$1`, `$2` etc.)
- Return typed objects, not raw QueryResultRow

Write these Server Actions. Each must be fully implemented — no stubs.

```typescript
// ── REQUESTS ──────────────────────────────────────────────────────────────────

// Get requests filtered by role:
//   agent → own requests only (WHERE agent_id = $1)
//   designer → assigned requests (WHERE designer_id = $1)
//   manager → all requests for tenant
export async function getRequests(tenantId: string, userId: string, role: IntakeRole)

// Get single request with messages, assets, and step history
export async function getRequestById(requestId: string, tenantId: string)

// Create new request (agent)
// Generates queue_number, creates first step log entry
export async function createRequest(data: CreateRequestInput, user: IntakeUser)

// Update request status (manager/designer)
// Writes to intake_request AND appends to intake_request_step
export async function updateRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  user: IntakeUser,
  note?: string
)

// Assign designer to request (manager)
export async function assignDesigner(
  requestId: string,
  designerName: string,
  user: IntakeUser
)

// Cancel request (agent can cancel submitted/assigned; manager can cancel any)
export async function cancelRequest(
  requestId: string,
  reason: string,
  user: IntakeUser
)

// ── MESSAGES ──────────────────────────────────────────────────────────────────

// Send chat message
export async function sendMessage(
  requestId: string,
  body: string,
  user: IntakeUser
)

// Get messages for a request (used by SSE stream on first connect)
export async function getMessages(requestId: string)

// ── REPORTS ───────────────────────────────────────────────────────────────────

// Operations KPIs: open count, completed this month, SLA compliance %, avg turnaround hours
export async function getOperationsKPIs(tenantId: string)

// Request volume by week for the last 12 weeks
export async function getRequestTrends(tenantId: string)

// Per-designer: assigned count, completed count, avg turnaround, SLA breach count
export async function getDesignerPerformance(tenantId: string)

// ── QUEUE ─────────────────────────────────────────────────────────────────────

// Intake queue: submitted requests not yet assigned, sorted by is_rush DESC, created_at ASC
export async function getIntakeQueue(tenantId: string)

// Feasibility flag (manager/designer)
export async function flagFeasibility(
  requestId: string,
  flag: 'none' | 'amber' | 'red',
  note: string,
  user: IntakeUser
)
```

### SLA helper

Create: `real-estate-platform/apps/premium-site/app/(routes)/intake/lib/sla.ts`

```typescript
// Use SQL CASE in queries — not a cron job
// Add this computed column to all intake_request queries:
export const SLA_STATE_SQL = `
  CASE
    WHEN ir.status IN ('completed', 'cancelled') THEN 'resolved'
    WHEN ir.due_date < NOW() THEN 'breached'
    WHEN ir.due_date < NOW() + INTERVAL '4 hours' THEN 'critical'
    WHEN ir.due_date < NOW() + INTERVAL '24 hours' THEN 'warning'
    ELSE 'on_track'
  END AS sla_state,
  EXTRACT(EPOCH FROM (ir.due_date - NOW())) / 3600 AS hours_remaining
`;
```

---

## STEP 7 — REAL-TIME CHAT (SSE)

### 7a. SSE Route Handler

Create: `real-estate-platform/apps/premium-site/app/api/intake/requests/[id]/stream/route.ts`

```typescript
// GET /api/intake/requests/[id]/stream
// Holds connection open via SSE
// Polls intake_request_message every 2 seconds for new messages
// Sends: data: { type: 'message', payload: IntakeMessage }\n\n
// Sends: data: { type: 'status', payload: { status, sla_state } }\n\n  (on any status change)
// Sends: data: { type: 'heartbeat' }\n\n  (every 30s to keep connection alive)
// Closes on client disconnect

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Verify role cookie before streaming
  // Set headers: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive
  // Poll DB every 2s, only send new messages (track last_seen_id)
  // Use ReadableStream with controller
}
```

### 7b. Client hook

Create: `real-estate-platform/apps/premium-site/app/(routes)/intake/lib/useRequestStream.ts`

```typescript
"use client";
// useRequestStream(requestId: string)
// Returns: { messages: IntakeMessage[], status: RequestStatus, slaState: SlaState }
// Uses EventSource, handles reconnect on error
// Merges SSE messages with initial messages from server
```

### 7c. Wire into request detail page

`/intake/requests/[id]/page.tsx` is a Server Component that:
1. Fetches initial request data + messages via `getRequestById()`
2. Passes them as props to `RequestDetailClient` (client component)
3. `RequestDetailClient` uses `useRequestStream` to receive live updates

---

## STEP 8 — PAGES (WIRE DATA TO VIEWS)

For each page, write a Server Component that fetches data and passes it to the appropriate IntakeUI view or a new client component.

### `/intake/page.tsx`
Server component. Read role cookie → redirect:
- `agent` → `/intake/requests`
- `designer` → `/intake/queue`
- `manager` → `/intake/triage`

### `/intake/requests/page.tsx`
Server component:
```typescript
const user = await getCurrentUser(cookies());
const requests = await getRequests(user.tenantId, user.id, user.role);
// Render RequesterDashboard with real requests
```

### `/intake/requests/[id]/page.tsx`
Server component → fetch request + messages → render RequestDetailClient with SSE hook

### `/intake/triage/page.tsx`
Server component → fetch intake queue → render IntakeQueueTable with real data

### `/intake/queue/page.tsx`
Server component → fetch designer queue → render DesignerDashboard with real data

### `/intake/reports/page.tsx`
Server component → fetch KPIs + trends → render ExecutiveView + BarChartPanel with real data

---

## STEP 9 — NEXT.CONFIG + DEPS

### Update `apps/premium-site/next.config.js`

Add only what's missing — do not remove anything existing:
```javascript
serverExternalPackages: ['pg', 'xlsx'],
images: {
  remotePatterns: [
    // keep existing
    { protocol: 'https', hostname: '*.s3.amazonaws.com' },
  ],
},
```

### Env vars needed

Add to `.env.local` for development and Amplify console for deployment:

```
INTAKE_PREVIEW_PASSWORD=changeme123
DATABASE_URL=                         # already set — Neon connection string
```

That's it for Phase 1. S3, Google OAuth, Pusher are Phase 2.

---

## STEP 10 — VERIFICATION CHECKLIST

Before declaring Phase 1 complete, verify each item works end-to-end:

- [ ] `/intake/login` renders, password gate works, both role cards render
- [ ] Selecting Yong redirects to `/intake/requests` showing agent view
- [ ] Selecting Lex redirects to `/intake/triage` showing manager view
- [ ] Yong can submit a new request → appears in DB → appears in Lex's triage queue
- [ ] Lex can approve a request from triage → status updates in DB → Yong sees updated status
- [ ] Lex can assign designer → queue_number and designer name persist
- [ ] Yong sends a chat message → Lex sees it appear in real time (SSE)
- [ ] Lex sends a reply → Yong sees it appear in real time (SSE)
- [ ] Cancel works from both sides → status = cancelled in DB
- [ ] `/intake/analytics/market-share` loads Lex Market Share tool, file upload works
- [ ] `/intake/analytics/explorer` loads Data Explorer, file upload works
- [ ] `/intake/reports` shows real KPIs from DB (not mock data)
- [ ] Role switcher in sidebar footer works (click → back to login → pick other role)
- [ ] `pnpm build --filter @real-estate/premium-site` passes with no errors

---

## CONSTRAINTS

- Follow existing code patterns exactly — pg pool from `@platform/database`, Server Actions from `listings/actions.ts`, page structure from existing routes.
- Do not introduce new ORMs, new state management libraries beyond Zustand (already in lex), or new routing libraries.
- Do not touch any existing routes (`/`, `/listings`, `/market`, etc.).
- Do not modify `@platform/database/src/schema.sql` — add `004_intake_tables.sql` only.
- IntakeUI.tsx — add `"use client"` and the data bridge. Nothing else.
- If you encounter an import error or missing dep, fix it. Do not stub it.
- Every Server Action must be fully implemented with real SQL — no `// TODO` placeholders.
- If the /lex Vite glob import for hero images is complex to port, replace with a static array of 4-6 hardcoded Unsplash luxury property image URLs for Phase 1. Note what you did.
- Run `pnpm type-check --filter @real-estate/premium-site` after completing each step.

Start with Step 1 (DB migration). Do not proceed to Step 2 until migration runs successfully.
