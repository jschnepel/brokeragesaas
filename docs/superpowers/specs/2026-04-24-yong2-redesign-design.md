# Yong2 Redesign — Design Spec

**Date:** 2026-04-24
**Owner:** Joey Schnepel
**Target location:** `yong2/` (new top-level Next.js app, parallel to `Jeane/jeane-site/`)
**Status:** Design locked, ready for implementation planning.

---

## 1. Summary

A complete refresh of Yong Choi's agent website. Purpose: replace the current `prototypes/yong/` marketing surface with a dark, cinematic, editorial brand site that foregrounds photography and reads more like a magazine than a real-estate portal.

The existing prototype keeps serving the analytics stack (market pulse, snapshot, trends, compare, dashboard). yong2 is marketing-only — home, portfolio/listings, communities, about, contact. No analytics ports in v1; a single "Market Intelligence" section on the home page links out to the existing prototype's analytics routes.

Clean slate. Nothing is carried forward from the prototype at the component level. Patterns from the old site can be pulled in later as needed.

## 2. Goals & non-goals

**Goals**
- Distinct, premium visual identity that differentiates from generic luxury-agent templates.
- SEO-capable SSR/ISR via Next.js App Router.
- Fast, photo-forward experience — hero imagery is the product.
- Live listing data from the existing Spark/RDS pipeline (read-only, no new ingest work).
- Community KPIs pulled from the existing RDS materialized views (`mv_community_scorecard` or equivalent).
- Ship marketing v1 without touching analytics.

**Non-goals for v1**
- Analytics / market report pages (stay on the prototype).
- Buyer's / Seller's Center content pages.
- Blog / Journal (deferred until there is content to publish).
- Authenticated portal, saved search, favorites.
- Compare tool.
- Any new database work (schema, ingest, materialized views).

## 3. Scope — page inventory

Seven surfaces in v1:

| # | Route | Template |
|---|---|---|
| 1 | `/` | Home |
| 2 | `/portfolio` | Listings grid |
| 3 | `/portfolio/[slug]` | Listing detail |
| 4 | `/communities` | Communities index |
| 5 | `/communities/[slug]` | Community detail |
| 6 | `/about` | About Yong |
| 7 | `/contact` | Contact |

Plus a shared nav + footer. No sidebar, no tab bars, no dashboard chrome.

## 4. Brand system — "Midnight & Stone"

### 4.1 Palette

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0B1620` | Primary background (midnight blue-black) |
| `--ink-elevated` | `#1E2C38` | Elevated surface (cards, chrome) |
| `--gold` | `#D4B88A` | Accent — kickers, hairlines, active states, CTA fill |
| `--gold-muted` | `#C9A96A` | Secondary accent, borders |
| `--stone` | `#EFE9DF` | Warm off-white body text, light-mode surfaces |
| `--stone-muted` | `#D9D2C7` | Muted stone for secondary surfaces |
| `--mute` | `#8A93A0` | Secondary text on dark backgrounds |
| `--hairline` | `rgba(212,184,138,0.25)` | Gold-tinted dividers |

Dark-first. Light-mode surfaces exist for certain sections (e.g., listing narrative) but the default canvas is midnight.

### 4.2 Typography

- **Display serif:** Playfair Display. Weights used: 400, 500. Italic extensively. Tight tracking (−0.02em) at large sizes.
- **Body / UI sans:** Inter. Weights 400, 500, 600. Tracking baseline, increased for small-caps labels (0.3em).
- Future upgrade path noted but not in v1: Canela, GT Super, Prata, Domaine Display. Swap-in is low effort via Tailwind tokens.

Type scale (desktop):
- H1 display: 96px / italic / tight
- H1 page: 72–82px / italic
- H2 section: 44–54px / italic
- H3 card: 22–26px
- Body: 13–14px, line-height 1.65
- Caps label: 10–11px, 0.3em tracking, uppercase, gold

### 4.3 Motion & tone

- Slow, cinematic, CSS-first. No framer-motion in v1 (keep deps lean).
- Key interactions: fade + translate on scroll, image Ken-Burns on hero, subtle hover zoom on tiles.
- No particle fields, no parallax stacks, no floating orbs.
- Nav fades in after ~60px scroll on the home hero; solid on all other pages.

## 5. Home page

Section order:

