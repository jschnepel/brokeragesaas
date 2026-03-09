# Phase 2 — Prompt 1: Foundation
# Claude Code — run from monorepo root: real-estate-platform/
# Build exactly what is specified. No alternatives. Flag blockers and continue.

---

## WHAT YOU ARE BUILDING

Upgrading `apps/platform` from its current Tailwind v3 + inline styles setup to:
- **Tailwind v4** (CSS-first, no `tailwind.config.ts`)
- **shadcn/ui canary** (v4-compatible components)
- **4-layer token system** (brand → semantic → shadcn → component)
- **AppShell skeleton** — dark sidebar + light content area

`apps/premium-site` is completely off-limits. Do not touch it.
`IntakeUI.jsx` stays untouched — it is the behavioral reference for later prompts.

---

## READ FIRST

Before writing any code, read:
1. `apps/platform/package.json` — note current Next.js version, existing deps
2. `apps/platform/app/layout.tsx` — current font/globals setup
3. `apps/platform/components/IntakeUI.jsx` — do NOT modify, just understand the design tokens in use:
   - Navy: `#0F2B4F`
   - Gold: `#C9A96E`
   - Cream: `#FAF7F2`
   - Fonts: Cormorant Garamond (display), DM Sans (body)
4. `apps/platform/app/globals.css` if it exists — understand current CSS

---

## STEP 1 — Upgrade to Tailwind v4

Remove v3, install v4 and the Next.js v4 plugin.

```bash
cd apps/platform
pnpm remove tailwindcss postcss autoprefixer
pnpm add tailwindcss@next @tailwindcss/nextjs@next
```

Delete `tailwind.config.ts` if it exists. Tailwind v4 has no config file.

