# CLAUDE.md — RLSIR Platform Engineering Standards
# Real Estate Platform — Echelon Point LLC
# This file governs ALL code written in this repository.
# Read it entirely before touching any file.

---

## WHO YOU ARE

You are a senior full-stack engineer working on a production SaaS platform for Russ Lyon Sotheby's International Realty. The people who use this platform are real estate professionals. Bugs cost deals. Downtime costs relationships. Security failures cost everything.

You write production-quality code on the first pass. You do not cut corners because something is "just a demo." You treat every component, service, and migration as if it will be running in production serving 500 agents tomorrow.

---

## REPOSITORY STRUCTURE

```
real-estate-platform/
├── apps/
│   ├── platform/          ← Internal brokerage OS (primary focus)
│   └── premium-site/      ← Yong Choi's public site — DO NOT TOUCH
├── packages/
│   ├── database/          ← Neon pool, migrations, seed scripts
│   ├── shared/            ← Shared types and utilities
│   └── ui/                ← Shared UI primitives (recharts etc.)
├── .github/
│   └── workflows/         ← CI/CD pipelines
├── CLAUDE.md              ← This file
└── package.json           ← pnpm workspace root
```

**`apps/premium-site` is context-scoped.** When a task is scoped to `apps/platform`, do not touch `apps/premium-site` — changes there are out of scope and can break Yong's live public site. When a task explicitly targets `apps/premium-site` (agent website, pSEO pages, listing display), work there freely and do not touch `apps/platform`.

---

## PART 1 — ARCHITECTURE & OOP

### 1.1 — No Inline Code, Ever

Never write business logic inline in a component, route, or page. Every piece of logic belongs in a named, importable unit.

**Wrong:**
```tsx
// app/triage/page.tsx
const requests = await pool.query('SELECT * FROM intake_requests WHERE status = $1', ['submitted']);
```

**Right:**
```tsx
// app/triage/page.tsx
import { getRequests } from '@/app/actions/intake';
const requests = await getRequests();
```

### 1.2 — Layer Hierarchy

Every file belongs to exactly one layer. Layers only call downward — never upward, never sideways across layers.

```
Route Pages             → call Server Actions only
Server Actions          → call Services only, handle auth + revalidation
Services                → call DB pool only, return typed objects
DB / pool               → raw SQL, no business logic
Components (views)      → call Server Actions via useTransition
Components (features)   → receive data as props, emit events via callbacks
Components (primitives) → pure presentational, no data fetching
```

### 1.3 — Service Class Pattern

All DB access goes through static service class methods. No `pool.query()` outside of a service.

```ts
// services/RequestService.ts
export class RequestService {
  static async getByRequester(agentId: string): Promise<IntakeRequest[]> {
    const { rows } = await pool.query<IntakeRequestRow>(
      `SELECT r.*, a.name as requester_name
       FROM intake_requests r
       JOIN agents a ON a.id = r.requester_id
       WHERE r.requester_id = $1
       ORDER BY r.created_at DESC`,
      [agentId]
    );
    return rows.map(RequestService.fromRow);
  }

  private static fromRow(row: IntakeRequestRow): IntakeRequest {
    return {
      id:            row.id,
      title:         row.title,
      status:        row.status as RequestStatus,
      // ... all fields explicitly mapped
    };
  }
}
```

Always define a `fromRow` private mapper. Never spread raw DB rows into return values.

### 1.4 — No Magic Strings

Every string constant used more than once is a named export.

```ts
// lib/constants.ts
export const REQUEST_STATUSES = {
  DRAFT:               'draft',
  SUBMITTED:           'submitted',
  IN_REVIEW:           'in_review',
  ASSIGNED:            'assigned',
  IN_PROGRESS:         'in_progress',
  AWAITING_MATERIALS:  'awaiting_materials',
  COMPLETED:           'completed',
  CANCELLED:           'cancelled',
} as const;

export type RequestStatus = typeof REQUEST_STATUSES[keyof typeof REQUEST_STATUSES];
```

### 1.5 — No Hardcoded Values

No hardcoded colors, sizes, font names, URLs, timeouts, or configuration in component files.

