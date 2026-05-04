# Yong2 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new, dark cinematic editorial marketing site for Yong Choi at top-level `yong2/` — home, portfolio (with detail), communities (with detail), about, contact. Live listings from RDS/Spark, live community KPIs from existing materialized views. Analytics stays on the existing prototype.

**Architecture:** Standalone Next.js 16 App Router application (parallel to `Jeane/jeane-site/`). SSG + ISR. Dark-first Tailwind v4 design system ("Midnight & Stone"). Direct RDS reads via `pg`. Contact form hits a Route Handler that emails via Resend. Deployed on Vercel with Fluid Compute defaults.

**Tech Stack:** Next.js 16.2.4 · React 19.2.4 · TypeScript strict · Tailwind CSS v4 · `pg` for RDS · `resend` for email · `vitest` for unit tests · MapLibre GL for maps.

**Branching:** Work on a new branch `feature/yong2-redesign` off `dev`. Commit per task. PR to `dev` at the end.

**Design spec:** `docs/superpowers/specs/2026-04-24-yong2-redesign-design.md`.

**Commit authorship:** All commits authored by Joey Schnepel (joeyschnepel@gmail.com). Never add Co-Authored-By, Signed-off-by, or any AI/Claude attribution.

---

## File Structure

Top-level `yong2/` (parallel to `Jeane/`, NOT inside `real-estate-platform/`).

```
yong2/
├── README.md                              — purpose, dev commands
├── CLAUDE.md                              — scope, stack, rules (like Jeane's)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── vercel.ts                              — Vercel project config
├── .env.example                           — documented env vars
├── .gitignore
├── app/
│   ├── layout.tsx                         — root layout, fonts, metadata
│   ├── page.tsx                           — Home
│   ├── globals.css                        — Tailwind v4 + CSS variables
│   ├── portfolio/
│   │   ├── page.tsx                       — Listings grid
│   │   └── [slug]/page.tsx                — Listing detail
│   ├── communities/
│   │   ├── page.tsx                       — Communities index
│   │   └── [slug]/page.tsx                — Community detail
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── api/contact/route.ts               — Contact form POST
│   ├── sitemap.ts                         — next-sitemap route
│   ├── robots.ts
│   └── opengraph-image.tsx                — Default OG
├── components/
│   ├── chrome/Navigation.tsx
│   ├── chrome/Footer.tsx
│   ├── chrome/SothebysLockup.tsx
│   ├── hero/HeroCinematic.tsx
│   ├── home/HomeIntro.tsx
│   ├── home/FeaturedPortfolio.tsx
│   ├── home/HomeCommunities.tsx
│   ├── home/AboutSnippet.tsx
│   ├── home/MarketBlurb.tsx
│   ├── home/ContactCTA.tsx
│   ├── portfolio/ListingGrid.tsx
│   ├── portfolio/ListingTile.tsx
│   ├── portfolio/ListingDetailHero.tsx
│   ├── portfolio/ListingFactSheet.tsx
│   ├── portfolio/ListingGallery.tsx
│   ├── communities/CommunityIndex.tsx
│   ├── communities/CommunityCard.tsx
│   ├── communities/CommunityHero.tsx
│   ├── communities/CommunityKpis.tsx
│   ├── about/AboutSplit.tsx
│   ├── about/StatsStrip.tsx
│   ├── contact/ContactForm.tsx
│   └── shared/
│       ├── CapsLabel.tsx
│       ├── HairlineDivider.tsx
│       ├── SectionFrame.tsx
│       └── formatters.ts
├── lib/
│   ├── db.ts                              — pg Pool singleton
│   ├── listings.ts                        — RDS reads for listings
│   ├── communities.ts                     — RDS reads + curated slug list
│   ├── contact.ts                         — Resend wrapper
│   ├── rate-limit.ts                      — in-memory rate limit
│   └── seo.ts                             — metadata helpers
├── content/
│   ├── yong.ts                            — bio copy, stats, contact facts
│   ├── communities.ts                     — narrative per community slug
│   └── home.ts                            — home page copy strings
├── styles/
│   └── tokens.css                         — CSS custom properties (palette)
├── public/
│   ├── hero/                              — hero posters, fallback stills
│   ├── og/                                — OG images
│   └── favicon.ico
└── tests/
    ├── setup.ts
    ├── lib/listings.test.ts
    ├── lib/communities.test.ts
    ├── lib/rate-limit.test.ts
    ├── api/contact.test.ts
    └── smoke.spec.ts                       — Playwright smoke tests
```

---

## Conventions & notes

- Named exports only (no default exports for shared components).
- `'use client'` only when `useState` / `useEffect` / event handlers are actually needed.
- No `any` — `import type { X }` for type-only imports.
- Tailwind v4 tokens via CSS variables, consumed via `theme()` and arbitrary values.
- RDS pool: `max: 5`, `connectionTimeoutMillis: 5000`, `ssl: { rejectUnauthorized: false }`.
- Content lives in `content/*.ts` — typed TS, not JSON, not a CMS.
- All routes are SSG or ISR (`revalidate = 3600`). No client-side data fetching for content.
- Font loading via `next/font/google` — no external `<link>` tags.

---

## Task 1: Scaffold yong2/ — Next.js app shell

**Files:**
- Create: `yong2/package.json`
- Create: `yong2/tsconfig.json`
- Create: `yong2/next.config.ts`
- Create: `yong2/postcss.config.mjs`
- Create: `yong2/.gitignore`
- Create: `yong2/.env.example`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p yong2
cd yong2
```

- [ ] **Step 2: Write `yong2/package.json`**

```json
{
  "name": "yong2",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "pg": "^8.13.1",
    "resend": "^4.0.0",
    "maplibre-gl": "^4.7.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/pg": "^8.11.10",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@playwright/test": "^1.49.0",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Write `yong2/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `yong2/next.config.ts`**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'rlsir-platform-assets-us-east-1.s3.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.sparkplatform.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {},
};

export default nextConfig;
```

- [ ] **Step 5: Write `yong2/postcss.config.mjs`**

```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
};
```

- [ ] **Step 6: Write `yong2/.gitignore`**

```
node_modules
.next
out
coverage
.env*.local
.env
!.env.example
.vercel
playwright-report
test-results
*.tsbuildinfo
```

- [ ] **Step 7: Write `yong2/.env.example`**

```
# RDS — read-only listings and community KPIs
RDS_DATABASE_URL=postgres://user:pass@rlsir-db.ck5i8kmcu0jw.us-east-1.rds.amazonaws.com:5432/rlsir?sslmode=require

# Contact form
RESEND_API_KEY=re_xxxxx
CONTACT_TO_EMAIL=yong@example.com
CONTACT_FROM_EMAIL=no-reply@yongchoi.com

# Site metadata
NEXT_PUBLIC_SITE_URL=https://yongchoi.com
```

- [ ] **Step 8: Install dependencies**

Run: `cd yong2 && npm install`
Expected: clean install, `node_modules/` populated, no vulnerability errors beyond low.

- [ ] **Step 9: Commit**

```bash
git add yong2/
git commit -m "chore(yong2): scaffold Next.js 16 app shell"
```

---

## Task 2: CLAUDE.md + README for yong2

**Files:**
- Create: `yong2/CLAUDE.md`
- Create: `yong2/README.md`

- [ ] **Step 1: Write `yong2/CLAUDE.md`**

```markdown
# CLAUDE.md — Yong2 Site

Agent website for Yong Choi. Parallel to `Jeane/jeane-site/`. **Do not touch Jeane's site or `real-estate-platform/` from this context.**

Design spec: `docs/superpowers/specs/2026-04-24-yong2-redesign-design.md`.
Implementation plan: `docs/superpowers/plans/2026-04-24-yong2-redesign.md`.

## Stack

| | |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| React | 19.2.4 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript strict |
| Node | >= 20 |
| Data | RDS (pg) · Spark CDN images |
| Email | Resend |

## Commands

cd yong2
npm run dev           # next dev
npm run build         # next build
npm run test          # vitest
npm run test:e2e      # playwright

## Scope Rules

- Only edit files in `yong2/`. Never touch `real-estate-platform/` or `Jeane/` from a yong2 task.
- Content lives in `content/*.ts` — typed TS, not markdown, not a CMS.
- Analytics pages (market pulse, snapshot, trends, compare) stay on the `prototypes/yong/` site. yong2 links out to them; do not port them.
- Per-community narrative content lives in `content/communities.ts`.

## Design System — Midnight & Stone

- Primary bg: `#0B1620` (ink). Elevated: `#1E2C38`.
- Accent: `#D4B88A` (gold). Secondary: `#C9A96A`.
- Text on dark: `#EFE9DF` (stone). Muted: `#8A93A0`.
- Tokens defined in `styles/tokens.css` and `app/globals.css`.
- Typography: Playfair Display (display serif, italic heavy) + Inter (UI).
- Motion: CSS-only. No framer-motion.
- `font-serif` for headings, uppercase 0.3em tracking for caps labels.

## Git Rules — MANDATORY

- All commits authored by Joey Schnepel (joeyschnepel@gmail.com) ONLY.
- **NEVER** add Co-Authored-By, Signed-off-by, or any AI/Claude attribution.
- **NEVER** include "Claude", "Anthropic", "AI-generated" or similar in commits, PRs, or in-tree code comments.
- Branches: feature/* → dev → testing → main.
- Never push directly to main or testing.

## Coding Standards

- TypeScript strict, no `any`, `import type` for type-only imports.
- No default exports for shared components — named exports only.
- `'use client'` only when genuinely needed (state, effects, event handlers).
- CSS-only transitions. No framer-motion.
- Content typed in `content/*.ts`, never JSON blobs inline in components.
```

- [ ] **Step 2: Write `yong2/README.md`**

```markdown
# yong2

Yong Choi's agent website (dark cinematic editorial redesign). Next.js 16, App Router.

## Dev

cd yong2
cp .env.example .env.local   # fill in RDS + Resend keys
npm install
npm run dev                  # http://localhost:3000

## Build

npm run build
npm start

## Tests

npm run test       # unit (vitest)
npm run test:e2e   # smoke (playwright)

## Structure

- `app/` — routes + layouts
- `components/` — UI by surface (chrome, hero, home, portfolio, communities, about, contact, shared)
- `lib/` — data access, email, utilities
- `content/` — typed content source (copy, curated slug lists)
- `styles/tokens.css` — palette CSS variables
- `public/` — static assets (hero posters, OG)
```

- [ ] **Step 3: Commit**

```bash
git add yong2/CLAUDE.md yong2/README.md
git commit -m "docs(yong2): add CLAUDE.md and README"
```

---

## Task 3: Design tokens — palette + Tailwind v4 + fonts

**Files:**
- Create: `yong2/styles/tokens.css`
- Create: `yong2/app/globals.css`
- Create: `yong2/app/layout.tsx`

- [ ] **Step 1: Write `yong2/styles/tokens.css`**

```css
:root {
  /* Midnight & Stone palette */
  --ink: #0B1620;
  --ink-elevated: #1E2C38;
  --ink-surface: #071019;
  --gold: #D4B88A;
  --gold-muted: #C9A96A;
  --stone: #EFE9DF;
  --stone-muted: #D9D2C7;
  --mute: #8A93A0;
  --hairline: rgba(212, 184, 138, 0.25);

  /* Type scale */
  --fs-display-xxl: clamp(3.5rem, 7vw, 6rem);
  --fs-display-xl: clamp(2.75rem, 5vw, 4.5rem);
  --fs-display-lg: clamp(2rem, 3.5vw, 3rem);
  --fs-h3: 1.5rem;
  --fs-body: 0.875rem;
  --fs-caps: 0.625rem;

  /* Tracking */
  --tracking-caps: 0.3em;
  --tracking-display: -0.02em;
}
```

- [ ] **Step 2: Write `yong2/app/globals.css`**

```css
@import "tailwindcss";
@import "../styles/tokens.css";

