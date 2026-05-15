import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Override the root layout's `template: '%s · Yong Choi'` with an
// absolute title so the 404 page surfaces as "404 — Page Not Found"
// instead of inheriting the homepage title. `robots: noindex` keeps
// the 404 out of search indices when crawlers hit unknown routes.
export const metadata: Metadata = {
  title: { absolute: '404 — Page Not Found · Yong Choi' },
  description: 'The page you requested doesn’t exist or has been moved.',
  robots: { index: false, follow: false },
};

/**
 * Minimal not-found that imports zero layout chrome. Next 16.2.4 +
 * React 19.2.4 has a prerender regression where /_not-found dies with
 * `useContext` null when its tree pulls in client components that lift
 * hooks (the original Navigation + Footer composition tripped this).
 * Inline styles avoid the Tailwind CSS-vars dependency too — keeps
 * the prerender path self-contained.
 */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0B1620',
        color: '#EFE9DF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#D4B88A',
            marginBottom: 24,
          }}
        >
          404 &mdash; Not Found
        </p>
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: 48,
            lineHeight: 1.05,
            marginBottom: 24,
          }}
        >
          This page wasn&rsquo;t found.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(239,233,223,0.7)',
            marginBottom: 32,
            maxWidth: 480,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          The address you requested doesn&rsquo;t exist or has been removed.
        </p>
        <Link
          href="/"
          style={{
            background: '#D4B88A',
            color: '#0B1620',
            padding: '14px 28px',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