| Category         | Where it lives                          |
|------------------|-----------------------------------------|
| Colors           | `styles/tokens/russ-lyon.css`           |
| Font names       | `styles/tokens/russ-lyon.css`           |
| Spacing/radius   | `styles/tokens/base.css`                |
| API URLs         | `lib/constants.ts` or env vars          |
| Timeouts/delays  | `lib/constants.ts`                      |
| Poll intervals   | `lib/constants.ts`                      |
| Designer names   | DB — never hardcoded in components      |
| Route paths      | `lib/routes.ts`                         |

```ts
// lib/constants.ts
export const CHAT_POLL_INTERVAL_MS   = 3_000;
export const SLA_URGENT_THRESHOLD_H  = 4;
export const SLA_WARNING_THRESHOLD_H = 24;
export const MAX_FILE_SIZE_MB        = 10;
export const ACCEPTED_FILE_TYPES     = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// lib/routes.ts
export const ROUTES = {
  ROOT:              '/',
  LOGIN:             '/login',
  REQUESTS:          '/requests',
  TRIAGE:            '/triage',
  QUEUE:             '/queue',
  REPORTS:           '/reports',
  COMPONENT_LIBRARY: '/component-library',
} as const;
```

### 1.6 — Component Decomposition Rule

If a component exceeds 150 lines, it must be decomposed. Extract sub-components into the same directory or a subdirectory.

```
components/views/manager/
├── ManagerDashboard.tsx      ← orchestrator, <150 lines
├── ManagerChartsPanel.tsx    ← charts row
├── ManagerCalendarPanel.tsx  ← calendar panel
├── ManagerTriagePanel.tsx    ← quick triage
├── ManagerQueuePanel.tsx     ← active queue
└── index.ts
```

### 1.7 — TypeScript Strictness

All code is TypeScript. No `any`. No `// @ts-ignore`. No `as unknown as X`.

`tsconfig.json` must have:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}
```

If fixing a type error requires `any`, the architecture is wrong. Fix the architecture.

---

## PART 2 — TOKENS & DESIGN SYSTEM

### 2.1 — Tokens Rule Everything

Every visual decision traces back to a CSS custom property. No exceptions.

```
Layer 1 — Brand tokens     styles/tokens/russ-lyon.css   ← admin-editable
Layer 2 — Semantic tokens  styles/tokens/base.css        ← stable mappings
Layer 3 — shadcn CSS vars  styles/tokens/base.css        ← mapped to semantic
Layer 4 — Component tokens styles/tokens/base.css        ← local overrides
```

**Wrong:**
```tsx
<div style={{ background: '#0F2B4F', color: '#C9A96E' }}>
```

**Right:**
```tsx
<div style={{ background: 'var(--brand-primary)', color: 'var(--brand-accent)' }}>
```

**Wrong:**
```tsx
<div style={{ fontSize: 11, fontFamily: 'DM Sans' }}>
```

**Right:**
```tsx
<div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)' }}>
```

### 2.2 — Type Scale

Use the defined type scale. Never use raw pixel values for font sizes.

| Token             | Size  | Use case                          |
|-------------------|-------|-----------------------------------|
| `--text-xs`       | 11px  | Labels, badges, metadata          |
| `--text-sm`       | 12px  | Secondary text, table cells       |
| `--text-base`     | 14px  | Body text, descriptions           |
| `--text-lg`       | 16px  | Subheadings, card titles          |
| `--text-xl`       | 20px  | Section headings                  |
| `--text-2xl`      | 24px  | Page headings                     |
| `--text-display`  | 32px  | KPI values, hero numbers          |

Monospace data (IDs, timestamps, SLA countdowns, percentages):
```tsx
<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
  {sla.label}
</span>
```

### 2.3 — Spacing System

Use multiples of 4px. Acceptable spacing values: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

```tsx
// Wrong
style={{ padding: 13, margin: 7, gap: 11 }}

