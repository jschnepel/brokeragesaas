# Integration & Migration Report — Claude Code Prompt
# Run from the monorepo root. No implementation code. 
# Deliverable: docs/integration-report.md

---

## STEP 1 — READ FIRST, WRITE NOTHING

Before writing anything, read all of the following:

**Monorepo root:**
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- Every `apps/*/package.json` and `packages/*/package.json`

**Main Next.js app** (confirm name from `pnpm-workspace.yaml` — may be `apps/rlsir`, `apps/premium-site`, or other):
- `next.config.js` / `next.config.ts`
- Full `app/` directory — every route, layout, page
- `app/api/` — every route handler
- Auth config — check `middleware.ts`, `auth.ts`, `[...nextauth]`, any Clerk config
- `.env.example` or any committed env references

**`@platform/database`:**
- Full Drizzle schema — every table, column, relation
- `drizzle.config.ts`
- Existing migration files

**`/lex` system** (search entire repo — may be `apps/lex`, `packages/lex`, a subdir, or root-level folder):
- **Read it purely to understand what it does and what it outputs.**
- Every page, component, chart, and data transformation
- How it currently gets its data (API calls, DB queries, CSV, mock)
- What metrics it computes, what visualizations it renders, what reports it generates
- **Do not plan to open, link to, or redirect users to /lex. It stays where it is.**

**Intake prototype** (look for `IntakeUI.jsx` or `intake-ui.jsx` anywhere in repo — if not present, treat as described in CONTEXT below):
- Read it fully — understand all views, mock data shapes, component structure

---

## CONTEXT

### The Intake Module
A self-contained React prototype (~8,200 lines) covering the full marketing request workflow:

**Roles:** Agent · Designer · Marketing Manager · Executive

**Request lifecycle:** Submit → Intake triage → Assign → In progress → Review → Approve → Complete  
Cancel available at any stage from both Agent and Manager sides

**Features built:**
- Per-request threaded chat (currently mocked)
- SLA tracking with urgency states (critical / warning / healthy / breached)
- Design Queue with feasibility flagging and designer assignment
- Operations Report: line charts (YoY, rolling 30d, 3-line comparison), KPI panels, team health grid
- Lyon's Den: company feed, events, Prides groups with chat/files/calendar
- Org chart with slide-in profile drawer (About / Calendar / Schedule tabs)
- Global fuzzy search across users, listings, pages
- Multi-panel Messenger (LinkedIn-style, bottom-right)
- Pagination on all tables

**Intake schema tables:**
`intake_request` · `intake_request_step` · `intake_request_message` · `intake_request_asset` ·
`intake_listing_cache` · `intake_google_connection` · `intake_sla_config` · `intake_material_type` ·
`intake_sla_notification` · `intake_rush_fee_approval`

### The /lex System
**Do not plan to migrate, move, or link to /lex.** Read its code only to extract:
- What outputs it produces (reports, charts, dashboards, exports)
- What data it consumes and what transformations it applies
- What the end user actually sees and does

Then plan how to produce those same outputs natively inside the intake platform — rebuilt from scratch using the intake module's existing analytics frame (Operations Report, Executive View, DesignerDashboard stats panels) and the `@platform/ui` component library. The /lex app is the spec. The intake platform is the destination.

### The Platform
Multi-tenant brokerage SaaS. Hierarchy: Platform → Tenant → Office → Team → Agent.
`tenant_id` scopes all data. `@platform/database` = 46 Drizzle tables on Neon serverless Postgres.
Deployed to AWS Amplify.

---

## STEP 2 — WRITE THE REPORT

Save to `docs/integration-report.md`.

---

### 1. CODEBASE SNAPSHOT
- Confirmed app name and directory
- Monorepo package graph (which packages depend on which)
- Current route map — every existing page
- Auth: provider, session shape, role resolution — or flag as missing
- API pattern with specific examples from the actual code
- Database: Neon confirmed, Drizzle version, migration tooling, full table list with one-line description each
- Amplify: confirmed branch, build command, env vars already set

