# CLAUDE.md — apps/platform
# Instructions for Claude Code operating in real-estate-platform/apps/platform/

---

## WHAT THIS APP IS

The Brokerage Operating System for Russ Lyon Sotheby's International Realty.
- Multi-role dashboard (agent, designer, marketing_manager, executive, platform_admin)
- Marketing intake workflow with chat
- Live token-based design system
- Tenant: `russ-lyon`

This app is deployed to AWS Amplify independently from `apps/premium-site`.

---

## ARCHITECTURE LAYERS

Strict layer discipline. Never skip a layer. Never import across layers in the wrong direction.

```
┌─────────────────────────────────────────────┐
│  Route Pages (app/*/page.tsx)               │  Server components. Auth guards. Pass session
│  — server components only                  │  to client views. No business logic here.
├─────────────────────────────────────────────┤
│  Views (components/views/)                  │  'use client'. Compose feature components.
│  — client components                       │  Call server actions. Manage local UI state.
├─────────────────────────────────────────────┤
│  Feature Components (components/features/)  │  'use client'. Props-driven. No data fetching.
│  — client components                       │  Emit callbacks upward to views.
├─────────────────────────────────────────────┤
│  Primitives (components/primitives/)        │  Pure presentational. No state. No side effects.
│  + shadcn (components/ui/)                 │  Only CSS vars and props.
├─────────────────────────────────────────────┤
│  Server Actions (app/actions/)              │  'use server'. Auth check. Call services.
│  — server only                             │  revalidatePath. Return serializable data.
├─────────────────────────────────────────────┤
│  Services (services/)                       │  Pure TypeScript classes. Static methods.
│  — server only                             │  pool.query() only. No Next.js imports.
├─────────────────────────────────────────────┤
│  Database (@platform/database)              │  Pool, migrations, seed scripts.
└─────────────────────────────────────────────┘
```

**Forbidden imports:**
- Views must NOT import from `services/` directly — go through `app/actions/`
- Primitives must NOT import from `features/` — dependencies only flow downward
- Services must NOT import from Next.js (`next/headers`, `next/cache`, etc.) — that belongs in actions
- Route pages must NOT contain business logic — delegate to views

---

## FILE STRUCTURE

```
apps/platform/
├── app/
│   ├── actions/           — Server actions (one file per domain)
│   │   ├── intake.ts      — Request, message, assignment actions
│   │   └── theme.ts       — Theme read/write actions
│   ├── api/               — API routes (polling endpoints only)
│   ├── (routes)/          — Page files, server components
│   └── layout.tsx         — ThemeProvider, font loading
├── components/
│   ├── ui/                — shadcn components (do not manually edit — override via tokens)
│   ├── primitives/        — StatusBadge, RushBadge, SLAIndicator, KPITile, etc.
│   ├── features/          — RequestCard, Modals, Chat, RequestDetail, ProfileDrawer
│   ├── views/             — AgentDashboard, ManagerDashboard, DesignerDashboard, ExecutiveDashboard
│   └── shell/             — AppShell, Sidebar, TopBar
├── lib/
│   ├── constants.ts       — ROLES, ROUTES, STATUS_LABELS, MATERIAL_TYPES, etc.
│   ├── mock-data.ts       — Demo data (used only if DB is unavailable)
│   ├── motion.ts          — Framer Motion presets
│   └── utils.ts           — cn(), slaCountdown(), formatDate(), etc.
├── services/
│   ├── RequestService.ts
│   ├── MessageService.ts
│   ├── AgentService.ts
│   ├── AnalyticsService.ts
│   ├── ThemeService.ts
│   └── index.ts
├── styles/
│   └── tokens/
│       ├── russ-lyon.css  — Layer 1: brand tokens (admin-editable)
│       ├── base.css       — Layer 2-4: semantic + shadcn + component tokens
│       └── dark.css       — Dark mode scaffold
└── types/
    ├── next-auth.d.ts
    └── index.ts           — Shared domain types (IntakeRequest, ChatMessage, Agent, etc.)
```

---

## CONSTANTS — lib/constants.ts

All repeating string literals live here. Import from here, never re-declare.