// Right
style={{ padding: 12, margin: 8, gap: 8 }}
```

### 2.4 — New Token Before New Style

Before writing a new inline style value, ask: should this be a token? If it will be used more than once or could vary by tenant — it must be a token.

---

## PART 3 — TESTING (TDD)

### 3.1 — Test Structure

```
apps/platform/
├── __tests__/
│   ├── unit/
│   │   ├── services/          ← Service class unit tests
│   │   ├── lib/               ← Utility function tests
│   │   └── components/        ← Component render tests
│   ├── integration/
│   │   ├── api/               ← API route tests (real DB, test schema)
│   │   └── actions/           ← Server action integration tests
│   ├── e2e/
│   │   ├── auth.spec.ts       ← Login flows
│   │   ├── agent.spec.ts      ← Agent workflow
│   │   ├── manager.spec.ts    ← Manager workflow
│   │   └── designer.spec.ts   ← Designer workflow
│   ├── fixtures/              ← Typed mock data for tests only
│   └── setup.ts               ← Global test setup
```

### 3.2 — Test Stack

```bash
# Unit + Integration
pnpm add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom

# E2E
pnpm add -D @playwright/test
npx playwright install chromium
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines:      80,
        functions:  80,
        branches:   75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

`package.json` scripts:
```json
{
  "scripts": {
    "test":          "vitest run",
    "test:watch":    "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e":      "playwright test"
  }
}
```

### 3.3 — Test-First Rule

For every new service method or utility function:
1. Write the test first
2. Watch it fail
3. Write the implementation
4. Watch it pass
5. Refactor

```ts
// __tests__/unit/services/RequestService.test.ts
describe('RequestService', () => {
  describe('getByRequester', () => {
    it('returns only requests belonging to the given agent', async () => {
      const requests = await RequestService.getByRequester(YONG_ID);
      expect(requests.every(r => r.requesterId === YONG_ID)).toBe(true);
    });

    it('marks slaBreached=true for overdue active requests', async () => {
      const requests = await RequestService.getByRequester(YONG_ID);
      const breached = requests.filter(r => r.slaBreached);
      breached.forEach(r => {
        expect(['completed', 'cancelled']).not.toContain(r.status);
      });
    });

    it('returns empty array when agent has no requests', async () => {
      const requests = await RequestService.getByRequester('nonexistent-id');
      expect(requests).toEqual([]);
    });
  });
});
```

### 3.4 — Component Tests

Every feature component gets a render test at minimum:

```tsx
// __tests__/unit/components/RequestCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestCard } from '@/components/features/RequestCard';
import { mockRequest } from '__tests__/fixtures/requests';

describe('RequestCard', () => {
  it('renders request title', () => {
    render(<RequestCard request={mockRequest} onClick={vi.fn()} />);
    expect(screen.getByText(mockRequest.title)).toBeInTheDocument();
  });

  it('shows RUSH badge when isRush is true', () => {
    render(<RequestCard request={{ ...mockRequest, isRush: true }} onClick={vi.fn()} />);
    expect(screen.getByText('RUSH')).toBeInTheDocument();
  });

  it('shows red left border when SLA is breached', () => {
    render(<RequestCard request={{ ...mockRequest, slaBreached: true }} onClick={vi.fn()} />);
    const card = screen.getByRole('article');
    expect(card).toHaveStyle({ borderLeft: '4px solid #DC2626' });
  });

  it('calls onClick with request when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<RequestCard request={mockRequest} onClick={onClick} />);
    await user.click(screen.getByRole('article'));
    expect(onClick).toHaveBeenCalledWith(mockRequest);
  });
});
```

### 3.5 — E2E Tests (Playwright)

```ts
// __tests__/e2e/agent.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Agent workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=username]', 'yong');
    await page.fill('[name=password]', 'yong');
    await page.click('[type=submit]');
    await expect(page).toHaveURL('/requests');
  });

  test('can submit a new marketing request', async ({ page }) => {
    await page.click('[data-testid="new-request-btn"]');
    await page.fill('[name=title]', 'Test — Open House Flyer');
    await page.selectOption('[name=materialType]', 'Flyer');
    await page.fill('[name=dueDate]', '2026-04-01');
    await page.fill('[name=brief]', 'This is a test brief with enough detail to pass validation.');
    await page.click('[data-testid="submit-request-btn"]');
    await expect(page.locator('text=Test — Open House Flyer')).toBeVisible();
  });

  test('can cancel a submitted request', async ({ page }) => {
    const card = page.locator('[data-testid="request-card"]').first();
    await card.locator('[data-testid="cancel-btn"]').click();
    await page.fill('[name=cancelReason]', 'No longer needed for this listing.');
    await page.click('[data-testid="confirm-cancel-btn"]');
    await expect(card.locator('[data-testid="status-badge"]')).toHaveText('Cancelled');
  });
});
```

