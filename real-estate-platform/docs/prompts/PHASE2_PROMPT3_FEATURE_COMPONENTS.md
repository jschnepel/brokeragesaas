# Phase 2 — Prompt 3: Feature Components
# Claude Code — run from monorepo root: real-estate-platform/
# Build exactly what is specified. No alternatives. Flag blockers and continue.

---

## CONTEXT

Completed so far:
- P2-1: Tailwind v4, shadcn canary, token system, AppShell shell components
- P2-2: shadcn themed, 6 primitives (StatusBadge, RushBadge, SLAIndicator, SectionHeader, KPITile, GlassCard), Framer Motion presets

Do NOT touch:
- `components/IntakeUI.jsx` — behavioral reference only
- Any existing route pages (`/login`, `/requests`, `/triage`, `/queue`, `/reports`)
- `apps/premium-site`

---

## WHAT YOU ARE BUILDING

The feature component layer — composite components that combine primitives + shadcn into real UI pieces. These are the building blocks the view layer (Prompt 4) will assemble into full dashboards.

Components to build:
1. `RequestCard` — the core card for displaying a request in lists
2. `NewRequestModal` — full request submission form
3. `CancelModal` — role-aware cancel confirmation
4. `RequestDetail` — slide-in panel showing full request + chat thread
5. `ChatThread` + `ChatInput` — messaging components
6. `ProfileDrawer` — agent profile side panel

All components are `'use client'`. All use mock/prop data — no server actions yet.

---

## READ FIRST

Before writing any code, read these sections of `components/IntakeUI.jsx`:

1. **`RequestCard` component** — find it by searching `function RequestCard`. Note: thumbnail from `referenceFiles[0]`, 2×2 detail grid (type, designer, submitted date, SLA), status badge, rush badge, last message preview, click handler.

2. **`NewRequestModal`** — find `function NewRequestModal` or the modal that opens on "New Request". Note all form fields: title, materialType, dueDate, isRush, brief, referenceFiles upload area, notes.

3. **`CancelRequestModal`** — note role-aware behavior: agents cannot cancel if status is `in_progress`; managers can always cancel. Reason textarea required.

4. **`RequestDetail`** — the slide-in panel. Note: header with status + rush, metadata grid, timeline/status log section, chat thread at bottom with polling.

5. **`ChatThread` / message rendering** — find the message rendering inside RequestDetail. Note: sender avatar, message bubble, timestamp, platform vs email channel indicator.

6. **`ProfileLink` / `OrgProfileModal`** — the clickable profile component that opens an agent profile drawer.

Use these as the behavioral spec. Rebuild the UI with the new component system — do not copy JSX verbatim.

---

## STEP 1 — RequestCard

Create `components/features/RequestCard.tsx`:

```
Props:
  request: {
    id: string
    title: string
    materialType: string
    status: RequestStatus
    isRush: boolean
    designerName?: string
    requesterName: string
    submittedAt: string       // ISO date string
    slaDeadline: string | null
    slaBreached: boolean
    referenceFiles?: Array<{ url: string }>
    lastMessage?: { preview: string; time: string }
    feasibilityFlag?: boolean
  }
  onClick: (request) => void
  onCancel?: (request) => void  // shown only if provided
  compact?: boolean             // condensed single-line layout for queue tables
```

Full card layout (when compact=false):
- Left: thumbnail (first referenceFile url, or initials placeholder if none) — 72×72, object-cover
- Right: title (navy, 13px, font-weight 600), status badge + rush badge row
- 2×2 detail grid below title: Material Type | Designer (or "Unassigned" in amber), Submitted | SLA
- Last message preview (if present): gray italic, 11px, single line truncated
- Hover: subtle lift `translateY(-1px)`, `box-shadow` increase
- SLA breached: left border `4px solid #DC2626`
- Unassigned: left border `4px solid #D97706`
- Normal: left border `4px solid transparent`
- Cancel button (×) top-right, only if `onCancel` provided

Use `motion.div` from framer-motion with `fadeIn` preset from `lib/motion.ts` for mount animation.

Compact layout (compact=true):
- Single row: title | material type | designer | status badge | SLA
- No thumbnail, no message preview, no 2×2 grid
- Used in queue tables

---

## STEP 2 — NewRequestModal

Create `components/features/NewRequestModal.tsx`.

Uses shadcn `Dialog`, `DialogContent`, `DialogHeader`. Internal state manages all form fields.

```
Props:
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: NewRequestData) => void
  submitting?: boolean
```

```
NewRequestData: {
  title: string
  materialType: string
  dueDate: string
  isRush: boolean
  brief: string
  notes?: string
  referenceFiles: File[]
}
```