---

### 2. /LEX CAPABILITY AUDIT
*(Read /lex code — do not plan to touch or redirect to it)*

- Functional summary: what does a user actually do in /lex and what do they get out of it?
- Full inventory of views, charts, tables, and exports with one-line description each
- Data consumed: exact sources, field names, any computed/derived metrics
- Visualizations: chart types, axes, aggregation logic
- Any report generation (PDF, CSV, email)
- UI patterns that match or conflict with the intake module's existing design system
- `@platform/ui` components that could replace /lex's own UI

---

### 3. /LEX OUTPUTS → INTAKE PLATFORM REBUILD PLAN
**Goal: produce the same outputs /lex produces, natively inside the intake platform.**

For each /lex view or feature:
- Where it maps in the intake platform: Operations Report · Executive View · new `/intake/analytics` route · new `/intake/reports` route · other
- What data it needs — intake schema tables already covering it vs new tables/columns needed
- What chart/component already exists in the intake prototype that covers it, or what needs to be built
- Whether it needs a dedicated route or slots into an existing view as a new tab/panel

Include the final proposed route map showing where every /lex capability lands inside the intake platform.

---

### 4. INTAKE MODULE INTEGRATION PLAN
For each item: what needs to exist · exact file path · effort (S/M/L) · blocked by

- **App location & route** — confirmed app folder, where `/intake` lives in the route tree, layout inheritance
- **Component placement** — `IntakeUI.jsx` destination, `"use client"` + `dynamic()` wrapper for Recharts SSR
- **Auth + role gating** — how Agent / Designer / Manager / Executive maps to existing session and profile. Specific table + field.
- **Database migration** — 10 intake tables joining 46 existing. Naming conflicts. `tenant_id` consistency. Exact migration command.
- **API surface** — every route handler or server action needed to replace mocked data:
  `METHOD /api/intake/[path] — purpose — tables read/written`
- **Real-time chat** — zero-cost options ranked: Neon polling · SSE from Next.js route · Pusher free tier · Ably free tier. Winner with justification and upgrade path.
- **File uploads** — S3 + CloudFront (already in Master Build Plan) vs Cloudflare R2 free tier. Recommendation.
- **SLA engine** — options: DB timestamp on read · Vercel Cron · AWS EventBridge. Zero-cost winner.
- **Google Calendar** (Schedule tab in profile drawer) — OAuth scope, tables, flow
- **Amplify access control** — confirm free tier, exact console steps

---

### 5. UNIFIED ROUTE MAP
Complete proposed route tree after integration — existing routes + intake routes + rebuilt /lex-derived routes.
Note: public · auth-gated · role-gated for each.

Mermaid diagram:
```
Agent → submits request → API → DB → Designer queue
Designer → updates status → API → DB → Agent notification  
Data → Analytics frame → Executive / rebuilt analytics views
```

---

### 6. DEPENDENCY & BUILD CHANGES
- Exact `pnpm add --filter [app]` commands
- Any `turbo.json` changes
- Any `next.config.js` changes (image domains, etc.)
- Env vars to add in Amplify console: name · placeholder value · purpose

---

### 7. UNKNOWNS & BLOCKERS
`⚠️ [file or system] — what is unknown — why it matters — how to resolve`

---

### 8. PHASED EFFORT TABLE
| Feature | Phase | Effort | Blocked By | Notes |

Phase 1 = working demo with real data for Lex and David (intake workflow + rebuilt /lex outputs)
Phase 2 = full SLA engine, file uploads, notifications
Phase 3 = multi-tenant rollout

---

## CONSTRAINTS

- No implementation code. Report only.
- Actual file paths from what you read — no guesses.
- /lex is read-only reference material. Do not plan to open, link, redirect to, or move it.
- Flag every unknown explicitly rather than assuming.
- Report must be specific enough that the next Claude Code session can execute Phase 1 with zero clarifying questions.

Read everything first. Do not start writing until all files have been read.
