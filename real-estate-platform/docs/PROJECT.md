# PROJECT.md — RLSIR Platform Living Tracker
# Real Estate Platform — Echelon Point LLC
# ⚠️ This file is a source of truth. Update it on every task completion, every new item added to backlog, and every status change.
# Format: update Status, Last Updated, and File Refs on every change.

---

## HOW TO USE THIS FILE

Every item has:
- **Status** — `backlog` | `in-progress` | `done` | `blocked`
- **Owner** — who is building it (Joey / Claude Code / TBD)
- **Files** — every file this item touches or creates (relative to monorepo root)
- **Last Updated** — date of last status change

When Claude Code completes a task, it must:
1. Move the item from `in-progress` → `done`
2. Add all files created or modified under **Files**
3. Add a one-line note to `CHANGELOG.md`
4. Update **Last Updated** date

When a new feature is planned, add it to **Backlog** before starting work.

---

## PROJECT OVERVIEW

| Field           | Value                                                      |
|-----------------|------------------------------------------------------------|
| Platform        | RLSIR Brokerage OS                                         |
| Client          | Russ Lyon Sotheby's International Realty                   |
| Primary Contact | Yong Choi (agent/demo user), Lex Baum (Creative Director)  |
| Stakeholder     | David Kim (CMO)                                            |
| Builder         | Echelon Point LLC (Joey Schnepel)                          |
| Stack           | Next.js 16, Tailwind v4, shadcn canary, Neon Postgres, AWS Amplify |
| Monorepo        | pnpm 8.15.0 + Turborepo                                    |
| Started         | 2026-01                                                    |
| Last Updated    | 2026-03-09                                                 |

---

## STATUS SUMMARY

| Phase    | Status      | Items Done | Items Left |
|----------|-------------|------------|------------|
| Phase 1  | ✅ Done      | 6/6        | 0          |
| Phase 2  | 🔄 In Progress | 5/7     | 2          |
| Phase 3  | ⏳ Backlog   | 0/8        | 8          |
| Phase 4  | ⏳ Backlog   | 0/5        | 5          |

---

## ✅ DONE

### Phase 1 — Foundation

---

#### P1-1 — Auth + Shell
**Status:** done | **Last Updated:** 2026-02-15

Set up NextAuth v5 with CredentialsProvider. Role-based routing middleware. AppShell with Sidebar and TopBar. Three demo users.

**Files:**
```
apps/platform/auth.ts
apps/platform/middleware.ts          ← may be renamed to proxy.ts
apps/platform/app/layout.tsx
apps/platform/app/providers.tsx
apps/platform/app/page.tsx           ← role-based redirect
apps/platform/app/login/page.tsx
apps/platform/components/shell/AppShell.tsx
apps/platform/components/shell/Sidebar.tsx
apps/platform/components/shell/TopBar.tsx
apps/platform/components/shell/index.ts
```

---

#### P1-2 — Token System (4 Layers)
**Status:** done | **Last Updated:** 2026-02-15

Brand tokens, semantic tokens, shadcn CSS var overrides, component tokens. Navy/Gold/Cream palette. Cormorant Garamond + DM Sans.

**Files:**
```
apps/platform/styles/tokens/russ-lyon.css   ← Layer 1 brand tokens
apps/platform/styles/tokens/base.css        ← Layers 2–4
apps/platform/styles/tokens/dark.css        ← Dark mode scaffold
apps/platform/app/globals.css
```

---

#### P1-3 — Database + Migrations
**Status:** done | **Last Updated:** 2026-02-20

Migrated from AWS RDS to Neon serverless Postgres. Schema includes agents, listings, and intake tables.

**Files:**
```
packages/database/src/index.ts
packages/database/src/schema.sql
packages/database/src/migrations/001_initial_schema.sql
packages/database/src/migrations/002_agents.sql
packages/database/src/migrations/003_listings.sql
packages/database/src/migrations/004_intake_tables.sql
packages/database/package.json
```

---

