# Amplify Routing Map — Sev-1 Triage

**Date:** 2026-05-13
**Scope:** Root-cause audit for three concurrent Sev-1 symptoms on `www.yong-choi.com`. **Investigation only — no fixes applied.**

## TL;DR

Three reported symptoms, **three distinct root causes** — they do not share one. Severity ranking:

| # | Symptom | Root cause | Severity | Confidence |
|---|---|---|---|---|
| B | `canonical` / `og:url` / `og:image` / `twitter:image` all point to `feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com` | `NEXT_PUBLIC_SITE_URL` Amplify branch env var is explicitly set to the preview-branch URL, not `https://www.yong-choi.com`. Baked into the SSR/SSG output. | Sev-1 — SEO/social bleed | **Confirmed** |
| C | `/market-reports/q1-2026`, `/q4-2025`, `/q3-2025`, `/q2-2025` all 404 | `app/market-reports/[slug]/page.tsx` calls `getReport(slug)` → composes data from `analytics_base` + `mv_market_pulse` + `mv_community_scorecard` + `mv_supply_demand` + `mv_inventory_age`. All five relations were dropped during the dbt cutover (Phase 6). Every query throws "relation does not exist" → `Promise.all` rejects → `getReport` returns `null` → `notFound()`. | Sev-1 — primary marketing content | **Confirmed (via code path + project memory of MV drops)** |
| A | `GET /about` returns the legacy Placester site | Could **not** reproduce against the current production URL — `https://www.yong-choi.com/about` returns the Next.js about page (Next ETag, `x-nextjs-cache: HIT`, body contains `<title>About Yong Choi · Yong Choi`, no `placester`/`iframe`/`wordpress` markers). Most likely a **stale CloudFront edge cache** at a non-PHX50 PoP, surviving from an earlier deploy that emitted Placester content (or returned an upstream fallback). `Cache-Control: s-maxage=31536000` (1 year, default for fully static prerendered pages) means any prior bad render can persist per-PoP for an extreme TTL. | Sev-1 — believed-broken page | **Probable (stale cache); not reproduced live** |

The fixes are independent of each other; ship in the order shown in §6.

---

## 1. Production topology

```
Browser
   │
   ▼
DNS:  www.yong-choi.com  CNAME  d4hn1ffnsphw6.cloudfront.net   ← Amplify-managed CF distribution
                                  │
                                  ▼
              CloudFront (Amplify-managed, multiple PoPs, e.g. PHX50-P1)
                                  │
                                  ▼
              AWS Amplify Hosting  app id  d2tuygdje4mmy3
                                  │  branch: feature/yong2-amplify  (the ONLY branch on the app)
                                  │  appRoot: yong2
                                  │  customRules: []   (no Amplify rewrites/redirects)
                                  ▼
              Next.js Compute Lambda  (.next from `npm run build`)
                                  │
                                  ▼
              app/* route handlers  (Server Components + Route Handlers)
```

Evidence captured by direct AWS CLI reads on 2026-05-13:

- `aws amplify list-domain-associations --app-id d2tuygdje4mmy3` — `yong-choi.com` + `www.yong-choi.com` both target branch `feature/yong2-amplify` via `d4hn1ffnsphw6.cloudfront.net`. `www` is verified; apex is not.
- `aws amplify get-app … --query app.customRules` → `[]`. **No Amplify-level rewrite or redirect rules exist.** Any path-specific interception must be inside the Next.js app (route handlers, middleware) or in CloudFront — which here is Amplify-managed and not separately configured.
- `aws amplify list-branches --app-id d2tuygdje4mmy3` → exactly one branch: `feature/yong2-amplify`. There is no `main` or `production` branch deployment.
- `aws amplify list-jobs --branch-name feature/yong2-amplify --max-results 3`:
  - Job **141** — `SUCCEED` @ 2026-05-13 09:51 — **currently serving production.**
  - Job **142** — `FAILED` @ 2026-05-13 10:23.
  - Job **143** — `FAILED` @ 2026-05-13 10:27 (commit "feat(yong2): wire GoogleAnalyticsScript into root layout").