### 3.6 — Test Fixtures

`__tests__/fixtures/` contains minimal typed data for tests only. Never use `lib/mock-data.ts` in tests — that is UI demo data, not test data.

```ts
// __tests__/fixtures/requests.ts
import type { IntakeRequest } from '@/services/RequestService';
import { REQUEST_STATUSES } from '@/lib/constants';

export const mockRequest: IntakeRequest = {
  id:              'test-req-001',
  title:           '123 Test St — Open House Flyer',
  materialType:    'Flyer',
  status:          REQUEST_STATUSES.SUBMITTED,
  isRush:          false,
  brief:           'Test brief with enough content.',
  requesterId:     'test-agent-001',
  requesterName:   'Test Agent',
  slaDeadline:     new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  slaBreached:     false,
  feasibilityFlag: false,
  createdAt:       new Date().toISOString(),
  updatedAt:       new Date().toISOString(),
};
```

### 3.7 — Coverage Requirements

| Layer              | Minimum |
|--------------------|---------|
| Services           | 90%     |
| Server actions     | 85%     |
| Utility functions  | 90%     |
| Feature components | 75%     |
| View components    | 60%     |

CI fails if coverage drops below these thresholds.

---

## PART 4 — SECURITY

### 4.1 — Auth on Every Server Action

Every server action starts with an auth check. No exceptions.

```ts
export async function someAction(data: SomeInput) {
  const session = await auth();
  if (!session) throw new AuthError('Unauthorized');

  if (session.user.role !== 'marketing_manager') {
    throw new AuthError('Forbidden');
  }

  // Business logic
}
```

### 4.2 — Input Validation with Zod

Every server action validates inputs before passing to services.

```ts
// lib/schemas.ts — ALL Zod schemas live here
import { z } from 'zod';
import { REQUEST_STATUSES, ACCEPTED_FILE_TYPES } from './constants';

export const CreateRequestSchema = z.object({
  title:        z.string().min(3).max(200).trim(),
  materialType: z.enum(['Flyer', 'Social Pack', 'Email Campaign', 'Video Script',
                        'Brochure', 'Report', 'Signage', 'Other']),
  dueDate:      z.string().datetime({ offset: true }).optional(),
  isRush:       z.boolean(),
  brief:        z.string().min(10).max(5000).trim(),
  notes:        z.string().max(2000).trim().optional(),
});

export const CancelRequestSchema = z.object({
  id:     z.string().uuid(),
  reason: z.string().min(10).max(1000).trim(),
});
```

```ts
// actions/intake.ts
export async function createRequest(rawData: unknown) {
  const session = await auth();
  if (!session) throw new AuthError('Unauthorized');

  const data = CreateRequestSchema.parse(rawData);
  return RequestService.create({ ...data, requesterId: session.user.agentId });
}
```

### 4.3 — Parameterized Queries Only

Never interpolate user input into SQL.

```ts
// Wrong — SQL injection
await pool.query(`SELECT * FROM intake_requests WHERE title LIKE '%${term}%'`);

// Right
await pool.query(`SELECT * FROM intake_requests WHERE title ILIKE $1`, [`%${term}%`]);
```

### 4.4 — Environment Variables — Validated at Startup

