import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { websiteSchema } from '@/lib/jsonld';
import { CookieBanner } from '@/components/consent/CookieBanner';
import { ClarityScript } from '@/components/analytics/Clarity';
import { PostHogScript } from '@/components/analytics/PostHog';
import { PageviewTracker } from '@/components/analytics/PageviewTracker';
import { EngagementTracker } from '@/components/analytics/EngagementTracker';
import { SessionTracker } from '@/components/analytics/SessionTracker';
import { VercelAnalyticsScript } from '@/components/analytics/VercelAnalytics';

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
      <body>
        {/*
         * WebSite-only schema at the root. The richer RealEstateAgent schema
         * is emitted on /about (more detailed page-level context) so we don't
         * double-emit `@type: RealEstateAgent` across every route. The string
         * passed to dangerouslySetInnerHTML is JSON.stringify of an internal
         * object — no user input, so XSS is not a concern.
         */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }}
        />
        {children}
        {/*
         * Analytics + consent. All five components render `null` until the
         * cookie banner has captured an opt-in (or the visitor lands with one
         * already stored). DNT browsers auto-reject inside <CookieBanner /> so
         * the SDKs never load. Order matters only insofar as PostHog must
         * mount before <PageviewTracker /> so the imported `posthog` reference
         * is alive — both are no-ops until consent.analytics === true.
         */}
        <CookieBanner />
        <ClarityScript />
        <PostHogScript />
        {/* PageviewTracker uses useSearchParams() which Next requires inside a Suspense boundary. */}
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
        {/* EngagementTracker also reads pathname via the App Router hooks. */}
        <Suspense fallback={null}>
          <EngagementTracker />
        </Suspense>
        {/* SessionTracker owns session_id, step counter, active-time, and the
            exit beacon — every event in EventCatalog inherits session context
            via track() once this is mounted. useSearchParams → Suspense. */}
        <Suspense fallback={null}>
          <SessionTracker />
        </Suspense>
        <VercelAnalyticsScript />
      </body>
    </html>
  );
}
