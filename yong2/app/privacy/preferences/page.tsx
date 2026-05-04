import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PreferencesPanel } from '@/components/consent/PreferencesPanel';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Manage Preferences',
  description:
    'Update your cookie and analytics preferences for yongchoi.com. Reset your anonymous analytics id at any time.',
  alternates: { canonical: siteUrl('/privacy/preferences') },
};

export default function PreferencesPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24">
        <SectionFrame className="py-20">
          <article className="max-w-3xl mx-auto space-y-10">
            <header className="space-y-4">
              <div className="caps">Privacy</div>
              <h1 className="font-serif italic text-5xl md:text-6xl leading-[1.05] tracking-tight">
                Manage Preferences
              </h1>
              <p className="text-stone/80 leading-relaxed">
                Choose which categories of cookies you allow. Necessary cookies are always on so the site
                can remember your choice. Analytics covers Microsoft Clarity, PostHog, and Vercel Web
                Analytics — all anonymized.
              </p>
            </header>

            <PreferencesPanel />
          </article>
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