Form fields (in order):
1. **Title** — Input, placeholder "e.g. 16020 N Horseshoe Dr — Open House Flyer", required
2. **Material Type** — shadcn Select with options: Flyer, Social Pack, Email Campaign, Video Script, Brochure, Report, Signage, Other
3. **Due Date** — Input type="date", required
4. **Rush** — toggle row: label "Mark as RUSH" + description "Prioritizes above standard queue" + a toggle button (not shadcn Switch — just a styled button that toggles state). When active, show RushBadge inline.
5. **Brief** — Textarea, min 3 rows, placeholder "Describe what you need...", required
6. **Reference Files** — drag-and-drop zone: dashed border, "Drop files or click to upload" text, accepts images + PDF, shows file name list below after selection. Use a hidden `<input type="file" multiple>` behind a styled div.
7. **Notes** — Textarea, optional, placeholder "Additional notes for the designer..."

Footer: Cancel button (outline) + Submit button (default, disabled while submitting). Show "Submitting…" text while submitting.

Dialog width: `max-w-2xl`. Scrollable content area if form exceeds viewport height.

---

## STEP 3 — CancelModal

Create `components/features/CancelModal.tsx`.

```
Props:
  open: boolean
  onOpenChange: (open: boolean) => void
  request: { id: string; title: string; status: RequestStatus } | null
  role: 'agent' | 'marketing_manager' | 'designer' | 'executive'
  onConfirm: (reason: string) => void
  cancelling?: boolean
```

Behavior:
- If `role === 'agent'` AND `status === 'in_progress'`: show blocked state — "This request is in progress and cannot be cancelled. Contact your marketing manager." — no confirm button, only Close.
- All other cases: show reason Textarea (required, min 10 chars) + "Confirm Cancel" button (destructive variant).
- Title shows request title truncated to 48 chars.
- Confirm button disabled until reason.length >= 10.

---

## STEP 4 — ChatThread + ChatInput

Create `components/features/chat/ChatThread.tsx` and `components/features/chat/ChatInput.tsx`.

### ChatThread

```
Props:
  messages: Array<{
    id: string
    senderId: string
    senderName: string
    senderInitials: string
    content: string
    sentAt: string   // ISO
    isOwn: boolean   // true if current user sent it
  }>
  loading?: boolean
```

Layout:
- Scrollable container, `flex-direction: column`, messages in chronological order
- Each message: avatar (32px circle, initials) + bubble
- Own messages: right-aligned, navy bubble, white text
- Others: left-aligned, white bubble, border, navy text
- Timestamp below each bubble, 9px, gray, monospace font
- If `loading`: show 3 skeleton bubbles (alternating left/right) using shadcn `Skeleton`
- Auto-scroll to bottom when messages change — use `useEffect` + `useRef` on a scroll anchor div

### ChatInput

```
Props:
  onSend: (message: string) => void
  sending?: boolean
  disabled?: boolean
  placeholder?: string
```

Layout:
- Row: Textarea (flex:1, max 3 rows, auto-resize) + Send button (icon button, navy)
- Send on Enter (without shift), or button click
- Clear input after send
- Disabled state when `sending` or `disabled`
- Send button shows spinner SVG when `sending`

---

## STEP 5 — RequestDetail

Create `components/features/RequestDetail.tsx`.

This is a slide-in panel (shadcn `Sheet`, side="right", size ~640px wide) that shows full request details + chat.

```
Props:
  request: FullRequest | null   // null = closed
  currentUser: { id: string; name: string; initials: string; role: string }
  onClose: () => void
  onCancel: (request) => void
  onStatusChange?: (requestId: string, newStatus: RequestStatus) => void
  messages?: ChatMessage[]
  onSendMessage?: (content: string) => void
  sendingMessage?: boolean
```

Layout (top to bottom inside Sheet):
1. **Header** — title, StatusBadge, RushBadge (if rush), close button (×)
2. **Metadata grid** — 2×3 grid: Material Type, Designer (or Unassigned), Requester, Submitted, Due Date, SLA countdown
3. **Action row** (role-dependent):
   - `agent`: Cancel button (if not completed/cancelled)
   - `marketing_manager`: Assign designer dropdown (mock options: Lex Baum, Marcus Webb) + status change buttons
   - `designer`: status change buttons (Start Work, Mark Review, Complete)
4. **Brief** — collapsible section, shows full brief text
5. **Reference Files** — thumbnail grid (if any), click opens in new tab
6. **Status Timeline** — vertical list of status transitions, each with label + timestamp + who changed it. Use mock data from `MOCK_STATUS_LOG` constant defined in this file.
7. **Chat** — `ChatThread` + `ChatInput` pinned to bottom, flex fills remaining space

Use `slideInRight` from `lib/motion.ts` on the Sheet content via `motion.div` wrapper inside the Sheet.