@theme {
  --color-ink: #0B1620;
  --color-ink-elevated: #1E2C38;
  --color-ink-surface: #071019;
  --color-gold: #D4B88A;
  --color-gold-muted: #C9A96A;
  --color-stone: #EFE9DF;
  --color-stone-muted: #D9D2C7;
  --color-mute: #8A93A0;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Playfair Display", Georgia, serif;
}

@layer base {
  html { scroll-behavior: smooth; }
  body {
    background: var(--ink);
    color: var(--stone);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  ::selection { background: var(--gold); color: var(--ink); }
}

@layer utilities {
  .caps {
    font-size: var(--fs-caps);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--gold);
  }
  .display-xxl { font-family: var(--font-serif); font-size: var(--fs-display-xxl); line-height: 0.95; letter-spacing: var(--tracking-display); }
  .display-xl  { font-family: var(--font-serif); font-size: var(--fs-display-xl);  line-height: 1.02; letter-spacing: var(--tracking-display); }
  .display-lg  { font-family: var(--font-serif); font-size: var(--fs-display-lg);  line-height: 1.05; letter-spacing: -0.015em; }
  .hairline { background: var(--hairline); height: 1px; }
}

@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
.animate-fade-up { animation: fadeUp 0.8s ease-out forwards; }

@keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.08); } }
.animate-ken-burns { animation: kenBurns 24s ease-out forwards; }
```

- [ ] **Step 3: Write `yong2/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: "Yong Choi · Scottsdale Luxury Real Estate · Sotheby's International Realty",
    template: '%s · Yong Choi',
  },
  description: "A curated portfolio of the Phoenix Metro's most coveted estates, represented by Yong Choi.",
  openGraph: {
    type: 'website',
    siteName: 'Yong Choi',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Add placeholder home**

Create `yong2/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="display-xl italic">Yong Choi</h1>
    </main>
  );
}
```

- [ ] **Step 5: Verify the dev server boots**

Run: `cd yong2 && npm run dev`
Expected: server starts on `http://localhost:3000`, page renders Playfair italic "Yong Choi" on midnight background. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add yong2/app yong2/styles
git commit -m "feat(yong2): design tokens, Tailwind v4 theme, fonts, base layout"
```

---

## Task 4: Shared utilities (formatters + CapsLabel + HairlineDivider + SectionFrame)

**Files:**
- Create: `yong2/components/shared/formatters.ts`
- Create: `yong2/components/shared/CapsLabel.tsx`
- Create: `yong2/components/shared/HairlineDivider.tsx`
- Create: `yong2/components/shared/SectionFrame.tsx`
- Create: `yong2/tests/setup.ts`
- Create: `yong2/vitest.config.ts`
- Test: `yong2/components/shared/formatters.test.ts`

- [ ] **Step 1: Write `yong2/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 2: Write `yong2/tests/setup.ts`** (empty hook for now)

```ts
// Global test setup — add matchers or mocks here as needed.
export {};
```

- [ ] **Step 3: Write the failing test — `yong2/components/shared/formatters.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { formatPrice, formatSqft, formatAcres, formatDom, slugify } from './formatters';

describe('formatters', () => {
  describe('formatPrice', () => {
    it('formats whole millions with commas and dollar sign', () => {
      expect(formatPrice(8495000)).toBe('$8,495,000');
    });
    it('returns "Price Upon Request" when price is null or 0', () => {
      expect(formatPrice(null)).toBe('Price Upon Request');
      expect(formatPrice(0)).toBe('Price Upon Request');
    });
  });

  describe('formatSqft', () => {
    it('formats square footage with commas and sf suffix', () => {
      expect(formatSqft(7842)).toBe('7,842 sf');
    });
    it('returns em dash for null', () => {
      expect(formatSqft(null)).toBe('—');
    });
  });

  describe('formatAcres', () => {
    it('formats with one decimal and ac suffix', () => {
      expect(formatAcres(1.8)).toBe('1.8 ac');
    });
  });

  describe('formatDom', () => {
    it('rounds to whole number', () => {
      expect(formatDom(112.4)).toBe('112');
    });
  });

  describe('slugify', () => {
    it('lowercases and replaces spaces with hyphens', () => {
      expect(slugify('Desert Mountain')).toBe('desert-mountain');
    });
    it('strips non-alphanumeric except hyphens', () => {
      expect(slugify("Yong's Estate #1")).toBe('yongs-estate-1');
    });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd yong2 && npm run test`
Expected: FAIL — `Cannot find module './formatters'`.

- [ ] **Step 5: Write `yong2/components/shared/formatters.ts`**

```ts
export function formatPrice(price: number | null | undefined): string {
  if (!price) return 'Price Upon Request';
  return `$${price.toLocaleString('en-US')}`;
}

export function formatSqft(sqft: number | null | undefined): string {
  if (sqft == null) return '—';
  return `${sqft.toLocaleString('en-US')} sf`;
}

export function formatAcres(acres: number | null | undefined): string {
  if (acres == null) return '—';
  return `${acres.toFixed(1)} ac`;
}

export function formatDom(dom: number | null | undefined): string {
  if (dom == null) return '—';
  return Math.round(dom).toString();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
```

- [ ] **Step 6: Run tests — verify pass**

Run: `npm run test`
Expected: PASS (5+ tests green).

- [ ] **Step 7: Write `yong2/components/shared/CapsLabel.tsx`**

```tsx
import type { ReactNode } from 'react';

type CapsLabelProps = {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'p';
};

export function CapsLabel({ children, className = '', as: Tag = 'span' }: CapsLabelProps) {
  return <Tag className={`caps ${className}`}>{children}</Tag>;
}
```

- [ ] **Step 8: Write `yong2/components/shared/HairlineDivider.tsx`**

```tsx
type HairlineDividerProps = { className?: string };
export function HairlineDivider({ className = '' }: HairlineDividerProps) {
  return <div className={`hairline w-full ${className}`} aria-hidden="true" />;
}
```

- [ ] **Step 9: Write `yong2/components/shared/SectionFrame.tsx`**

```tsx
import type { ReactNode } from 'react';

type SectionFrameProps = {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
  id?: string;
};

export function SectionFrame({ children, className = '', as: Tag = 'section', id }: SectionFrameProps) {
  return (
    <Tag id={id} className={`w-full px-6 md:px-12 lg:px-16 ${className}`}>
      <div className="max-w-[1400px] mx-auto">{children}</div>
    </Tag>
  );
}
```

- [ ] **Step 10: Commit**

```bash
git add yong2/components/shared yong2/tests yong2/vitest.config.ts
git commit -m "feat(yong2): shared formatters, CapsLabel, HairlineDivider, SectionFrame"
```

---

## Task 5: Chrome — Navigation + Footer + Sotheby's lockup

**Files:**
- Create: `yong2/components/chrome/SothebysLockup.tsx`
- Create: `yong2/components/chrome/Navigation.tsx`
- Create: `yong2/components/chrome/Footer.tsx`
- Create: `yong2/content/site.ts`
- Modify: `yong2/app/layout.tsx`

- [ ] **Step 1: Write `yong2/content/site.ts`**

```ts
export const siteContent = {
  brand: {
    name: 'Yong Choi',
    tagline: 'Sotheby’s International Realty',
    location: 'Scottsdale · Paradise Valley · Desert Mountain',
  },
  nav: [
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Communities', href: '/communities' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  contact: {
    mobile: '480 · 555 · 0100',
    mobileHref: 'tel:+14805550100',
    email: 'yong@example.com',
    office: 'Russ Lyon Sotheby’s · Scottsdale',
    instagram: '@yongchoi.scottsdale',
    instagramHref: 'https://instagram.com/yongchoi.scottsdale',
  },
  legal: {
    copyright: `© ${new Date().getFullYear()} Yong Choi. All rights reserved.`,
    mlsDisclaimer:
      'Based on information from ARMLS. All data deemed reliable but not guaranteed and should be independently verified.',
    fairHousing: 'Equal Housing Opportunity. Each office is independently owned and operated.',
  },
} as const;

export type SiteContent = typeof siteContent;
```

- [ ] **Step 2: Write `yong2/components/chrome/SothebysLockup.tsx`**

```tsx
type SothebysLockupProps = {
  className?: string;
  variant?: 'light' | 'dark';
};

export function SothebysLockup({ className = '', variant = 'light' }: SothebysLockupProps) {
  const color = variant === 'light' ? 'text-stone' : 'text-ink';
  return (
    <div className={`${color} ${className}`}>
      <div className="font-serif italic text-lg tracking-tight leading-none">Sotheby’s</div>
      <div className="caps mt-1" style={{ color: 'inherit', opacity: 0.7 }}>International Realty</div>
    </div>
  );
}
```

- [ ] **Step 3: Write `yong2/components/chrome/Navigation.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { siteContent } from '@/content/site';

type NavigationProps = {
  initialTransparent?: boolean;
};

export function Navigation({ initialTransparent = false }: NavigationProps) {
  const [scrolled, setScrolled] = useState(!initialTransparent);

  useEffect(() => {
    if (!initialTransparent) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [initialTransparent]);

  const isTransparent = initialTransparent && !scrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-500 ${
        isTransparent ? 'bg-transparent' : 'bg-ink/95 backdrop-blur-sm border-b border-white/5'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-stone tracking-tight hover:text-gold transition-colors">
          {siteContent.brand.name}
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {siteContent.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="caps text-stone hover:text-gold transition-colors"
              style={{ color: 'var(--stone)' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          aria-label="Open menu"
          className="md:hidden text-stone"
          onClick={() => {
            const el = document.getElementById('mobile-menu');
            if (el) el.hidden = !el.hidden;
          }}
        >
          <span className="block w-6 h-px bg-current mb-1.5" />
          <span className="block w-6 h-px bg-current mb-1.5" />
          <span className="block w-4 h-px bg-current ml-auto" />
        </button>
      </div>
      <div id="mobile-menu" hidden className="md:hidden bg-ink border-t border-white/5">
        <div className="px-6 py-8 flex flex-col gap-6">
          {siteContent.nav.map((item) => (
            <Link key={item.href} href={item.href} className="font-serif italic text-2xl text-stone">
              {item.label}
            </Link>
          ))}
          <a href={siteContent.contact.mobileHref} className="caps mt-4 text-gold">
            {siteContent.contact.mobile}
          </a>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Write `yong2/components/chrome/Footer.tsx`**

```tsx
import Link from 'next/link';
import { siteContent } from '@/content/site';
import { SothebysLockup } from './SothebysLockup';
import { HairlineDivider } from '@/components/shared/HairlineDivider';

export function Footer() {
  return (
    <footer className="mt-24 pt-20 pb-10 border-t border-white/5 bg-ink-surface text-stone">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <div className="font-serif text-2xl tracking-tight">{siteContent.brand.name}</div>
          <p className="text-sm text-mute mt-3 max-w-xs leading-relaxed">
            Private representation across the Phoenix Metro’s most coveted addresses.
          </p>
          <SothebysLockup className="mt-6" />
        </div>
        <div>
          <div className="caps mb-4">Navigation</div>
          <ul className="space-y-2.5">
            {siteContent.nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-stone/80 hover:text-gold text-sm">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="caps mb-4">Contact</div>
          <ul className="space-y-2.5 text-sm">
            <li><a href={siteContent.contact.mobileHref} className="hover:text-gold">{siteContent.contact.mobile}</a></li>
            <li><a href={`mailto:${siteContent.contact.email}`} className="hover:text-gold">{siteContent.contact.email}</a></li>
            <li className="text-mute">{siteContent.contact.office}</li>
            <li><a href={siteContent.contact.instagramHref} className="hover:text-gold">{siteContent.contact.instagram}</a></li>
          </ul>
        </div>
      </div>
      <HairlineDivider className="mt-14 mb-6 max-w-[1400px] mx-auto" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 text-[11px] text-mute leading-relaxed space-y-2">
        <div>{siteContent.legal.mlsDisclaimer}</div>
        <div>{siteContent.legal.fairHousing}</div>
        <div>{siteContent.legal.copyright}</div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Verify dev server still builds and renders**

Run: `cd yong2 && npm run dev`, navigate to `/`, confirm no console errors.

- [ ] **Step 6: Commit**

```bash
git add yong2/components/chrome yong2/content/site.ts
git commit -m "feat(yong2): Navigation, Footer, Sotheby's lockup + site content"
```

---

## Task 6: Hero Cinematic + home page placeholder assembly

**Files:**
- Create: `yong2/content/home.ts`
- Create: `yong2/content/yong.ts`
- Create: `yong2/components/hero/HeroCinematic.tsx`
- Modify: `yong2/app/page.tsx`
- Create: `yong2/public/hero/hero-poster.jpg` (placeholder — use any licensed still; document in README)

- [ ] **Step 1: Write `yong2/content/yong.ts`**

```ts
export const yongBio = {
  name: 'Yong Choi',
  kicker: 'An Advisor, First',
  headline: 'The case for *fewer, better* transactions.',
  paragraphs: [
    'Over two decades, Yong has built a practice that mirrors his clients — private, deliberate, exceptionally well-informed.',
    'He represents a small number of principals each year, preferring depth over volume. Every engagement begins with a conversation, not a pitch.',
  ],
  stats: [
    { value: '$1.2B', label: 'Career Sales' },
    { value: '24', label: 'Years' },
    { value: 'Top 1%', label: 'Sotheby’s International' },
  ],
  heroCopy: {
    localities: 'Scottsdale · Paradise Valley · DC Ranch',
    headlineLine1: 'The Art of',
    headlineLine2: 'Desert Living',
    scrollHint: 'Scroll',
  },
} as const;
```

- [ ] **Step 2: Write `yong2/content/home.ts`**

```ts
export const homeContent = {
  intro: {
    kicker: 'A Portfolio, Not a Listing Site',
    headlineLeft: 'Represented with *discretion,*',
    headlineRight: 'delivered with *distinction.*',
    lead: 'Yong Choi represents the Phoenix Metro’s most private estates.',
    body:
      'A former advisor turned broker — with $1.2B in career sales across Silverleaf, Desert Mountain, Estancia, Paradise Valley and DC Ranch. Every representation is bespoke.',
  },
  portfolio: {
    kicker: 'Current Portfolio',
    headline: 'Now offering.',
    cta: { label: 'View the Portfolio', href: '/portfolio' },
  },
  communities: {
    kicker: 'The Communities',
    headline: 'Where buyers choose to live.',
    cta: { label: 'Explore Communities', href: '/communities' },
  },
  market: {
    kicker: 'Market Intelligence',
    bigStat: '$3.4M',
    bigStatLabel: 'Phoenix Metro · Median Luxury Sale',
    body:
      'Yong’s practice is built on market intelligence — live pricing, velocity, and neighborhood-level benchmarks.',
    cta: { label: 'Explore the Dashboards', href: 'https://yongchoi.com/market' },
  },
  contactCta: {
    kicker: 'An Invitation',
    headline: '*Let’s begin* a conversation.',
    body:
      'Whether you’re assessing a move or years away, every client relationship starts with a conversation.',
  },
} as const;
```

- [ ] **Step 3: Write `yong2/components/hero/HeroCinematic.tsx`**

```tsx
import Image from 'next/image';
import { yongBio } from '@/content/yong';
import { CapsLabel } from '@/components/shared/CapsLabel';

export function HeroCinematic() {
  const { heroCopy, stats } = yongBio;
  return (
    <header className="relative w-full h-screen min-h-[640px] overflow-hidden">
      <div className="absolute inset-0 animate-ken-burns">
        <Image
          src="/hero/hero-poster.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,22,32,0.25),rgba(11,22,32,0.85))]" />
      <div className="absolute inset-x-0 bottom-0 pb-20 pt-40 bg-gradient-to-b from-transparent to-ink/80">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 text-stone">
          <CapsLabel className="animate-fade-up" as="div">{heroCopy.localities}</CapsLabel>
          <h1 className="display-xxl mt-6 text-stone animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            {heroCopy.headlineLine1}
            <br />
            <em className="font-light">{heroCopy.headlineLine2}</em>
          </h1>
          <div className="mt-12 flex flex-col md:flex-row md:items-end md:justify-between gap-8 animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
            <dl className="flex flex-wrap gap-10">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="caps">{s.label}</dt>
                  <dd className="font-serif text-3xl mt-1">{s.value}</dd>
                </div>
              ))}
            </dl>
            <div className="caps text-stone/70">{heroCopy.scrollHint} ↓</div>
          </div>
        </div>
      </div>
    </header>
  );
}
```

Note the `animate-fade-up` uses `opacity: 0` + forwards fill — the inline style sets initial hidden state that the keyframe animates from. This is stagger without JS.

- [ ] **Step 4: Update `yong2/app/page.tsx` to a home skeleton**

```tsx
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { HeroCinematic } from '@/components/hero/HeroCinematic';

export default function Home() {
  return (
    <>
      <Navigation initialTransparent />
      <HeroCinematic />
      <main className="min-h-[40vh]"> {/* section stack added in Task 7 */} </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Add a placeholder hero poster**

Download or copy any appropriately-licensed dark desert/estate still to `yong2/public/hero/hero-poster.jpg` (at least 1920×1080). Interim option: copy from `prototypes/yong/public/` if anything fits. Update `yong2/README.md` with a note that this is a placeholder pending Yong's professional shoot.

- [ ] **Step 6: Verify in browser**

Run: `npm run dev`, open `/`, confirm:
- Hero fills viewport, Ken-Burns zoom runs
- Kicker → italic headline → stats fade in staggered
- Nav is transparent initially, fades solid after scrolling past 60px

- [ ] **Step 7: Commit**

```bash
git add yong2/content yong2/components/hero yong2/app/page.tsx yong2/public/hero
git commit -m "feat(yong2): cinematic hero + home content source + nav integration"
```

---

## Task 7: Home page sections (Intro → Portfolio stub → Communities stub → About snippet → Market → Contact CTA)

**Files:**
- Create: `yong2/components/home/HomeIntro.tsx`
- Create: `yong2/components/home/FeaturedPortfolio.tsx`
- Create: `yong2/components/home/HomeCommunities.tsx`
- Create: `yong2/components/home/AboutSnippet.tsx`
- Create: `yong2/components/home/MarketBlurb.tsx`
- Create: `yong2/components/home/ContactCTA.tsx`
- Modify: `yong2/app/page.tsx`

- [ ] **Step 1: Write `yong2/components/home/HomeIntro.tsx`**

```tsx
import { homeContent } from '@/content/home';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

function emphasize(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((chunk, i) =>
    chunk.startsWith('*') && chunk.endsWith('*') ? <em key={i} className="font-light">{chunk.slice(1, -1)}</em> : <span key={i}>{chunk}</span>
  );
}

export function HomeIntro() {
  const { intro } = homeContent;
  return (
    <SectionFrame className="py-28">
      <CapsLabel as="div">{intro.kicker}</CapsLabel>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
        <h2 className="display-xl">
          {emphasize(intro.headlineLeft)}
          <br />
          {emphasize(intro.headlineRight)}
        </h2>
        <div className="text-stone/80 leading-relaxed">
          <p className="font-serif italic text-stone text-lg mb-4">{intro.lead}</p>
          <p>{intro.body}</p>
        </div>
      </div>
    </SectionFrame>
  );
}
```

- [ ] **Step 2: Write `yong2/components/home/FeaturedPortfolio.tsx`** (stub that renders placeholder tiles; real data wired in Task 10)

```tsx
import Link from 'next/link';
import { homeContent } from '@/content/home';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

type FeaturedListing = {
  slug: string;
  address: string;
  community: string;
  price: number | null;
  imageUrl: string | null;
  tag?: string;
};

type FeaturedPortfolioProps = { listings: FeaturedListing[] };

export function FeaturedPortfolio({ listings }: FeaturedPortfolioProps) {
  const { portfolio } = homeContent;
  return (
    <SectionFrame className="py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <CapsLabel as="div">{portfolio.kicker}</CapsLabel>
          <h2 className="display-lg italic mt-3">{portfolio.headline}</h2>
        </div>
        <Link href={portfolio.cta.href} className="caps hover:text-stone transition-colors hidden md:inline">
          {portfolio.cta.label} →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((l) => (
          <Link
            key={l.slug}
            href={`/portfolio/${l.slug}`}
            className="relative aspect-[4/5] overflow-hidden bg-ink-elevated group"
          >
            {l.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.imageUrl} alt={l.address} className="w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-105" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            {l.tag ? (
              <span className="absolute top-3 left-3 caps bg-ink/70 px-2 py-1">{l.tag}</span>
            ) : null}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="caps mb-1">{l.community}</div>
              <div className="font-serif text-lg leading-tight">{l.address}</div>
              <div className="caps text-stone/80 mt-1">
                {l.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(l.price) : 'Price Upon Request'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </SectionFrame>
  );
}
```

- [ ] **Step 3: Write `yong2/components/home/HomeCommunities.tsx`**

```tsx
import Link from 'next/link';
import { homeContent } from '@/content/home';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

type CommunityTile = { slug: string; name: string; locality: string; imageUrl: string | null };
type HomeCommunitiesProps = { communities: CommunityTile[] };

export function HomeCommunities({ communities }: HomeCommunitiesProps) {
  const { communities: copy } = homeContent;
  return (
    <SectionFrame className="py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <CapsLabel as="div">{copy.kicker}</CapsLabel>
          <h2 className="display-lg italic mt-3">{copy.headline}</h2>
        </div>
        <Link href={copy.cta.href} className="caps hover:text-stone hidden md:inline">
          {copy.cta.label} →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {communities.map((c) => (
          <Link
            key={c.slug}
            href={`/communities/${c.slug}`}
            className="relative aspect-square overflow-hidden bg-ink-elevated group"
          >
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-105" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="caps mb-1 text-xs">{c.locality}</div>
              <div className="font-serif italic text-lg leading-tight">{c.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </SectionFrame>
  );
}
```

- [ ] **Step 4: Write `yong2/components/home/AboutSnippet.tsx`**

```tsx
import Link from 'next/link';
import { yongBio } from '@/content/yong';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

function emphasize(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((c, i) =>
    c.startsWith('*') && c.endsWith('*') ? <em key={i} className="font-light">{c.slice(1, -1)}</em> : <span key={i}>{c}</span>
  );
}

export function AboutSnippet() {
  return (
    <SectionFrame className="py-24 bg-ink-elevated">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 items-center">
        <div className="aspect-[3/4] bg-ink-surface flex items-center justify-center caps text-mute">
          Portrait
        </div>
        <div>
          <CapsLabel as="div">Meet Your Advisor</CapsLabel>
          <h2 className="display-lg mt-4">{emphasize(yongBio.headline)}</h2>
          {yongBio.paragraphs.map((p, i) => (
            <p key={i} className="mt-4 text-stone/80 leading-relaxed max-w-2xl">{p}</p>
          ))}
          <div className="font-serif italic text-2xl text-gold mt-6">— Yong Choi</div>
          <Link href="/about" className="caps mt-8 inline-block hover:text-stone">About Yong →</Link>
        </div>
      </div>
    </SectionFrame>
  );
}
```

- [ ] **Step 5: Write `yong2/components/home/MarketBlurb.tsx`**

```tsx
import { homeContent } from '@/content/home';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

export function MarketBlurb() {
  const { market } = homeContent;
  return (
    <SectionFrame className="py-24">
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-center max-w-4xl">
        <div className="font-serif text-[96px] leading-none text-gold">{market.bigStat}</div>
        <div>
          <CapsLabel as="div">{market.kicker}</CapsLabel>
          <div className="font-serif italic text-2xl mt-3">{market.bigStatLabel}</div>
          <p className="mt-4 text-stone/80 leading-relaxed max-w-xl">{market.body}</p>
          <a href={market.cta.href} className="caps mt-6 inline-block hover:text-stone" rel="noopener">
            {market.cta.label} →
          </a>
        </div>
      </div>
    </SectionFrame>
  );
}
```

- [ ] **Step 6: Write `yong2/components/home/ContactCTA.tsx`**

```tsx
import Link from 'next/link';
import { homeContent } from '@/content/home';
import { siteContent } from '@/content/site';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

function emphasize(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((c, i) =>
    c.startsWith('*') && c.endsWith('*') ? <em key={i} className="font-light">{c.slice(1, -1)}</em> : <span key={i}>{c}</span>
  );
}

export function ContactCTA() {
  const { contactCta } = homeContent;
  return (
    <SectionFrame className="py-28">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <CapsLabel as="div">{contactCta.kicker}</CapsLabel>
          <h2 className="display-lg mt-4">{emphasize(contactCta.headline)}</h2>
          <p className="mt-4 text-stone/80 leading-relaxed max-w-lg">{contactCta.body}</p>
        </div>
        <dl className="md:border-l md:border-white/10 md:pl-10 space-y-3">
          <div className="flex justify-between border-b border-white/10 pb-3">
            <dt className="caps">Mobile</dt><dd><a href={siteContent.contact.mobileHref} className="hover:text-gold">{siteContent.contact.mobile}</a></dd>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <dt className="caps">Email</dt><dd><a href={`mailto:${siteContent.contact.email}`} className="hover:text-gold">{siteContent.contact.email}</a></dd>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <dt className="caps">Office</dt><dd className="text-mute">{siteContent.contact.office}</dd>
          </div>
          <Link href="/contact" className="caps inline-block mt-6 bg-gold text-ink px-6 py-4 hover:bg-stone transition-colors">
            Begin a Conversation →
          </Link>
        </dl>
      </div>
    </SectionFrame>
  );
}
```

- [ ] **Step 7: Wire sections into `yong2/app/page.tsx`**

```tsx
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { HeroCinematic } from '@/components/hero/HeroCinematic';
import { HomeIntro } from '@/components/home/HomeIntro';
import { FeaturedPortfolio } from '@/components/home/FeaturedPortfolio';
import { HomeCommunities } from '@/components/home/HomeCommunities';
import { AboutSnippet } from '@/components/home/AboutSnippet';
import { MarketBlurb } from '@/components/home/MarketBlurb';
import { ContactCTA } from '@/components/home/ContactCTA';

export const revalidate = 3600;

export default async function Home() {
  // Placeholder data until Task 10 wires the real RDS client.
  const featured = [
    { slug: 'desert-hills-drive', address: '10440 E Desert Hills Dr', community: 'Desert Mountain', price: 8495000, imageUrl: null, tag: 'Featured' },
    { slug: 'feathersong-lane', address: '11025 E Feathersong Ln', community: 'Silverleaf', price: 12950000, imageUrl: null, tag: 'Just Listed' },
    { slug: 'arroyo-verde', address: '6225 E Arroyo Verde Dr', community: 'Paradise Valley', price: null, imageUrl: null, tag: 'Coming Soon' },
  ];
  const communities = [
    { slug: 'silverleaf', name: 'Silverleaf', locality: 'North Scottsdale', imageUrl: null },
    { slug: 'desert-mountain', name: 'Desert Mountain', locality: 'North Scottsdale', imageUrl: null },
    { slug: 'estancia', name: 'Estancia', locality: 'Scottsdale', imageUrl: null },
    { slug: 'paradise-valley', name: 'Paradise Valley', locality: 'Paradise Valley', imageUrl: null },
  ];
  return (
    <>
      <Navigation initialTransparent />
      <HeroCinematic />
      <HomeIntro />
      <FeaturedPortfolio listings={featured} />
      <HomeCommunities communities={communities} />
      <AboutSnippet />
      <MarketBlurb />
      <ContactCTA />
      <Footer />
    </>
  );
}
```

- [ ] **Step 8: Verify in browser**

Run: `npm run dev`, scroll home. Confirm all sections render cleanly, nothing overlaps, mobile layout stacks correctly.

- [ ] **Step 9: Commit**

```bash
git add yong2/components/home yong2/app/page.tsx
git commit -m "feat(yong2): home page section stack (intro, portfolio, communities, about, market, cta)"
```

---

## Task 8: DB client — `lib/db.ts` + pg pool singleton

**Files:**
- Create: `yong2/lib/db.ts`
- Test: `yong2/lib/db.test.ts`

- [ ] **Step 1: Write the failing test — `yong2/lib/db.test.ts`**

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { getPool, resetPool } from './db';

describe('db pool', () => {
  afterEach(async () => { await resetPool(); });

  it('throws if RDS_DATABASE_URL is missing', () => {
    const prev = process.env.RDS_DATABASE_URL;
    delete process.env.RDS_DATABASE_URL;
    expect(() => getPool()).toThrow(/RDS_DATABASE_URL/);
    process.env.RDS_DATABASE_URL = prev;
  });

  it('returns the same pool on repeated calls (singleton)', () => {
    process.env.RDS_DATABASE_URL = 'postgres://u:p@localhost:5432/db';
    const a = getPool();
    const b = getPool();
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npm run test`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `yong2/lib/db.ts`**

```ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const url = process.env.RDS_DATABASE_URL;
  if (!url) {
    throw new Error('RDS_DATABASE_URL is required');
  }
  pool = new Pool({
    connectionString: url,
    max: 5,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

export async function resetPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
```

- [ ] **Step 4: Run test — pass**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add yong2/lib/db.ts yong2/lib/db.test.ts
git commit -m "feat(yong2): pg pool singleton with RDS SSL config"
```

---

## Task 9: Listings data layer — `lib/listings.ts`

Reads the curated set of listings Yong represents. Assumes a `listings` table/view already exists in RDS from the Spark pipeline, with at minimum: `listing_id`, `slug`, `street`, `city`, `community_name`, `list_price`, `beds`, `baths`, `sqft`, `lot_acres`, `year_built`, `mls_number`, `status`, `cover_photo_url`, `photos` (jsonb array), `latitude`, `longitude`, `remarks`, `is_featured` (boolean), `updated_at`.

If the actual column names differ, the adapter in this file is where that gets reconciled — downstream code only sees the domain type exported below.

**Files:**
- Create: `yong2/lib/listings.ts`
- Test: `yong2/lib/listings.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// yong2/lib/listings.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFeaturedListings, getListingBySlug, getAllListings, listingRowToListing } from './listings';

vi.mock('./db', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn(),
  })),
}));

const sampleRow = {
  listing_id: '123',
  slug: 'desert-hills-drive',
  street: '10440 E Desert Hills Dr',
  city: 'Scottsdale',
  community_name: 'Desert Mountain',
  list_price: '8495000',
  beds: 5,
  baths: '6.5',
  sqft: 7842,
  lot_acres: '1.8',
  year_built: 2019,
  mls_number: '6712940',
  status: 'Active',
  cover_photo_url: 'https://cdn.example.com/a.jpg',
  photos: ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'],
  latitude: '33.87',
  longitude: '-111.87',
  remarks: 'An estate.',
  is_featured: true,
  updated_at: new Date('2026-04-20').toISOString(),
};

describe('listingRowToListing', () => {
  it('coerces string numerics to numbers', () => {
    const l = listingRowToListing(sampleRow);
    expect(l.listPrice).toBe(8495000);
    expect(l.baths).toBe(6.5);
    expect(l.lotAcres).toBe(1.8);
    expect(l.latitude).toBeCloseTo(33.87);
  });
  it('keeps null prices as null (not 0)', () => {
    const l = listingRowToListing({ ...sampleRow, list_price: null });
    expect(l.listPrice).toBeNull();
  });
  it('maps community_name to community', () => {
    const l = listingRowToListing(sampleRow);
    expect(l.community).toBe('Desert Mountain');
  });
});

describe('getFeaturedListings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('queries is_featured = true and returns ordered list', async () => {
    const { getPool } = await import('./db');
    const mockQuery = vi.fn().mockResolvedValue({ rows: [sampleRow] });
    (getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: mockQuery });

    const result = await getFeaturedListings(3);
    expect(mockQuery).toHaveBeenCalledOnce();
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/is_featured\s*=\s*true/i);
    expect(sql).toMatch(/LIMIT\s+\$1/i);
    expect(params).toEqual([3]);
    expect(result[0].slug).toBe('desert-hills-drive');
  });
});

describe('getListingBySlug', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns null when no row matches', async () => {
    const { getPool } = await import('./db');
    const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
    (getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: mockQuery });

    const result = await getListingBySlug('does-not-exist');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `npm run test`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `yong2/lib/listings.ts`**

```ts
import { getPool } from './db';

export type ListingStatus = 'Active' | 'Coming Soon' | 'Pending' | 'Sold';

export type Listing = {
  id: string;
  slug: string;
  street: string;
  city: string;
  community: string;
  listPrice: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lotAcres: number | null;
  yearBuilt: number | null;
  mlsNumber: string | null;
  status: ListingStatus | string;
  coverPhotoUrl: string | null;
  photos: string[];
  latitude: number | null;
  longitude: number | null;
  remarks: string | null;
  isFeatured: boolean;
  updatedAt: string;
};

type Row = {
  listing_id: string;
  slug: string;
  street: string;
  city: string;
  community_name: string;
  list_price: string | number | null;
  beds: number | null;
  baths: string | number | null;
  sqft: number | null;
  lot_acres: string | number | null;
  year_built: number | null;
  mls_number: string | null;
  status: string;
  cover_photo_url: string | null;
  photos: string[] | null;
  latitude: string | number | null;
  longitude: string | number | null;
  remarks: string | null;
  is_featured: boolean;
  updated_at: string;
};

const toNum = (v: string | number | null | undefined): number | null => {
  if (v == null) return null;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
};

export function listingRowToListing(r: Row): Listing {
  return {
    id: r.listing_id,
    slug: r.slug,
    street: r.street,
    city: r.city,
    community: r.community_name,
    listPrice: toNum(r.list_price),
    beds: r.beds ?? null,
    baths: toNum(r.baths),
    sqft: r.sqft ?? null,
    lotAcres: toNum(r.lot_acres),
    yearBuilt: r.year_built ?? null,
    mlsNumber: r.mls_number,
    status: r.status,
    coverPhotoUrl: r.cover_photo_url,
    photos: r.photos ?? [],
    latitude: toNum(r.latitude),
    longitude: toNum(r.longitude),
    remarks: r.remarks,
    isFeatured: r.is_featured,
    updatedAt: r.updated_at,
  };
}

const SELECT = `
  SELECT listing_id, slug, street, city, community_name, list_price,
         beds, baths, sqft, lot_acres, year_built, mls_number, status,
         cover_photo_url, photos, latitude, longitude, remarks,
         is_featured, updated_at
  FROM listings
`;

export async function getFeaturedListings(limit = 6): Promise<Listing[]> {
  const pool = getPool();
  const sql = `${SELECT} WHERE is_featured = true AND status IN ('Active','Coming Soon') ORDER BY updated_at DESC LIMIT $1`;
  const { rows } = await pool.query<Row>(sql, [limit]);
  return rows.map(listingRowToListing);
}

export async function getAllListings(): Promise<Listing[]> {
  const pool = getPool();
  const sql = `${SELECT} WHERE status IN ('Active','Coming Soon','Sold') ORDER BY
    CASE status WHEN 'Coming Soon' THEN 1 WHEN 'Active' THEN 2 ELSE 3 END,
    updated_at DESC`;
  const { rows } = await pool.query<Row>(sql);
  return rows.map(listingRowToListing);
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const pool = getPool();
  const sql = `${SELECT} WHERE slug = $1 LIMIT 1`;
  const { rows } = await pool.query<Row>(sql, [slug]);
  return rows.length ? listingRowToListing(rows[0]) : null;
}

export async function getListingsByCommunity(communityName: string): Promise<Listing[]> {
  const pool = getPool();
  const sql = `${SELECT} WHERE community_name = $1 AND status IN ('Active','Coming Soon') ORDER BY updated_at DESC`;
  const { rows } = await pool.query<Row>(sql, [communityName]);
  return rows.map(listingRowToListing);
}
```

- [ ] **Step 4: Run tests — pass**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add yong2/lib/listings.ts yong2/lib/listings.test.ts
git commit -m "feat(yong2): listings read layer with domain mapper + tests"
```

---

## Task 10: Wire home page to live listings + communities data

**Files:**
- Create: `yong2/lib/communities.ts` (curated list + KPI reader — full impl in Task 12; stub here)
- Create: `yong2/content/communities.ts` (narrative copy keyed by slug)
- Modify: `yong2/app/page.tsx`

- [ ] **Step 1: Write `yong2/content/communities.ts`**

```ts
export const communitiesContent = {
  'silverleaf': {
    slug: 'silverleaf',
    name: 'Silverleaf',
    locality: 'North Scottsdale',
    communityKey: 'SILVERLEAF',
    heroImageUrl: '/hero/silverleaf.jpg',
    narrative: [
      'Silverleaf is the gold standard of North Scottsdale — a gated village inside DC Ranch with an architectural committee that has kept the neighborhood coherent while still producing some of the most ambitious custom homes in the Valley.',
      'Buyer profile skews toward second-home owners with a base outside Arizona, though primary residents are a growing share. Pace has stayed measured through every recent cycle.',
    ],
  },
  'desert-mountain': {
    slug: 'desert-mountain',
    name: 'Desert Mountain',
    locality: 'North Scottsdale',
    communityKey: 'DESERT MOUNTAIN',
    heroImageUrl: '/hero/desert-mountain.jpg',
    aerialVideoId: 'AWZEVnZC3FoDtxr8ifXBgo',
    narrative: [
      'Seven Jack Nicklaus courses, 8,000 acres of Sonoran preserve, and a member roster spanning North America’s top family offices.',
      'Desert Mountain’s resale velocity has historically led comparable clubs — liquidity matters to the buyer this neighborhood attracts.',
    ],
  },
  'estancia': {
    slug: 'estancia',
    name: 'Estancia',
    locality: 'Scottsdale',
    communityKey: 'ESTANCIA',
    heroImageUrl: '/hero/estancia.jpg',
    narrative: [
      'Pinnacle Peak’s most private enclave. Tom Fazio routing, dramatic topography, and an architectural vocabulary rooted in the Sonoran landscape rather than transplanted from elsewhere.',
    ],
  },
  'paradise-valley': {
    slug: 'paradise-valley',
    name: 'Paradise Valley',
    locality: 'Paradise Valley',
    communityKey: 'PARADISE VALLEY',
    heroImageUrl: '/hero/paradise-valley.jpg',
    narrative: [
      'The valley floor — minimum-one-acre lots, Camelback and Mummy Mountain views, and a buyer pool that skews local, generational, and discreet.',
    ],
  },
} as const;

export type CommunitySlug = keyof typeof communitiesContent;
export const communitySlugs = Object.keys(communitiesContent) as CommunitySlug[];
```

- [ ] **Step 2: Write `yong2/lib/communities.ts` (stub — KPI reader in Task 12)**

```ts
import { communitiesContent, communitySlugs, type CommunitySlug } from '@/content/communities';

export type CommunitySummary = {
  slug: CommunitySlug;
  name: string;
  locality: string;
  imageUrl: string | null;
};

export function getCuratedCommunities(): CommunitySummary[] {
  return communitySlugs.map((slug) => {
    const c = communitiesContent[slug];
    return { slug, name: c.name, locality: c.locality, imageUrl: c.heroImageUrl ?? null };
  });
}
```

- [ ] **Step 3: Update `yong2/app/page.tsx` to call live listings + curated communities**

```tsx
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { HeroCinematic } from '@/components/hero/HeroCinematic';
import { HomeIntro } from '@/components/home/HomeIntro';
import { FeaturedPortfolio } from '@/components/home/FeaturedPortfolio';
import { HomeCommunities } from '@/components/home/HomeCommunities';
import { AboutSnippet } from '@/components/home/AboutSnippet';
import { MarketBlurb } from '@/components/home/MarketBlurb';
import { ContactCTA } from '@/components/home/ContactCTA';
import { getFeaturedListings } from '@/lib/listings';
import { getCuratedCommunities } from '@/lib/communities';

export const revalidate = 3600;

export default async function Home() {
  const [listings, communities] = await Promise.all([
    getFeaturedListings(3).catch(() => []),
    Promise.resolve(getCuratedCommunities()),
  ]);

  const featured = listings.map((l) => ({
    slug: l.slug,
    address: l.street,
    community: l.community,
    price: l.listPrice,
    imageUrl: l.coverPhotoUrl,
    tag: l.status === 'Coming Soon' ? 'Coming Soon' : l.isFeatured ? 'Featured' : undefined,
  }));

  return (
    <>
      <Navigation initialTransparent />
      <HeroCinematic />
      <HomeIntro />
      <FeaturedPortfolio listings={featured} />
      <HomeCommunities communities={communities} />
      <AboutSnippet />
      <MarketBlurb />
      <ContactCTA />
      <Footer />
    </>
  );
}
```

The `.catch(() => [])` lets the home page degrade gracefully during DB outages or local dev without `RDS_DATABASE_URL`. Error telemetry in Task 18.

- [ ] **Step 4: Verify**

Run: `npm run dev` with `RDS_DATABASE_URL` set in `.env.local`. Confirm real listings render. Unset and confirm page still renders with empty portfolio grid (no crash).

- [ ] **Step 5: Commit**

```bash
git add yong2/lib/communities.ts yong2/content/communities.ts yong2/app/page.tsx
git commit -m "feat(yong2): wire home to live listings + curated communities"
```

---

## Task 11: `/portfolio` grid page + `/portfolio/[slug]` detail page

**Files:**
- Create: `yong2/app/portfolio/page.tsx`
- Create: `yong2/app/portfolio/[slug]/page.tsx`
- Create: `yong2/components/portfolio/ListingGrid.tsx`
- Create: `yong2/components/portfolio/ListingTile.tsx`
- Create: `yong2/components/portfolio/ListingDetailHero.tsx`
- Create: `yong2/components/portfolio/ListingFactSheet.tsx`
- Create: `yong2/components/portfolio/ListingGallery.tsx`

- [ ] **Step 1: Write `yong2/components/portfolio/ListingTile.tsx`**

```tsx
import Link from 'next/link';
import type { Listing } from '@/lib/listings';
import { formatPrice } from '@/components/shared/formatters';

type ListingTileProps = { listing: Listing };

export function ListingTile({ listing }: ListingTileProps) {
  const tag = listing.status === 'Coming Soon' ? 'Coming Soon' : listing.status === 'Sold' ? 'Sold' : listing.isFeatured ? 'Featured' : null;
  return (
    <Link href={`/portfolio/${listing.slug}`} className="relative aspect-[4/5] overflow-hidden bg-ink-elevated group">
      {listing.coverPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.coverPhotoUrl} alt={listing.street} className="w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-105" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
      {tag ? <span className="absolute top-3 left-3 caps bg-ink/70 px-2 py-1">{tag}</span> : null}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="caps mb-1">{listing.community}</div>
        <div className="font-serif text-lg leading-tight">{listing.street}</div>
        <div className="caps text-stone/80 mt-1">{formatPrice(listing.listPrice)}</div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Write `yong2/components/portfolio/ListingGrid.tsx`**

```tsx
'use client';

import { useMemo, useState } from 'react';
import type { Listing } from '@/lib/listings';
import { ListingTile } from './ListingTile';

type ListingGridProps = { listings: Listing[] };
type StatusFilter = 'All' | 'Active' | 'Coming Soon' | 'Sold';
const FILTERS: StatusFilter[] = ['All', 'Active', 'Coming Soon', 'Sold'];

export function ListingGrid({ listings }: ListingGridProps) {
  const [filter, setFilter] = useState<StatusFilter>('All');
  const filtered = useMemo(() => filter === 'All' ? listings : listings.filter((l) => l.status === filter), [filter, listings]);
  return (
    <>
      <div className="flex items-end justify-between border-b border-white/10 pb-6 mb-10">
        <h1 className="display-xl italic">The Portfolio</h1>
        <div className="flex gap-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`caps ${filter === f ? 'text-stone border-b border-gold pb-1' : 'text-gold hover:text-stone'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((l) => <ListingTile key={l.slug} listing={l} />)}
      </div>
      {filtered.length === 0 ? <p className="mt-16 text-center text-mute">No listings in this view.</p> : null}
    </>
  );
}
```

- [ ] **Step 3: Write `yong2/app/portfolio/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { ListingGrid } from '@/components/portfolio/ListingGrid';
import { getAllListings } from '@/lib/listings';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'The Portfolio',
  description: 'Current and recent representations across the Phoenix Metro.',
};

