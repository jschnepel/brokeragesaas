# Phase 2 — Prompt 6: Component Library Token Editor
# Claude Code — run from monorepo root: real-estate-platform/
# Build exactly what is specified. No alternatives. Flag blockers and continue.

---

## CONTEXT

Full platform is live with real DB. This prompt adds the Component Library admin panel — a live token editor where changing a color, font, or effect token updates the entire platform in real time and saves to Neon.

Do NOT touch:
- Any existing route pages or views
- `apps/premium-site`
- Service classes or server actions from Prompt 5

---

## WHAT YOU ARE BUILDING

A new route `/component-library` with two modes:
- **Preview mode** — grid of all components (shadcn + primitives + feature components), click to expand
- **Edit mode** — token editor panel slides in, changes apply live to every component in the preview, Save persists to Neon

The token editor writes to a `tenant_themes` table in Neon. On app load, the current tenant's theme is injected as a `<style>` tag into the document, overriding `styles/tokens/russ-lyon.css`.

---

## READ FIRST

1. `styles/tokens/russ-lyon.css` — the 9 Layer 1 brand tokens to expose in the editor
2. `styles/tokens/base.css` — understand what cascades from Layer 1
3. `packages/database/src/schema.sql` — understand the pool pattern before adding a new table
4. `components/primitives/index.ts` — all primitives available to render in preview
5. `components/features/index.ts` — all feature components available

---

## STEP 1 — Database: tenant_themes Table

Create migration `packages/database/src/migrations/005_tenant_themes.sql`:

```sql
CREATE TABLE IF NOT EXISTS tenant_themes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL UNIQUE,
  theme_name    TEXT NOT NULL DEFAULT 'Custom',
  tokens        JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the default Russ Lyon theme
INSERT INTO tenant_themes (tenant_id, theme_name, tokens) VALUES (
  'russ-lyon',
  'Russ Lyon Sotheby''s',
  '{
    "brand-primary":       "#0F2B4F",
    "brand-primary-dark":  "#0A1F3A",
    "brand-accent":        "#C9A96E",
    "brand-surface":       "#FAF7F2",
    "brand-surface-alt":   "#F3EFE8",
    "brand-dark":          "#071428",
    "brand-sidebar":       "#0A1F3A",
    "brand-font-display":  "Cormorant Garamond, Georgia, serif",
    "brand-font-body":     "DM Sans, system-ui, sans-serif",
    "brand-font-mono":     "Geist Mono, Fira Code, monospace",
    "brand-radius":        "2px",
    "brand-glow-opacity":  "0.18",
    "brand-card-blur":     "0px",
    "brand-sidebar-width": "224px"
  }'::jsonb
) ON CONFLICT (tenant_id) DO NOTHING;

-- Pre-built alternate theme: Dark Elegance
INSERT INTO tenant_themes (tenant_id, theme_name, tokens) VALUES (
  'russ-lyon-dark',
  'Dark Elegance',
  '{
    "brand-primary":       "#F9F6F1",
    "brand-primary-dark":  "#E8E2D9",
    "brand-accent":        "#C9A96E",
    "brand-surface":       "#0A1F3A",
    "brand-surface-alt":   "#0F2B4F",
    "brand-dark":          "#060F1E",
    "brand-sidebar":       "#060F1E",
    "brand-font-display":  "Cormorant Garamond, Georgia, serif",
    "brand-font-body":     "DM Sans, system-ui, sans-serif",
    "brand-font-mono":     "Geist Mono, Fira Code, monospace",
    "brand-radius":        "2px",
    "brand-glow-opacity":  "0.25",
    "brand-card-blur":     "8px",
    "brand-sidebar-width": "224px"
  }'::jsonb
) ON CONFLICT (tenant_id) DO NOTHING;

-- Pre-built alternate theme: Modern Professional
INSERT INTO tenant_themes (tenant_id, theme_name, tokens) VALUES (
  'russ-lyon-modern',
  'Modern Professional',
  '{
    "brand-primary":       "#1A1A2E",
    "brand-primary-dark":  "#0F0F1A",
    "brand-accent":        "#E94560",
    "brand-surface":       "#F8F9FA",
    "brand-surface-alt":   "#EAECEF",
    "brand-dark":          "#0D0D1A",
    "brand-sidebar":       "#1A1A2E",
    "brand-font-display":  "Cormorant Garamond, Georgia, serif",
    "brand-font-body":     "DM Sans, system-ui, sans-serif",
    "brand-font-mono":     "Geist Mono, Fira Code, monospace",
    "brand-radius":        "6px",
    "brand-glow-opacity":  "0.2",
    "brand-card-blur":     "0px",
    "brand-sidebar-width": "224px"
  }'::jsonb
) ON CONFLICT (tenant_id) DO NOTHING;
```