```ts
// Roles
export const ROLES = {
  AGENT:             'agent',
  DESIGNER:          'designer',
  MARKETING_MANAGER: 'marketing_manager',
  EXECUTIVE:         'executive',
  PLATFORM_ADMIN:    'platform_admin',
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];

// Request statuses
export const REQUEST_STATUS = {
  DRAFT:               'draft',
  SUBMITTED:           'submitted',
  IN_REVIEW:           'in_review',
  ASSIGNED:            'assigned',
  IN_PROGRESS:         'in_progress',
  AWAITING_MATERIALS:  'awaiting_materials',
  COMPLETED:           'completed',
  CANCELLED:           'cancelled',
} as const;
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

// Material types
export const MATERIAL_TYPES = [
  'Flyer',
  'Social Pack',
  'Email Campaign',
  'Video Script',
  'Brochure',
  'Report',
  'Signage',
  'Other',
] as const;
export type MaterialType = typeof MATERIAL_TYPES[number];

// Routes
export const ROUTES = {
  ROOT:              '/',
  LOGIN:             '/login',
  REQUESTS:          '/requests',
  TRIAGE:            '/triage',
  TRIAGE_MARKETING:  '/triage/marketing',
  QUEUE:             '/queue',
  REPORTS:           '/reports',
  COMPONENT_LIBRARY: '/component-library',
  DESIGN_SYSTEM:     '/design-system',
} as const;

// Tenant
export const TENANT_ID = 'russ-lyon';

// SLA defaults (hours)
export const SLA_HOURS = {
  STANDARD: 48,
  RUSH:     24,
} as const;

// Polling interval (ms)
export const CHAT_POLL_INTERVAL = 3000;

// Pagination
export const PAGE_SIZE = 20;

// Designer list (until AgentService is available client-side)
export const DESIGNERS = ['Lex Baum', 'Marcus Webb'] as const;
```

If you need a constant that isn't here, **add it here first**, then use it.

---

## DESIGN TOKENS — NEVER HARDCODE

The token cascade:
```
russ-lyon.css (Layer 1 — brand, admin edits this)
  → base.css (Layer 2 — semantic, never changes)
    → shadcn CSS vars (Layer 3 — auto-wired)
      → component tokens (Layer 4 — local overrides)
```

**In components, always use Layer 2+ tokens:**
```tsx
// ✗ Wrong — hardcoded hex
style={{ background: '#0F2B4F', color: '#C9A96E' }}

// ✗ Wrong — Layer 1 in components (bypasses semantic layer)
style={{ background: 'var(--brand-primary)' }}

// ✓ Right — semantic token
style={{ background: 'var(--color-primary)', color: 'var(--color-accent)' }}

// ✓ Also right — component token
style={{ borderRadius: 'var(--card-radius)' }}
```

**Exception:** Shell components (`Sidebar`, `TopBar`) may use `var(--brand-*)` directly because they ARE the brand surface. All other components use semantic tokens.

---

## SERVICE CLASS PATTERN

All services follow this exact pattern. No deviations.

```ts
// services/ExampleService.ts
import { pool } from '@platform/database';
import type { ExampleType } from '@/types';

export class ExampleService {
  // Static methods only — no instantiation
  static async getById(id: string): Promise<ExampleType | null> {
    const { rows } = await pool.query<ExampleType>(
      'SELECT * FROM example_table WHERE id = $1',
      [id]
    );
    return rows[0] ?? null;
  }

  static async create(data: CreateExampleInput): Promise<ExampleType> {
    const { rows } = await pool.query<ExampleType>(
      `INSERT INTO example_table (field_a, field_b)
       VALUES ($1, $2)
       RETURNING *`,
      [data.fieldA, data.fieldB]
    );
    return rows[0];
  }
}
```

Rules:
- Static methods only
- Always use parameterized queries (`$1`, `$2`) — never string interpolation
- Return typed results — define the return type explicitly
- `null` for not-found, never `undefined`
- Throw descriptive errors for business rule violations: `throw new Error('Request not found')`
- Never catch errors in services — let them bubble to the action layer

---

## SERVER ACTION PATTERN

```ts
// app/actions/example.ts
'use server';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { ExampleService } from '@/services';
import { ROUTES, ROLES } from '@/lib/constants';
import type { Role } from '@/lib/constants';

// Auth guard helper — use in every action
async function requireAuth(allowedRoles?: Role[]) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    throw new Error('Forbidden');
  }
  return session;
}

export async function getExample(id: string) {
  await requireAuth();
  return ExampleService.getById(id);
}

export async function createExample(data: CreateExampleInput) {
  const session = await requireAuth([ROLES.AGENT, ROLES.MARKETING_MANAGER]);
  const result = await ExampleService.create({ ...data, createdBy: session.user.agentId });
  revalidatePath(ROUTES.REQUESTS);
  return result;
}
```