#### P1-4 — Server Actions + Chat API
**Status:** done | **Last Updated:** 2026-02-22

9 server actions for intake flow. Chat polling API route. NextAuth session integration.

**Files:**
```
apps/platform/app/actions/intake.ts
apps/platform/app/api/messages/[requestId]/route.ts
```

---

#### P1-5 — IntakeUI Prototype (Phase 1 Reference)
**Status:** done | **Last Updated:** 2026-02-25

Full ~9,932-line prototype with mock data. Served as reference for Phase 2 rebuild. Deleted after Phase 2 data layer was live.

**Files:**
```
apps/platform/components/IntakeUI.jsx    ← DELETED in P2-5
apps/platform/components/IntakeClient.tsx ← DELETED in P2-5
```

---

#### P1-6 — Amplify Initial Config
**Status:** done | **Last Updated:** 2026-02-25

Initial Amplify deploy config, environment setup.

**Files:**
```
apps/platform/next.config.ts
amplify.yml                              ← root-level (initial version)
```

---

### Phase 2 — Production Rebuild

---

#### P2-1 — Foundation Refactor
**Status:** done | **Last Updated:** 2026-03-01

Tailwind v4.2.1 + shadcn 4.0.2 canary (new-york style). Framer Motion 12. Token system hardened.

**Files:**
```
apps/platform/package.json
apps/platform/tailwind.config.ts
apps/platform/components/ui/                ← 17 shadcn components, all themed
apps/platform/lib/motion.ts                 ← spring, springGentle, fadeIn, slideInRight, scaleIn
```

---

#### P2-2 — Design System
**Status:** done | **Last Updated:** 2026-03-02

6 primitive components. Component gallery page.

**Files:**
```
apps/platform/components/primitives/StatusBadge.tsx
apps/platform/components/primitives/RushBadge.tsx
apps/platform/components/primitives/SLAIndicator.tsx
apps/platform/components/primitives/SectionHeader.tsx
apps/platform/components/primitives/KPITile.tsx
apps/platform/components/primitives/GlassCard.tsx
apps/platform/components/primitives/index.ts
apps/platform/app/design-system/page.tsx
```

---

#### P2-3 — Feature Components
**Status:** done | **Last Updated:** 2026-03-03

7 feature components: modals, drawers, chat.

**Files:**
```
apps/platform/components/features/RequestCard.tsx
apps/platform/components/features/NewRequestModal.tsx
apps/platform/components/features/CancelModal.tsx
apps/platform/components/features/RequestDetail.tsx
apps/platform/components/features/ProfileDrawer.tsx
apps/platform/components/features/chat/ChatThread.tsx
apps/platform/components/features/chat/ChatInput.tsx
apps/platform/components/features/index.ts
```

---

#### P2-4 — Views + Route Wiring
**Status:** done | **Last Updated:** 2026-03-07

4 role-based dashboards. Mock data extracted to lib. All routes wired to server components.

**Files:**
```
apps/platform/lib/mock-data.ts
apps/platform/components/views/AgentDashboard.tsx
apps/platform/components/views/ManagerDashboard.tsx
apps/platform/components/views/DesignerDashboard.tsx
apps/platform/components/views/ExecutiveDashboard.tsx
apps/platform/components/views/index.ts
apps/platform/app/requests/page.tsx
apps/platform/app/triage/page.tsx
apps/platform/app/queue/page.tsx
apps/platform/app/reports/page.tsx
apps/platform/app/page.tsx              ← role-based redirect
```

---

#### P2-5 — Data Layer
**Status:** done | **Last Updated:** 2026-03-09

Live Neon DB. Service classes. Server actions rewritten. Chat polling live. IntakeUI deleted.