1. **Hero** — Full-bleed cinematic (selected: Concept A).
2. **Intro** — Brand statement, italic headline + two-column narrative.
3. **Current Portfolio** — 3–6 featured active listings, 4:5 tiles, minimal overlay.
4. **Communities** — 4 or 8 community tiles with aerial photography, stats on hover.
5. **About Yong** — Portrait split + short bio + career stats + signature, link to `/about`.
6. **Market Intelligence** — One large stat + blurb, links out to the existing prototype's analytics routes.
7. **Contact** — Closing CTA, direct contact lines (no form; form lives on `/contact`).
8. **Footer** — Sotheby's International Realty lockup, social, legal.

Dropped: Journal (no content to publish).

### 5.1 Hero (Concept A — Full-bleed cinematic)

- 100vh. Full-bleed background: video preferred, high-res still as fallback.
- Dark radial + bottom gradient scrim for legibility.
- Content anchored bottom-left (desktop) / bottom-center (mobile).
  - Kicker (gold, caps): locality list — "Scottsdale · Paradise Valley · DC Ranch".
  - H1: *"The Art of Desert Living"* — two-line italic display, 96px desktop.
  - Stats row (3 cells): `$1.2B Career Sales` · `24 yrs In Market` · `Top 1% Sotheby's Intl`.
  - Scroll hint, bottom-right.
- Nav hidden on initial paint, fades in after scroll.
- No search widget, no listing carousel, no CTA buttons. This is a brand moment.

## 6. Page templates

### 6.1 `/portfolio` — Listings grid

- Page header: italic display "The Portfolio" left, minimal filter strip right (status: All · Active · Coming Soon · Sold). No beds/price/community filters in v1.
- 3-col / 2-col / 1-col responsive grid. 4:5 portrait tiles. Gap ~16px.
- Tile: photo + gradient scrim + `addr` (serif) + `community · price` (gold caps) bottom-left. No CTA on hover — whole tile is the link.
- Sort: implicit (newest first, then featured-first if flagged).
- Pagination: none in v1 (static list ≤ 24 listings expected); infinite scroll only if exceeded.

### 6.2 `/portfolio/[slug]` — Listing detail

- Hero photo (16:9) with address overlay: locality caps + italic serif address.
- Two-column body: narrative (left, drop cap, 2–3 paragraphs Yong-authored where available, MLS remarks fallback) + fact sheet (right, k/v rows — Price, Beds, Baths, Interior sf, Lot, Year, MLS).
- Photo gallery: 3-up staggered grid below, then full-bleed slider on click.
- Map section: static MapLibre embed, midnight style, pin only.
- Contact module at bottom: "Request a private tour" — small form with name/email/phone.
- No "similar listings" module, no price-history chart, no walkscore embeds. Keeps focus on the property.

### 6.3 `/communities` — Communities index

- Display: 2-col grid (desktop) of 16:10 cards. 8–12 communities total.
- Card: aerial photo behind + locality caps (e.g., "North Scottsdale") + italic name + stats row (Median · Active · Avg DOM).
- Hover: subtle zoom + gold "View Community →" reveal.
- Stats pulled live from RDS materialized view (`mv_community_scorecard` or equivalent already in use by premium-site).

### 6.4 `/communities/[slug]` — Community detail

- Aerial hero with italic name overlay. Where a Desert Mountain course matches (Renegade, Cochise, Geronimo, Apache, Chiricahua, Outlaw), embed the Google Aerial View flyover video by ID.
- KPI strip (4 cells, bordered): Median Sale, Active Listings, Avg DOM, $/SqFt.
- Narrative: 2–3 paragraphs from Yong about the enclave — architecture, pace, buyer profile.
- "Now in [community]" — grid of Yong's active listings there.
- Link back to `/communities` bottom.

### 6.5 `/about` — About Yong

- Split layout: portrait (3:4) left + copy right.
- Kicker + italic H1 + 3–4 paragraphs. Signature at bottom.
- Career stats strip: `$1.2B` · `24 yrs` · `Top 1%` (same three as hero).
- Optional "Selected Representations" strip — row of sold listings, marketing shots + address + year + price-on-request. Pulled from a small curated list, not MLS-driven.
- Optional press/accolades row — small logo strip (WSJ, AZ Foothills, etc.) if assets are available.
- One scroll, no tabs, no accordions.

### 6.6 `/contact` — Contact