export default async function PortfolioPage() {
  const listings = await getAllListings().catch(() => []);
  return (
    <>
      <Navigation />
      <main className="pt-24">
        <SectionFrame className="py-12">
          <ListingGrid listings={listings} />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Write `yong2/components/portfolio/ListingDetailHero.tsx`**

```tsx
import type { Listing } from '@/lib/listings';
import { CapsLabel } from '@/components/shared/CapsLabel';

type Props = { listing: Listing };

export function ListingDetailHero({ listing }: Props) {
  return (
    <section className="relative w-full h-[70vh] min-h-[520px] overflow-hidden">
      {listing.coverPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.coverPhotoUrl} alt={listing.street} className="absolute inset-0 w-full h-full object-cover" />
      ) : <div className="absolute inset-0 bg-ink-elevated" />}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 pb-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
          <CapsLabel as="div">{listing.community} · {listing.city}</CapsLabel>
          <h1 className="display-xl mt-4 text-stone">
            <em className="font-light">{listing.street}</em>
          </h1>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Write `yong2/components/portfolio/ListingFactSheet.tsx`**

```tsx
import type { Listing } from '@/lib/listings';
import { formatPrice, formatSqft, formatAcres } from '@/components/shared/formatters';

type Props = { listing: Listing };
type Row = { label: string; value: string };

export function ListingFactSheet({ listing }: Props) {
  const rows: Row[] = [
    { label: 'Price', value: formatPrice(listing.listPrice) },
    { label: 'Bedrooms', value: listing.beds?.toString() ?? '—' },
    { label: 'Bathrooms', value: listing.baths?.toString() ?? '—' },
    { label: 'Interior', value: formatSqft(listing.sqft) },
    { label: 'Lot', value: formatAcres(listing.lotAcres) },
    { label: 'Year Built', value: listing.yearBuilt?.toString() ?? '—' },
    { label: 'MLS', value: listing.mlsNumber ?? '—' },
    { label: 'Status', value: listing.status },
  ];
  return (
    <dl className="border-t border-white/10">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between py-3 border-b border-white/10 text-sm">
          <dt className="caps">{r.label}</dt>
          <dd className={r.label === 'Price' ? 'font-serif text-base' : ''}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 6: Write `yong2/components/portfolio/ListingGallery.tsx`**

```tsx
type Props = { photos: string[] };

export function ListingGallery({ photos }: Props) {
  if (photos.length === 0) return null;
  const [primary, second, third, ...rest] = photos;
  return (
    <div className="mt-16">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-2">
        {primary ? <img src={primary} alt="" className="w-full aspect-square object-cover" /> : null}
        {second ? <img src={second} alt="" className="w-full aspect-square object-cover" /> : null}
        {third ? <img src={third} alt="" className="w-full aspect-square object-cover" /> : null}
      </div>
      {rest.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {rest.slice(0, 8).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full aspect-square object-cover" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 7: Write `yong2/app/portfolio/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { ListingDetailHero } from '@/components/portfolio/ListingDetailHero';
import { ListingFactSheet } from '@/components/portfolio/ListingFactSheet';
import { ListingGallery } from '@/components/portfolio/ListingGallery';
import { getListingBySlug, getAllListings } from '@/lib/listings';

export const revalidate = 3600;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const listings = await getAllListings().catch(() => []);
  return listings.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: 'Listing' };
  return {
    title: `${listing.street} · ${listing.community}`,
    description: listing.remarks?.slice(0, 160) ?? `${listing.street}, ${listing.city}.`,
    openGraph: {
      images: listing.coverPhotoUrl ? [listing.coverPhotoUrl] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  return (
    <>
      <Navigation />
      <ListingDetailHero listing={listing} />
      <SectionFrame className="py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-12">
          <article className="text-stone/90 leading-relaxed space-y-4">
            {listing.remarks ? (
              <p>
                <span className="font-serif text-5xl leading-none float-left mr-2 -mt-1 text-gold">{listing.remarks.charAt(0)}</span>
                {listing.remarks.slice(1)}
              </p>
            ) : <p>Appointment only. Contact Yong for full property narrative.</p>}
          </article>
          <ListingFactSheet listing={listing} />
        </div>
        <ListingGallery photos={listing.photos} />
        <div className="mt-16 pt-10 border-t border-white/10 flex items-center justify-between">
          <Link href="/portfolio" className="caps hover:text-stone">← The Portfolio</Link>
          <Link href="/contact" className="caps bg-gold text-ink px-6 py-4 hover:bg-stone transition-colors">
            Request a Private Tour →
          </Link>
        </div>
      </SectionFrame>
      <Footer />
    </>
  );
}
```

- [ ] **Step 8: Verify in browser**

Run: `npm run dev`. Visit `/portfolio`, filter by status, click through to `/portfolio/[slug]`. With empty DB, portfolio renders empty state; with real data, tiles and detail page populate.

- [ ] **Step 9: Commit**

```bash
git add yong2/app/portfolio yong2/components/portfolio
git commit -m "feat(yong2): portfolio grid + listing detail pages"
```

---

## Task 12: Community data — `mv_community_scorecard` reader + stats

Augments `lib/communities.ts` with a KPI read.

**Files:**
- Modify: `yong2/lib/communities.ts`
- Test: `yong2/lib/communities.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// yong2/lib/communities.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCommunityKpis, communityKpiRowToKpis } from './communities';

vi.mock('./db', () => ({ getPool: vi.fn() }));

describe('communityKpiRowToKpis', () => {
  it('coerces numerics from strings', () => {
    const kpis = communityKpiRowToKpis({
      community_key: 'SILVERLEAF',
      median_sale_price: '6200000',
      active_count: 14,
      avg_dom: '112.4',
      median_ppsf: '1240.50',
    });
    expect(kpis.medianSalePrice).toBe(6200000);
    expect(kpis.activeCount).toBe(14);
    expect(kpis.avgDom).toBeCloseTo(112.4);
    expect(kpis.medianPpsf).toBeCloseTo(1240.5);
  });
});

describe('getCommunityKpis', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns null when no row found', async () => {
    const { getPool } = await import('./db');
    const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
    (getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: mockQuery });
    const kpis = await getCommunityKpis('DOES NOT EXIST');
    expect(kpis).toBeNull();
  });
});
```

- [ ] **Step 2: Run it — FAIL (functions not exported)**

Run: `npm run test`

- [ ] **Step 3: Extend `yong2/lib/communities.ts`**

```ts
import { getPool } from './db';
import { communitiesContent, communitySlugs, type CommunitySlug } from '@/content/communities';