**Files:**
```
packages/database/src/migrations/004_intake_tables.sql
packages/database/src/seed-intake.ts
apps/platform/services/RequestService.ts
apps/platform/services/MessageService.ts
apps/platform/services/AgentService.ts
apps/platform/services/AnalyticsService.ts
apps/platform/services/index.ts
apps/platform/app/actions/intake.ts        ← rewritten to use services
apps/platform/app/api/messages/[requestId]/route.ts  ← updated to use MessageService
apps/platform/lib/env.ts                   ← env var validation
apps/platform/lib/constants.ts             ← CHAT_POLL_INTERVAL_MS etc.
apps/platform/lib/routes.ts
apps/platform/lib/errors.ts
apps/platform/components/IntakeUI.jsx      ← DELETED
apps/platform/components/IntakeClient.tsx  ← DELETED
```

---

## 🔄 IN PROGRESS

#### P2-6 — Token Editor (Component Library Admin)
**Status:** in-progress | **Owner:** Claude Code | **Last Updated:** 2026-03-09
**Prompt:** `docs/prompts/PHASE2_PROMPT6_TOKEN_EDITOR.md`

Live theme editor. Pre-built themes. Save to Neon. ThemeProvider injects theme on every page.

**Files (planned):**
```
packages/database/src/migrations/005_tenant_themes.sql
apps/platform/services/ThemeService.ts
apps/platform/app/actions/theme.ts
apps/platform/components/ThemeProvider.tsx
apps/platform/components/features/TokenEditor.tsx
apps/platform/app/component-library/page.tsx
apps/platform/app/layout.tsx               ← updated to wrap with ThemeProvider
```

---

#### P2-7 — Amplify Deploy + CI/CD
**Status:** in-progress | **Owner:** Claude Code | **Last Updated:** 2026-03-09
**Prompt:** `docs/prompts/PHASE2_PROMPT7_AMPLIFY_DEPLOY.md`

Production Amplify deploy. Security headers. GitHub Actions CI/CD pipelines. Pre-commit hooks.

**Files (planned):**
```
apps/platform/amplify.yml
apps/platform/DEPLOY.md
apps/platform/.env.example
apps/platform/next.config.ts               ← security headers, image domains
apps/platform/vitest.config.ts
apps/platform/playwright.config.ts
apps/platform/__tests__/setup.ts
apps/platform/__tests__/fixtures/requests.ts
apps/platform/__tests__/fixtures/agents.ts
apps/platform/__tests__/e2e/auth.spec.ts
apps/platform/__tests__/e2e/agent.spec.ts
apps/platform/__tests__/e2e/manager.spec.ts
.github/workflows/ci.yml
.github/workflows/deploy-staging.yml
.github/workflows/deploy-production.yml
.husky/pre-commit
package.json                               ← lint-staged config
SECURITY.md
```

---

## ⏳ BACKLOG

### Phase 3 — ARMLS Integration

---

#### P3-1 — ARMLS Cobblestone CLA + Spark Registration
**Status:** backlog | **Owner:** Joey | **Last Updated:** 2026-03-09
**Blocker:** Setup fee payment

CLA signed. Spark Platform registration pending setup fee. Two-track approval: ARMLS Cobblestone CLA + Spark Platform.

**Files (planned):**
```
docs/ARMLS_COMPLIANCE.md
apps/platform/lib/armls/
```

---

#### P3-2 — ARMLS Data Mirror (AWS RDS)
**Status:** backlog | **Owner:** TBD | **Last Updated:** 2026-03-09
**Blocked by:** P3-1

AWS RDS schema for ARMLS listing mirror. ETL pipeline from Spark API → RDS. Scheduled sync.

**Files (planned):**
```
packages/database/src/migrations/armls/001_listings_mirror.sql
apps/backend/lib/armls/SparkClient.ts
apps/backend/lib/armls/etl/syncListings.ts
apps/backend/app/api/cron/armls-sync/route.ts
```

---

#### P3-3 — RESO OData Photo Mapping
**Status:** backlog | **Owner:** TBD | **Last Updated:** 2026-03-09
**Blocked by:** P3-1, Russ Lyon photo permission

Photos currently blocked on Russ Lyon side. ARMLS access pending. Architecture planned.