---

## COMPONENT PATTERNS

### Primitive (no state, no side effects)
```tsx
// components/primitives/ExamplePrimitive.tsx
interface ExamplePrimitiveProps {
  value: string;
  variant?: 'default' | 'accent';
}

export function ExamplePrimitive({ value, variant = 'default' }: ExamplePrimitiveProps) {
  const color = variant === 'accent' ? 'var(--color-accent)' : 'var(--color-primary)';
  return (
    <span style={{ color, fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)' }}>
      {value}
    </span>
  );
}
```

### Feature Component (state allowed, no data fetching)
```tsx
// components/features/ExampleFeature.tsx
'use client';
import { useState } from 'react';
import { ExamplePrimitive } from '@/components/primitives';

interface ExampleFeatureProps {
  items: Item[];
  onSelect: (item: Item) => void;
}

export function ExampleFeature({ items, onSelect }: ExampleFeatureProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (item: Item) => {
    setSelected(item.id);
    onSelect(item);
  };

  return (
    <div>
      {items.map(item => (
        <ExamplePrimitive key={item.id} value={item.label} />
      ))}
    </div>
  );
}
```

### View (data fetching via actions, composes feature components)
```tsx
// components/views/ExampleView.tsx
'use client';
import { useEffect, useState, useTransition } from 'react';
import { getItems, createItem } from '@/app/actions/example';
import { ExampleFeature } from '@/components/features';
import { AppShell } from '@/components/shell';
import { ROUTES } from '@/lib/constants';

interface ExampleViewProps {
  currentUser: { id: string; name: string; role: string; initials: string };
}

export function ExampleView({ currentUser }: ExampleViewProps) {
  const [items, setItems]     = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getItems().then(setItems).finally(() => setLoading(false));
  }, []);

  const handleCreate = (data: CreateItemInput) => {
    startTransition(async () => {
      await createItem(data);
      const fresh = await getItems();
      setItems(fresh);
    });
  };

  return (
    <AppShell
      sidebarItems={NAV_ITEMS}
      user={currentUser}
      topBarTitle="Example"
    >
      <ExampleFeature items={items} onSelect={() => {}} />
    </AppShell>
  );
}
```

---

## TESTING

See root `CLAUDE.md` for full TDD rules. Platform-specific additions:

### Test a service method — always mock the pool
```ts
vi.mock('@platform/database', () => ({
  pool: { query: vi.fn() }
}));
```

### Test a server action — mock the service
```ts
vi.mock('@/services', () => ({
  RequestService: { getByRequester: vi.fn() }
}));
vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { agentId: 'agent-1', role: 'agent' } })
}));
```

### Never test implementation details
Test what a component or function does, not how it does it internally.

```ts
// ✗ Wrong — testing implementation
expect(component.state.isOpen).toBe(true);

// ✓ Right — testing behavior
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

---

## ENVIRONMENT VARIABLES

All required env vars — never access `process.env` directly in components or services. Use a central config:

```ts
// lib/config.ts
export const config = {
  databaseUrl:  process.env.DATABASE_URL!,
  authSecret:   process.env.AUTH_SECRET!,
  nextauthUrl:  process.env.NEXTAUTH_URL!,
  nodeEnv:      process.env.NODE_ENV ?? 'development',
  tenantId:     process.env.TENANT_ID ?? TENANT_ID,
} as const;
```

If a required var is missing, fail loudly at startup, not silently at runtime.

---

## WHAT NOT TO DO

- ❌ Don't write raw SQL in components, views, or actions
- ❌ Don't hardcode colors, sizes, or strings inline
- ❌ Don't add `console.log` (use proper error throwing/catching)
- ❌ Don't create a new constant file — add to `lib/constants.ts`
- ❌ Don't add a new utility — add to `lib/utils.ts`
- ❌ Don't bypass the action layer from views
- ❌ Don't use `any` — define the type
- ❌ Don't write a feature without a test
- ❌ Don't touch `apps/premium-site`
- ❌ Don't commit `.env.local` or secrets

---

## VERIFY BEFORE DONE

```bash
pnpm type-check   # 0 errors
pnpm test         # 0 failures
pnpm build        # 0 errors, all routes compile
```

All three must pass. A task is not complete until all three are green.