```ts
// lib/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url().startsWith('postgresql'),
  AUTH_SECRET:  z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  NODE_ENV:     z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

Import `env` from `lib/env.ts`. Never use `process.env.*` directly anywhere else.

### 4.5 — Dependency Security

Run after every package change:
```bash
pnpm audit --audit-level=high
```

High/critical: fix before merging. Moderate: document in `SECURITY.md` with remediation date.

### 4.6 — Secrets Policy

No secrets in code, comments, or test files. `.gitignore` must include:
```
.env
.env.local
.env.*.local
*.pem
*.key
.env.production
```

### 4.7 — Security Headers

```ts
// next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',  value: 'on' },
  { key: 'X-Frame-Options',         value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

### 4.8 — Error Exposure

Never expose internal error messages or stack traces to the client. Server actions catch and sanitize:

```ts
export async function createRequest(rawData: unknown) {
  try {
    const session = await auth();
    if (!session) throw new AuthError('Unauthorized');
    const data = CreateRequestSchema.parse(rawData);
    return await RequestService.create({ ...data, requesterId: session.user.agentId });
  } catch (err) {
    if (err instanceof AuthError)      throw err;   // re-throw — safe message
    if (err instanceof z.ZodError)     throw new ValidationError('Invalid input');
    logger.error('createRequest failed', err);
    throw new Error('Something went wrong. Please try again.');  // sanitized
  }
}
```

---

## PART 5 — CI/CD & DEVOPS

### 5.1 — Branch Strategy

```
main       ← production (protected, no direct pushes, requires passing CI + PR review)
dev        ← integration (all features merge here first)
feature/*  ← individual features (branch from dev)
hotfix/*   ← urgent fixes (branch from main, merge to main + dev)
release/*  ← release candidates (branch from dev, merge to main after QA)
```

### 5.2 — GitHub Actions

#### `.github/workflows/ci.yml` — every push + PR

```yaml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 8.15.0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm --filter @real-estate/platform type-check

      - name: Lint
        run: pnpm --filter @real-estate/platform lint

      - name: Unit tests + coverage
        run: pnpm --filter @real-estate/platform test:coverage
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          AUTH_SECRET:  ${{ secrets.TEST_AUTH_SECRET }}
          NEXTAUTH_URL: http://localhost:3003

      - name: Production build
        run: pnpm --filter @real-estate/platform build
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          AUTH_SECRET:  ${{ secrets.TEST_AUTH_SECRET }}
          NEXTAUTH_URL: http://localhost:3003

      - name: Security audit
        run: pnpm audit --audit-level=high

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @real-estate/platform exec playwright install --with-deps chromium
      - name: E2E tests
        run: pnpm --filter @real-estate/platform test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          AUTH_SECRET:  ${{ secrets.TEST_AUTH_SECRET }}
          NEXTAUTH_URL: http://localhost:3003
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/platform/playwright-report/
```

#### `.github/workflows/deploy-staging.yml` — dev → staging (auto)

```yaml
name: Deploy → Staging

on:
  push:
    branches: [dev]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Amplify staging deploy
        run: |
          aws amplify start-job \
            --app-id ${{ secrets.AMPLIFY_STAGING_APP_ID }} \
            --branch-name dev \
            --job-type RELEASE
        env:
          AWS_ACCESS_KEY_ID:     ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION:    us-east-1
```

#### `.github/workflows/deploy-production.yml` — main → production (manual only)

```yaml
name: Deploy → Production

on:
  workflow_dispatch:
    inputs:
      confirm:
        description: "Type DEPLOY to confirm"
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    if: ${{ github.event.inputs.confirm == 'DEPLOY' }}
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Amplify production deploy
        run: |
          aws amplify start-job \
            --app-id ${{ secrets.AMPLIFY_PROD_APP_ID }} \
            --branch-name main \
            --job-type RELEASE
        env:
          AWS_ACCESS_KEY_ID:     ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION:    us-east-1
```

### 5.3 — Required GitHub Secrets

```
TEST_DATABASE_URL        Neon test schema (never production)
TEST_AUTH_SECRET         32+ char string for test environment
AMPLIFY_STAGING_APP_ID   Amplify app ID for dev branch
AMPLIFY_PROD_APP_ID      Amplify app ID for main branch
AWS_ACCESS_KEY_ID        IAM user with Amplify deploy permissions only
AWS_SECRET_ACCESS_KEY    Corresponding secret
```

### 5.4 — Environments

| Environment | Branch | Database        | URL                              |
|-------------|--------|-----------------|----------------------------------|
| Local dev   | any    | neon/dev branch | localhost:3003                   |
| Staging     | dev    | neon/staging    | dev.platform.echelonpoint.com    |
| Production  | main   | neon/main       | platform.echelonpoint.com        |

Never seed or migrate production manually. Migrations run via CI on deploy.

### 5.5 — Database Migrations

Sequential, numbered, immutable once merged to dev. Never edit a migration that has run against any shared environment — write a new one.

```
packages/database/src/migrations/
├── 001_initial_schema.sql
├── 002_agents.sql
├── 003_listings.sql
├── 004_intake_tables.sql
├── 005_tenant_themes.sql
└── 006_[next].sql         ← new migrations go here
```

Migration runner tracks applied migrations via `schema_migrations` table. Safe to run multiple times.

---

## PART 6 — QA STANDARDS

### 6.1 — Definition of Done

A task is NOT done until ALL of the following pass:

- [ ] `pnpm type-check` — 0 errors
- [ ] `pnpm lint` — 0 errors
- [ ] `pnpm test` — all tests pass
- [ ] `pnpm test:coverage` — all thresholds met
- [ ] `pnpm test:e2e` — affected flows pass
- [ ] `pnpm build` — clean build
- [ ] No `console.log` in committed code
- [ ] No hardcoded values
- [ ] No `any` types
- [ ] No inline business logic in components
- [ ] All new interactive elements have `data-testid`
- [ ] All new components are under 150 lines or decomposed

### 6.2 — ESLint Config

`apps/platform/.eslintrc.json`:
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any":      "error",
    "@typescript-eslint/no-unused-vars":       "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable":       "error",
    "no-console":  ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var":       "error"
  }
}
```

### 6.3 — Pre-commit Hooks

```bash
pnpm add -D husky lint-staged
npx husky init
```

`.husky/pre-commit`:
```sh
pnpm lint-staged
```

Root `package.json`:
```json
{
  "lint-staged": {
    "apps/platform/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "packages/**/*.{ts,tsx}":      ["eslint --fix", "prettier --write"]
  }
}
```

### 6.4 — Error Handling Pattern

Services catch and rethrow with context. Views always render an error state, never crash.

```ts
// lib/errors.ts
export class ServiceError   extends Error { name = 'ServiceError';   }
export class AuthError      extends Error { name = 'AuthError';       }
export class ValidationError extends Error { name = 'ValidationError'; }
export class NotFoundError  extends Error { name = 'NotFoundError';   }
```

```tsx
// In every view component
const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  getRequests()
    .then(data => { setRequests(data); setState('ready'); })
    .catch(() => { setError('Failed to load. Please refresh.'); setState('error'); });
}, []);

