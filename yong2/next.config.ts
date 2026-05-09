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
  // pg: native binary deps; aws-sdk + hyparquet: large module trees that
  // Turbopack tries to inline-hash, then fails to ship the resolved file
  // into the Amplify SSR Lambda (build #68 verified the failure: "Cannot
  // find module '@aws-sdk/client-s3-57f25c9af355c604'"). Marking external
  // lets node resolve them from node_modules at runtime instead.
  serverExternalPackages: ['pg', '@aws-sdk/client-s3', 'hyparquet', 'hyparquet-compressors'],
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
    ];
  },
  skipTrailingSlashRedirect: true,
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