### 1.1 Build pipeline (yong2-amplify-worktree/amplify.yml, application 2)

The relevant `frontend.build.commands` for `appRoot: yong2`:

1. Resolve `SPARK_ACCESS_TOKEN` from branch env or Secrets Manager → `/tmp/spark_token`.
2. **Write `.env.production.local`** with build-time vars. Key line (file:line `amplify.yml:56`):
   ```
   printf 'NEXT_PUBLIC_SITE_URL=%s\n' "${NEXT_PUBLIC_SITE_URL:-https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com}"
   ```
   The fallback default is the Amplify preview URL.
3. Sync resolved token back into branch env via `aws amplify update-branch`.
4. Run `npm run build` (`next build`).
5. Verify `.next/BUILD_ID` exists.
6. Prewarm dbt parquet on CloudFront `d12v6de1xwcjhk.cloudfront.net` (`fct_*` files).

`artifacts.baseDirectory: .next`. Server bundle + static assets ship to Amplify SSR runtime.

### 1.2 Build-time env (Amplify branch `feature/yong2-amplify`)

`aws amplify get-branch … --query branch.environmentVariables`:

```json
{
  "AMPLIFY_MONOREPO_APP_ROOT": "yong2",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY": "AIzaSy…",
  "NEXT_PUBLIC_SITE_URL": "https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com",   ← BUG B
  "RDS_DATABASE_URL": "postgresql://rlsir_admin:…@rlsir-db.ck5i8kmcu0jw.us-east-1.rds.amazonaws.com:5432/rlsir_platform",
  "SPARK_ACCESS_TOKEN": "3rw1w0tx0dhftpqn6bwh16ax1"
}
```

Because the var is explicitly set, the `amplify.yml:56` fallback never engages — the value is what was manually configured in the Amplify console. Changing the default in `amplify.yml` will **not** fix anything; the branch env wins.

---

## 2. Where `/about` resolution comes from

### 2.1 Route handler in code

`app/about/page.tsx` exists in the repo and is a fully implemented Server Component. The file:

- Imports `Navigation`, `Footer`, `SectionFrame`, `PageHero`, `AboutSplit`, `TestimonialsSection`, JSON-LD schema fns.
- Exports `metadata` (title, description, canonical via `siteUrl('/about')`).
- Renders `<PageHero imageSrc="/page-heroes/about.jpg" … />`, then `<AboutSplit />` inside a `SectionFrame`, then `<TestimonialsSection />`.
- **No `revalidate`, no `dynamic = 'force-dynamic'`, no `generateStaticParams`.** Therefore Next.js classifies this page as **fully static** — it is prerendered at build time and CloudFront caches it with `Cache-Control: s-maxage=31536000` (1 year, no `stale-while-revalidate`).

Git history confirms the route was added in `a32d0f2 feat(yong2): about page` (older commit) and most recently modified to add `<TestimonialsSection />` in the current uncommitted change.

### 2.2 What production is actually serving

