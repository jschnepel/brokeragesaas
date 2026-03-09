# Phase 2 — Prompt 4: Views
# Claude Code — run from monorepo root: real-estate-platform/
# Build exactly what is specified. No alternatives. Flag blockers and continue.

---

## CONTEXT

Completed so far:
- P2-1: Tailwind v4, shadcn, token system, AppShell (Sidebar, TopBar)
- P2-2: shadcn themed, primitives (StatusBadge, RushBadge, SLAIndicator, KPITile, GlassCard, SectionHeader)
- P2-3: Feature components (RequestCard, NewRequestModal, CancelModal, RequestDetail, ProfileDrawer, ChatThread, ChatInput)

Do NOT touch:
- `components/IntakeUI.jsx` — behavioral reference, stays until Prompt 5
- `apps/premium-site`

---

## WHAT YOU ARE BUILDING

Replace the existing route pages with new views built on the component system. Each route page currently renders `<IntakeClient>` which lazy-loads `IntakeUI.jsx`. You are replacing those with proper view components.

**The existing routes stay at the same URLs.** Only the page content changes.

Views to build:
1. `AgentDashboard` — `/requests`
2. `ManagerDashboard` — `/triage`
3. `DesignerDashboard` — `/queue`
4. `ExecutiveDashboard` — `/reports`

Each view gets its own file in `components/views/`. Route pages import from there.

---

## READ FIRST

Before writing any code, read ALL of the following sections in `components/IntakeUI.jsx`. Use these as the behavioral spec — match the logic exactly, rebuild the UI with the new component system.

1. **`RequesterDashboard`** function — KPI tiles, active requests grid, completed/cancelled sections, new request button
2. **`ManagerDashboardHome`** function — the full 3-row layout you know well: charts row, KPI+capacity+triage row, messages+queue row
3. **`DesignerDashboardHome`** function — queue table with feasibility flags, assign controls
4. **`ExecutiveDashboardHome`** / reports view — KPI grid, charts
5. **`MOCK_REQUESTS`** constant — copy this entire constant verbatim into a new file `lib/mock-data.ts`
6. **`MOCK_MESSAGES`** or `UNIFIED_MESSAGES` constant — copy verbatim into `lib/mock-data.ts`
7. **`DESIGNER_ALL_REQUESTS`** constant — copy verbatim
8. **All other mock data constants** used by the dashboard views: `MMD_VOLUME_12W`, `MMD_SLA_TREND`, `MMD_MATERIAL_BREAKDOWN`, `MKTG_CAMPAIGNS`, `CAL_EVENTS`, `TURNAROUND_BY_TYPE`, `AGENT_TASKS`, `UNIFIED_MESSAGES`, `byDesigner` logic

Read carefully. The mock data is the only data source until Prompt 5.

---

## STEP 1 — Extract Mock Data

Create `lib/mock-data.ts`.

Copy ALL mock data constants from `IntakeUI.jsx` verbatim into this file. Export each one. This includes at minimum:

```ts
export const MOCK_REQUESTS = [ ... ]
export const UNIFIED_MESSAGES = [ ... ]
export const DESIGNER_ALL_REQUESTS = [ ... ]
export const MMD_VOLUME_12W = [ ... ]
export const MMD_SLA_TREND = [ ... ]
export const MMD_MATERIAL_BREAKDOWN = [ ... ]
export const MKTG_CAMPAIGNS = [ ... ]
export const CAL_EVENTS = [ ... ]
export const TURNAROUND_BY_TYPE = [ ... ]
export const AGENT_TASKS = [ ... ]
```

Also export any helper functions used across views:
```ts
export function slaCountdown(deadline: string | null, paused?: boolean): { label: string; urgent: boolean; paused: boolean }
```

If there are additional constants in IntakeUI.jsx that dashboards depend on, include them too.

---

## STEP 2 — AgentDashboard (`/requests`)

Create `components/views/AgentDashboard.tsx`.

```
Props:
  currentUser: { id: string; name: string; initials: string; role: string }
```

Behavioral spec: match `RequesterDashboard` in IntakeUI.jsx exactly.

Structure:
- AppShell wrapping the whole view with correct nav items for agent role (My Requests active)
- **New Request button** in TopBar actions — opens NewRequestModal
- **KPI row** — 4 KPITile components: Open Requests, Pending Review, Completed MTD, Rush Active
- **Active Requests section** — SectionHeader + grid of RequestCard (full variant), filtered to non-completed/cancelled from MOCK_REQUESTS for the current user. Clicking a card opens RequestDetail.
- **Completed section** — collapsible (default open), RequestCard grid, completed status only
- **Cancelled section** — collapsible (default open), RequestCard grid, cancelled status only
- NewRequestModal wired: `onSubmit` logs to console and closes modal (real submit in Prompt 5)
- CancelModal wired: opens from RequestCard cancel button, role='agent'
- RequestDetail wired: opens on card click, uses UNIFIED_MESSAGES filtered to that request id

Nav items for agent:
```ts
[
  { label: 'My Requests', href: '/requests', icon: ... },
]
```

---

