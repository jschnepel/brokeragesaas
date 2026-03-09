# ARCHITECTURE.md — System Design Reference
# Real Estate Platform — Echelon Point LLC
# Update when: new services added, layer relationships change, new apps join the monorepo
# Last Updated: 2026-03-09

---

## MONOREPO STRUCTURE

```
real-estate-platform/
├── apps/
│   ├── platform/          Port 3003 — Internal Brokerage OS
│   └── premium-site/      Port 3001 — Yong Choi's public agent website
├── packages/
│   ├── database/          @platform/database — Neon pool + migrations
│   ├── shared/            @platform/shared — shared types + utilities
│   └── ui/                @platform/ui — shared UI (recharts)
├── docs/                  This directory — source-of-truth documentation
├── .github/workflows/     CI/CD pipelines
├── CLAUDE.md              Engineering standards (law of the codebase)
├── package.json           pnpm workspace root
└── pnpm-workspace.yaml
```

**Build system:** pnpm 8.15.0 + Turborepo 1.11.2
**Node version:** 20 (pinned in .nvmrc and engines field)

---

## apps/platform — Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Route Pages    /app/**                                  │
│  (server components, auth check, pass session to views) │
├─────────────────────────────────────────────────────────┤
│  Server Actions  /app/actions/                           │
│  (auth check, Zod validation, revalidatePath)           │
├─────────────────────────────────────────────────────────┤
│  Services        /services/                              │
│  (DB queries, fromRow mappers, typed return values)     │
├─────────────────────────────────────────────────────────┤
│  Database        @platform/database (pool.query)         │
│  Neon serverless Postgres                               │
└─────────────────────────────────────────────────────────┘

         ↑ Layers only call downward ↑

┌─────────────────────────────────────────────────────────┐
│  View Components    /components/views/                   │
│  (useEffect + server actions, no direct DB)             │
├─────────────────────────────────────────────────────────┤
│  Feature Components /components/features/               │
│  (props in, callbacks out, no data fetching)            │
├─────────────────────────────────────────────────────────┤
│  Primitive Components /components/primitives/           │
│  (pure presentational, token-based styling)             │
└─────────────────────────────────────────────────────────┘
```

---

## apps/platform — Directory Map

```
apps/platform/
├── __tests__/
│   ├── unit/services/        Service class unit tests
│   ├── unit/components/      Component render tests
│   ├── integration/actions/  Server action integration tests
│   ├── e2e/                  Playwright flows
│   ├── fixtures/             Test-only typed mock data
│   └── setup.ts
├── app/
│   ├── actions/
│   │   ├── intake.ts         12 server actions — intake flow
│   │   └── theme.ts          3 server actions — theme management
│   ├── api/
│   │   └── messages/[requestId]/route.ts  Chat polling (GET + POST)
│   ├── component-library/page.tsx         Token editor + component preview
│   ├── design-system/page.tsx             Dev component gallery
│   ├── login/page.tsx
│   ├── queue/page.tsx                     → DesignerDashboard
│   ├── reports/page.tsx                   → ExecutiveDashboard
│   ├── requests/page.tsx                  → AgentDashboard
│   ├── triage/page.tsx                    → ManagerDashboard
│   ├── globals.css
│   ├── layout.tsx                         ThemeProvider wraps children
│   ├── page.tsx                           Role-based redirect
│   └── providers.tsx                      SessionProvider
├── components/
│   ├── features/
│   │   ├── chat/
│   │   │   ├── ChatThread.tsx
│   │   │   └── ChatInput.tsx
│   │   ├── CancelModal.tsx
│   │   ├── NewRequestModal.tsx
│   │   ├── ProfileDrawer.tsx
│   │   ├── RequestCard.tsx
│   │   ├── RequestDetail.tsx
│   │   ├── TokenEditor.tsx             ← P2-6
│   │   └── index.ts
│   ├── primitives/
│   │   ├── ErrorBoundary.tsx
│   │   ├── EmptyState.tsx
│   │   ├── GlassCard.tsx
│   │   ├── KPITile.tsx
│   │   ├── RushBadge.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── SLAIndicator.tsx
│   │   ├── StatusBadge.tsx
│   │   └── index.ts
│   ├── shell/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── index.ts
│   ├── ui/                             17 shadcn canary components
│   ├── views/
│   │   ├── AgentDashboard.tsx
│   │   ├── DesignerDashboard.tsx
│   │   ├── ExecutiveDashboard.tsx
│   │   ├── ManagerDashboard.tsx
│   │   └── index.ts
│   └── ThemeProvider.tsx               ← P2-6
├── lib/
│   ├── constants.ts                    All magic strings + numeric constants
│   ├── env.ts                          Zod-validated env vars
│   ├── errors.ts                       ServiceError, AuthError, ValidationError, NotFoundError
│   ├── logger.ts                       info/warn/error logger
│   ├── mock-data.ts                    UI demo data (not used in tests)
│   ├── motion.ts                       Framer Motion presets
│   ├── routes.ts                       ROUTES constant map
│   ├── schemas.ts                      All Zod validation schemas
│   └── types.ts                        Shared TypeScript types
├── services/
│   ├── AgentService.ts
│   ├── AnalyticsService.ts
│   ├── MessageService.ts
│   ├── RequestService.ts
│   ├── ThemeService.ts                 ← P2-6
│   └── index.ts
├── styles/tokens/
│   ├── russ-lyon.css                   Layer 1 brand tokens (admin-editable)
│   ├── base.css                        Layers 2–4
│   └── dark.css                        Dark mode scaffold
├── auth.ts
├── middleware.ts                        Auth guard + role-based routing
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## DATA FLOW