export type CommunitySummary = {
  slug: CommunitySlug;
  name: string;
  locality: string;
  imageUrl: string | null;
};

export type CommunityKpis = {
  communityKey: string;
  medianSalePrice: number | null;
  activeCount: number;
  avgDom: number | null;
  medianPpsf: number | null;
};

type KpiRow = {
  community_key: string;
  median_sale_price: string | number | null;
  active_count: number | null;
  avg_dom: string | number | null;
  median_ppsf: string | number | null;
};

const toNum = (v: string | number | null | undefined): number | null => {
  if (v == null) return null;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
};

export function communityKpiRowToKpis(r: KpiRow): CommunityKpis {
  return {
    communityKey: r.community_key,
    medianSalePrice: toNum(r.median_sale_price),
    activeCount: r.active_count ?? 0,
    avgDom: toNum(r.avg_dom),
    medianPpsf: toNum(r.median_ppsf),
  };
}

export function getCuratedCommunities(): CommunitySummary[] {
  return communitySlugs.map((slug) => {
    const c = communitiesContent[slug];
    return { slug, name: c.name, locality: c.locality, imageUrl: c.heroImageUrl ?? null };
  });
}

export async function getCommunityKpis(communityKey: string): Promise<CommunityKpis | null> {
  const pool = getPool();
  const sql = `
    SELECT community_key, median_sale_price, active_count, avg_dom, median_ppsf
    FROM mv_community_scorecard
    WHERE community_key = $1
    LIMIT 1
  `;
  const { rows } = await pool.query<KpiRow>(sql, [communityKey]);
  return rows.length ? communityKpiRowToKpis(rows[0]) : null;
}