- Split: direct contact lines left + form right.
- Left: italic H1 ("Begin a conversation."), short paragraph, k/v rows (Mobile, Email, Office, Instagram).
- Right: bordered form panel with Name, Email, Phone, Interest (Buying · Selling · Both radio), Message, gold Send button.
- Form submits to a Next.js Route Handler (`/api/contact`) that emails Yong via Resend or AWS SES. Success state = inline confirmation, no redirect.
- Rate-limit + honeypot anti-spam. No CAPTCHA in v1.
- No calendar embed in v1.

## 7. Global chrome

### 7.1 Navigation

- Transparent on first-load hero (home only), solid midnight on all other routes.
- Left: serif logo "Yong Choi" (single link to `/`).
- Right: 4 uppercase caps links — `Portfolio` · `Communities` · `About` · `Contact`.
- No search icon, no phone icon, no language toggle.
- Mobile: serif logo left, hamburger right → overlay menu with the 4 links + direct contact lines.
- Scroll behavior: on `/` only, fade in after 60px; on all other pages, always solid.

### 7.2 Footer

- Midnight background with stone typography.
- Three columns (desktop):
  1. Brand — Yong Choi serif lockup, Sotheby's International Realty line, short tagline.
  2. Navigation — same 4 links duplicated + direct contact lines.
  3. Legal & social — Instagram, LinkedIn, fair-housing disclosures, ARMLS/IDX attribution, copyright.
- One-line MLS disclaimer bar at the very bottom (required by Spark/ARMLS terms).

## 8. Data & integrations

yong2 is a consumer of existing data. No new DB work.

### 8.1 Listings

- Source: the platform Spark pipeline → RDS. Feature flag for which listings appear in `/portfolio` — likely a curated set scoped to Yong's agent ID or a `featured_on_yong_site` boolean / tag.
- Query surface: because yong2 lives outside `real-estate-platform/` (per §9), it cannot directly import `@platform/spark` / `@platform/database`. Default: a thin `lib/listings.ts` in yong2 that connects to RDS directly with the same `pg` pool config used elsewhere (`max: 5`, `ssl: { rejectUnauthorized: false }`). Alternative if creds-sharing is undesirable: a small `/api/listings` Route Handler proxy on `apps/premium-site` that yong2 fetches. Decision deferred to implementation (see §13).
- Rendering: SSG at build for list pages, ISR (revalidate 1h) for detail. Images served from the Spark CDN.

### 8.2 Communities

