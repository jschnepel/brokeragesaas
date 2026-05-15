import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Amplify Hosting Next.js Compute does NOT pass app/branch env vars
  // to the SSR Lambda runtime — verified via /api/diag/env returning
  // 0 of our custom vars even though .env.production.local was loaded
  // at build. For non-NEXT_PUBLIC_ vars, the `env` field inlines the
  // *value* into the compiled server bundle as a literal, so
  // process.env.X at runtime is replaced with "actual_value" before
  // the Lambda even starts. NEXT_PUBLIC_ vars Next handles natively
  // via the same mechanism for client bundles, so we don't list them
  // here.
  env: {
    RDS_DATABASE_URL: process.env.RDS_DATABASE_URL ?? '',
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL ?? '',
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL ?? '',
    // Spark API token for the IDX listings feed (see lib/spark/client.ts).
    // Source-of-truth = AWS Secrets Manager rlsir/armls/tokens; amplify.yml
    // syncs it to the Amplify branch env on every build, and this `env`
    // entry inlines it into the server bundle so the Lambda runtime can
    // read it. Build #59's /api/diag/env confirmed the absence of this
    // entry was the root cause: SPARK was in branch env + .env.production
    // .local but never reached process.env at request time.
    SPARK_ACCESS_TOKEN: process.env.SPARK_ACCESS_TOKEN ?? '',
    // NEXT_PUBLIC_ brokerage / contact vars. NEXT_PUBLIC_SITE_URL is
    // intentionally not duplicated here — Next inlines it into both
    // client AND server bundles natively. The other four below are
    // read in server components (content/site.ts → IDX footer,
    // /contact, /about, home, etc.) so we need the same SSR-Lambda
    // inlining the SPARK token gets. Verified via /api/diag/env
    // after job 158: only NEXT_PUBLIC_SITE_URL was visible at runtime;
    // the other four were absent despite being in branch env + the
    // .env.production.local printf block.
    NEXT_PUBLIC_ADVISOR_MOBILE: process.env.NEXT_PUBLIC_ADVISOR_MOBILE ?? '',
    NEXT_PUBLIC_OFFICE_PHONE: process.env.NEXT_PUBLIC_OFFICE_PHONE ?? '',
    NEXT_PUBLIC_ADVISOR_EMAIL: process.env.NEXT_PUBLIC_ADVISOR_EMAIL ?? '',
    NEXT_PUBLIC_OFFICE_ADDRESS: process.env.NEXT_PUBLIC_OFFICE_ADDRESS ?? '',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'rlsir-platform-assets-us-east-1.s3.amazonaws.com', pathname: '/**' },
      // Spark CDN serves listing photos from `cdn.photos.sparkplatform.com`.
      // The previous `*.sparkplatform.com` pattern only matches one subdomain
      // level (e.g. `cdn.sparkplatform.com`) — `next/image` would 400 on real
      // photo URLs without these explicit hostnames.
      { protocol: 'https', hostname: '*.sparkplatform.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.photos.sparkplatform.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.resize.sparkplatform.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Repo-controlled SVG placeholders for hero + community tiles. CSP
    // blocks any inline scripts or external loads from inside the SVG.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // pg only — has native binary deps that Turbopack can't bundle.
  // Initially tried adding @aws-sdk/client-s3, hyparquet, hyparquet-compressors
  // here too (build #69), but Amplify SSR doesn't ship node_modules to the
  // Lambda runtime — only `.next/` per amplify.yml artifacts.baseDirectory.
  // serverExternalPackages required node_modules at runtime, hence
  // "Cannot find module '@aws-sdk/client-s3-57f25c9af355c604'" failures.
  // Leaving non-pg packages out lets Turbopack inline-bundle them into
  // the .next/ chunks that DO ship.
  serverExternalPackages: ['pg'],
  // PostHog reverse proxy — first-party path `/ingest/*` proxies to PostHog
  // Cloud (us region). Ad blockers that strip `posthog.com` requests don't
  // touch first-party paths, so we recover the ~10–30% of visitors who'd
  // otherwise be invisible to analytics. Static path is the SDK loader;
  // /flags is the modern feature-flag/decide endpoint (replaces /decide as
  // of posthog-js 1.x). Trailing-slash redirect would mangle the proxied
  // POSTs, so disable it.
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      // Legacy icon / manifest paths. Browsers auto-request these
      // from the root regardless of any <link rel="icon"> we emit in
      // <head>, so without these rewrites the user's DevTools console
      // logs a 404 per navigation. Map them to the corresponding
      // Next.js metadata routes (app/icon.tsx, app/apple-icon.tsx,
      // app/manifest.ts) so the request resolves silently.
      { source: '/favicon.ico', destination: '/icon' },
      { source: '/apple-touch-icon.png', destination: '/apple-icon' },
      { source: '/apple-touch-icon-precomposed.png', destination: '/apple-icon' },
      { source: '/manifest.json', destination: '/manifest.webmanifest' },
    ];
  },
  // 301 redirects — preserve link equity from the retired quarterly
  // cadence (q1-2026 / q4-2025 / q3-2025 / q2-2025) by collapsing
  // every legacy quarter URL to the new index. The regex constraint
  // `(q\\d+-\\d{4})` matches q1-q9 plus any 4-digit year so a future
  // q5-YYYY doesn't slip through to a 404. The four explicit slugs
  // are listed alongside the regex for sitemap/legacy-backlink
  // discoverability — Next applies the first matching rule, so
  // having explicit + catch-all is harmless.
  async redirects() {
    return [
      { source: '/market-reports/q1-2026', destination: '/market-reports', permanent: true },
      { source: '/market-reports/q4-2025', destination: '/market-reports', permanent: true },
      { source: '/market-reports/q3-2025', destination: '/market-reports', permanent: true },
      { source: '/market-reports/q2-2025', destination: '/market-reports', permanent: true },
      {
        source: '/market-reports/:slug(q\\d+-\\d{4})',
        destination: '/market-reports',
        permanent: true,
      },
    ];
  },
  skipTrailingSlashRedirect: true,
  // Security headers — five-pack covering the OWASP-recommended baseline.
  //
  // CSP is intentionally permissive on `script-src` / `style-src` / `img-src`
  // because the site loads PostHog, Microsoft Clarity, GA4, Vercel Analytics,
  // MapTiler, Google Maps, Google Aerial View, Spark CDN, and Next.js Image
  // optimizer — locking those down field-by-field is a multi-week migration.
  // What CSP gives us TODAY without that work:
  //   - frame-ancestors 'none'   → clickjacking protection (XFO equivalent + iframes)
  //   - object-src 'none'        → blocks Flash/Java/plugins
  //   - base-uri 'self'          → prevents <base> tag injection attacks
  //   - form-action 'self'       → forms can't be hijacked to POST elsewhere
  //   - upgrade-insecure-requests → auto-upgrade http to https
  //
  // Future tightening: nonce-based script-src after a CSP report-only audit
  // confirms which inline scripts are first-party Next.js vs. third-party.
  async headers() {
    const csp = [
      "default-src 'self' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
      // MapLibre GL JS spawns its tile-decoding Web Worker from a
      // blob: URL. Without `worker-src` the browser walks
      // worker-src → child-src → script-src; my prior CSP didn't
      // include `blob:` on any of those, so workers were blocked
      // and the map rendered as a blank canvas with zero tile
      // requests fired. Explicit `worker-src 'self' blob:` resolves
      // it directly and documents the requirement.
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss: blob:",
      "frame-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
      },
      { key: 'Content-Security-Policy', value: csp },
    ];

    return [
      // Apply to all HTML routes. Static asset paths in /_next/* are
      // immutable + already get long-cache headers; the security headers
      // here ride along harmlessly.
      { source: '/(.*)', headers: securityHeaders },
    ];
  },
  // Next 16.2.4 framework regression: prerendering the synthetic
  // `/_global-error` route hits `useContext(LayoutRouterContext)` returning
  // null and aborts the build. Reproduced on Jeane's site (identical
  // Next/React versions), on Next 16.1.6, and with React downgraded to
  // 19.1.0 — so it's an upstream Next.js bug, not a user-code issue.
  // Verified independent of: custom global-error.tsx (removing it does
  // not fix it), `output: 'standalone'`, `experimental.ppr: false`,
  // `dynamic = 'force-dynamic'` exports on global-error/not-found,
  // and reduction of global-error to bare HTML. Per attempt 6, the
  // regression is purely in the framework's `_global-error` prerender
  // worker. `dev` is unaffected; Vercel's deploy build path may also
  // handle it differently. Tracking issue/fix upstream.
};

export default nextConfig;