export async function getAllCommunityKpis(): Promise<Record<string, CommunityKpis>> {
  const pool = getPool();
  const keys = communitySlugs.map((s) => communitiesContent[s].communityKey);
  if (keys.length === 0) return {};
  const sql = `
    SELECT community_key, median_sale_price, active_count, avg_dom, median_ppsf
    FROM mv_community_scorecard
    WHERE community_key = ANY($1::text[])
  `;
  const { rows } = await pool.query<KpiRow>(sql, [keys]);
  return Object.fromEntries(rows.map((r) => [r.community_key, communityKpiRowToKpis(r)]));
}
```

- [ ] **Step 4: Run tests — pass**

Run: `npm run test`

- [ ] **Step 5: Commit**

```bash
git add yong2/lib/communities.ts yong2/lib/communities.test.ts
git commit -m "feat(yong2): community KPI reader (mv_community_scorecard)"
```

---

## Task 13: `/communities` index + `/communities/[slug]` detail

**Files:**
- Create: `yong2/app/communities/page.tsx`
- Create: `yong2/app/communities/[slug]/page.tsx`
- Create: `yong2/components/communities/CommunityIndex.tsx`
- Create: `yong2/components/communities/CommunityCard.tsx`
- Create: `yong2/components/communities/CommunityHero.tsx`
- Create: `yong2/components/communities/CommunityKpis.tsx`

- [ ] **Step 1: Write `yong2/components/communities/CommunityCard.tsx`**

```tsx
import Link from 'next/link';
import type { CommunitySummary } from '@/lib/communities';
import type { CommunityKpis } from '@/lib/communities';
import { formatPrice, formatDom } from '@/components/shared/formatters';