**Notes:** VOW vs IDX distinction — sold transaction data requires VOW. Staging environment (password-protected) chosen for ARMLS product review.

**Files (planned):**
```
apps/platform/services/ListingService.ts
apps/platform/components/features/ListingCard.tsx
apps/platform/components/features/ListingPhotoGallery.tsx
```

---

#### P3-4 — Listing Search + Filters
**Status:** backlog | **Owner:** TBD | **Last Updated:** 2026-03-09
**Blocked by:** P3-2

Public and agent-facing listing search. Price, beds/baths, community, status filters. 4-tier market drilldown.

**Files (planned):**
```
apps/platform/app/listings/page.tsx
apps/platform/components/views/ListingSearchView.tsx
apps/platform/components/features/ListingFilters.tsx
apps/platform/components/features/ListingGrid.tsx
```

---

#### P3-5 — MapLibre + OpenFreeMap Integration
**Status:** backlog | **Owner:** TBD | **Last Updated:** 2026-03-09

Listing map view. MapLibre GL + OpenFreeMap tiles. ESRI overlay for private gated communities (Desert Mountain, Silverleaf, etc.). 133 GeoJSON luxury community boundaries already built.

**Files (planned):**
```
apps/platform/components/features/ListingMap.tsx
apps/platform/lib/geo/
public/geo/communities.geojson          ← 133 communities, 117 polygons + 16 points
```

---

#### P3-6 — Market Analytics Dashboard
**Status:** backlog | **Owner:** TBD | **Last Updated:** 2026-03-09

12 analytics domains from ARMLS/RESO field inventory. Public-facing. 4-tier build priority.

Priority domains: Market Velocity & Momentum, Micro-Market Comparisons, Temporal Pattern Mining.

**Files (planned):**
```
apps/platform/app/analytics/page.tsx
apps/platform/components/views/AnalyticsDashboard.tsx
apps/platform/services/MarketAnalyticsService.ts
apps/platform/lib/analytics/
```

---

#### P3-7 — Hybrid Relocation Tool
**Status:** backlog | **Owner:** TBD | **Last Updated:** 2026-03-09

Hook-first UX. Lifestyle → community matching. Integrates with MapLibre community boundaries. Yong's mortgage expertise embedded.

**Files (planned):**
```
apps/platform/app/relocation/page.tsx
apps/platform/components/views/RelocationTool.tsx
apps/platform/components/features/LifestyleQuiz.tsx
apps/platform/components/features/CommunityMatch.tsx
```

---

#### P3-8 — IDX/VOW Compliance Layer
**Status:** backlog | **Owner:** Joey + Legal review | **Last Updated:** 2026-03-09

HUD/Fair Housing Act compliance. Arizona ADRE rules. ADA web accessibility. School data: names only, no ratings. Three-layer content structure: IDX listing pages, editorial Community Guide pages, agent Market pages.

**Files (planned):**
```
docs/COMPLIANCE.md
apps/platform/lib/compliance/
apps/platform/middleware/fairHousingCheck.ts
```

---

### Phase 4 — Brokerage OS Expansion

---

#### P4-1 — Google Workspace OAuth
**Status:** backlog | **Owner:** TBD | **Last Updated:** 2026-03-09

Replace CredentialsProvider with Google OAuth for `@russlyon.com` domain. SSO for all brokerage staff.

**Files (planned):**
```
apps/platform/auth.ts                  ← add GoogleProvider
apps/platform/app/api/auth/[...nextauth]/route.ts
```

---

#### P4-2 — Sphere Automation (CRM Light)
**Status:** backlog | **Owner:** TBD | **Last Updated:** 2026-03-09

Agent sphere management. Contact tracking. Automated drip sequences. Birthday/anniversary triggers.

**Files (planned):**
```
packages/database/src/migrations/006_sphere.sql
apps/platform/services/SphereService.ts
apps/platform/app/sphere/page.tsx
apps/platform/components/views/SphereDashboard.tsx
```

---