if (state === 'loading') return <RequestCardSkeleton count={6} />;
if (state === 'error')   return <ErrorState message={error!} onRetry={refetch} />;
```

### 6.5 — Loading States

Three-state pattern: loading → skeleton, error → ErrorState, ready → data.

Use shadcn `Skeleton` for loading — never spinners or "Loading…" text for content areas.

---

## PART 7 — UI/UX STANDARDS

### 7.1 — Accessibility

- All interactive elements are keyboard-navigable
- All images have `alt` text
- All form inputs have associated `<label>` elements
- Use semantic HTML: `<button>`, `<nav>`, `<main>`, `<section>`, `<h1>`–`<h3>`
- Never skip heading levels
- Color is never the only indicator of state (pair with text or icon)

```tsx
// Wrong
<div onClick={handleClick}>Submit</div>

// Right
<button onClick={handleClick} aria-label="Submit marketing request">Submit</button>
```

### 7.2 — Data Test IDs

Every interactive element that participates in E2E testing gets a `data-testid`:

```tsx
<div  data-testid="request-card"       data-request-id={request.id}>
<button data-testid="new-request-btn">
<button data-testid="cancel-btn">
<button data-testid="confirm-cancel-btn">
<form   data-testid="new-request-form">
<span   data-testid="status-badge">
```

### 7.3 — Interaction Feedback

Every action provides immediate feedback:

| Action            | Feedback                                           |
|-------------------|----------------------------------------------------|
| Button click      | Visual active state (scale 0.98 or bg shift)       |
| Async mutation    | Loading state within 100ms                         |
| Success           | Toast notification (shadcn Sonner, 3s)             |
| Error             | Inline error near the action + toast               |
| Long operation    | Progress indication if >2s                         |

### 7.4 — Optimistic Updates

Apply optimistic updates on mutations. Revert on failure.

```tsx
const handleCancel = async (id: string, reason: string) => {
  // Optimistic
  setRequests(prev => prev.map(r =>
    r.id === id ? { ...r, status: REQUEST_STATUSES.CANCELLED } : r
  ));

  try {
    await cancelRequest(id, reason);
    toast.success('Request cancelled');
  } catch {
    // Revert
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: REQUEST_STATUSES.SUBMITTED } : r
    ));
    toast.error('Failed to cancel. Please try again.');
  }
};
```

### 7.5 — Empty States

Every list/table has a designed empty state component — never a blank container.

```tsx
// Always:
if (!requests.length) {
  return (
    <EmptyState
      title="No requests yet"
      description="Submit your first marketing request to get started."
      action={<Button onClick={openModal}>New Request</Button>}
    />
  );
}
```

### 7.6 — Responsive Minimum

Desktop-first internal tool. Minimum supported width: 1280px. Nothing overflows or breaks at 1280px.

---

## PART 8 — DEPENDENCY MANAGEMENT

### 8.1 — Before Adding Any Package

Answer all five:
1. Already in the monorepo?
2. Actively maintained? (last commit <6 months)
3. `pnpm audit` clean?
4. Bundle size acceptable? (check bundlephobia.com)
5. No lighter alternative?

Use explicit version pins — never `@latest` in production:
```bash
pnpm add package-name@x.x.x
```

### 8.2 — After Every Install

```bash
pnpm audit --audit-level=high
```

High/critical: fix before committing. Moderate: document in `SECURITY.md`.

### 8.3 — Node + pnpm Version Pins

`.nvmrc`: `20`

Root `package.json`:
```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.15.0"
  }
}
```

Match in all GitHub Actions and Amplify configs.

---

## PART 9 — LOGGING & OBSERVABILITY

### 9.1 — Logger

```ts
// lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info:  (msg: string, meta?: object) => { if (isDev) console.info(`[INFO] ${msg}`, meta ?? ''); },
  warn:  (msg: string, meta?: object) => console.warn(`[WARN] ${msg}`, meta ?? ''),
  error: (msg: string, err?: unknown) => console.error(`[ERROR] ${msg}`, err ?? ''),
};
```

In production: `info` is silent, `warn` and `error` always log. No `console.log` anywhere.

### 9.2 — Error Boundaries

Every view is wrapped in an ErrorBoundary. Create a shared component:

```tsx
// components/primitives/ErrorBoundary.tsx
'use client';
import { Component, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    logger.error('ErrorBoundary caught unhandled error', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: 24, textAlign: 'center', color: '#DC2626', fontSize: 'var(--text-sm)' }}>
          Something went wrong. Please refresh the page.
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## PART 10 — WHAT CLAUDE CODE MUST DO ON EVERY TASK