type Props = { community: CommunitySummary; kpis: CommunityKpis | null };

export function CommunityCard({ community, kpis }: Props) {
  return (
    <Link href={`/communities/${community.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-ink-elevated group">
      {community.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={community.imageUrl} alt={community.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-105" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        <div>
          <div className="caps">{community.locality}</div>
          <div className="font-serif italic text-2xl mt-2">{community.name}</div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-serif text-lg">{kpis?.medianSalePrice ? formatPrice(kpis.medianSalePrice) : '—'}</div>
            <div className="caps mt-0.5">Median</div>
          </div>
          <div>
            <div className="font-serif text-lg">{kpis?.activeCount ?? '—'}</div>
            <div className="caps mt-0.5">Active</div>
          </div>
          <div>
            <div className="font-serif text-lg">{formatDom(kpis?.avgDom ?? null)}</div>
            <div className="caps mt-0.5">Avg DOM</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Write `yong2/components/communities/CommunityIndex.tsx`**

```tsx
import type { CommunitySummary, CommunityKpis } from '@/lib/communities';
import { CommunityCard } from './CommunityCard';

type Props = { communities: CommunitySummary[]; kpisByKey: Record<string, CommunityKpis> };

export function CommunityIndex({ communities, kpisByKey }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {communities.map((c) => (
        <CommunityCard
          key={c.slug}
          community={c}
          kpis={kpisByKey[cMetaKey(c.slug)] ?? null}
        />
      ))}
    </div>
  );
}

// Helper — the index receives summaries without the community_key, but the content source has it.
// We re-resolve the key at render time from the slug.
function cMetaKey(slug: string): string {
  const mod = require('@/content/communities').communitiesContent;
  return mod[slug]?.communityKey ?? '';
}
```

Note: the synchronous `require` inside a server component is acceptable; this is statically-resolvable content. If ESM strictness complains, inline the lookup via a prop instead.

- [ ] **Step 3: Write `yong2/app/communities/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { CommunityIndex } from '@/components/communities/CommunityIndex';
import { getCuratedCommunities, getAllCommunityKpis } from '@/lib/communities';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'The Communities',
  description: "The enclaves Yong Choi represents across the Phoenix Metro.",
};

export default async function CommunitiesPage() {
  const communities = getCuratedCommunities();
  const kpisByKey = await getAllCommunityKpis().catch(() => ({}));
  return (
    <>
      <Navigation />
      <main className="pt-24">
        <SectionFrame className="py-12">
          <h1 className="display-xl italic border-b border-white/10 pb-6 mb-10">The Communities</h1>
          <CommunityIndex communities={communities} kpisByKey={kpisByKey} />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Write `yong2/components/communities/CommunityHero.tsx`**

```tsx
import { CapsLabel } from '@/components/shared/CapsLabel';

type Props = {
  name: string;
  locality: string;
  imageUrl: string | null;
  aerialVideoId?: string;
};

export function CommunityHero({ name, locality, imageUrl, aerialVideoId }: Props) {
  return (
    <section className="relative w-full h-[60vh] min-h-[440px] overflow-hidden">
      {aerialVideoId ? (
        <iframe
          src={`https://aerialview.google.com/embed/${aerialVideoId}?autoplay=1&mute=1&loop=1`}
          className="absolute inset-0 w-full h-full"
          title={`${name} aerial`}
          allow="autoplay; fullscreen"
        />
      ) : imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
      ) : <div className="absolute inset-0 bg-ink-elevated" />}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 pb-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
          <CapsLabel as="div">{locality}</CapsLabel>
          <h1 className="display-xl italic mt-4">{name}</h1>
        </div>
      </div>
    </section>
  );
}
```

Verify the Google Aerial View embed URL format before release — fall back to the image if embeds are restricted.

- [ ] **Step 5: Write `yong2/components/communities/CommunityKpis.tsx`**

```tsx
import type { CommunityKpis as KpisData } from '@/lib/communities';
import { formatPrice, formatDom } from '@/components/shared/formatters';

