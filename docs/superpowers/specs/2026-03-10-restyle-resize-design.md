# Restyle & Resize — Complete UI Overhaul

**Date:** 2026-03-10
**Status:** Approved
**Scope:** Queue, Requests, Request Detail, Queue Detail, Agent Dashboard, Designer Dashboard

---

## Problem

Every page has ad-hoc sizing with hardcoded pixel values scattered across 15+ files. Components are disproportionate — some too small, some too large, no consistent spacing or sizing system. The Request Detail page uses a cramped side-by-side layout that wastes space. The RevisionModal doesn't load actual design files. The QuickActionSheet duplicates information that belongs on the full page.

## Design Decisions

### 1. Centralized Layout Constants

All layout dimensions live in `lib/config/layout.ts`. Components import from this file — no hardcoded pixels in component files.

```ts
export const LAYOUT = {
  detail: {
    previewMinHeight: 320,
    previewMaxHeight: 560,
    chatHeight: 280,
  },
  queue: {
    analyticsHeight: 240,
    analyticsGrid: "minmax(200px, 1fr) 2fr minmax(240px, 1fr)",
    sectionGap: 24,
  },
  table: {
    rowHeight: 44,
    headerHeight: 40,
  },
  card: {
    minWidth: 280,
    maxWidth: 360,
    minHeight: 180,
  },
}
```

### 2. Request Detail — Stacked Layout

Replace side-by-side grid with full-width stacked sections:

1. **Header** — back, queue#, title, status, rush, SLA
2. **Design Preview** — full-width, loads latest uploaded file, scales to aspect ratio (320–560px)
3. **Brief + Meta** — full-width, 2-column internal grid (meta fields left, brief text + files right)
4. **Action Strip** — full-width bar with all status buttons, "Request Revision", "Open in Canva"
5. **Chat Thread** — full-width, collapsible, 280px default height, expandable

### 3. RevisionModal — Load Real Design Files

- Fetch latest file from `intake_files` for the request
- Draw uploaded image onto canvas as background
- Agent annotates on top of the real design
- Falls back to placeholder if no files exist

### 4. QuickActionSheet — Quick Actions Only

Strip down to:
- Status transition buttons
- Assign designer dropdown
- Cancel button

Remove: meta fields, SLA display, message preview, "View Full Request" (these live on the detail page).

### 5. Queue Page — Proportional Analytics Row

- Height: 240px (down from 280px)
- Grid: `minmax(200px, 1fr) 2fr minmax(240px, 1fr)` (flexible, not fixed pixels)
- Consistent 24px gap between all sections
- Tables: consistent row height (44px body, 40px header)
- MyQueueCards: `repeat(auto-fill, minmax(280px, 1fr))` grid

### 6. Agent + Designer Dashboards

**Agent Dashboard:**
- KPI row: My Requests, In Progress, Completed, Avg Turnaround
- My recent requests table (5 rows)
- Quick actions bar

**Designer Dashboard:**
- KPI row: My Active, Completed This Week, SLA Compliance, Revision Rate
- My assigned queue (5 rows, sorted by SLA urgency)
- Recent activity feed

### 7. Component Styling Rules

- No inline pixel values for layout — import from `layout.ts`
- Brand colors via CSS vars only
- Type scale via Tailwind tokens only
- Spacing in 4px increments (Tailwind classes)
- Cards: `rounded-md border border-border bg-white`
- Section headers: `text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--brand-accent)]`

## Pages Affected

| Page | Changes |
|------|---------|
| `/requests/[id]` | Stacked layout, full-width preview, collapsible chat |
| `/queue/[id]` | Same (reuses RequestDetailClient) |
| `/queue` | Analytics row proportions, table sizing, card grid |
| `/requests` | Table/card sizing consistency |
| `/dashboard` | Agent + Designer views rebuilt with DB data |
| QuickActionSheet | Stripped to quick actions only |
| RevisionModal | Load real uploaded files onto canvas |
| `lib/config/layout.ts` | New file — all layout constants |

## Out of Scope

- Triage page
- Executive/Manager dashboards
- Mobile/tablet responsive (desktop-first, 1280px minimum)
- File upload flow (separate feature)