#### P4-3 — Lead Discovery + Competitive Intelligence
**Status:** backlog | **Owner:** TBD | **Last Updated:** 2026-03-09

Unfair advantage machine for Yong Choi pitch to David Kim. Market share tracking, competitor moves, off-market signals.

**Files (planned):**
```
packages/database/src/migrations/007_competitive_intel.sql
apps/platform/services/CompetitiveIntelService.ts
apps/platform/app/intel/page.tsx
```

---

#### P4-4 — pSEO Engine
**Status:** backlog | **Owner:** Joey | **Last Updated:** 2026-03-09

Programmatic SEO. Yong selects ~4 primary zip codes. Echelon Point captures remaining Phoenix zip codes via referral/marketing fee (structured for unlicensed compliance).

**Files (planned):**
```
apps/premium-site/app/[community]/page.tsx
apps/premium-site/app/[zipcode]/page.tsx
apps/premium-site/lib/seo/
```

---

#### P4-5 — Multi-Tenant Brokerage Expansion
**Status:** backlog | **Owner:** TBD | **Last Updated:** 2026-03-09

Scale from single-agent (Yong) to full brokerage OS. Tenant hierarchy: Platform → Tenant → Office → Team → Agent. `tenant_id` scoping across all queries.

**Notes:** Platform currently uses `tenant_id` in DB but UI is single-tenant. Full multi-tenant requires schema audit and middleware updates.

**Files (planned):**
```
packages/database/src/migrations/008_multi_tenant.sql
apps/platform/middleware.ts            ← tenant resolution from domain
apps/platform/lib/tenant.ts
apps/platform/services/TenantService.ts
```

---

## 🚫 BLOCKED

#### ARMLS Photo Integration
**Status:** blocked | **Blocker:** Russ Lyon permission + ARMLS setup fee | **Last Updated:** 2026-03-09

Photos require explicit Russ Lyon approval on top of ARMLS Spark access. Both pending. Architecture planned in P3-3.

---

## 📋 DECISIONS LOG

See `docs/DECISIONS.md` for full Architecture Decision Records.

| # | Decision | Date | Status |
|---|----------|------|--------|
| 001 | Neon over AWS RDS for platform DB | 2026-02 | active |
| 002 | Raw pg pool over Drizzle/Prisma | 2026-02 | active |
| 003 | Tailwind v4 + shadcn canary | 2026-02 | active |
| 004 | OpenNext/SST deferred to post-launch | 2026-02 | deferred |
| 005 | MapLibre + OpenFreeMap + ESRI for mapping | 2026-02 | active |
| 006 | Echelon Point LLC over Pixels and Print Studio | 2026-03 | active |
| 007 | Staging = password-protected for ARMLS review | 2026-03 | active |
| 008 | VOW required for sold transaction data | 2026-03 | active |

---

## 🌐 ENVIRONMENT REFERENCE

| Environment | Branch | DB              | URL                           | Amplify App ID     |
|-------------|--------|-----------------|-------------------------------|--------------------|
| Local       | any    | neon/dev        | localhost:3003                | —                  |
| Staging     | dev    | neon/staging    | dev.platform.[domain].com     | AMPLIFY_STAGING_ID |
| Production  | main   | neon/main       | platform.[domain].com         | AMPLIFY_PROD_ID    |

---

## 🔑 KEY CONTACTS

| Person      | Role                 | Company                   | Notes                              |
|-------------|----------------------|---------------------------|------------------------------------|
| Yong Choi   | Agent / Demo User    | Russ Lyon Sotheby's       | Primary client, 30+ yrs experience |
| Lex Baum    | Creative Director    | Russ Lyon Sotheby's       | marketing_manager role, key ally   |
| David Kim   | CMO                  | Russ Lyon Sotheby's       | Pitch target — market as marketing software under his budget |
| Derek       | CTO                  | Russ Lyon Sotheby's       | Gatekeeper — route around via David |

---

*This file is updated on every task completion. If it's out of date, update it before starting new work.*
*Owner: Joey Schnepel — Echelon Point LLC*
