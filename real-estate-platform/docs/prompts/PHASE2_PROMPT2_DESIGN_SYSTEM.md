# Phase 2 — Prompt 2: Atomic Design System
# Claude Code — run from monorepo root: real-estate-platform/
# Build exactly what is specified. No alternatives. Flag blockers and continue.

---

## CONTEXT

Prompt 1 is complete and verified:
- Tailwind v4.2.1 installed, `@tailwindcss/postcss` wired
- shadcn 4.0.2 canary, new-york style, 17 components in `components/ui/`
- 4-layer token system in `styles/tokens/` (russ-lyon.css → base.css → dark.css)
- AppShell in `components/shell/` (Sidebar, TopBar, AppShell, index.ts)
- `/design-system` smoke test page renders

Do NOT touch:
- `components/IntakeUI.jsx`
- Any existing route pages (`/login`, `/requests`, `/triage`, `/queue`, `/reports`)
- `apps/premium-site`

---

## WHAT YOU ARE BUILDING

The complete atomic layer of the new design system:

1. **Theme overrides** — restyle all 17 shadcn components to navy/gold
2. **Custom primitives** — 6 components not covered by shadcn
3. **Framer Motion** — install + one shared animation config
4. **Update `/design-system`** — render all atoms with live previews

Everything in this prompt is pure presentational — no data fetching, no server actions.

---

## READ FIRST

Before writing any code, read:
1. `styles/tokens/base.css` — all CSS vars available, especially the type scale
2. `styles/tokens/russ-lyon.css` — brand tokens
3. `components/ui/button.tsx` — understand how shadcn new-york style uses CSS vars
4. `components/IntakeUI.jsx` lines 1–200 — note the exact status colors, badge styles, rush badge, SLA countdown display patterns used throughout. These are the behavioral reference.

---

## STEP 1 — Install Framer Motion

```bash
cd apps/platform
pnpm add framer-motion
```

Create `lib/motion.ts`:

```ts
// apps/platform/lib/motion.ts
// Shared animation presets — import from here, not from framer-motion directly

export const spring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

export const springGentle = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 24,
};

export const fadeIn = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
  transition: springGentle,
};

export const slideInRight = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: 16 },
  transition: springGentle,
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.96 },
  transition: spring,
};
```

---

## STEP 2 — shadcn Theme Overrides

Override the generated shadcn components to match the navy/gold system. Edit these files in `components/ui/`:

### `components/ui/button.tsx`

Replace the `buttonVariants` cva definition. Keep the existing import structure, only change the variant/size styles:

```ts
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-1',
  {
    variants: {
      variant: {
        default:     'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] active:scale-[0.98]',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline:     'border border-[var(--color-border)] bg-white text-[var(--brand-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-surface)]',
        secondary:   'bg-[var(--brand-surface-alt)] text-[var(--brand-primary)] hover:bg-[var(--color-border)]',
        ghost:       'text-[var(--brand-primary)] hover:bg-[var(--brand-surface-alt)]',
        link:        'text-[var(--brand-accent)] underline-offset-4 hover:underline p-0 h-auto',
        accent:      'bg-[var(--brand-accent)] text-white hover:opacity-90 active:scale-[0.98]',
      },
      size: {
        default: 'h-8 px-4 text-[var(--text-sm)] tracking-wide',
        sm:      'h-7 px-3 text-[var(--text-xs)] tracking-wide',
        lg:      'h-10 px-6 text-[var(--text-base)]',
        icon:    'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);
```

Add `'accent'` to the variant type if TypeScript requires it.

### `components/ui/badge.tsx`

Replace the `badgeVariants` cva:

```ts
const badgeVariants = cva(
  'inline-flex items-center gap-1 font-semibold tracking-[0.08em] uppercase transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-[var(--brand-primary)] text-white',
        secondary:   'bg-[var(--brand-surface-alt)] text-[var(--brand-primary)]',
        destructive: 'bg-red-50 text-red-700 border border-red-200',
        outline:     'border border-[var(--color-border)] text-[var(--brand-primary)] bg-transparent',
        success:     'bg-green-50 text-green-700 border border-green-200',
        warning:     'bg-amber-50 text-amber-700 border border-amber-200',
        accent:      'bg-[var(--brand-accent-muted)] text-[var(--brand-primary)] border border-[rgba(201,169,110,0.3)]',
        rush:        'bg-red-600 text-white',
      },
      size: {
        default: 'text-[9px] px-2 py-0.5 rounded-[var(--brand-radius)]',
        sm:      'text-[8px] px-1.5 py-px rounded-[var(--brand-radius)]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);
```

### `components/ui/card.tsx`

Replace the card components:

```tsx
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white border border-[var(--color-border)] rounded-[var(--brand-radius)] overflow-hidden',
        className
      )}
      {...props}
    />
  )
);

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between', className)}
      {...props}
    />
  )
);

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--brand-primary)]', className)}
      {...props}
    />
  )
);

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5', className)} {...props} />
  )
);

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-5 py-3 border-t border-[var(--color-border)] flex items-center', className)}
      {...props}
    />
  )
);
```

### `components/ui/input.tsx`

```tsx
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-8 w-full bg-white border border-[var(--color-border)] px-3 text-[var(--text-sm)] text-[var(--brand-primary)] placeholder:text-[#9CA3AF] rounded-[var(--brand-radius)] outline-none transition-colors',
        'focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
```

### `components/ui/textarea.tsx`

```tsx
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full bg-white border border-[var(--color-border)] px-3 py-2 text-[var(--text-sm)] text-[var(--brand-primary)] placeholder:text-[#9CA3AF] rounded-[var(--brand-radius)] outline-none transition-colors resize-none',
        'focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
```

### `components/ui/select.tsx`

Only override the trigger styling — keep all shadcn primitives intact. Find `SelectTrigger` and update its className:

```tsx
// In SelectTrigger, replace the className string with:
'flex h-8 w-full items-center justify-between bg-white border border-[var(--color-border)] px-3 text-[var(--text-sm)] text-[var(--brand-primary)] rounded-[var(--brand-radius)] outline-none transition-colors focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] disabled:opacity-50 [&>span]:line-clamp-1'
```

### `components/ui/tabs.tsx`

Override `TabsList` and `TabsTrigger` className strings:

```tsx
// TabsList
'inline-flex items-center bg-[var(--brand-surface-alt)] border border-[var(--color-border)] rounded-[var(--brand-radius)] p-0.5 gap-0.5'

// TabsTrigger  
'inline-flex items-center justify-center px-3 py-1.5 text-[var(--text-xs)] font-semibold tracking-[0.06em] uppercase rounded-[var(--brand-radius)] transition-colors text-[#9CA3AF] hover:text-[var(--brand-primary)] data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary)] data-[state=active]:shadow-sm'
```

### `components/ui/dialog.tsx`

Override `DialogOverlay` and `DialogContent`:

```tsx
// DialogOverlay className
'fixed inset-0 z-50 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'

// DialogContent className
'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-white border border-[var(--color-border)] shadow-xl rounded-[var(--brand-radius)] w-full max-w-lg p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
```

---

## STEP 3 — Custom Primitives

Create `components/primitives/`. These are the building blocks used throughout the app that shadcn doesn't cover.

### `components/primitives/StatusBadge.tsx`