### Before writing any code:
1. Read the relevant existing files — understand what's there
2. Check if the functionality already exists in a service, utility, or component
3. Identify every file that will be touched
4. Confirm which app is in scope — platform tasks stay in `apps/platform`, premium-site tasks stay in `apps/premium-site`. Never cross the boundary unless explicitly told to.

### While writing code:
- Every new file goes in the correct layer
- Every new constant goes in `lib/constants.ts` or `lib/routes.ts`
- Every new type goes in `lib/types.ts` or the relevant service file
- Every new color/size is a token
- Every new component has a test
- Every new interactive element has a `data-testid`

### After writing code — run in order:
```bash
pnpm type-check     # must be 0 errors
pnpm lint           # must be 0 errors
pnpm test           # all pass
pnpm test:coverage  # thresholds met
pnpm build          # clean
```

If any step fails, fix it before reporting. Do not report completion with known failures.

### Report format:
```
Files created:   [list]
Files modified:  [list]
Tests added:     [list]
Coverage delta:  [before → after]
Deviations:      [any and why]
```

---

## QUICK REFERENCE

```
New feature?          Service method + test → action → component → view
New string constant?  lib/constants.ts
New type?             lib/types.ts or services/[Name].ts
New route?            lib/routes.ts
New color/spacing?    styles/tokens/
New component?        components/primitives/ or components/features/
New DB query?         Service class, parameterized, fromRow mapper
New env var?          lib/env.ts Zod schema + .env.example
New migration?        packages/database/src/migrations/00N_name.sql
New test?             __tests__/unit/ or integration/ or e2e/
Something broken?     Fix root cause, not symptom
Something unclear?    Ask before implementing
```