`curl -sI https://www.yong-choi.com/about` (taken from PHX50-P1 edge today):

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
ETag: "h7rgtytf49r3m"
x-nextjs-cache: HIT
x-nextjs-prerender: 1
Cache-Control: s-maxage=31536000
Via: 1.1 …cloudfront.net (CloudFront)
X-Cache: Miss from cloudfront
X-Amz-Cf-Pop: PHX50-P1
```

`curl -s … /about | grep -i "placester|iframe|legacy|wordpress|wp-content"` → **no matches**.
`curl -s … /about | grep '<title'` → `<title>About Yong Choi · Yong Choi</title>`.
Body length 35 KB; contains preload tags for `/page-heroes/about.jpg` and `/images/yong-choi.jpg`, the React serialized props, and other Next-generated markup. This **is** the Next.js about page.

### 2.3 Why the Placester symptom may still be real

Three plausible reasons production *can* still serve Placester even though the current bundle does not:

1. **Stale per-PoP CloudFront cache.** `s-maxage=31536000` for a fully static prerender means every CloudFront PoP independently caches whatever was returned by SSR the first time it was asked. If an earlier broken deploy had a `/about/page.tsx` that returned Placester markup (e.g. an iframe to `yong-choi.placester.com/about`, or a `redirect()` to legacy, or an SSR failure that fell through to an upstream legacy origin), that response could persist at the user's nearest PoP for up to a year, even after a fixed build deploys. The reporter likely hit a PoP other than PHX50-P1 that still has the stale entry.
2. **Browser-side cache.** Same 1-year `s-maxage` is also returned to the browser. Force-reload or private window will bypass.
3. **Prior content via the Placester domain itself.** The Placester host (e.g. `yong-choi.placester.com`) is independent — if a user's bookmark or external link sends them there, that is unrelated to the Amplify routing for `www.yong-choi.com`. Verify the reporter's exact URL bar contents.

There is no Amplify rewrite rule, no `middleware.ts` matcher hit (matcher excludes static-asset paths but `/about` is not excluded — and even when matched, the middleware does not rewrite path or origin, it only writes an attribution cookie), and no DNS path-based routing capability at Route 53. **Nothing in the current infra can redirect `/about` to Placester at request time.**

---

## 3. Where the canonical URL is sourced

Two code paths converge on a single env var:

### 3.1 `metadataBase` (root layout)

`app/layout.tsx:30`:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  …
};
```

Next.js uses `metadataBase` to resolve every relative URL in page metadata (`openGraph.images`, `twitter.images`, etc.) — so the bundled `og:image` reference becomes `${NEXT_PUBLIC_SITE_URL}/opengraph-image?<hash>` and gets baked into the static prerender.

### 3.2 `siteUrl(path)` helper

`lib/seo.ts`:

```ts
export function siteUrl(path: string = ''): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  …
  return `${base.replace(/\/$/, '')}${clean}`;
}
```

Called from `app/about/page.tsx` (`alternates.canonical`), `app/market-reports/page.tsx`, `app/market-reports/[slug]/page.tsx`, `app/sitemap.ts`, `app/robots.ts`, `lib/jsonld.ts` (`SITE_URL` in `realEstateAgentSchema`, `realEstateListingSchema`, etc.). Every page-level `canonical`, every JSON-LD `url`, every sitemap entry, and `robots.host` all derive from the same env var.

### 3.3 Live evidence of the leak

`curl -s https://www.yong-choi.com/` returns:

```
<link rel="canonical" href="https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com"/>
<meta property="og:image"  content="https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com/opengraph-image?3c6eb0bc62edc9f9"/>
<meta name="twitter:image" content="https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com/opengraph-image?3c6eb0bc62edc9f9"/>
```

This is mechanically caused by **§1.2** — branch env explicitly sets `NEXT_PUBLIC_SITE_URL` to the preview URL. Next.js evaluates `process.env.NEXT_PUBLIC_*` at build time, replaces every literal in the bundle, and produces the static prerender with the wrong absolute URL.

Because the page bodies are fully prerendered, **fixing the env var alone is insufficient — the cached prerenders must be invalidated** (either by a fresh deploy that produces a new `BUILD_ID` and hence new ETags, or by an explicit CloudFront invalidation). A fresh deploy is the natural path: Amplify rebuilds with the corrected env var, ships a new `.next/`, and the new ETags cause cache misses.

---

## 4. Why `/market-reports/<quarter>` 404s

### 4.1 The dynamic segment name

The user's bug report references `/q1-2026`, `/q4-2025`, `/q3-2025`, `/q2-2025`. The route file is `app/market-reports/[slug]/page.tsx` (the dynamic segment is named `slug`, not `quarter` — both shapes match the same URL pattern, so that detail is cosmetic and not the cause).

`MARKET_REPORT_COPY` in `content/market-reports.ts` defines exactly those four slugs: `q1-2026`, `q4-2025`, `q3-2025`, `q2-2025`. So the URLs *should* resolve.