- Source: `mv_community_scorecard` in RDS (already used by premium-site's `/market`).
- Rendering: ISR revalidate 1h on `/communities` and `/communities/[slug]`.
- Curated list of community slugs lives in `yong2/lib/communities.ts` — keeps the site intentional rather than auto-generated from MLS.

### 8.3 Imagery

- Listing photos: Spark CDN URLs, Next.js `<Image>` with remote patterns configured.
- Hero / community aerials: stored in S3 (`rlsir-platform-assets-us-east-1`) with appropriate remote pattern. Migrate/upload Yong's existing hero assets during implementation.
- Desert Mountain flyover videos: embed Google Aerial View iframes by the IDs already catalogued in memory.

### 8.4 Contact form

- `POST /api/contact` Route Handler on Fluid Compute.
- Email via Resend (preferred — lower friction than SES setup) or AWS SES if Resend isn't approved.
- Env vars via `vercel env` / `.env.local` — no secrets in repo.
- Honeypot + Upstash rate limit (10 req / IP / hour).

### 8.5 Analytics

- Plausible or Vercel Web Analytics for site metrics. No marketing pixels in v1.

## 9. Tech stack

- **Framework:** Next.js 16 (App Router) + React 19.
- **Styling:** Tailwind CSS v4 (matches Jeane's pattern). Design tokens live as Tailwind theme values + CSS custom properties on `:root`.
- **Fonts:** Self-hosted via `next/font/google` (Playfair Display + Inter) — no external font CDN.
- **Icons:** `lucide-react` where needed, but prefer custom minimalist icons / SVG marks.
- **Maps:** MapLibre GL (same as prototype) with a custom midnight style JSON.
- **Images:** `next/image`. `html2canvas-pro` only if a share/export feature is added (not in v1).
- **Email / forms:** Resend preferred (or AWS SES).
- **Hosting:** Vercel. Fluid Compute default. Plausible or Vercel Analytics.
- **Repo layout:** Top-level `yong2/` directory, standalone Next.js app. Not part of the `real-estate-platform` monorepo initially — matches the Jeane pattern. Revisit consolidation later.

## 10. File / folder layout (target)

```
yong2/
  app/
    layout.tsx
    page.tsx                        — Home
    portfolio/
      page.tsx                      — Listings grid
      [slug]/page.tsx               — Listing detail
    communities/
      page.tsx                      — Communities index
      [slug]/page.tsx               — Community detail
    about/page.tsx
    contact/page.tsx
    api/contact/route.ts            — Form handler
  components/
    chrome/Navigation.tsx
    chrome/Footer.tsx
    chrome/SotebysLockup.tsx
    hero/HeroCinematic.tsx
    home/HomeIntro.tsx
    home/FeaturedPortfolio.tsx
    home/HomeCommunities.tsx
    home/AboutSnippet.tsx
    home/MarketBlurb.tsx
    home/ContactCTA.tsx
    portfolio/ListingGrid.tsx
    portfolio/ListingTile.tsx
    portfolio/ListingDetailHero.tsx
    portfolio/ListingFactSheet.tsx
    portfolio/ListingGallery.tsx
    communities/CommunityIndex.tsx
    communities/CommunityCard.tsx
    communities/CommunityHero.tsx
    communities/CommunityKpis.tsx
    about/AboutSplit.tsx
    about/SelectedRepresentations.tsx
    contact/ContactForm.tsx
    shared/CapsLabel.tsx
    shared/SectionFrame.tsx
    shared/HairlineDivider.tsx
  lib/
    listings.ts                     — Spark/RDS read client
    communities.ts                  — Curated community list + queries
    contact.ts                      — Resend/SES wrapper
    seo.ts                          — Metadata helpers
  styles/
    globals.css
  public/
    og/                             — Open Graph images
    hero/                           — Hero stills / posters
  content/
    yong/                           — Markdown bio, narrative copy
    communities/                    — Per-community narrative markdown
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  vercel.ts                         — Vercel config (preferred over vercel.json)
```

## 11. Implementation sequencing (high level)

1. **Scaffold** — `yong2/` Next.js 16 app, Tailwind v4, fonts, palette tokens, base layout, nav + footer shells.
2. **Home** — Hero → Intro → Portfolio stub → Communities stub → About → Market → Contact CTA. Static content first.
3. **Portfolio + Listing detail** — Wire Spark/RDS read client, curated listing feed, ISR.
4. **Communities + Community detail** — Wire `mv_community_scorecard` read, curated slugs, aerial + flyover embeds.
5. **About + Contact** — Static copy, Resend form handler, rate-limiting.
6. **Polish pass** — motion, mobile, accessibility, Lighthouse, OG images, sitemap, robots.
7. **Launch prep** — Domain, Vercel env vars, analytics, MLS disclaimers, redirects from old prototype paths.

Each numbered step is one implementation plan chunk — writing-plans will break them further.

## 12. Success criteria

- Lighthouse ≥ 90 in all four categories on desktop + mobile for `/`, `/portfolio`, `/communities/[slug]`.
- Listings render from live Spark/RDS data; community KPIs from `mv_community_scorecard`.
- Contact form delivers to Yong's inbox with honeypot + rate limit.
- No analytics pages in v1; existing prototype's analytics routes linked from the home page's Market Intelligence section.
- Visual direction: user approval on hero + sections + page templates (achieved in brainstorm) → matching fidelity at launch.
- Mobile first-paint < 2.0s on 4G throttled, hero image optimized (AVIF/WebP, ≤ 300KB LCP candidate).

## 13. Open questions (to resolve during implementation)

- Hero asset: does Yong have a branded video reel, or do we shoot / license one? If not, a single high-res still + Ken-Burns fallback ships v1.
- Portrait for About + Hero composites: need a current professional shoot.
- Copy: who drafts Yong's voice — Yong himself, an agency, or placeholder that he edits in situ? v1 can ship with the placeholder copy already sketched in the mockups.
- Press/accolades: is a logo strip desired for `/about`? Asset gathering.
- Domain: yongchoi.com or similar — confirm ownership and target subdomain for staging.
- MLS compliance text: validate against current ARMLS display rules before launch (reuse `@platform/compliance` helpers from the prototype).
- Resend vs SES: pick based on Yong's existing email setup.

---

**End of spec.**
