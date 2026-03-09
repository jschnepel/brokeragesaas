# DECISIONS.md — Architecture Decision Records (ADR)
# Real Estate Platform — Echelon Point LLC
# Format: one ADR per decision. Never delete a record — supersede it with a new one.
# Last Updated: 2026-03-09

---

## How to Add a Decision

```
#### ADR-NNN — Short Title
**Date:** YYYY-MM-DD
**Status:** proposed | active | superseded | deferred | rejected
**Supersedes:** ADR-NNN (if applicable)

**Context:** Why did this decision need to be made?
**Decision:** What was decided?
**Consequences:** What are the trade-offs?
```

---

#### ADR-001 — Neon over AWS RDS for platform database
**Date:** 2026-02-15
**Status:** active

**Context:** Initial build used AWS RDS. Free tier costs were accumulating. Neon offers serverless Postgres with a generous free tier and branch-per-environment workflow.

**Decision:** Migrate platform DB from RDS to Neon serverless Postgres. Keep AWS RDS as the ARMLS data mirror (separate concern, heavier workload, not yet active).

**Consequences:**
- Eliminates ongoing RDS costs while platform is pre-revenue
- Neon cold starts (~2s) acceptable for internal tool
- Branch workflow enables staging/prod DB separation cleanly
- ARMLS mirror stays on RDS when it goes live (heavy read workload, always-on)

---

#### ADR-002 — Raw pg pool over Drizzle or Prisma
**Date:** 2026-02-15
**Status:** active

**Context:** Considered Drizzle ORM and Prisma for type-safe DB access. Platform uses complex JOINs and aggregate queries for analytics. Both ORMs add abstraction that fights against efficient SQL.

**Decision:** Use raw `pg` pool with hand-written parameterized queries. All DB access through service class methods with `fromRow` mappers that provide type safety at the boundary.

**Consequences:**
- More SQL to write, but SQL is explicit and reviewable
- No ORM migration files — plain `.sql` files only
- `fromRow` mappers provide the same type safety as ORM at lower overhead
- Easier to audit for SQL injection (parameterized queries are obvious)
- No ORM version upgrade surface

---

#### ADR-003 — Tailwind v4 + shadcn canary (new-york style)
**Date:** 2026-02-15
**Status:** active

**Context:** Tailwind v3 uses `tailwind.config.js` for theming. v4 is CSS-first with `@theme` directive. shadcn canary supports v4 natively. The 4-layer token system requires CSS custom properties throughout — v4 makes this cleaner.

**Decision:** Use Tailwind v4.2.1 + shadcn 4.0.2 canary, new-york style. Define tokens as CSS vars in `styles/tokens/`. Shadow Tailwind utility classes with token values where possible.

**Consequences:**
- Some Tailwind utilities differ from v3 docs — team needs v4 awareness
- shadcn canary means occasional breaking changes on updates — pin versions
- CSS-first theming aligns with the token editor (P2-6) — ThemeProvider can inject vars that override everything
- Tailwind utility classes in JSX are for layout only; visual design goes through CSS vars

---

#### ADR-004 — Defer OpenNext/SST to post-launch
**Date:** 2026-02-20
**Status:** deferred

**Context:** OpenNext + SST would allow Next.js on AWS Lambda instead of Amplify SSR. Lower cost at scale, more control over infra. However, adds significant complexity to the build pipeline and requires SST infrastructure-as-code.

**Decision:** Deploy to AWS Amplify Gen 2 for launch. Evaluate OpenNext/SST when the platform has paying tenants and predictable load.

**Consequences:**
- Amplify is the simplest Next.js SSR path on AWS — fast to set up
- Amplify SSR pricing is higher per request than Lambda at volume
- Migration to OpenNext is possible post-launch without code changes
- Revisit when monthly Amplify bill exceeds ~$50/month

---

#### ADR-005 — MapLibre + OpenFreeMap + ESRI for mapping
**Date:** 2026-02-22
**Status:** active (backlog P3-5)