type Props = { kpis: KpisData | null };

export function CommunityKpis({ kpis }: Props) {
  if (!kpis) return null;
  const cells = [
    { label: 'Median Sale', value: kpis.medianSalePrice ? formatPrice(kpis.medianSalePrice) : '—' },
    { label: 'Active Listings', value: kpis.activeCount.toString() },
    { label: 'Avg Days on Market', value: formatDom(kpis.avgDom) },
    { label: 'Median $/Sqft', value: kpis.medianPpsf ? `$${Math.round(kpis.medianPpsf).toLocaleString()}` : '—' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border border-white/10 my-10">
      {cells.map((c, i) => (
        <div key={c.label} className={`p-6 text-center ${i < 3 ? 'border-b md:border-b-0 md:border-r border-white/10' : ''}`}>
          <div className="font-serif text-2xl">{c.value}</div>
          <div className="caps mt-2">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Write `yong2/app/communities/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { CommunityHero } from '@/components/communities/CommunityHero';
import { CommunityKpis } from '@/components/communities/CommunityKpis';
import { ListingTile } from '@/components/portfolio/ListingTile';
import { communitiesContent, communitySlugs, type CommunitySlug } from '@/content/communities';
import { getCommunityKpis } from '@/lib/communities';
import { getListingsByCommunity } from '@/lib/listings';

export const revalidate = 3600;

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return communitySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!(slug in communitiesContent)) return { title: 'Community' };
  const c = communitiesContent[slug as CommunitySlug];
  return {
    title: c.name,
    description: c.narrative[0]?.slice(0, 160),
  };
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (!(slug in communitiesContent)) notFound();
  const c = communitiesContent[slug as CommunitySlug];

  const [kpis, listings] = await Promise.all([
    getCommunityKpis(c.communityKey).catch(() => null),
    getListingsByCommunity(c.communityKey).catch(() => []),
  ]);

  return (
    <>
      <Navigation />
      <CommunityHero
        name={c.name}
        locality={c.locality}
        imageUrl={c.heroImageUrl ?? null}
        aerialVideoId={'aerialVideoId' in c ? c.aerialVideoId : undefined}
      />
      <SectionFrame className="py-16">
        <CommunityKpis kpis={kpis} />
        <div className="max-w-3xl">
          {c.narrative.map((p, i) => (
            <p key={i} className="text-stone/85 leading-relaxed mb-4">{p}</p>
          ))}
        </div>
        {listings.length > 0 ? (
          <>
            <h2 className="display-lg italic mt-16 mb-8">Now in {c.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => <ListingTile key={l.slug} listing={l} />)}
            </div>
          </>
        ) : null}
        <Link href="/communities" className="caps mt-16 inline-block hover:text-stone">← All Communities</Link>
      </SectionFrame>
      <Footer />
    </>
  );
}
```

- [ ] **Step 7: Verify**

Run: `npm run dev`, visit `/communities`, click a community, confirm hero + KPIs + narrative + active listings render.

- [ ] **Step 8: Commit**

```bash
git add yong2/app/communities yong2/components/communities
git commit -m "feat(yong2): communities index + community detail pages"
```

---

## Task 14: `/about` page

**Files:**
- Create: `yong2/app/about/page.tsx`
- Create: `yong2/components/about/AboutSplit.tsx`
- Create: `yong2/components/about/StatsStrip.tsx`

- [ ] **Step 1: Write `yong2/components/about/StatsStrip.tsx`**

```tsx
import { yongBio } from '@/content/yong';

export function StatsStrip() {
  return (
    <dl className="grid grid-cols-3 gap-6 md:gap-10 pt-8 mt-8 border-t border-white/10">
      {yongBio.stats.map((s) => (
        <div key={s.label}>
          <dt className="caps">{s.label}</dt>
          <dd className="font-serif text-3xl text-gold mt-2">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 2: Write `yong2/components/about/AboutSplit.tsx`**

```tsx
import { yongBio } from '@/content/yong';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { StatsStrip } from './StatsStrip';

function emphasize(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((c, i) =>
    c.startsWith('*') && c.endsWith('*') ? <em key={i} className="font-light">{c.slice(1, -1)}</em> : <span key={i}>{c}</span>
  );
}

export function AboutSplit() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
      <div className="aspect-[3/4] bg-ink-elevated flex items-center justify-center caps text-mute">
        Portrait
      </div>
      <div>
        <CapsLabel as="div">{yongBio.kicker}</CapsLabel>
        <h1 className="display-xl mt-4">{emphasize(yongBio.headline)}</h1>
        {yongBio.paragraphs.map((p, i) => (
          <p key={i} className="mt-4 text-stone/85 leading-relaxed">{p}</p>
        ))}
        <StatsStrip />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `yong2/app/about/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { AboutSplit } from '@/components/about/AboutSplit';

export const metadata: Metadata = {
  title: 'About Yong Choi',
  description: 'Over two decades representing clients from Paradise Valley to Desert Mountain.',
};

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24">
        <SectionFrame className="py-20">
          <AboutSplit />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`, visit `/about`, confirm split layout renders, stats strip shows values.

- [ ] **Step 5: Commit**

```bash
git add yong2/app/about yong2/components/about
git commit -m "feat(yong2): about page"
```

---

## Task 15: Rate limit utility + contact form handler

**Files:**
- Create: `yong2/lib/rate-limit.ts`
- Test: `yong2/lib/rate-limit.test.ts`
- Create: `yong2/lib/contact.ts`
- Create: `yong2/app/api/contact/route.ts`
- Test: `yong2/app/api/contact/route.test.ts`

- [ ] **Step 1: Write failing test — rate limit**

```ts
// yong2/lib/rate-limit.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, __resetRateLimit } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => { __resetRateLimit(); });

  it('allows the first N requests from the same key', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('1.2.3.4', 10, 3600_000).allowed).toBe(true);
    }
  });

  it('blocks the 11th request within the window', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('1.2.3.4', 10, 3600_000);
    expect(checkRateLimit('1.2.3.4', 10, 3600_000).allowed).toBe(false);
  });

  it('tracks keys independently', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('1.2.3.4', 10, 3600_000);
    expect(checkRateLimit('5.6.7.8', 10, 3600_000).allowed).toBe(true);
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Write `yong2/lib/rate-limit.ts`**

```ts
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

export function checkRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.resetAt < now) {
    const next: Bucket = { count: 1, resetAt: now + windowMs };
    store.set(key, next);
    return { allowed: true, remaining: max - 1, resetAt: next.resetAt };
  }
  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { allowed: true, remaining: max - existing.count, resetAt: existing.resetAt };
}

export function __resetRateLimit(): void {
  store.clear();
}
```

Note: in-memory is fine for a single Vercel Fluid function instance. If traffic grows, swap to Upstash Redis.

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Write `yong2/lib/contact.ts`**

```ts
import { Resend } from 'resend';

export type ContactMessage = {
  name: string;
  email: string;
  phone: string;
  interest: 'Buying' | 'Selling' | 'Both';
  message: string;
};

export async function sendContactMessage(msg: ContactMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? 'no-reply@yongchoi.com';
  if (!apiKey || !to) {
    throw new Error('RESEND_API_KEY and CONTACT_TO_EMAIL are required');
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    replyTo: msg.email,
    subject: `Website inquiry — ${msg.name} (${msg.interest})`,
    text: [
      `From: ${msg.name} <${msg.email}>`,
      `Phone: ${msg.phone}`,
      `Interest: ${msg.interest}`,
      '',
      msg.message,
    ].join('\n'),
  });
}
```

- [ ] **Step 6: Write failing test for the route**

```ts
// yong2/app/api/contact/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/contact', () => ({ sendContactMessage: vi.fn() }));
vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit');
  return actual;
});

describe('POST /api/contact', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { __resetRateLimit } = await import('@/lib/rate-limit');
    __resetRateLimit();
  });

  it('rejects missing fields with 400', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.1.1.1' },
      body: JSON.stringify({ name: 'x' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects honeypot hits with 200 (silent drop)', async () => {
    const { POST } = await import('./route');
    const body = { name: 'a', email: 'a@b.c', phone: '1', interest: 'Buying', message: 'hi', website: 'spam.com' };
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '2.2.2.2' },
      body: JSON.stringify(body),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const { sendContactMessage } = await import('@/lib/contact');
    expect(sendContactMessage).not.toHaveBeenCalled();
  });

  it('accepts valid payload and calls sendContactMessage', async () => {
    const { POST } = await import('./route');
    const body = { name: 'a', email: 'a@b.c', phone: '1', interest: 'Buying', message: 'hi' };
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '3.3.3.3' },
      body: JSON.stringify(body),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const { sendContactMessage } = await import('@/lib/contact');
    expect(sendContactMessage).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 7: Run — FAIL**

- [ ] **Step 8: Write `yong2/app/api/contact/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactMessage } from '@/lib/contact';
import { checkRateLimit } from '@/lib/rate-limit';

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(1).max(40),
  interest: z.enum(['Buying', 'Selling', 'Both']),
  message: z.string().min(1).max(4000),
  website: z.string().optional(), // honeypot
});

export async function POST(req: Request): Promise<Response> {
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  // Silently drop honeypot hits — bot doesn't know it failed.
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = checkRateLimit(ip, 10, 3600_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    await sendContactMessage({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      interest: parsed.data.interest,
      message: parsed.data.message,
    });
  } catch (err) {
    console.error('contact.send_failed', err);
    return NextResponse.json({ error: 'Unable to send' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 9: Run tests — PASS**

- [ ] **Step 10: Commit**

```bash
git add yong2/lib/rate-limit.ts yong2/lib/rate-limit.test.ts yong2/lib/contact.ts yong2/app/api/contact
git commit -m "feat(yong2): contact form route handler with Resend + honeypot + rate limit"
```

---

## Task 16: `/contact` page UI + form component

**Files:**
- Create: `yong2/components/contact/ContactForm.tsx`
- Create: `yong2/app/contact/page.tsx`

- [ ] **Step 1: Write `yong2/components/contact/ContactForm.tsx`**

```tsx
'use client';

import { useState, type FormEvent } from 'react';

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

export function ContactForm() {
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    setErrorMsg('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Unable to send');
      }
      setState('sent');
      form.reset();
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send');
    }
  }

  if (state === 'sent') {
    return (
      <div className="border border-gold/40 p-8 text-center">
        <div className="font-serif italic text-2xl mb-2">Message received.</div>
        <p className="text-stone/80 text-sm">Yong will be in touch within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="border border-gold/30 p-6 md:p-8 space-y-5">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <Field label="Your Name" name="name" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Phone" name="phone" type="tel" required />
      <div>
        <label className="caps block mb-2">Interest</label>
        <select name="interest" required defaultValue="" className="w-full bg-transparent border-b border-white/15 py-2 text-stone focus:border-gold outline-none">
          <option value="" disabled>Select one</option>
          <option>Buying</option>
          <option>Selling</option>
          <option>Both</option>
        </select>
      </div>
      <div>
        <label className="caps block mb-2">Message</label>
        <textarea name="message" required rows={5} className="w-full bg-transparent border-b border-white/15 py-2 text-stone focus:border-gold outline-none" />
      </div>
      {errorMsg ? <p className="text-red-400 text-sm">{errorMsg}</p> : null}
      <button type="submit" disabled={state === 'sending'} className="caps bg-gold text-ink px-6 py-4 hover:bg-stone transition-colors disabled:opacity-50">
        {state === 'sending' ? 'Sending…' : 'Send →'}
      </button>
    </form>
  );
}

