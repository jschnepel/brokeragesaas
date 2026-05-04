import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How yongchoi.com collects, uses, and protects information about visitors. Includes our analytics providers, retention windows, and how to exercise data rights.',
  alternates: { canonical: siteUrl('/privacy/policy') },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24">
        <SectionFrame className="py-20">
          <article className="max-w-3xl mx-auto space-y-10">
            <header className="space-y-4">
              <div className="caps">Privacy</div>
              <h1 className="font-serif italic text-5xl md:text-6xl leading-[1.05] tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-sm text-mute">Last updated: April 2026</p>
            </header>

            <section className="space-y-4 text-stone/85 leading-relaxed">
              <p>
                This page explains what information we collect when you visit yongchoi.com, why we collect
                it, how long we keep it, and the choices available to you. We default to collecting as little
                as possible. Analytics are off until you opt in via the cookie banner. Browsers that send the
                Do Not Track signal are treated as an automatic opt-out.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl">What we collect</h2>
              <ul className="list-disc list-inside text-stone/85 space-y-2 leading-relaxed">
                <li>
                  <strong className="text-stone">Necessary cookies.</strong> A consent cookie
                  (<code>yong2_consent</code>) recording your choice, and an anonymous session id
                  (<code>yong2_anon_id</code>) used to stitch pageviews within a single visit.
                </li>
                <li>
                  <strong className="text-stone">Analytics (opt-in).</strong> Pages viewed, anonymized
                  aggregates of mouse / scroll behavior, time on page, performance metrics, and basic device
                  / browser type. IP addresses are anonymized at ingestion by all three providers.
                </li>
                <li>
                  <strong className="text-stone">Contact form.</strong> Name, email, phone (optional), and
                  message — only what you submit. Used to reply and held in our email system.
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl">Analytics providers</h2>
              <ul className="list-disc list-inside text-stone/85 space-y-2 leading-relaxed">
                <li>
                  <strong className="text-stone">Microsoft Clarity</strong> — anonymized session replay and
                  heatmaps. No keystrokes are recorded; form fields are masked by default.
                </li>
                <li>
                  <strong className="text-stone">PostHog Cloud (US)</strong> — custom event metrics and
                  funnels. Configured events-only with autocapture and session recording disabled.
                </li>
                <li>
                  <strong className="text-stone">Vercel Web Analytics</strong> — first-party Core Web Vitals
                  measurement. No cookies; aggregated only.
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl">Retention</h2>
              <p className="text-stone/85 leading-relaxed">
                Analytics data is retained for 24 months and then deleted by the provider. Contact form
                submissions are retained as long as the conversation is active and for up to 24 months
                thereafter.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl">Your choices</h2>
              <ul className="list-disc list-inside text-stone/85 space-y-2 leading-relaxed">
                <li>
                  Update your cookie preferences any time at{' '}
                  <Link href="/privacy/preferences" className="text-gold underline underline-offset-4">
                    /privacy/preferences
                  </Link>
                  .
                </li>
                <li>
                  See the full list of cookies we may set at{' '}
                  <Link href="/privacy/cookies" className="text-gold underline underline-offset-4">
                    /privacy/cookies
                  </Link>
                  .
                </li>
                <li>
                  Request access, correction, or deletion of your data by emailing{' '}
                  <a
                    href="mailto:privacy@yongchoi.com"
                    className="text-gold underline underline-offset-4"
                  >
                    privacy@yongchoi.com
                  </a>
                  . We respond within 30 days.
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl">Sale of personal information</h2>
              <p className="text-stone/85 leading-relaxed">
                We do not sell or share personal information with advertisers. The "Do Not Sell My Personal
                Information" link in the footer routes to your preferences page where you can disable
                analytics outright.
              </p>
            </section>
          </article>
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