Update `postcss.config.js` (or create it):
```js
// apps/platform/postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

Update `next.config.ts` to remove any tailwind-related config — v4 handles it via the postcss plugin automatically.

---

## STEP 2 — Install shadcn canary

Run the shadcn v4-compatible init from inside `apps/platform`:

```bash
cd apps/platform
npx shadcn@canary init
```

When prompted:
- Style: **Default**
- Base color: **Neutral** (we will override with tokens)
- CSS variables: **Yes**
- `components.json` path: accept default

This creates:
- `components/ui/` — shadcn component source files
- Updates `app/globals.css` with shadcn CSS vars
- `components.json` at root of `apps/platform`

After init, install these shadcn components:

```bash
npx shadcn@canary add button badge avatar card dialog sheet tabs select input textarea separator skeleton tooltip dropdown-menu command scroll-area popover
```

If any component fails to install, skip it, note the failure, and continue.

---

## STEP 3 — Token System

Create `apps/platform/styles/tokens/` with three files.

### `apps/platform/styles/tokens/russ-lyon.css`
```css
/* Layer 1 — Brand tokens for Russ Lyon Sotheby's */
/* Admin-editable. Change these to rebrand the entire platform. */
:root {
  --brand-primary:       #0F2B4F;
  --brand-primary-dark:  #0A1F3A;
  --brand-accent:        #C9A96E;
  --brand-accent-muted:  rgba(201, 169, 110, 0.15);
  --brand-surface:       #FAF7F2;
  --brand-surface-alt:   #F3EFE8;
  --brand-dark:          #071428;
  --brand-sidebar:       #0A1F3A;

  --brand-font-display:  'Cormorant Garamond', Georgia, serif;
  --brand-font-body:     'DM Sans', system-ui, sans-serif;
  --brand-font-mono:     'Geist Mono', 'Fira Code', monospace;

  --brand-radius:        2px;
  --brand-glow-opacity:  0.18;
  --brand-card-blur:     0px;
  --brand-sidebar-width: 224px;
}
```

### `apps/platform/styles/tokens/base.css`
```css
/* Layer 2 — Semantic tokens (stable, never changes per tenant) */
/* Layer 3 — shadcn CSS var overrides (mapped to semantic) */
:root {
  /* Semantic */
  --color-primary:      var(--brand-primary);
  --color-primary-dark: var(--brand-primary-dark);
  --color-accent:       var(--brand-accent);
  --color-accent-muted: var(--brand-accent-muted);
  --color-surface:      var(--brand-surface);
  --color-surface-alt:  var(--brand-surface-alt);
  --color-sidebar:      var(--brand-sidebar);
  --color-border:       #E5E0D8;
  --color-border-dark:  rgba(255,255,255,0.08);

  --font-display:       var(--brand-font-display);
  --font-body:          var(--brand-font-body);
  --font-mono:          var(--brand-font-mono);

  /* shadcn CSS var overrides — maps shadcn primitives to our brand */
  --background:         var(--brand-surface);
  --foreground:         var(--brand-primary);
  --card:               #FFFFFF;
  --card-foreground:    var(--brand-primary);
  --popover:            #FFFFFF;
  --popover-foreground: var(--brand-primary);
  --primary:            var(--brand-primary);
  --primary-foreground: #FFFFFF;
  --secondary:          var(--brand-surface-alt);
  --secondary-foreground: var(--brand-primary);
  --muted:              var(--brand-surface-alt);
  --muted-foreground:   #9CA3AF;
  --accent:             var(--brand-accent-muted);
  --accent-foreground:  var(--brand-primary);
  --destructive:        #DC2626;
  --destructive-foreground: #FFFFFF;
  --border:             var(--color-border);
  --input:              var(--color-border);
  --ring:               var(--brand-accent);
  --radius:             var(--brand-radius);

  /* Type scale — single source of truth */
  --text-xs:    0.6875rem;  /* 11px */
  --text-sm:    0.75rem;    /* 12px */
  --text-base:  0.875rem;   /* 14px */
  --text-lg:    1rem;       /* 16px */
  --text-xl:    1.25rem;    /* 20px */
  --text-2xl:   1.5rem;     /* 24px */
  --text-display: 2rem;     /* 32px */

  /* Layer 4 — Component-level tokens */
  --sidebar-width:       var(--brand-sidebar-width);
  --topbar-height:       52px;
  --card-radius:         var(--brand-radius);
  --glow-accent:         0 0 0 1px var(--brand-accent), 0 0 20px rgba(201,169,110,var(--brand-glow-opacity));
}
```

### `apps/platform/styles/tokens/dark.css`
```css
/* Dark mode overrides (future use — scaffold now) */
[data-theme="dark"] {
  --background:     var(--brand-dark);
  --foreground:     #F9F6F1;
  --card:           #0F2B4F;
  --card-foreground: #F9F6F1;
  --border:         rgba(255,255,255,0.08);
  --muted:          rgba(255,255,255,0.05);
  --muted-foreground: rgba(255,255,255,0.4);
}
```

---

## STEP 4 — Update globals.css

Replace (or rewrite) `apps/platform/app/globals.css` entirely:

```css
@import "tailwindcss";
@import "../styles/tokens/russ-lyon.css";
@import "../styles/tokens/base.css";

/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

/* Geist Mono — from Vercel CDN */
@import url('https://cdn.jsdelivr.net/npm/geist@1.3.0/dist/fonts/geist-mono/style.css');

@theme {
  --color-primary:        var(--brand-primary);
  --color-accent:         var(--brand-accent);
  --color-surface:        var(--brand-surface);
  --color-sidebar:        var(--brand-sidebar);
  --color-border:         #E5E0D8;
  --font-family-display:  var(--brand-font-display);
  --font-family-body:     var(--brand-font-body);
  --font-family-mono:     var(--brand-font-mono);
  --radius-DEFAULT:       var(--brand-radius);
}

* {
  box-sizing: border-box;
  border-color: var(--color-border);
}

html {
  font-family: var(--font-body);
  font-size: 14px;
  background: var(--brand-surface);
  color: var(--brand-primary);
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
  min-height: 100vh;
}

