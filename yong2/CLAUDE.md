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
npm run build         # next build  (see Known Issue below)
npm run test          # vitest
npm run test:e2e      # playwright

## Known Issue — `npm run build` `/_global-error` prerender

Next 16.2.4 fails to prerender the synthetic `/_global-error` route during
`npm run build` with `Cannot read properties of null (reading 'useContext')`
inside the `LayoutRouterContext` invariant. This reproduces:
  - on Jeane's site (identical Next 16.2.4 + React 19.2.4 stack)
  - on Next 16.1.6 (downgraded)
  - with React 19.1.0 (downgraded)
  - with Turbopack and `--webpack` builds
  - with our custom `app/global-error.tsx` and without it (framework default)

It is an upstream Next.js framework regression, not user code. `npm run dev`
is unaffected. Vercel's deploy path may handle it differently — verify on a
preview deploy. Until upstream ships a fix, treat `npm run build` failure
as a known limitation, not a regression introduced by feature work.

`app/not-found.tsx` is intentionally minimal (no Navigation/Footer chrome)
because the original chrome-importing version compounded the prerender
failure on `/_not-found`. Keep it inline-styled until the upstream fix lands.

### Build attempts that did NOT fix it (don't repeat)

Tried 2026-04-26 against `next@16.2.4` + `react@19.2.4`:

1. `dynamic = 'force-dynamic'` exports on `app/global-error.tsx` and
   `app/not-found.tsx` — does not propagate to the synthetic
   `/_global-error` route the worker uses.
2. Stripping `app/global-error.tsx` to bare HTML (no hooks, no Link,
   only inline-styled `<html><body>`).
3. `output: 'standalone'` in `next.config.ts`.
4. `experimental.ppr: false` (sometimes shifts the failure to `/about`
   instead of `/_global-error` — same `useContext null` cause).
5. `serverExternalPackages: ['pg']` (kept this — it's a sensible
   default regardless).
6. Removing `app/global-error.tsx` entirely so Next falls back to its
   built-in default — same crash, confirming the bug is in the
   framework's prerender of the synthetic route, not user code.

`experimental.dynamicIO` and `experimental.useCache` are not valid
keys on `ExperimentalConfig` in 16.2.4 (TS error). PPR is the only
related toggle exposed.

## Known fixes (live + landed)

- **MapTiler** key for the listing detail map is the public/free key
  `6DagWlYgkxoFxL5RaX6S`. Set as `NEXT_PUBLIC_MAPTILER_KEY` in
  `.env.local` (gitignored) and `.env.example`. Safe in the client
  bundle — public keys are intended for browser use.
- **Listing OG images** must use absolute positioning + `display: flex`
  on every container with > 1 child. Satori does not support
  `z-index`. Layered overlays (background photo + dark gradient +
  text columns) are stacked as absolute children of a single root
  `position: relative; display: flex` container.

## Responsive notes

Audited at 375 / 768 / 1024 px. Coverage in `tests/responsive.spec.ts`:
visits every public surface (incl. one detail page picked at runtime
from each index), screenshots full-page to `tests/screenshots/`
(gitignored), and asserts `scrollWidth - clientWidth <= 2` on every
viewport. Burger nav has its own toggle test.

Run against the docker dev container without spawning a second `next dev`:

    PLAYWRIGHT_BASE_URL=http://localhost:3200 npx playwright test

The same env var skips Playwright's `webServer` block. CI (no env var)
keeps the original behaviour and starts its own server on :3000.

Recurring fixes you should apply if you add new sections:

- Wrap multi-column grids `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  — never bare `grid-cols-2/3` without a `grid-cols-1` mobile floor.
- Title rows that pair `display-xl` with horizontal controls must
  `flex-col gap-6 md:flex-row md:items-end md:justify-between` —
  fixed-width display type plus N filter pills overflows 375 px.
- Hardcoded display sizes (`text-[96px]`) need a smaller mobile step
  (`text-[64px] md:text-[96px]`); the existing `display-*` utilities
  already use `clamp()`.
- All photo URLs live on `cdn.photos.sparkplatform.com` — that exact
  host is registered in `next.config.ts` `remotePatterns` (the wildcard
  `*.sparkplatform.com` only matches one subdomain level).

## Performance & SEO

Source-of-truth docs:

- `docs/PERFORMANCE.md` — page-by-page LCP / weight / interaction budgets,
  Core Web Vitals, API/DB p50/p95, Lighthouse CI thresholds.
- `docs/SEO.md` — rendering strategy per route (ISR / SSG / streaming),
  SEO building blocks, webmaster verification checklist.

Hero LCP path: every `priority` `<Image>` auto-emits a `<link rel="preload"
as="image" imageSrcSet=...>` in the document head. Hero `<Image>` components
also pass `fetchPriority="high"` and `quality={70}` for the LCP-critical
photograph (10% byte savings vs default 75 with imperceptible quality loss
on luxury photography).

Liveness: `GET /api/health` returns `{ ok, db, mvFreshness, latencyMs }`
with `Cache-Control: no-store`. Wire an external uptime monitor (e.g.
UptimeRobot) at 5-min cadence — alarms on `ok: false` or latency > 2s.

`Server-Timing` headers on `/api/listings/search`, `/api/contact`, and
`/api/health` surface DB + total request timings in browser DevTools and
Vercel's request panel.

Lighthouse CI: `.github/workflows/lighthouse-yong2.yml` runs on PRs that
touch `yong2/`. Asserts the budgets in `lighthouserc.json` (LCP < 1000ms,
CLS < 0.05, Perf >= 90, SEO >= 95, A11y >= 95). Build step is currently
`continue-on-error: true` until the upstream Next 16.2.4 `_global-error`
prerender bug is patched.

## Vercel Speed Insights — first deploy

On the first Vercel preview/production deploy, enable **Speed Insights**
in the project's dashboard (Settings → Speed Insights → Enable). This
collects real-user CWV data (LCP/INP/CLS p75) for the budgets defined
in `docs/PERFORMANCE.md`. No code change required — Vercel injects the
script automatically once enabled.

## Image optimization

Every `<img>` rendered from a remote photo URL goes through
`next/image`. Sizes hints are tuned per tile shape:

- Hero (above fold): `fill priority sizes="100vw"`
- Listing tile (4:5 grid): `sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"`
- Community card (16:10): `sizes="(min-width: 768px) 50vw, 100vw"`
- About portrait (3:4): `sizes="(min-width: 768px) 50vw, 100vw" priority`
- Gallery thumb: `sizes="(min-width: 768px) 25vw, 50vw"`

Recharts charts are dynamic-imported with SSR off via
`components/charts/ReportCharts.tsx`, with a skeleton loading state
that holds height to avoid CLS.

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
