import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { siteUrl } from '@/lib/seo';

// Portfolio is hand-curated. Listings here are the ones Yong has
// chosen to feature — not an auto-pulled IDX feed. Empty state shows
// until he adds an entry. The full live ARMLS Active+Pending feed
// lives at /listings (Home Search), Spark-backed.
//
// ISR — hourly. Periodic rebuilds prevent a bad deploy from being
// cached at edges for the 1-year `s-maxage` default of fully-static
// prerenders.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'The Portfolio · Recent Representations',
  description:
    "Hand-curated current and recent representations across Scottsdale, Paradise Valley, and the North Valley’s most coveted luxury enclaves.",
  alternates: { canonical: siteUrl('/portfolio') },
};

export default function PortfolioPage() {
  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/portfolio-az.jpg"
        kicker="The Portfolio"
        headline="Current"
        headlineItalic="representations."
        sub="Hand-curated estates across Scottsdale, Paradise Valley, and Yong's North Phoenix service area."
      />
      <main className="bg-ink text-stone">
        <SectionFrame className="py-24 md:py-32">
          <div className="max-w-2xl mx-auto text-center">
            <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mx-auto mb-8" />
            <p className="caps text-[10px] tracking-[0.32em] text-stone/55">
              By appointment · By introduction
            </p>
            <h2 className="font-serif text-stone text-3xl md:text-4xl leading-tight tracking-[-0.005em] mt-8">
              Yong&rsquo;s current representations are
              <br />
              <em className="font-light text-gold">handled privately.</em>
            </h2>
            <p className="mt-10 text-base md:text-lg leading-relaxed text-mute max-w-lg mx-auto">
              Featured estates appear here when Yong elects to show them
              publicly. For a quiet introduction to the broader top-tier
              inventory — both publicly listed and off-market — reach out
              directly.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/private-inventory"
                className="inline-flex items-center justify-center px-6 py-3.5 caps text-ink bg-gold hover:bg-[color:var(--gold-muted)] transition-colors text-center tracking-[0.32em]"
              >
                Subscribe to Off-Market
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3.5 caps text-stone border border-stone/30 hover:border-gold hover:text-gold transition-colors text-center tracking-[0.32em]"
              >
                Begin a Conversation
              </Link>
              <Link
                href="/listings"
                className="inline-flex items-center justify-center px-6 py-3.5 caps text-stone border border-stone/30 hover:border-gold hover:text-gold transition-colors text-center tracking-[0.32em]"
              >
                Browse the Active Market
              </Link>
            </div>
          </div>
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