Run the migration:
```bash
cd real-estate-platform
npx tsx -e "
const { pool } = require('./packages/database/src/index');
const fs = require('fs');
const sql = fs.readFileSync('./packages/database/src/migrations/005_tenant_themes.sql', 'utf8');
pool.query(sql).then(() => { console.log('tenant_themes created'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
"
```

---

## STEP 2 — ThemeService

Create `apps/platform/services/ThemeService.ts`:

```ts
import { pool } from '@platform/database';

export interface ThemeTokens {
  'brand-primary': string;
  'brand-primary-dark': string;
  'brand-accent': string;
  'brand-surface': string;
  'brand-surface-alt': string;
  'brand-dark': string;
  'brand-sidebar': string;
  'brand-font-display': string;
  'brand-font-body': string;
  'brand-font-mono': string;
  'brand-radius': string;
  'brand-glow-opacity': string;
  'brand-card-blur': string;
  'brand-sidebar-width': string;
}

export interface TenantTheme {
  id: string;
  tenantId: string;
  themeName: string;
  tokens: ThemeTokens;
  updatedAt: string;
}

export class ThemeService {
  static async getTheme(tenantId: string): Promise<TenantTheme | null> {
    const { rows } = await pool.query(
      'SELECT * FROM tenant_themes WHERE tenant_id = $1',
      [tenantId]
    );
    if (!rows[0]) return null;
    return {
      id: rows[0].id,
      tenantId: rows[0].tenant_id,
      themeName: rows[0].theme_name,
      tokens: rows[0].tokens,
      updatedAt: rows[0].updated_at,
    };
  }

  static async getAllThemes(): Promise<TenantTheme[]> {
    const { rows } = await pool.query(
      'SELECT * FROM tenant_themes ORDER BY created_at ASC'
    );
    return rows.map(r => ({
      id: r.id,
      tenantId: r.tenant_id,
      themeName: r.theme_name,
      tokens: r.tokens,
      updatedAt: r.updated_at,
    }));
  }

  static async saveTheme(tenantId: string, themeName: string, tokens: ThemeTokens): Promise<void> {
    await pool.query(
      `INSERT INTO tenant_themes (tenant_id, theme_name, tokens)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id) DO UPDATE
       SET theme_name = EXCLUDED.theme_name,
           tokens = EXCLUDED.tokens,
           updated_at = NOW()`,
      [tenantId, themeName, JSON.stringify(tokens)]
    );
  }

  static tokensToCSS(tokens: ThemeTokens): string {
    return `:root {\n${Object.entries(tokens)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join('\n')}\n}`;
  }
}
```

Add ThemeService to `services/index.ts`.

---

## STEP 3 — Theme Server Actions

Add to `app/actions/intake.ts` (or create `app/actions/theme.ts`):

```ts
'use server';
import { auth } from '@/auth';
import { ThemeService, ThemeTokens } from '@/services';

export async function getCurrentTheme() {
  // No auth required — theme is public
  return ThemeService.getTheme('russ-lyon');
}

export async function getAllThemes() {
  return ThemeService.getAllThemes();
}

export async function saveTheme(themeName: string, tokens: ThemeTokens) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  // Only marketing_manager, executive, platform_admin can save themes
  const allowed = ['marketing_manager', 'executive', 'platform_admin'];
  if (!allowed.includes(session.user.role)) throw new Error('Forbidden');
  await ThemeService.saveTheme('russ-lyon', themeName, tokens);
}
```