## STEP 3 — ManagerDashboard (`/triage`)

Create `components/views/ManagerDashboard.tsx`.

```
Props:
  currentUser: { id: string; name: string; initials: string; role: string }
```

Behavioral spec: match `ManagerDashboardHome` in IntakeUI.jsx exactly. This is the complex 3-row layout. Rebuild it using the new component system.

**Row 1** — `1fr | 1fr` grid, alignItems stretch:
- Left column (flex column, gap 16):
  - Charts panel — shadcn Tabs (Volume 12W / SLA 6M / By Type), Recharts inside each tab. Import Recharts directly — it's already in `@platform/ui`. Use `MMD_VOLUME_12W`, `MMD_SLA_TREND`, `MMD_MATERIAL_BREAKDOWN`.
  - Needs Attention list — maxHeight 176px, scrollable. Color-coded left border: red=SLA breached, amber=unassigned. From DESIGNER_ALL_REQUESTS filtered to: slaBreached OR !designerName OR feasibilityFlag. Clicking opens RequestDetail.
- Right column:
  - Calendar panel — shadcn Tabs (My Calendar / Marketing Cal). My Calendar: MiniGrid (7-col date grid, dot indicators, CAL_EVENTS list). Marketing Cal: type filter chips + MKTG_CAMPAIGNS list with status badges.

**Row 2** — `260px | 200px | 1fr` grid, alignItems start:
- KPI 2×2 tiles (260px) — KPITile ×4: Open Requests, SLA Compliance, Rush Active, Completed MTD
- Designer Capacity (200px, height 200) — 2-col internal: designer rows left | avg turnaround right (180px panel, cream bg). From byDesigner derived from DESIGNER_ALL_REQUESTS.
- Quick Triage (1fr, height 200) — unassigned requests only, inline assign dropdown + approve/reject with undo

**Row 3** — `1fr | 456px` grid, alignItems stretch:
- Recent Messages (1fr, height 320) — UNIFIED_MESSAGES, filter tabs (All/Platform/Email/DM), avatar + channel icon + sender + subject + preview
- Active Queue (456px) — all open requests from DESIGNER_ALL_REQUESTS, 2-line compact rows (title + rush badge / designer + SLA), clicking opens RequestDetail

Nav items for marketing_manager:
```ts
[
  { label: 'Dashboard',        href: '/triage',          icon: ... },
  { label: 'Marketing Dashboard', href: '/triage/marketing', icon: ... },
  { label: 'Design Queue',     href: '/queue',           icon: ... },
  { label: 'Reports',          href: '/reports',         icon: ... },
]
```

Note: `/triage/marketing` is a stub for now — create `app/triage/marketing/page.tsx` that just renders "Marketing Dashboard — Coming Soon" inside the AppShell. The full MarketingManagerDashboard view from IntakeUI.jsx is out of scope for this prompt.

---

## STEP 4 — DesignerDashboard (`/queue`)

Create `components/views/DesignerDashboard.tsx`.

```
Props:
  currentUser: { id: string; name: string; initials: string; role: string }
```

Behavioral spec: match `DesignerDashboardHome` / `IntakeQueueTable` in IntakeUI.jsx.

Structure:
- AppShell with nav (Design Queue active)
- **Filter bar** — status filter chips (All / Submitted / Assigned / In Progress / Awaiting Materials), search input
- **Queue table** — use RequestCard compact=true for each row, or build a proper table using shadcn Table if that's cleaner. Columns: Title | Type | Requester | Designer | Status | SLA | Actions
- **Actions per row**: Assign designer dropdown (Lex Baum / Marcus Webb) + Feasibility flag toggle + View Details button
- Clicking View Details opens RequestDetail
- Filter chips filter the list client-side from DESIGNER_ALL_REQUESTS

Nav items for designer: same as marketing_manager minus Marketing Dashboard.

---

## STEP 5 — ExecutiveDashboard (`/reports`)

Create `components/views/ExecutiveDashboard.tsx`.

Behavioral spec: match `ExecutiveDashboardHome` in IntakeUI.jsx.

Structure:
- AppShell with nav (Reports active)
- KPI grid — 4 tiles: Total Requests MTD, SLA Compliance, Avg Turnaround, Rush Rate
- Charts section — two charts side by side: volume trend (line chart, MMD_VOLUME_12W) + material breakdown (bar or pie, MMD_MATERIAL_BREAKDOWN)
- Team health section — designer capacity (byDesigner data), turnaround by type
- Read-only. No modals, no actions.

---

## STEP 6 — Wire Route Pages

Replace the content of each route page. Keep the file, change what it renders.

### `app/requests/page.tsx`

```tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AgentDashboard } from '@/components/views/AgentDashboard';

export default async function RequestsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <AgentDashboard
      currentUser={{
        id: session.user.agentId,
        name: session.user.name ?? '',
        initials: (session.user.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        role: session.user.role,
      }}
    />
  );
}
```

### `app/triage/page.tsx`

```tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ManagerDashboard } from '@/components/views/ManagerDashboard';

export default async function TriagePage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'marketing_manager') redirect('/requests');

  return (
    <ManagerDashboard
      currentUser={{
        id: session.user.agentId,
        name: session.user.name ?? '',
        initials: (session.user.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        role: session.user.role,
      }}
    />
  );
}
```