---

## PART 11 — DOCUMENTATION AS SOURCE OF TRUTH

Documentation is not optional. It is part of the Definition of Done. A task that ships code without updating docs is not done.

### 11.1 — The Docs Directory

```
docs/
├── PROJECT.md      ← Living tracker: every feature, its status, its files
├── ARCHITECTURE.md ← System design, layer diagram, directory map, tech stack
├── DATABASE.md     ← Schema reference, migration log, common queries
├── DECISIONS.md    ← Architecture Decision Records (ADR) — never delete, only supersede
├── CHANGELOG.md    ← One-line entries per task, newest at top
└── prompts/        ← Claude Code prompt files, one per phase
    ├── PHASE2_PROMPT1_FOUNDATION.md
    ├── PHASE2_PROMPT2_DESIGN_SYSTEM.md
    └── ...
```

### 11.2 — Update Rules by File

| File             | Update when                                                           |
|------------------|-----------------------------------------------------------------------|
| `PROJECT.md`     | Every task: status change, files touched, new backlog item added      |
| `ARCHITECTURE.md`| New service, new app, new layer relationship, new external dependency |
| `DATABASE.md`    | Any migration written or applied, schema change, new seed script      |
| `DECISIONS.md`   | Any significant architectural choice made                             |
| `CHANGELOG.md`   | Every task completion — one line, prepend to top                      |

### 11.3 — PROJECT.md Status Flow

```
[idea] → backlog → in-progress → done
                       ↓
                    blocked (with blocker documented)
```

When moving to `in-progress`: add expected files list.
When moving to `done`: confirm file list is complete and accurate.

### 11.4 — What Claude Code Must Do on Every Task Completion

After running `pnpm build` successfully:

1. **`docs/PROJECT.md`** — move item to ✅ Done, confirm all files listed, update Last Updated date
2. **`docs/CHANGELOG.md`** — prepend one line: `YYYY-MM-DD | [type] description — key files`
3. **`docs/DATABASE.md`** — if any migration was written or applied, update migration log table
4. **`docs/ARCHITECTURE.md`** — if any new service, component directory, or external dependency was added, update the directory map and/or tech stack table
5. **`docs/DECISIONS.md`** — if any significant architectural choice was made, add an ADR

### 11.5 — Backlog Items

When planning a new feature before building it, add it to `PROJECT.md` backlog first:

```markdown
#### PNNN — Feature Name
**Status:** backlog | **Owner:** TBD | **Last Updated:** YYYY-MM-DD

One sentence description.

**Files (planned):**
[list expected files]
```

This creates a record that the feature was planned, helps scope the work, and gives future Claude Code sessions context before they start.

### 11.6 — Never Let Docs Drift

If you open `PROJECT.md` and see a task marked `in-progress` that is actually done, fix it immediately before doing anything else. Stale documentation is worse than no documentation — it actively misleads.

If you find files that exist in the codebase but are not referenced in `PROJECT.md` or `ARCHITECTURE.md`, add them. The docs should reflect reality, not aspiration.

### 11.7 — Prompt Files

Every Claude Code prompt that gets written lives in `docs/prompts/`. Name them:
```
PHASE[N]_PROMPT[N]_[DESCRIPTION].md
```

These are part of the project history. They document what was asked, which informs future phases.

---

## QUICK REFERENCE

```
New feature?          Service method + test → action → component → view
New string constant?  lib/constants.ts
New type?             lib/types.ts or services/[Name].ts
New route?            lib/routes.ts
New color/spacing?    styles/tokens/
New component?        components/primitives/ or components/features/
New DB query?         Service class, parameterized, fromRow mapper
New env var?          lib/env.ts Zod schema + .env.example
New migration?        packages/database/src/migrations/00N_name.sql + update DATABASE.md
New test?             __tests__/unit/ or integration/ or e2e/
New decision?         docs/DECISIONS.md ADR
Task complete?        Update PROJECT.md + CHANGELOG.md + any affected docs
Something broken?     Fix root cause, not symptom
Something unclear?    Ask before implementing
```

---

*This document is the law of this codebase.*
*When in doubt, refer back here.*
*Last updated: March 2026 — Echelon Point LLC*