```tsx
'use client';

export type RequestStatus =
  | 'draft' | 'submitted' | 'in_review' | 'assigned'
  | 'in_progress' | 'awaiting_materials' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<RequestStatus, { label: string; bg: string; color: string; border: string }> = {
  draft:               { label: 'Draft',              bg: '#F9FAFB',  color: '#6B7280', border: '#E5E7EB' },
  submitted:           { label: 'Submitted',          bg: '#EFF6FF',  color: '#1D4ED8', border: '#BFDBFE' },
  in_review:           { label: 'In Review',          bg: '#FFFBEB',  color: '#D97706', border: '#FDE68A' },
  assigned:            { label: 'Assigned',           bg: '#F0F9FF',  color: '#0369A1', border: '#BAE6FD' },
  in_progress:         { label: 'In Progress',        bg: '#F0FDF4',  color: '#15803D', border: '#BBF7D0' },
  awaiting_materials:  { label: 'Awaiting Materials', bg: '#FFF7ED',  color: '#C2410C', border: '#FED7AA' },
  completed:           { label: 'Completed',          bg: '#F8F5F0',  color: 'var(--brand-primary)', border: 'rgba(201,169,110,0.3)' },
  cancelled:           { label: 'Cancelled',          bg: '#F9FAFB',  color: '#9CA3AF', border: '#E5E7EB' },
};

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'default';
}

export function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: size === 'sm' ? 8 : 9,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: size === 'sm' ? '1px 5px' : '2px 7px',
      borderRadius: 'var(--brand-radius)',
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-body)',
    }}>
      {cfg.label}
    </span>
  );
}
```

### `components/primitives/RushBadge.tsx`

```tsx
export function RushBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      padding: '2px 5px',
      borderRadius: 'var(--brand-radius)',
      background: '#DC2626',
      color: 'white',
      fontFamily: 'var(--font-body)',
      flexShrink: 0,
    }}>
      RUSH
    </span>
  );
}
```

### `components/primitives/SLAIndicator.tsx`

```tsx
'use client';

interface SLAIndicatorProps {
  deadline: string | null;
  paused?: boolean;
  size?: 'sm' | 'default';
}

function slaCountdown(deadline: string | null, paused = false) {
  if (!deadline) return { label: '—', urgent: false, paused };
  if (paused)    return { label: 'Paused', urgent: false, paused: true };
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0)          return { label: 'Overdue', urgent: true, paused: false };
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) {
    const m = Math.floor(diff / 60_000);
    return { label: `${m}m`, urgent: true, paused: false };
  }
  if (h < 24) return { label: `${h}h`, urgent: h < 4, paused: false };
  const d = Math.floor(h / 24);
  return { label: `${d}d`, urgent: false, paused: false };
}

export function SLAIndicator({ deadline, paused = false, size = 'default' }: SLAIndicatorProps) {
  const { label, urgent, paused: isPaused } = slaCountdown(deadline, paused);
  const color = isPaused ? '#0891B2' : urgent ? '#DC2626' : '#9CA3AF';
  return (
    <span style={{
      fontSize: size === 'sm' ? 9 : 10,
      fontWeight: 600,
      color,
      fontFamily: 'var(--font-mono)',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
```

### `components/primitives/SectionHeader.tsx`

```tsx
interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: React.ReactNode;
}

export function SectionHeader({ title, count, action }: SectionHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--brand-primary)',
          fontFamily: 'var(--font-body)',
        }}>
          {title}
        </span>
        {count !== undefined && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            background: 'var(--brand-surface-alt)',
            color: '#9CA3AF',
            padding: '1px 6px',
            borderRadius: 'var(--brand-radius)',
            fontFamily: 'var(--font-mono)',
          }}>
            {count}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

### `components/primitives/KPITile.tsx`

```tsx
interface KPITileProps {
  label: string;
  value: string | number;
  accent: string;
  barPct: number;
  signal: string;
  target: string;
}

