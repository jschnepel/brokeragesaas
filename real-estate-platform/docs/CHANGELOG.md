# CHANGELOG.md — Version History
# Real Estate Platform — Echelon Point LLC
# Format: newest entries at top. One line per feature/fix. Group by version or date.
# Update this file on every task completion before marking a task done in PROJECT.md.
# Last Updated: 2026-03-09

---

## How to Add an Entry

When completing any task, prepend a line:
```
YYYY-MM-DD | [type] Short description — files touched
```

Types: `feat` | `fix` | `refactor` | `infra` | `docs` | `test` | `security`

---

## 2026-03

### 2026-03-09
- `docs`     Bootstrapped documentation system — docs/PROJECT.md, ARCHITECTURE.md, DECISIONS.md, DATABASE.md, CHANGELOG.md
- `docs`     Updated CLAUDE.md with documentation mandate (Part 11)
- `feat`     P2-5 Data Layer complete — services/, seed-intake.ts, live chat polling, IntakeUI.jsx deleted
- `infra`    P2-7 Amplify deploy config written — amplify.yml, DEPLOY.md, .env.example, GitHub Actions workflows
- `feat`     P2-6 Token Editor written — ThemeProvider, TokenEditor.tsx, /component-library route, tenant_themes migration

### 2026-03-07
- `feat`     P2-4 Views complete — AgentDashboard, ManagerDashboard, DesignerDashboard, ExecutiveDashboard
- `feat`     P2-4 Mock data extracted to lib/mock-data.ts — 40+ typed constants
- `feat`     P2-4 All 4 route pages wired to view components with role guards

### 2026-03-03
- `feat`     P2-3 Feature components — RequestCard, NewRequestModal, CancelModal, RequestDetail, ProfileDrawer
- `feat`     P2-3 Chat components — ChatThread, ChatInput (auto-scroll, skeleton, own/other bubbles)

### 2026-03-02
- `feat`     P2-2 Design system — 6 primitive components (StatusBadge, RushBadge, SLAIndicator, SectionHeader, KPITile, GlassCard)
- `feat`     P2-2 /design-system gallery page — 12 sections

### 2026-03-01
- `refactor` P2-1 Foundation — Tailwind v4.2.1, shadcn 4.0.2 canary, 17 themed shadcn components
- `feat`     P2-1 Framer Motion presets — lib/motion.ts (spring, springGentle, fadeIn, slideInRight, scaleIn)

---

## 2026-02

### 2026-02-25
- `feat`     Phase 1 complete — IntakeUI.jsx prototype (~9,932 lines), ManagerDashboardHome layout finalized
- `infra`    Initial Amplify config, next.config.ts

### 2026-02-22
- `feat`     Server actions (9 actions) — app/actions/intake.ts
- `feat`     Chat polling API — /api/messages/[requestId] (GET + POST)

### 2026-02-20
- `infra`    Migrated DB from AWS RDS to Neon serverless Postgres
- `infra`    Migration 004 — intake_tables (intake_requests, intake_messages, intake_files, intake_status_log, intake_kpi_snapshots, intake_material_type)

### 2026-02-15
- `feat`     Auth — NextAuth v5, CredentialsProvider, role-based routing middleware
- `feat`     AppShell — Sidebar (dark gradient, gold active state), TopBar, layout
- `feat`     Token system — 4-layer CSS architecture (russ-lyon.css, base.css, dark.css)
- `infra`    Monorepo bootstrapped — pnpm 8.15.0, Turborepo 1.11.2, packages/database

---

## Upcoming (Planned)

### P2-6 (in progress)
- `feat`     Token editor admin panel — live theme editing, save to Neon, 3 pre-built themes
- `feat`     ThemeProvider — DB-driven CSS var injection on every page
- `feat`     /component-library route — 12-section preview grid

### P2-7 (in progress)
- `infra`    GitHub Actions CI/CD — ci.yml, deploy-staging.yml, deploy-production.yml
- `infra`    AWS Amplify production deploy — amplify.yml, security headers
- `test`     Testing infrastructure — vitest, playwright, coverage thresholds
- `infra`    Pre-commit hooks — husky, lint-staged

### P3 (backlog)
- `feat`     ARMLS Spark integration — listing data, photos, VOW compliance
- `feat`     MapLibre listing map — 133 GeoJSON community boundaries
- `feat`     Market analytics dashboard — 12 analytics domains
- `feat`     Hybrid relocation tool

### P4 (backlog)
- `infra`    Google OAuth — replace CredentialsProvider
- `feat`     Sphere automation (CRM light)
- `feat`     Lead discovery + competitive intelligence
- `feat`     Multi-tenant brokerage expansion

---

*One line per change. Newest at top. Always update before marking a task done.*