### Request Lifecycle

```
Agent submits request
        ↓
NewRequestModal → createRequest() server action
        ↓
Zod validation → RequestService.create() → INSERT intake_requests
        ↓
revalidatePath('/requests') + revalidatePath('/triage')
        ↓
Manager sees it in ManagerDashboard → assignRequest() → UPDATE assigned_to
        ↓
Designer sees it in DesignerDashboard → transitionRequest('in_progress')
        ↓
Chat back-and-forth via MessageService (GET/POST /api/messages/[id])
        ↓
Designer transitions: in_progress → in_review → completed
        ↓
Status log entries written at every transition (intake_status_log)
```

### Auth Flow

```
User visits any route
        ↓
middleware.ts checks session
        ↓
No session → redirect /login
        ↓
CredentialsProvider → lookup by email in agents table
        ↓
Session: { agentId, role, name, email }
        ↓
page.tsx checks role → redirect to correct dashboard
```

### Theme Flow

```
App boots → layout.tsx (server)
        ↓
ThemeService.getTheme('russ-lyon') → Neon DB
        ↓
ThemeProvider injects CSS vars as <style> tag in <head>
        ↓
All components read vars via var(--brand-primary) etc.
        ↓
Admin visits /component-library → Edit Theme
        ↓
TokenEditor onChange → write <style> override in-page → live preview
        ↓
Admin clicks Save → saveTheme() action → ThemeService.saveTheme() → UPDATE tenant_themes
        ↓
Next page load picks up new theme from DB
```

---

## TECH STACK

| Layer          | Technology                        | Version    | Notes                            |
|----------------|-----------------------------------|------------|----------------------------------|
| Framework      | Next.js                           | 16.1.6     | App Router, server components    |
| Language       | TypeScript                        | 5.x        | strict mode                      |
| Styling        | Tailwind CSS                      | 4.2.1      | v4 CSS-first config              |
| Components     | shadcn/ui canary                  | 4.0.2      | new-york style, navy/gold themed |
| Animation      | Framer Motion                     | 12.35.1    |                                  |
| Auth           | NextAuth                          | v5         | CredentialsProvider (→ OAuth P4) |
| Database       | Neon serverless Postgres          | —          | raw pg pool, no ORM              |
| DB Client      | pg                                | —          | via @platform/database pool      |
| Validation     | Zod                               | —          | all inputs + env vars            |
| Build          | Turborepo + pnpm                  | 1.11.2 / 8.15.0 |                             |
| Deployment     | AWS Amplify Gen 2                 | —          | SSR, no standalone mode          |
| CI/CD          | GitHub Actions                    | —          | ci / deploy-staging / deploy-prod|
| Testing        | Vitest + Playwright               | —          | unit + e2e                       |
| Mapping (P3)   | MapLibre GL + OpenFreeMap + ESRI  | —          | backlog                          |
| Images         | Cloudfront + S3                   | —          | backlog                          |
| Analytics      | GA4 + custom                      | —          | backlog                          |

---

## DATABASE SCHEMA OVERVIEW

See `docs/DATABASE.md` for full schema and migration log.

**Primary DB:** Neon serverless Postgres
**Secondary DB:** AWS RDS (ARMLS mirror — backlog P3-2)

### Current Tables (Neon)

| Table                 | Purpose                                    | Added In |
|-----------------------|--------------------------------------------|----------|
| `agents`              | Platform users, roles, auth                | 002      |
| `intake_requests`     | Marketing request records                  | 004      |
| `intake_messages`     | Chat messages per request                  | 004      |
| `intake_files`        | File attachments per request               | 004      |
| `intake_status_log`   | Status transition audit trail              | 004      |
| `intake_kpi_snapshots`| Pre-computed KPI snapshots                 | 004      |
| `intake_material_type`| Material type lookup table                 | 004      |
| `tenant_themes`       | Per-tenant brand token storage             | 005      |

### Tenant Hierarchy (current → future)
```
Platform (echelon_point)
  └── Tenant (russ_lyon)
        └── Office (scottsdale_office)
              └── Team (luxury_team)
                    └── Agent (yong_choi)
```

`tenant_id` scoping in all queries is the multi-tenant expansion path (P4-5).

---

## ROLE MATRIX

| Role                | Routes accessible                              | Can save themes |
|---------------------|------------------------------------------------|-----------------|
| `agent`             | /requests                                      | No              |
| `designer`          | /queue                                         | No              |
| `marketing_manager` | /triage, /component-library                    | Yes             |
| `executive`         | /reports, /component-library                   | Yes             |
| `platform_admin`    | all routes                                     | Yes             |

---

## EXTERNAL DEPENDENCIES (Production)

| Service       | Purpose                    | Status       | Auth method       |
|---------------|----------------------------|--------------|-------------------|
| Neon          | Primary database           | ✅ Active    | DATABASE_URL       |
| AWS Amplify   | Hosting + SSR              | ✅ Active    | Amplify console    |
| AWS S3        | Image + geo storage        | ⏳ Backlog   | IAM               |
| AWS CloudFront| CDN for S3                 | ⏳ Backlog   | IAM               |
| ARMLS Spark   | Listing data               | 🚫 Blocked   | API key (pending) |
| Google OAuth  | SSO for brokerage staff    | ⏳ Backlog   | OAuth2            |
| Unsplash      | Demo seed images           | ✅ Active    | Public URL        |

---

*Update this file when: new apps join the monorepo, new services are added, DB schema changes, or tech stack changes.*
