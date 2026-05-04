# yong2 Performance Specs

> Source of truth for performance targets. Updated when targets change.
> Last reviewed: 2026-04-27

## Hero image LCP — top priority

| Network | Target | Notes |
|---|---|---|
| Cable / fast WiFi | < 800ms | "Instant" perception threshold. Hard-fail in CI. |
| 4G mobile | < 1.2s | Luxury buyers on phones — must land in one breath. |
| Slow 3G (worst case) | < 2.5s | Floor — never see "loading" hero state. |

## Page load budgets

| Page | Hero LCP | General LCP | First content visible | Total weight |
|---|---|---|---|---|
| / | < 800ms | < 1.8s | featured tiles < 2.5s | < 600 KB |
| /portfolio | < 2.0s | n/a (small banner) | first tiles < 1.5s | < 900 KB |
| /portfolio/[slug] | < 800ms | < 2.0s | facts < 1.5s; map < 3.5s | < 1.2 MB |
| /listings | < 1.0s | < 2.5s | map interactive < 2.5s; results < 1.8s | < 1.4 MB |
| /communities | < 1.0s | < 2.0s | first card < 1.5s | < 800 KB |
| /communities/[slug] | < 1.0s | < 2.0s | KPIs < 1.5s | < 1.0 MB |
| /market-reports | < 1.0s | < 2.0s | latest report < 2.0s | < 800 KB |
| /market-reports/[slug] | < 1.0s | < 2.5s | trend chart < 3.0s | < 1.2 MB |
| /about | < 1.0s | < 1.8s | bio < 1.5s | < 600 KB |
| /contact | n/a | < 1.5s | form < 1.0s | < 400 KB |

## Core Web Vitals (real-user, p75)

| Metric | Target | Hard-fail in CI? |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.0s | Yes — fails if hero LCP > 1000ms cable |
| INP (Interaction to Next Paint) | < 100ms | No (warn only) |
| CLS (Cumulative Layout Shift) | < 0.05 | Yes |
| TTFB | < 400ms | No |
| FCP (First Contentful Paint) | < 1.2s | No |

## Custom interaction specs

| Interaction | Budget |
|---|---|
| Search keystroke → debounce start | < 50ms |
| Search results round-trip | < 600ms |
| Map pan → results refetch | < 800ms |
| Polygon draw → results refetch | < 1.2s |
| Lightbox open | < 150ms |
| Photo gallery next/prev | < 100ms (preloaded ±2) |
| Filter chip toggle → results | < 400ms |
| Burger nav open | < 100ms |
| Listing tile hover ring | < 16ms (one frame) |

## Backend API specs

| Endpoint | p50 | p95 |
|---|---|---|
| POST /api/listings/search (bbox) | < 200ms | < 500ms |
| POST /api/listings/search (polygon) | < 400ms | < 900ms |
| POST /api/listings/search (text FTS) | < 200ms | < 500ms |
| POST /api/contact | < 600ms | < 1.5s |
| GET /api/health | < 100ms | < 250ms |
| GET /sitemap.xml | < 800ms | < 2s |
| Listing detail SSG/ISR generation | < 1s | < 2.5s |

## DB query specs

| Query | p50 | p95 |
|---|---|---|
| getListingBySlug | < 30ms | < 100ms |
| getActiveListings(bbox) | < 100ms | < 250ms |
| getActiveComps cascade | < 250ms | < 600ms |
| getAreaRead (parallel) | < 200ms | < 500ms |
| getCommunityScorecard | < 50ms | < 150ms |
| Market report composer (cached) | < 50ms | < 200ms |

## Lighthouse targets (production build)

| Category | Target | Hard-fail in CI? |
|---|---|---|
| Performance | >= 90 | Yes |
| Accessibility | >= 95 | Yes |
| Best Practices | >= 95 | No (warn only) |
| SEO | >= 95 | Yes |

## Mobile specs

- No horizontal scroll at 320 / 375 / 390 / 414 / 430 px
- Touch targets >= 44 x 44 px
- Burger nav opens < 100ms tap response
- Map pinch-zoom enabled, scroll-zoom disabled

## Reliability specs

- Vercel uptime: >= 99.95%
- RDS uptime: >= 99.95%
- Graceful degradation: every data fetch wrapped in `.catch(fallback)`
- Page renders empty state on data outage instead of 500

## Privacy / security

Analytics tools (consent-gated, free-tier):
- **Microsoft Clarity** — session replay + heatmaps. 100% free, unlimited. EU/US options.
- **PostHog Cloud** — custom semantic events + user identification + funnels. Free tier (1M events/mo). Configured events-only (no autocapture, no recording — that's Clarity's job).
- **Vercel Web Analytics** — first-party CWV from real users. Included with existing Vercel plan.

Privacy posture:
- Explicit opt-in via cookie banner. Default-off for analytics + marketing.
- Browser DNT respected — auto-rejects all analytics.
- IP anonymization at all three providers.
- 24-month retention.
- DSAR workflow at /privacy/preferences.
- "Reject All" must work — Playwright-tested in P2.
- Form rate-limited 10/IP/hr, honeypot enabled.
- All API mutations zod-validated.

## Measurement tooling

- Vercel Speed Insights (real-user CWV)
- Lighthouse CI in GitHub Actions
- Vercel Functions metrics (API p50/p95)
- /api/health endpoint (external uptime monitor)
- Server-Timing headers on API + page handlers
- Quarterly perf-baseline doc: docs/perf-baseline-YYYY-Q.md