---

## STEP 4 — Theme Provider

Create `components/ThemeProvider.tsx`:

```tsx
'use client';
import { useEffect } from 'react';
import type { ThemeTokens } from '@/services/ThemeService';

interface ThemeProviderProps {
  tokens: ThemeTokens | null;
  children: React.ReactNode;
}

export function ThemeProvider({ tokens, children }: ThemeProviderProps) {
  useEffect(() => {
    if (!tokens) return;
    // Inject tokens as CSS vars on :root
    const styleId = 'platform-theme-tokens';
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = `:root {\n${Object.entries(tokens)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join('\n')}\n}`;
  }, [tokens]);

  return <>{children}</>;
}
```

Update `app/layout.tsx` to load the theme from DB server-side and pass to ThemeProvider:

```tsx
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeService } from '@/services';

export default async function RootLayout({ children }) {
  const theme = await ThemeService.getTheme('russ-lyon');

  return (
    <html lang="en">
      <body>
        <ThemeProvider tokens={theme?.tokens ?? null}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

This means every page load gets the current saved theme injected before render. No flash.

---

## STEP 5 — Token Editor Component

Create `components/features/TokenEditor.tsx`:

This is the editor panel that slides in from the right side of the Component Library page.

```
Props:
  tokens: ThemeTokens
  onChange: (tokens: ThemeTokens) => void   // called on every keystroke — drives live preview
  onSave: (themeName: string) => void
  onReset: () => void
  prebuiltThemes: TenantTheme[]
  onApplyPrebuilt: (theme: TenantTheme) => void
  saving?: boolean
```

Layout — 4 sections:

### 1. Pre-built themes
Horizontal row of theme chips. Each shows theme name. Click applies to editor immediately (calls `onChange` with that theme's tokens). Does not save until user hits Save.

### 2. Colors
Each token gets a row: swatch square (clicking opens native color picker `<input type="color">`) + hex text input. Tokens to show:
- Primary (`brand-primary`) — label: "Primary"
- Primary Dark (`brand-primary-dark`) — label: "Sidebar Gradient"
- Accent (`brand-accent`) — label: "Accent / Gold"
- Surface (`brand-surface`) — label: "Background"
- Surface Alt (`brand-surface-alt`) — label: "Surface Alt"
- Dark (`brand-dark`) — label: "Deep Dark"
- Sidebar (`brand-sidebar`) — label: "Sidebar"

Color swatch + text input are synced — changing either updates the token immediately and calls `onChange`.

### 3. Typography
- Display font (`brand-font-display`) — text input
- Body font (`brand-font-body`) — text input
- Mono font (`brand-font-mono`) — text input

### 4. Effects
- Border Radius (`brand-radius`) — range slider 0–16px + text display
- Glow Opacity (`brand-glow-opacity`) — range slider 0–0.5 step 0.01 + text display
- Card Blur (`brand-card-blur`) — range slider 0–20px + text display

### Footer
- Theme name input (text)
- "Save Theme" button (default variant, shows spinner while saving)
- "Reset to Default" button (outline)

Width: 320px. Background: white. Border-left: `1px solid var(--color-border)`. Full height, sticky.

---

## STEP 6 — Component Library Page

Create `app/component-library/page.tsx` (`'use client'`).

```
State:
  editMode: boolean        — toggle between preview and edit
  liveTokens: ThemeTokens  — current editor state, applied live to preview
  savedTheme: TenantTheme  — loaded on mount
  prebuiltThemes: TenantTheme[]
  saving: boolean
  themeName: string