### 4.2 Render path

`app/market-reports/[slug]/page.tsx`:

```ts
export const dynamic = 'force-dynamic';   // no static params, no ISR — rendered per request
…
const report = await getReport(slug).catch(() => null);
if (!report) notFound();
```

`getReport(slug)` (in `lib/market-reports.ts:943`) → `buildReportUncached(slug)` → fires six things in `Promise.all`:

```ts
const [trendResult, volume, mediansResult, supplyDemand, inventoryAgeResult, headlineStats] = await Promise.all([
  buildTrend(parsed.year, parsed.quarter),         // analytics_base
  buildVolume(parsed.year, parsed.quarter),        // listing_records (still exists)
  buildMedians(),                                  // mv_community_scorecard
  buildSupplyDemand(parsed.year, parsed.quarter),  // mv_supply_demand
  isLatest ? buildInventoryAge() : Promise.resolve(null), // mv_inventory_age
  buildHeadlineStats(parsed.year, parsed.quarter), // listing_records + mv_community_scorecard
]);
```

If *any* of those queries throws, `Promise.all` rejects, the outer `.catch(() => null)` swallows it, and the page short-circuits to `notFound()` → `404`.

### 4.3 The dropped relations

Per project memory (`MEMORY.md` → "dbt cutover — COMPLETE 2026-05-10 (Phases 0–7)"):

> All 7 phases done. yong2 reads dbt parquet from CloudFront with zero RDS analytics dependency. RDS shrunk db.t3.medium → db.t3.small. **9 dashboard MVs + `analytics_base` dropped.** Lambda `refresh-views` task is a no-op.

That drop list covers every relation `lib/market-reports.ts` queries on the SQL fast path:

- `analytics_base` — `buildTrend` reads `analytics_base.community_slug` / `region_slug` / `price_per_sqft` / `close_price` / `close_date`. **Dropped.** Query throws `relation "analytics_base" does not exist`.
- `mv_community_scorecard` — `buildMedians` + `buildHeadlineStats` read `scope_type` / `scope_key` / `avg_ppsf` / `yoy_price_change_pct` / `total_closed` / `months_of_supply`. **Dropped.**
- `mv_supply_demand` — `buildSupplyDemand` reads `month` / `new_listings` / `closed_sales`. **Dropped.**
- `mv_inventory_age` — `buildInventoryAge` reads `dom_bucket` / `listing_count`. **Dropped.**

`listing_records` is NOT a MV — it's the ARMLS bronze mirror. It still exists. So `buildVolume` and `buildHeadlineStats`'s `listing_records` queries would succeed in isolation, but the parallel `Promise.all` is bottlenecked by the first MV failure.

This explains why:
- `/market-reports` **index** returns `200 OK` (cache HIT): the index page reads only `MARKET_REPORT_COPY` (editorial constants) and does not touch the DB at all (see comment at `app/market-reports/page.tsx:18` "Index page is intentionally DB-free").
- `/market-reports/<slug>` returns `404`: every detail page tries to hydrate live data from now-dropped relations.

### 4.4 Migration analog

The `/phoenix` tabs already migrated to CloudFront parquet (`prewarm` step at `amplify.yml:120`). The `fct_*` parquet files include `fct_market_pulse_*`, `fct_negotiation_*`, `fct_pricereduction_*`, `fct_active_inventory`, `fct_active_dom_distribution`, `fct_active_by_pricetier`, `fct_listing_pace`, `fct_status_velocity`, `fct_months_of_supply`. The market-reports detail page needs the same migration: replace the `query(...)` calls in `lib/market-reports.ts` with parquet reads (probably via `hyparquet` / `duckdb-wasm` from CloudFront) — or, simpler, drop the live-data path entirely and render the report from editorial copy only (`editorialStats`, `pulse`, `curatedFindings`, `monthlyTrend`, `tierBreakdown` are all already in `MARKET_REPORT_COPY`).

---