**Context:** Listing maps need to show luxury communities including private gated communities (Desert Mountain, Silverleaf, Troon North). OpenStreetMap tiles don't cover these accurately. Google Maps requires expensive API keys and has licensing restrictions on real estate use.

**Decision:** MapLibre GL JS (open source) + OpenFreeMap base tiles (free) + ESRI overlay for private community coverage. 133 community GeoJSON boundaries pre-built from Maricopa County parcel data.

**Consequences:**
- Zero per-request map costs
- ESRI overlay covers the private communities OSM misses
- MapLibre is open source — no vendor lock-in
- 133 GeoJSON boundaries already built (117 polygons, 16 points) — ready to load
- Must keep GeoJSON up to date as communities change

---

#### ADR-006 — Echelon Point LLC over Pixels and Print Studio
**Date:** 2026-03-01
**Status:** active

**Context:** Original consultancy brand was "Pixels and Print Studio." Needed a more technical, premium brand that signals engineering capability, not just design.

**Decision:** Rebrand to Echelon Point. File LLC under Echelon Point. Trademark filing under USPTO Class 42. Domain negotiation ongoing (echelonpoint.com listed at $20K from squatter — pursuing alternatives).

**Consequences:**
- All client-facing materials and contracts under Echelon Point LLC
- IP ownership clearly with Echelon Point, not Russ Lyon
- Contractor relationship with Yong Choi preserves IP

---

#### ADR-007 — Staging environment = password-protected Next.js app
**Date:** 2026-03-05
**Status:** active

**Context:** ARMLS Spark product review requires a staging environment where the reviewer can verify IDX compliance without the app being publicly accessible.

**Decision:** Staging (`dev` branch on Amplify) uses Next.js middleware to require a static password for all routes. Not a real auth system — just a gate for ARMLS review purposes.

**Consequences:**
- Simple to implement — single env var `STAGING_PASSWORD`
- ARMLS reviewer gets a URL + password, can review listing display compliance
- Not a long-term solution — remove or replace with proper staging auth post-ARMLS approval

---

#### ADR-008 — VOW required for sold transaction data
**Date:** 2026-03-05
**Status:** active

**Context:** The market analytics platform (P3-6) wants to display list-to-sale price ratios, appreciation metrics, and sold data. IDX only covers active listings. Sold transaction data requires Virtual Office Website (VOW) access under ARMLS rules.

**Decision:** Plan the analytics platform with VOW compliance from the start. Sold data APIs are gated behind VOW-compliant pages (require user registration or agent context).

**Consequences:**
- Increases compliance surface area
- Some analytics features (velocity, appreciation) require VOW gating
- Public-facing analytics pages can only show aggregate/anonymized sold data
- Agent-authenticated views can show full sold transaction detail under VOW

---

#### ADR-009 — 150-line component decomposition rule
**Date:** 2026-03-09
**Status:** active

**Context:** Several components from Phase 1 (IntakeUI.jsx at ~9,932 lines) became unmaintainable. Even Phase 2 dashboard components were approaching 300+ lines before decomposition.

**Decision:** Any component exceeding 150 lines must be decomposed into sub-components in the same directory. This is enforced in code review and documented in CLAUDE.md.

**Consequences:**
- More files — offset by better discoverability and testability
- Each sub-component can have focused tests
- Decomposition is always into the same directory — no deep nesting

---

#### ADR-010 — No Drizzle schema, no Prisma schema — SQL migrations only
**Date:** 2026-03-09
**Status:** active

**Context:** Some team members familiar with Drizzle schema files as migration source of truth. However, the platform already has complex SQL with CTEs, computed columns, and aggregate functions that don't map cleanly to ORM schema definitions.

**Decision:** All schema changes via numbered `.sql` migration files in `packages/database/src/migrations/`. A `schema_migrations` table tracks what has been applied. No ORM schema files.

**Consequences:**
- SQL migrations are the single source of truth for DB schema
- `DATABASE.md` documents current schema state for reference
- Migrations are immutable once applied to any shared environment
- New changes always require a new migration file

---

*Never delete a decision record. If a decision is reversed, add a new ADR with status `superseded` and reference the original.*