```

On mount: `getAllThemes()` → set `savedTheme` (russ-lyon) + `prebuiltThemes` (all 3) + `liveTokens`

Layout:

```
┌─────────────────────────────────────────────────────┐
│  COMPONENT LIBRARY          [Edit Theme] [← Back]   │  ← TopBar
├──────────────────────────────────────┬──────────────┤
│                                      │              │
│  Preview grid                        │ TokenEditor  │
│  (all components)                    │ (320px)      │
│                                      │              │  ← only visible in edit mode
│                                      │              │
└──────────────────────────────────────┴──────────────┘
```

When `editMode` is true:
- Apply `liveTokens` to the document immediately via a `<style>` tag (same pattern as ThemeProvider but in-page, so it overrides the ThemeProvider styles during editing)
- Show TokenEditor panel on the right
- Every component in the preview grid re-renders with the live tokens because they all read from CSS vars

When `editMode` is false:
- Remove the in-page `<style>` tag override (reverts to saved theme)
- Hide TokenEditor

**Preview grid** — 12 sections, each in a Card:

1. **Color Tokens** — swatch grid (auto-updates as tokens change)
2. **Typography** — type scale specimens
3. **Buttons** — all variants + sizes
4. **Badges** — StatusBadge all statuses + RushBadge
5. **Inputs** — Input, Textarea, Select
6. **Cards** — Card, GlassCard (glow=true), KPITile ×2
7. **Tabs** — shadcn Tabs with 3 panels
8. **Dialogs** — Button that opens Dialog
9. **SLA Indicators** — 4 states
10. **RequestCard** — full variant with mock data
11. **AppShell Preview** — a miniaturized sidebar (non-interactive, just CSS) showing how the sidebar looks with current tokens
12. **Effect Preview** — a card with hover glow, showing current glow-opacity + blur values

Nav: add "Component Library" to the nav items for `marketing_manager` and `executive` roles. Link: `/component-library`.

---

## STEP 7 — Add to Nav

Update `ManagerDashboard.tsx` and `ExecutiveDashboard.tsx` nav items to include:

```ts
{ label: 'Component Library', href: '/component-library', icon: ... }
```

---

## STEP 8 — Verify

```bash
cd apps/platform
pnpm type-check
pnpm build
```

Manual test:
1. Login as `lex` → nav shows "Component Library"
2. `/component-library` loads all 12 preview sections
3. Click "Edit Theme" → TokenEditor slides in
4. Change Primary color to `#1B4332` (dark green) → sidebar in preview updates immediately
5. Change Accent to `#D4AF37` → gold elements update
6. Click pre-built "Dark Elegance" → all tokens swap instantly
7. Click "Reset to Default" → back to navy/gold
8. Click "Save Theme" → saves to Neon, toast confirmation
9. Reload the page → saved theme is still applied (loaded from DB via ThemeProvider)
10. Login as `david` → also sees Component Library in nav

Report:
1. `pnpm type-check` — 0 errors?
2. `pnpm build` — 0 errors?
3. Does live token editing update the preview in real time?
4. Do pre-built themes apply instantly?
5. Does save persist to Neon and survive reload?
6. Does ThemeProvider inject saved theme on every page — not just `/component-library`?

---

## CONSTRAINTS

- Token editor only available to `marketing_manager`, `executive`, `platform_admin` — enforce in the save action only (page is viewable by anyone logged in)
- Live preview works by writing a `<style>` tag — do NOT use React state to pass CSS vars down as props to every component. CSS vars cascade naturally.
- No new npm packages
- If native `<input type="color">` styling is limited on Windows, that's acceptable — functionality over cosmetics
- `brand-sidebar-width` and font tokens are text inputs only, not color pickers

---

## WHAT SUCCESS LOOKS LIKE

```
apps/platform/
├── services/
│   └── ThemeService.ts          ✓ getTheme, getAllThemes, saveTheme, tokensToCSS
├── app/
│   ├── actions/theme.ts         ✓ getCurrentTheme, getAllThemes, saveTheme
│   ├── layout.tsx               ✓ ThemeProvider wrapping children, theme loaded from DB
│   └── component-library/
│       └── page.tsx             ✓ 12 sections, edit mode, live preview
├── components/
│   ├── ThemeProvider.tsx        ✓ injects CSS vars on mount
│   └── features/
│       └── TokenEditor.tsx      ✓ colors, typography, effects, save, prebuilt themes
└── packages/database/src/
    └── migrations/
        └── 005_tenant_themes.sql ✓ table + 3 seeded themes
```

Changing a token updates every component on screen in real time. Saving persists to Neon. Reloading any page in the app applies the saved theme. The platform is fully rebrandable from the browser.