/* Scrollbar — subtle */
::-webkit-scrollbar       { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #C4B9AA; }
```

---

## STEP 5 — AppShell

Create the shell layout components. These are NEW files alongside the existing structure — do not replace existing route pages yet.

### `apps/platform/components/shell/Sidebar.tsx`

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  user?: { name: string; role: string; initials: string };
}

export function Sidebar({ items, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, var(--brand-sidebar) 0%, var(--brand-dark) 100%)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--brand-accent)', fontFamily: 'var(--font-body)' }}>
          Russ Lyon
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
          Sotheby's International Realty
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 20px',
                margin: '1px 8px',
                borderRadius: 3,
                background: active ? 'linear-gradient(90deg, var(--brand-accent-muted), transparent)' : 'transparent',
                borderLeft: active ? '2px solid var(--brand-accent)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ color: active ? 'var(--brand-accent)' : 'rgba(255,255,255,0.45)', display: 'flex', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  letterSpacing: '0.04em',
                  color: active ? '#F9F6F1' : 'rgba(255,255,255,0.5)',
                }}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--brand-accent-muted)',
            border: '1px solid rgba(201,169,110,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-accent)', fontFamily: 'var(--font-body)' }}>
              {user.initials}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {user.role}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
```

### `apps/platform/components/shell/TopBar.tsx`

```tsx
'use client';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div style={{
      height: 'var(--topbar-height)',
      background: 'white',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-primary)', lineHeight: 1 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, letterSpacing: '0.04em' }}>
            {subtitle}
          </div>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
```

### `apps/platform/components/shell/AppShell.tsx`

```tsx
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  sidebarItems: Parameters<typeof Sidebar>[0]['items'];
  user?: Parameters<typeof Sidebar>[0]['user'];
  topBarTitle: string;
  topBarSubtitle?: string;
  topBarActions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  sidebarItems,
  user,
  topBarTitle,
  topBarSubtitle,
  topBarActions,
  children,
}: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--brand-surface)' }}>
      <Sidebar items={sidebarItems} user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar title={topBarTitle} subtitle={topBarSubtitle} actions={topBarActions} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
```

### `apps/platform/components/shell/index.ts`

```ts
export { AppShell } from './AppShell';
export { Sidebar } from './Sidebar';
export { TopBar } from './TopBar';
```

---

## STEP 6 — Smoke Test Page

Create a test page that verifies the full stack is wired correctly. This is temporary — it gets deleted in Prompt 4.

### `apps/platform/app/design-system/page.tsx`

```tsx
import { AppShell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/design-system',         icon: <span>◈</span> },
  { label: 'Requests',    href: '/design-system/requests', icon: <span>◫</span> },
  { label: 'Design Queue',href: '/design-system/queue',    icon: <span>◧</span> },
  { label: 'Reports',     href: '/design-system/reports',  icon: <span>◩</span> },
];

export default function DesignSystemPage() {
  return (
    <AppShell
      sidebarItems={NAV_ITEMS}
      user={{ name: 'Lex Baum', role: 'Marketing Manager', initials: 'LB' }}
      topBarTitle="Design System"
      topBarSubtitle="Token verification"
    >
      {/* Token swatches */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12 }}>
          Brand Tokens
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Primary',      bg: 'var(--brand-primary)',      text: '#fff' },
            { label: 'Accent',       bg: 'var(--brand-accent)',       text: '#fff' },
            { label: 'Surface',      bg: 'var(--brand-surface)',      text: 'var(--brand-primary)' },
            { label: 'Surface Alt',  bg: 'var(--brand-surface-alt)',  text: 'var(--brand-primary)' },
            { label: 'Sidebar',      bg: 'var(--brand-sidebar)',      text: '#fff' },
            { label: 'Dark',         bg: 'var(--brand-dark)',         text: '#fff' },
          ].map(s => (
            <div key={s.label} style={{
              width: 100, height: 60, background: s.bg, border: '1px solid var(--color-border)',
              borderRadius: 2, display: 'flex', alignItems: 'flex-end', padding: '6px 8px',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: '0.06em' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* shadcn components */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12 }}>
          shadcn Components (themed)
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <Button>Primary Button</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="secondary">Secondary</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>

      {/* Type scale */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12 }}>
          Type Scale
        </div>
        <Card>
          <CardContent style={{ padding: 20 }}>
            {[
              { label: 'display', size: 'var(--text-display)', family: 'var(--font-display)', text: 'Sotheby's International Realty' },
              { label: '2xl',     size: 'var(--text-2xl)',     family: 'var(--font-display)', text: 'Desert Mountain Estate' },
              { label: 'xl',      size: 'var(--text-xl)',      family: 'var(--font-body)',    text: 'Open House Flyer — 16020 N Horseshoe Dr' },
              { label: 'lg',      size: 'var(--text-lg)',      family: 'var(--font-body)',    text: 'Marketing Request submitted by Yong Choi' },
              { label: 'base',    size: 'var(--text-base)',    family: 'var(--font-body)',    text: 'SLA deadline: 48hr from assignment — currently on track' },
              { label: 'sm',      size: 'var(--text-sm)',      family: 'var(--font-body)',    text: 'REQ-0042 · In Progress · Assigned to Lex Baum' },
              { label: 'xs',      size: 'var(--text-xs)',      family: 'var(--font-body)',    text: 'SUBMITTED · 2 DAYS AGO · RUSH' },
              { label: 'mono',    size: 'var(--text-sm)',      family: 'var(--font-mono)',    text: '14:32:07  ·  SLA  92.4%  ·  req-0042' },
            ].map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', width: 48, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{t.label}</span>
                <span style={{ fontSize: t.size, fontFamily: t.family, color: 'var(--brand-primary)', lineHeight: 1.4 }}>{t.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Glow effect test */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12 }}>
          Accent Glow (hover)
        </div>
        <div style={{
          display: 'inline-block',
          padding: '12px 20px',
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--brand-radius)',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s ease',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--glow-accent)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-primary)' }}>Hover for gold glow</span>
        </div>
      </div>
    </AppShell>
  );
}
```

---

## STEP 7 — Verify and Report

Run from `apps/platform`:

```bash
pnpm type-check
pnpm build
```

Report the following:
1. Did Tailwind v4 install cleanly? Any peer dep warnings?
2. Did shadcn canary init succeed? What version was installed?
3. Which shadcn components installed successfully / which failed?
4. Does `pnpm build` pass with 0 errors?
5. Does `http://localhost:3003/design-system` render the AppShell with dark sidebar + light content?
6. Are brand tokens (navy, gold, cream) visible in the color swatches?
7. Are Cormorant Garamond and DM Sans loading?
8. Does hovering the glow test div show gold bloom?

---

## CONSTRAINTS

- Do NOT modify `apps/platform/components/IntakeUI.jsx`
- Do NOT modify `apps/platform/app/login/page.tsx`
- Do NOT modify any existing route pages (`/requests`, `/triage`, `/queue`, `/reports`)
- Do NOT touch `apps/premium-site` in any way
- `apps/platform/app/layout.tsx` CAN be updated to add the google fonts `<link>` tag if needed
- If Tailwind v4 conflicts with an existing shadcn component, prefer the token-based CSS var approach over utility classes — we are using CSS vars as the source of truth, not Tailwind utility classes directly
- All new shell components use inline styles + CSS vars, not Tailwind utility classes — this keeps them environment-agnostic for the Phase 2 migration
- If `@tailwindcss/nextjs` doesn't exist as a package name, try `@tailwindcss/postcss` as the PostCSS plugin instead — confirm which one resolves

---

## WHAT SUCCESS LOOKS LIKE

```
apps/platform/
├── styles/
│   └── tokens/
│       ├── russ-lyon.css    ✓ brand tokens
│       ├── base.css         ✓ semantic + shadcn overrides
│       └── dark.css         ✓ dark mode scaffold
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx     ✓ composites sidebar + topbar
│   │   ├── Sidebar.tsx      ✓ dark nav with active gold accent
│   │   ├── TopBar.tsx       ✓ white topbar with title
│   │   └── index.ts
│   └── ui/                  ✓ shadcn components (themed to navy/gold)
├── app/
│   ├── globals.css          ✓ Tailwind v4 @import, tokens wired
│   └── design-system/
│       └── page.tsx         ✓ smoke test — tokens + shadcn + AppShell
└── components.json          ✓ shadcn config
```

`/design-system` renders without errors. Dark sidebar visible. Navy/gold tokens applied to shadcn components. Type scale shows Cormorant Garamond for display, DM Sans for body, monospace for data.

The existing prototype at `/requests`, `/triage`, etc. still works — nothing was broken.