function Field({ label, name, type = 'text', required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="caps block mb-2">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full bg-transparent border-b border-white/15 py-2 text-stone focus:border-gold outline-none"
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `yong2/app/contact/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { ContactForm } from '@/components/contact/ContactForm';
import { siteContent } from '@/content/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Begin a conversation with Yong Choi.',
};

export default function ContactPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24">
        <SectionFrame className="py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h1 className="display-xl"><em className="font-light">Begin</em> a conversation.</h1>
              <p className="mt-6 text-stone/85 leading-relaxed max-w-md">
                Whether you&rsquo;re months or years from a move, every engagement starts with a conversation. Messages are read personally and replied to within 24 hours.
              </p>
              <dl className="mt-10 space-y-3">
                {[
                  { k: 'Mobile', v: <a href={siteContent.contact.mobileHref} className="hover:text-gold">{siteContent.contact.mobile}</a> },
                  { k: 'Email', v: <a href={`mailto:${siteContent.contact.email}`} className="hover:text-gold">{siteContent.contact.email}</a> },
                  { k: 'Office', v: <span className="text-mute">{siteContent.contact.office}</span> },
                  { k: 'Instagram', v: <a href={siteContent.contact.instagramHref} className="hover:text-gold">{siteContent.contact.instagram}</a> },
                ].map((row) => (
                  <div key={row.k} className="flex justify-between border-b border-white/10 py-3 text-sm">
                    <dt className="caps">{row.k}</dt>
                    <dd>{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <ContactForm />
          </div>
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify end-to-end**

Run: `npm run dev`. Fill out form. With `RESEND_API_KEY` and `CONTACT_TO_EMAIL` set, confirm email arrives. Without, confirm graceful 500 with user-visible error.

- [ ] **Step 4: Commit**

```bash
git add yong2/components/contact yong2/app/contact
git commit -m "feat(yong2): contact page with inline form + success state"
```

---

## Task 17: SEO — sitemap, robots, OG image

**Files:**
- Create: `yong2/app/sitemap.ts`
- Create: `yong2/app/robots.ts`
- Create: `yong2/app/opengraph-image.tsx`
- Create: `yong2/lib/seo.ts` (helper)

- [ ] **Step 1: Write `yong2/lib/seo.ts`**

```ts
export function siteUrl(path: string = ''): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${clean}`;
}
```

- [ ] **Step 2: Write `yong2/app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next';
import { getAllListings } from '@/lib/listings';
import { communitySlugs } from '@/content/communities';
import { siteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/portfolio', '/communities', '/about', '/contact'];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((p) => ({
    url: siteUrl(p),
    changeFrequency: p === '' ? 'weekly' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));

  entries.push(...communitySlugs.map((s) => ({ url: siteUrl(`/communities/${s}`), changeFrequency: 'weekly' as const, priority: 0.6 })));

  const listings = await getAllListings().catch(() => []);
  entries.push(...listings.map((l) => ({
    url: siteUrl(`/portfolio/${l.slug}`),
    lastModified: new Date(l.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  })));

  return entries;
}
```

- [ ] **Step 3: Write `yong2/app/robots.ts`**

```ts
import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: siteUrl('/sitemap.xml'),
    host: process.env.NEXT_PUBLIC_SITE_URL,
  };
}
```

- [ ] **Step 4: Write `yong2/app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Yong Choi · Sotheby’s International Realty';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        background: '#0B1620', color: '#EFE9DF',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '80px',
      }}>
        <div style={{ fontSize: 16, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#D4B88A', marginBottom: 32 }}>
          Sotheby’s International Realty
        </div>
        <div style={{ fontSize: 96, fontStyle: 'italic', lineHeight: 1.0 }}>
          Yong Choi
        </div>
        <div style={{ fontSize: 24, marginTop: 24, color: '#8A93A0' }}>
          Scottsdale &middot; Paradise Valley &middot; Desert Mountain
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 5: Verify**

Run `npm run dev`, visit `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, confirm all render.

- [ ] **Step 6: Commit**

```bash
git add yong2/app/sitemap.ts yong2/app/robots.ts yong2/app/opengraph-image.tsx yong2/lib/seo.ts
git commit -m "feat(yong2): sitemap, robots, default OG image"
```

---

## Task 18: Playwright smoke tests

**Files:**
- Create: `yong2/playwright.config.ts`
- Create: `yong2/tests/smoke.spec.ts`

- [ ] **Step 1: Install Playwright browsers**

Run: `cd yong2 && npx playwright install chromium`

- [ ] **Step 2: Write `yong2/playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  timeout: 30_000,
  use: { baseURL: 'http://localhost:3000', headless: true },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Write `yong2/tests/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.describe('yong2 smoke', () => {
  test('home renders hero + sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Desert Living');
    await expect(page.getByText('Meet Your Advisor')).toBeVisible();
    await expect(page.getByText('Begin a Conversation', { exact: false })).toBeVisible();
  });

  test('portfolio page renders filter bar', async ({ page }) => {
    await page.goto('/portfolio');
    await expect(page.getByRole('heading', { name: 'The Portfolio' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Active' })).toBeVisible();
  });

  test('communities page renders cards', async ({ page }) => {
    await page.goto('/communities');
    await expect(page.getByRole('heading', { name: 'The Communities' })).toBeVisible();
  });

  test('about page renders headline + stats', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText('fewer, better')).toBeVisible();
    await expect(page.getByText('Career Sales')).toBeVisible();
  });

  test('contact page renders form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByLabel('Your Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('nav links navigate between pages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Portfolio' }).first().click();
    await expect(page).toHaveURL(/\/portfolio/);
  });
});
```

- [ ] **Step 4: Run the smoke tests**

Run: `cd yong2 && npm run test:e2e`
Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add yong2/playwright.config.ts yong2/tests
git commit -m "test(yong2): playwright smoke suite for all routes"
```

---

## Task 19: Vercel config + deployment prep

**Files:**
- Create: `yong2/vercel.ts`
- Modify: `yong2/README.md` (add deploy notes)

- [ ] **Step 1: Write `yong2/vercel.ts`**

```ts
import { routes, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
  headers: [
    routes.cacheControl('/_next/static/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    routes.cacheControl('/hero/(.*)', { public: true, maxAge: '1 day' }),
  ],
};

export default config;
```

- [ ] **Step 2: Install `@vercel/config`**

Run: `cd yong2 && npm install --save-dev @vercel/config`

- [ ] **Step 3: Update `yong2/README.md`** — append a Deployment section:

```markdown
## Deployment

Deployed on Vercel (Fluid Compute default).

Required env vars (Vercel dashboard → Settings → Environment Variables):
- `RDS_DATABASE_URL`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `NEXT_PUBLIC_SITE_URL`

First-time link:

vercel link            # select or create yong2 project
vercel env pull        # pull envs to .env.local
vercel --prod          # deploy
```

- [ ] **Step 4: Commit**

```bash
git add yong2/vercel.ts yong2/README.md yong2/package.json yong2/package-lock.json
git commit -m "chore(yong2): vercel.ts config + deploy notes"
```

---

## Task 20: Root CLAUDE.md reference + final PR

**Files:**
- Modify: `CLAUDE.md` (root) — add yong2 pointer under Project Structure
- Modify: `MEMORY.md` in `C:\Users\joeys\.claude\projects\C--Users-joeys-Desktop-RLSIR-Websites\memory\` (optional; leave to user)

- [ ] **Step 1: Add yong2 to root `CLAUDE.md`**

Find the "Project Structure" section. Add a line under it:

```markdown
- **Yong2 Site**: `yong2/` — Yong Choi's redesigned Next.js 16 + React 19 + Tailwind v4 site (dark cinematic editorial). Parallel to Jeane. Replaces `prototypes/yong/` over time. Spec: `docs/superpowers/specs/2026-04-24-yong2-redesign-design.md`.
```

- [ ] **Step 2: Verify every task completed + tests green**

Run: `cd yong2 && npm run test && npm run test:e2e && npm run build`
Expected: all green. Build succeeds.

- [ ] **Step 3: Push branch + open PR to `dev`**

```bash
git push -u origin feature/yong2-redesign
gh pr create --base dev --title "yong2: new cinematic editorial marketing site" --body "$(cat <<'EOF'
## Summary
- New top-level Next.js 16 app at yong2/ (parallel to Jeane/)
- Dark cinematic editorial direction (Midnight & Stone palette)
- Home, portfolio + detail, communities + detail, about, contact
- Live listings from RDS; community KPIs from mv_community_scorecard
- Contact form via Resend, honeypot + rate-limited

Spec: docs/superpowers/specs/2026-04-24-yong2-redesign-design.md
Plan: docs/superpowers/plans/2026-04-24-yong2-redesign.md

## Test plan
- [ ] cd yong2 && npm run test (vitest)
- [ ] cd yong2 && npm run test:e2e (playwright smoke)
- [ ] cd yong2 && npm run build
- [ ] Manual: home hero + section stack + nav scroll behavior
- [ ] Manual: /portfolio grid + status filter + /portfolio/[slug]
- [ ] Manual: /communities index + /communities/[slug] with live KPIs
- [ ] Manual: /contact form submit with real Resend key (end-to-end email)
- [ ] Manual: /sitemap.xml + /robots.txt + /opengraph-image
EOF
)"
```

- [ ] **Step 4: Commit the root CLAUDE.md update**

```bash
git add CLAUDE.md
git commit -m "docs: reference yong2 in root CLAUDE.md"
git push
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task(s) |
|---|---|
| §1–2 Summary / goals | — (meta) |
| §3 Page inventory | 6 (home), 11 (portfolio + detail), 13 (communities + detail), 14 (about), 16 (contact) |
| §4.1 Palette | 3 |
| §4.2 Typography | 3 |
| §4.3 Motion | 3, 6 |
| §5 Home page stack | 6, 7, 10 |
| §5.1 Hero Concept A | 6 |
| §6.1 /portfolio | 11 |
| §6.2 /portfolio/[slug] | 11 |
| §6.3 /communities | 13 |
| §6.4 /communities/[slug] | 13 |
| §6.5 /about | 14 |
| §6.6 /contact | 15, 16 |
| §7.1 Navigation | 5 |
| §7.2 Footer | 5 |
| §8.1 Listings data | 8, 9, 10 |
| §8.2 Communities data | 12 |
| §8.3 Imagery | 1 (next.config remote patterns), 6 (hero placeholder) |
| §8.4 Contact form backend | 15 |
| §8.5 Analytics | — (deferred, noted in spec as optional Plausible) |
| §9 Tech stack | 1, 2 |
| §10 File layout | All tasks |
| §11 Phasing | Tasks 1–20 cover all six phases |
| §12 Success criteria | 18 (Playwright), 19 (perf), manual Lighthouse pass in Task 20 |

**Placeholder scan:** No "TBD" or "implement later" strings. Hero poster image is a documented placeholder pending Yong's shoot — that's an asset need, not a code placeholder. Portrait placeholder likewise. Domain `yongchoi.com` referenced — will be configured via `NEXT_PUBLIC_SITE_URL`.

**Type consistency:** `Listing`, `CommunitySummary`, `CommunityKpis`, `ContactMessage` types defined in `lib/*.ts` and consumed consistently in components. `formatPrice`, `formatSqft`, `formatAcres`, `formatDom`, `slugify` defined once in `components/shared/formatters.ts` and referenced by name everywhere.

**Known implementation risks flagged during execution:**
- RDS `listings` table column names — the Row type in `lib/listings.ts` is my assumption. First real query run will reveal schema drift; adapter will need adjustment.
- `mv_community_scorecard` columns — same assumption. Validate against `packages/database` in `real-estate-platform/` before wiring.
- Google Aerial View iframe embed URL format — verify `https://aerialview.google.com/embed/<id>` is the current embed format; fall back to image if embeds are restricted.
- Resend `from` domain verification — `CONTACT_FROM_EMAIL` domain must be verified in Resend before emails deliver.

---

**End of plan.**
