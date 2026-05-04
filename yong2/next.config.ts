import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
  },
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