export function KPITile({ label, value, accent, barPct, signal, target }: KPITileProps) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--brand-radius)',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 300, color: accent, lineHeight: 1, marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ height: 2, background: 'var(--brand-surface-alt)', borderRadius: 1, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${barPct}%`, background: accent, borderRadius: 1, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 9, color: '#6B7280', fontFamily: 'var(--font-body)' }}>{signal}</span>
        <span style={{ fontSize: 8, color: '#9CA3AF', letterSpacing: '0.06em' }}>{target}</span>
      </div>
    </div>
  );
}
```

### `components/primitives/GlassCard.tsx`

```tsx
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function GlassCard({ className, glow = false, style, ...props }: GlassCardProps) {
  return (
    <div
      className={cn('rounded-[var(--brand-radius)] transition-shadow duration-200', className)}
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(var(--brand-card-blur, 0px))',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: glow ? 'var(--glow-accent)' : '0 1px 3px rgba(0,0,0,0.06)',
        ...style,
      }}
      {...props}
    />
  );
}
```

### `components/primitives/index.ts`

```ts
export { StatusBadge }    from './StatusBadge';
export type { RequestStatus } from './StatusBadge';
export { RushBadge }      from './RushBadge';
export { SLAIndicator }   from './SLAIndicator';
export { SectionHeader }  from './SectionHeader';
export { KPITile }        from './KPITile';
export { GlassCard }      from './GlassCard';
```

---

## STEP 4 — Update `/design-system` Page

Replace `app/design-system/page.tsx` with a comprehensive component gallery that renders every atom. Keep `'use client'` at the top.

The page should render the AppShell and inside it, sections for:

1. **Token Swatches** — color grid (navy, gold, cream, surface-alt, sidebar, dark, destructive, success, warning)
2. **Buttons** — all variants + sizes in a flex row
3. **Badges** — all StatusBadge statuses + RushBadge + raw Badge variants
4. **Inputs** — Input, Textarea, a shadcn Select with options
5. **Cards** — Card with CardHeader/CardTitle/CardContent, GlassCard, KPITile (4 sample tiles in 2×2 grid)
6. **Tabs** — sample Tabs with 3 tab panels
7. **SLAIndicator** — 4 states: overdue, urgent (2h), normal (3d), paused
8. **SectionHeader** — 2 examples: with count, with action button
9. **Typography** — full type scale as in the previous smoke test
10. **Dialog** — a Button that opens a Dialog on click
11. **Framer Motion** — a small grid of 4 cards that animate in with `fadeIn` on mount

Use real-looking content throughout — luxury real estate context (property addresses, agent names, material types, SLA times). No "Lorem ipsum".

---

## STEP 5 — Verify

```bash
cd apps/platform
pnpm type-check
pnpm build
```

Report:
1. `pnpm type-check` — 0 errors?
2. `pnpm build` — 0 errors? All routes still compiled?
3. Does `/design-system` render all 11 sections without console errors?
4. Do shadcn Button variants show navy primary + gold focus ring?
5. Do StatusBadge colors match the config (blue=submitted, green=in_progress, etc.)?
6. Does the Framer Motion fade-in work on the card grid?
7. Do existing routes (`/requests`, `/triage`, `/queue`, `/reports`) still work?

---

## CONSTRAINTS

- Do NOT modify `components/IntakeUI.jsx`
- Do NOT modify any existing route pages
- Do NOT touch `apps/premium-site`
- All custom primitives use inline styles + CSS vars — NOT Tailwind utility classes
- shadcn component overrides use Tailwind utility classes with `[var(--token)]` syntax — this is correct for shadcn
- If a shadcn component override causes a TypeScript error on a variant that doesn't exist in the type, add the variant to the type union
- `GlassCard` blur is `0px` by default (controlled by `--brand-card-blur` token) — do not hardcode a blur value
- Keep all Framer Motion usage behind `'use client'` — no server component animation

---

## WHAT SUCCESS LOOKS LIKE

```
apps/platform/
├── lib/
│   └── motion.ts                  ✓ spring, springGentle, fadeIn, slideInRight, scaleIn
├── components/
│   ├── ui/                        ✓ 17 shadcn components, navy/gold themed
│   └── primitives/
│       ├── StatusBadge.tsx        ✓ 8 statuses, correct colors
│       ├── RushBadge.tsx          ✓ red, uppercase
│       ├── SLAIndicator.tsx       ✓ mono font, 4 states
│       ├── SectionHeader.tsx      ✓ uppercase label + count chip + optional action
│       ├── KPITile.tsx            ✓ display font value, progress bar, signal + target
│       ├── GlassCard.tsx          ✓ glass bg, optional glow
│       └── index.ts               ✓ barrel export
└── app/
    └── design-system/
        └── page.tsx               ✓ 11 sections, all atoms rendered live
```

`pnpm build` passes. `/design-system` is a live working component gallery. All 17 shadcn components show navy/gold. All 6 custom primitives render correctly. Existing routes untouched.