Define at top of file:
```ts
const MOCK_STATUS_LOG = [
  { status: 'submitted',   changedBy: 'Yong Choi',    at: '2026-03-01T09:14:00Z' },
  { status: 'assigned',    changedBy: 'Lex Baum',     at: '2026-03-01T11:30:00Z' },
  { status: 'in_progress', changedBy: 'Marcus Webb',  at: '2026-03-02T08:00:00Z' },
];
```

---

## STEP 6 — ProfileDrawer

Create `components/features/ProfileDrawer.tsx`.

Shadcn `Sheet`, side="right", ~400px wide.

```
Props:
  agent: {
    id: string
    name: string
    initials: string
    role: string
    email: string
    phone?: string
    title?: string
    office?: string
    bio?: string
    avatarBg?: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
```

Layout:
1. **Header** — large avatar (56px, initials), name (display font, 20px), title/role badge, close button
2. **Contact row** — email + phone with copy-to-clipboard buttons (just console.log for now)
3. **Office/Team** — if present
4. **Bio** — if present, body text
5. **Stats row** — 3 mock stat tiles: Active Requests (3), Completed MTD (12), Avg SLA (94%)
6. **Recent Activity** — 3 mock activity items (submitted request, sent message, completed request)

---

## STEP 7 — Barrel Exports

Create `components/features/index.ts`:

```ts
export { RequestCard }    from './RequestCard';
export { NewRequestModal } from './NewRequestModal';
export { CancelModal }    from './CancelModal';
export { RequestDetail }  from './RequestDetail';
export { ProfileDrawer }  from './ProfileDrawer';
export { ChatThread }     from './chat/ChatThread';
export { ChatInput }      from './chat/ChatInput';
```

---

## STEP 8 — Add to `/design-system` Gallery

Add a new section 12 to `app/design-system/page.tsx`: **"Feature Components"**

Show:
- One `RequestCard` with mock data (in_progress, rush, with thumbnail placeholder, with last message)
- One `RequestCard` compact=true
- A `NewRequestModal` triggered by a Button
- A `CancelModal` triggered by a Button (use marketing_manager role so it's not blocked)
- A standalone `ChatThread` with 4 mock messages (2 own, 2 other) — no Sheet wrapper
- A `ProfileDrawer` triggered by a Button

---

## STEP 9 — Verify

```bash
cd apps/platform
pnpm type-check
pnpm build
```

Report:
1. `pnpm type-check` — 0 errors?
2. `pnpm build` — 0 errors? All 9 routes still compiled?
3. Does `/design-system` section 12 render all feature components without console errors?
4. Does RequestCard show left border color correctly (red=breached, amber=unassigned, transparent=normal)?
5. Does NewRequestModal open/close and show all 7 form fields?
6. Does CancelModal block agents on in_progress? Does it require 10+ char reason?
7. Does ChatThread auto-scroll to bottom? Do own messages appear right-aligned navy?
8. Does RequestDetail Sheet slide in from the right?
9. Do existing routes still compile as dynamic?

---

## CONSTRAINTS

- All components are `'use client'`
- No server actions wired yet — `onSubmit`, `onSend`, `onCancel`, `onStatusChange` are all props (will be wired in Prompt 5)
- No real data fetching — mock data is defined inline or as constants in each file
- Do NOT modify `components/IntakeUI.jsx`
- Do NOT modify existing route pages
- Do NOT touch `apps/premium-site`
- `RequestDetail` uses shadcn `Sheet` — if Sheet doesn't support custom width via className, use `style` prop or wrap content in a sized div
- File upload in `NewRequestModal` is UI only — no actual upload logic, just state management of selected files
- If framer-motion `motion.div` inside a shadcn Sheet causes hydration issues, wrap in a `<AnimatePresence>` and use `initial={false}` on the AnimatePresence

---

## WHAT SUCCESS LOOKS LIKE

```
apps/platform/
└── components/
    └── features/
        ├── RequestCard.tsx      ✓ full + compact variants, left border states, motion
        ├── NewRequestModal.tsx  ✓ 7 fields, file upload UI, rush toggle
        ├── CancelModal.tsx      ✓ role-aware block, reason validation
        ├── RequestDetail.tsx    ✓ Sheet, metadata, timeline, chat
        ├── ProfileDrawer.tsx    ✓ Sheet, avatar, stats, activity
        ├── chat/
        │   ├── ChatThread.tsx   ✓ bubbles, own/other, auto-scroll, skeleton
        │   └── ChatInput.tsx    ✓ enter to send, auto-resize, sending state
        └── index.ts             ✓ barrel export
```

`pnpm build` passes clean. `/design-system` section 12 renders all 6 feature components. Existing routes untouched.