## 5. Where the canonical URL is **not** sourced (ruled out)

For completeness — paths that look related but are not the cause of any of the three bugs:

- `next.config.ts` — no `basePath`, no rewrites that touch the customer domain (the only rewrites are first-party PostHog proxies `/ingest/*`). `env` block inlines `RDS_DATABASE_URL`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `SPARK_ACCESS_TOKEN` into the server bundle — no `NEXT_PUBLIC_SITE_URL` (not needed there; Next handles `NEXT_PUBLIC_*` natively at build).
- `vercel.ts` — present in the repo but irrelevant; the production deploy is via Amplify, not Vercel. The file's `routes.cacheControl` headers only run if a Vercel deploy is made.
- `middleware.ts` — only writes an attribution cookie; never rewrites path or origin. Matcher excludes `_next/`, `api/`, `favicon`, `robots`, `sitemap`, `opengraph-image`, and any path with a file extension.
- `public/` — contains `hero/`, `images/`, `logos/`, `mock-listing/`, `page-heroes/`. No `placester.html`, no legacy assets.
- Amplify `customRules` — `[]`. No rewrite/redirect at the platform level.
- DNS — single CNAME → CloudFront alias. No path-based routing primitive at Route 53.
- CloudFront — Amplify-managed; not customer-configurable behaviors. No second origin.

---

## 6. Recommended fix path (do not implement here — investigation only)

The three fixes are independent. Recommended order is by user-visible severity × effort:

### Fix 1 — Bug B: `NEXT_PUBLIC_SITE_URL` (cheap, immediate)

1. In Amplify console (app `d2tuygdje4mmy3`, branch `feature/yong2-amplify`, Environment variables): change `NEXT_PUBLIC_SITE_URL` from `https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com` to `https://www.yong-choi.com`.
2. Redeploy (push a no-op commit, or "Redeploy this version" in the Amplify UI).
3. Verify the new build's `<link rel="canonical">` on the home page resolves to `https://www.yong-choi.com/` and `og:image` resolves to `https://www.yong-choi.com/opengraph-image?<hash>`.
4. (Optional) After the deploy is live, request CloudFront invalidation for `/*` to flush stale prerenders containing the old amplifyapp URL. The fresh build will have new ETags so most edges will MISS and re-fetch anyway, but explicit invalidation is the safe path for stragglers.

Side note: `amplify.yml:56` has the wrong fallback (the preview-branch URL) — once Bug B is fixed via branch env, the fallback never fires, but a defensive cleanup would change that default to `https://www.yong-choi.com` so a future-removed branch env doesn't reintroduce the regression.

### Fix 2 — Bug A: `/about` Placester (verify, then invalidate)

1. **First, gather a second data point.** Ask the reporter to hard-reload `https://www.yong-choi.com/about` (Ctrl+Shift+R / Cmd+Shift+R) and paste the rendered title + first H1 + the `X-Amz-Cf-Pop` header from DevTools Network panel. If after hard reload it still shows Placester, the stale-edge-cache hypothesis is confirmed for that PoP.
2. Issue a CloudFront invalidation for `/about` (and `/about/*` if any nested routes exist). The Amplify-managed CF distribution can be invalidated from the Amplify console or via `aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/about"` — the distribution ID corresponds to `d4hn1ffnsphw6.cloudfront.net`.
3. After invalidation, re-curl from a few `X-Amz-Cf-Pop` values (use a residential VPN or an EC2 in a different region to force different PoPs) to confirm `/about` returns the Next.js page everywhere.
4. (Belt-and-suspenders) Add `export const revalidate = 3600;` to `app/about/page.tsx` so the page is ISR'd hourly instead of cached for a year. This dramatically lowers the blast radius of any future broken build.

If hard reload **still** shows Placester *after* invalidation, the hypothesis is wrong — at that point investigate whether a third-party redirector (Cloudflare or a previous DNS record pointed somewhere else for that user), or whether the user has a corporate DNS that resolves `www.yong-choi.com` to the Placester host.

