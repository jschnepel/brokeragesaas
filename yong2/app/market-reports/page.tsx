import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { siteContent } from '@/content/site';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { PageHero } from '@/components/shared/PageHero';
import { MARKET_REPORT_COPY } from '@/content/market-reports';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: `Market Reports · ${siteContent.brand.name}`,
  description: `Quarterly luxury market intelligence for Silverleaf, Desert Mountain, Estancia, Paradise Valley, and DC Ranch — authored by ${siteContent.brand.name} of Russ Lyon Sotheby's International Realty.`,
  alternates: { canonical: siteUrl('/market-reports') },
};

// Index page is intentionally DB-free — see reference_yong2_amplify.md.
// Even one report's worth of fetchers (3+ parallel queries) trips the
// Lambda timeout on cold start. Index renders entirely from the
// editorial copy layer; the live charts + headline stats + automated
// snapshot all live on the per-report detail pages where they belong.
// Static-rendered for instant TTFB.

export default function MarketReportsPage() {
  const [latest, ...rest] = MARKET_REPORT_COPY;

  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/market.jpg"
        kicker="Luxury Market Intelligence"
        headline="Quarterly"
        headlineItalic="market reports."
        sub="A quarterly read on the Valley's top-tier market — authored by Yong Choi, grounded in the transactions the MLS alone doesn't capture."
      />
      <main className="bg-ink text-stone">

        {/* Why these matter */}
        <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20 border-b border-[color:var(--hairline)]">
          <div className="max-w-2xl mx-auto animate-fade-up">
            <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
            <p className="caps">Why these matter</p>
            <p className="display-lg mt-10 text-stone tracking-[-0.005em]">
              The public data tells part of the story. The rest is written in
              the introductions made over a decade, the pocket trades arranged
              before they reach the MLS, and the club memberships that change
              hands at close.
            </p>
            <p className="mt-10 text-base md:text-lg leading-relaxed text-mute">
              Each quarter, Yong publishes a working view of the Valley&rsquo;s
              top-tier market — combining ARMLS-recorded closes with the
              private representations he and the Russ Lyon Sotheby&rsquo;s
              International Realty network quietly facilitate. The result is a
              more complete picture than any public source provides.
            </p>
          </div>
        </section>

        {/* Featured latest report — copy-only feature panel.
         *  Live charts + computed headline stats live on the detail page. */}
        {latest && (
          <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20">
            <div className="max-w-[1400px] mx-auto">
              <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
              <p className="caps">The latest report</p>
              <Link
                href={`/market-reports/${latest.slug}`}
                className="group mt-8 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 md:gap-14 items-start"
              >
                <div
                  className="relative aspect-[4/3] lg:aspect-[5/4] overflow-hidden"
                  style={{ background: 'var(--ink-elevated)' }}
                >
                  <Image
                    src={latest.coverImage}
                    alt={`${latest.title} — ${latest.quarter} cover`}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    quality={75}
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                  />
                  <div
                    className="absolute inset-0 transition-opacity duration-700"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(11,22,32,0.55) 0%, transparent 60%)',
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(11,22,32,0.75) 0%, transparent 65%)',
                    }}
                  />
                  <div
                    className="absolute top-6 left-6 px-4 py-2 backdrop-blur-sm"
                    style={{ background: 'rgba(11,22,32,0.85)' }}
                  >
                    <p className="caps text-[10px]">{latest.quarter} · Latest</p>
                  </div>
                </div>
                <div className="flex flex-col">
                  <p className="caps">{latest.quarter}</p>
                  <h2 className="display-lg mt-4 text-stone group-hover:text-gold transition-colors tracking-[-0.005em]">
                    {latest.title}
                  </h2>
                  <p className="mt-6 font-serif italic text-gold text-lg md:text-xl leading-snug">
                    {latest.subtitle}
                  </p>
                  <p className="mt-6 text-base md:text-lg leading-relaxed text-mute max-w-md">
                    {latest.summary}
                  </p>

                  {/* What's inside — observation preview pulled from copy.
                   *  Lives in place of the live stats grid (which moved
                   *  entirely to the detail page). Three short bullets give
                   *  a meaningful taste of the report without a DB call. */}
                  {latest.observations.length > 0 && (
                    <div className="mt-10 pt-8 border-t border-[color:var(--hairline)] max-w-md">
                      <p className="caps text-[10px] text-stone/55 mb-6">What&rsquo;s inside</p>
                      <ul className="space-y-4">
                        {latest.observations.slice(0, 3).map((obs, i) => (
                          <li key={i} className="flex gap-4">
                            <span className="caps text-[10px] tracking-[0.32em] text-gold/70 tabular-nums shrink-0 mt-1">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="text-sm md:text-[15px] text-stone/85 leading-relaxed">
                              {obs}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-10 inline-flex items-center gap-3 caps text-stone group-hover:text-gold transition-colors">
                    Read the full report
                    <span className="block h-px w-10 bg-current transition-all group-hover:w-16" />
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Earlier reports */}
        {rest.length > 0 && (
          <section
            className="py-20 md:py-24 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]"
            style={{ background: 'var(--ink-surface)' }}
          >
            <div className="max-w-[1400px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
                <div>
                  <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
                  <p className="caps">Earlier reports</p>
                  <h2 className="display-lg mt-4 text-stone tracking-[-0.005em]">The archive.</h2>
                </div>
                <p className="caps text-[10px] tracking-[0.32em] max-w-xs md:text-right" style={{ color: 'var(--mute)' }}>
                  Published quarterly since Q2 2025.
                </p>
              </div>

              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {rest.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/market-reports/${r.slug}`} className="group block">
                      <div
                        className="relative aspect-[4/3] overflow-hidden"
                        style={{ background: 'var(--ink-elevated)' }}
                      >
                        <Image
                          src={r.coverImage}
                          alt={`${r.title} — ${r.quarter} cover`}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          quality={75}
                          className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              'linear-gradient(to top, rgba(11,22,32,0.55) 0%, transparent 60%)',
                          }}
                        />
                        <div
                          className="absolute top-4 left-4 px-3 py-1.5 backdrop-blur-sm"
                          style={{ background: 'rgba(11,22,32,0.85)' }}
                        >
                          <p className="caps text-[9px]">{r.quarter}</p>
                        </div>
                      </div>
                      <div className="border-t border-transparent group-hover:border-gold/40 transition-colors duration-300 pt-5 mt-5">
                        <p className="caps text-[10px] tracking-[0.32em] text-stone/55 mb-3">
                          {r.quarter}
                        </p>
                        <h3 className="font-serif text-xl md:text-2xl text-stone group-hover:text-gold transition-colors leading-tight tracking-[-0.005em]">
                          {r.title}
                        </h3>
                        <p className="mt-3 text-sm text-mute leading-relaxed line-clamp-2">
                          {r.summary}
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 caps text-[10px] text-gold group-hover:text-[color:var(--gold-muted)] transition-colors">
                          Read report
                          <span className="block h-px w-6 bg-current transition-all group-hover:w-10" />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Methodology */}
        <section className="py-16 md:py-20 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]">
          <div className="max-w-2xl mx-auto">
            <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
            <p className="caps">Methodology</p>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-mute">
              Data is aggregated from{' '}
              <span className="caps text-[10px] tracking-[0.3em] text-stone">ARMLS recorded transactions</span>
              ,{' '}
              <span className="caps text-[10px] tracking-[0.3em] text-stone">publicly filed deeds</span>
              , and a{' '}
              <span className="caps text-[10px] tracking-[0.3em] text-stone">private registry of off-market trades</span>{' '}
              facilitated by Yong and the Russ Lyon Sotheby&rsquo;s
              International Realty network. Stats reflect a three-month rolling
              window per quarter. Neighborhood boundaries follow municipal and
              ARMLS conventions. Adjustments are noted inline where applicable.
            </p>
          </div>
        </section>

        {/* Subscribe CTA */}
        <section
          className="py-20 md:py-28 px-6 md:px-12 lg:px-20"
          style={{ background: 'var(--ink-surface)' }}
        >
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-10 md:gap-16 items-center">
            <div>
              <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
              <p className="caps">A working dialogue</p>
              <h2 className="display-lg mt-6 text-stone tracking-[-0.005em] leading-[1.05]">
                Begin a
                <br />
                <em className="font-serif italic font-light text-gold">conversation.</em>
              </h2>
              <p className="mt-8 max-w-md text-base leading-relaxed text-mute">
                The data is one input among many. For a private read on how
                this quarter applies to a specific address, neighborhood, or
                criteria — reach out directly.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3.5 caps text-ink bg-gold hover:bg-[color:var(--gold-muted)] transition-colors text-center tracking-[0.32em]"
              >
                Begin a Conversation
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center px-6 py-3.5 caps text-stone border border-stone/30 hover:border-gold hover:text-gold transition-colors text-center tracking-[0.32em]"
              >
                Browse the Portfolio
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