### `app/queue/page.tsx`

```tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DesignerDashboard } from '@/components/views/DesignerDashboard';

export default async function QueuePage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (!['designer', 'marketing_manager'].includes(session.user.role)) redirect('/requests');

  return (
    <DesignerDashboard
      currentUser={{
        id: session.user.agentId,
        name: session.user.name ?? '',
        initials: (session.user.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        role: session.user.role,
      }}
    />
  );
}
```

### `app/reports/page.tsx`

```tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ExecutiveDashboard } from '@/components/views/ExecutiveDashboard';

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (!['executive', 'marketing_manager'].includes(session.user.role)) redirect('/requests');

  return (
    <ExecutiveDashboard
      currentUser={{
        id: session.user.agentId,
        name: session.user.name ?? '',
        initials: (session.user.name ?? 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        role: session.user.role,
      }}
    />
  );
}
```

### Root redirect `app/page.tsx`

```tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const role = session.user.role;
  if (role === 'marketing_manager') redirect('/triage');
  if (role === 'designer')          redirect('/queue');
  if (role === 'executive')         redirect('/reports');
  redirect('/requests');
}
```

---

## STEP 7 — Views Barrel

Create `components/views/index.ts`:

```ts
export { AgentDashboard }     from './AgentDashboard';
export { ManagerDashboard }   from './ManagerDashboard';
export { DesignerDashboard }  from './DesignerDashboard';
export { ExecutiveDashboard } from './ExecutiveDashboard';
```

---

## STEP 8 — Recharts Import

The monorepo has `@platform/ui` which already has recharts. Import Recharts in view components like this:

```ts
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
```

If that import path doesn't resolve, try:
```ts
import { ... } from '@platform/ui/recharts';
```

If neither works, install recharts directly in apps/platform:
```bash
pnpm add recharts
```

Use whichever resolves without error.

---

## STEP 9 — Verify

```bash
cd apps/platform
pnpm type-check
pnpm build
```

Then test all three logins manually in the browser:
- `yong` / `yong` → should land on `/requests`, see AgentDashboard
- `lex` / `lex` → should land on `/triage`, see ManagerDashboard
- `david` / `david` → should land on `/reports`, see ExecutiveDashboard

Report:
1. `pnpm type-check` — 0 errors?
2. `pnpm build` — 0 errors? How many routes compiled?
3. Does `yong` login → `/requests` → AgentDashboard with mock request cards?
4. Does `lex` login → `/triage` → ManagerDashboard with 3-row layout?
5. Does clicking a RequestCard open the RequestDetail sheet with mock chat?
6. Does New Request button open NewRequestModal?
7. Does `david` login → `/reports` → ExecutiveDashboard with charts?
8. Does the designer queue at `/queue` show the request table with filter chips?
9. Is `components/IntakeUI.jsx` still untouched?

---

## CONSTRAINTS

- All view components are `'use client'`
- Route pages are server components (async, use `auth()`) — views are client components imported into them
- Mock data only — no DB queries yet (Prompt 5)
- `components/IntakeUI.jsx` must remain completely untouched
- `IntakeClient.tsx` can stay — route pages simply stop using it
- If Recharts causes SSR errors in a client component, wrap the chart in a `dynamic` import with `{ ssr: false }` inside the view component
- The ManagerDashboard is the most complex — if Row 1 charts cause issues, stub them with placeholder divs first and note it in the report. Do not let chart issues block the rest of the layout.
- Keep all existing auth guards — redirect logic in route pages must stay correct
- If any view component exceeds ~400 lines, split sub-sections into files in `components/views/manager/` or similar subdirectory and import them

---

## WHAT SUCCESS LOOKS LIKE

```
apps/platform/
├── lib/
│   └── mock-data.ts              ✓ all constants extracted from IntakeUI.jsx
├── components/
│   └── views/
│       ├── AgentDashboard.tsx    ✓ KPIs, request cards, new/cancel/detail modals
│       ├── ManagerDashboard.tsx  ✓ 3-row layout, charts, calendar, triage, messages
│       ├── DesignerDashboard.tsx ✓ queue table, filter chips, assign controls
│       ├── ExecutiveDashboard.tsx ✓ KPIs, charts, team health
│       └── index.ts
└── app/
    ├── page.tsx                  ✓ role-based redirect
    ├── requests/page.tsx         ✓ renders AgentDashboard
    ├── triage/page.tsx           ✓ renders ManagerDashboard
    ├── triage/marketing/page.tsx ✓ stub
    ├── queue/page.tsx            ✓ renders DesignerDashboard
    └── reports/page.tsx          ✓ renders ExecutiveDashboard
```

All three logins hit the correct view. Mock data renders in every dashboard. IntakeUI.jsx untouched.

After this prompt, the new system is functionally equivalent to the Phase 1 prototype — same views, same behavior, built on the proper architecture. Prompt 5 replaces mock data with real Neon DB data and deletes IntakeUI.jsx.