### Fix 3 — Bug C: Market-reports detail 404 (real work)

The detail page depends on five relations that no longer exist. Two viable paths:

**Path C-a (preferred, mirrors the dbt-cutover pattern):**
- Refactor `lib/market-reports.ts` to read from the CloudFront parquet files already produced by the dbt pipeline at `d12v6de1xwcjhk.cloudfront.net/<fct_*>.parquet` (the same source the `/phoenix` tabs use).
- `buildTrend` ← `fct_market_pulse_community` / `fct_market_pulse_region` / `fct_market_pulse_metro` (per-quarter median PPSF).
- `buildVolume` can stay on `listing_records` (still alive) or move to a `fct_*` if one exposes price-band counts.
- `buildMedians` ← whichever `fct_*` carries the trailing-12 PPSF + YoY (likely `fct_community_yoy` or `fct_market_pulse_*`).
- `buildSupplyDemand` ← `fct_status_velocity` or similar.
- `buildInventoryAge` ← `fct_active_dom_distribution`.
- `buildHeadlineStats` ← composition of the above.
- Confirm each `fct_*` schema by reading from CloudFront with `hyparquet` in a one-off script before refactoring.

**Path C-b (fast unblock, lower quality):**
- Strip the SQL composition entirely and render `/market-reports/<slug>` purely from `MARKET_REPORT_COPY` (the editorial-copy file already contains `editorialStats`, `pulse`, `curatedFindings`, `monthlyTrend`, `tierBreakdown` — every number a reader sees on the page).
- This restores 200 OK but loses the "live live RDS-driven trend/volume/medians charts" component. Use as a stop-gap if C-a will take >1 day.

Either way: after the fix, run `curl -I https://www.yong-choi.com/market-reports/q1-2026` and confirm `200`. Repeat for `q4-2025`, `q3-2025`, `q2-2025`.

---

## 7. Verification commands captured during this audit

```bash
# 1. Confirm canonical leak
curl -s https://www.yong-choi.com/ \
  | grep -oE 'canonical[^>]+|og:image[^>]+|twitter:image[^>]+'

# 2. /about diagnostics
curl -sI https://www.yong-choi.com/about        # headers: 200 from Next, s-maxage=31536000
curl -s  https://www.yong-choi.com/about | head -c 2000
curl -s  https://www.yong-choi.com/about | grep -ic placester

# 3. Market-report quarters
for q in q1-2026 q4-2025 q3-2025 q2-2025; do
  curl -sI "https://www.yong-choi.com/market-reports/$q" | head -1
done

# 4. Confirm /market-reports index (DB-free) is fine
curl -sI https://www.yong-choi.com/market-reports

# 5. AWS reads (us-east-1)
aws amplify get-app             --app-id d2tuygdje4mmy3 --query app.customRules
aws amplify list-branches       --app-id d2tuygdje4mmy3
aws amplify list-domain-associations --app-id d2tuygdje4mmy3
aws amplify get-branch          --app-id d2tuygdje4mmy3 --branch-name feature/yong2-amplify --query branch.environmentVariables
aws amplify list-jobs           --app-id d2tuygdje4mmy3 --branch-name feature/yong2-amplify --max-results 5
```

---

## 8. Open questions for the reporter

1. **Bug A only:** What PoP code (`X-Amz-Cf-Pop` header) was your browser hitting when you saw the Placester `/about`? What was in the address bar — `www.yong-choi.com/about` or `yong-choi.com/about` (apex)? Does hard reload change the rendering?
2. **Bug C only:** Confirm whether prior `/market-reports/*` pages were ever functional in production — i.e. did this regress with the dbt cutover (Phase 6 around 2026-05-10), or did the quarter pages never work since the yong2 deploy? Memory says the cutover dropped MVs on 2026-05-10; deploy job 141 is from 2026-05-13. Symptom timing matches.
3. **General:** Two Amplify jobs (142, 143) failed today after the last successful job 141. Are those expected (you're mid-iteration) or are they unrelated incidents to surface separately?
