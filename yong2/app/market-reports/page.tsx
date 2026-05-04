import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { siteContent } from '@/content/site';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { PageHero } from '@/components/shared/PageHero';
import { TrendChartBlock } from '@/components/charts/ReportCharts';
import { buildReportNarrative } from '@/lib/narrative';
import { getReports } from '@/lib/market-reports';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: `Market Reports · ${siteContent.brand.name}`,
  description: `Quarterly luxury market intelligence for Silverleaf, Desert Mountain, Estancia, Paradise Valley, and DC Ranch — authored by ${siteContent.brand.name} of Russ Lyon Sotheby's International Realty.`,
  alternates: { canonical: siteUrl('/market-reports') },
};

// ISR: refresh hourly so newly-refreshed MV data flows through.
export const revalidate = 3600;

export default async function MarketReportsPage() {
  const reports = await getReports().catch(() => []);
  const [latest, ...rest] = reports;
  const latestNarrative = latest ? buildReportNarrative(latest) : null;

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
          <div className="max-w-3xl mx-auto animate-fade-up">
            <p className="caps">Why these matter</p>
            <p className="display-lg mt-8 text-stone">
              The public data tells part of the story. The rest is written in
              the introductions made over a decade, the pocket trades arranged
              before they reach the MLS, and the club memberships that change
              hands at close.
            </p>
            <p className="mt-8 text-base md:text-lg leading-relaxed text-mute">
              Each quarter, Yong publishes a working view of the Valley&rsquo;s
              top-tier market — combining ARMLS-recorded closes with the
              private representations he and the Russ Lyon Sotheby&rsquo;s
              International Realty network quietly facilitate. The result is a
              more complete picture than any public source provides.
            </p>
          </div>
        </section>

        {/* Featured latest report */}
        {latest && (
          <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20">
            <div className="max-w-[1400px] mx-auto">
              <p className="caps">The latest report</p>
              <Link
                href={`/market-reports/${latest.slug}`}
                className="group mt-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 md:gap-14 items-center"
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
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(11,22,32,0.55) 0%, transparent 60%)',
                    }}
                  />
                  <div
                    className="absolute top-6 left-6 px-4 py-2 backdrop-blur-sm"
                    style={{ background: 'rgba(11,22,32,0.85)' }}
                  >
                    <p className="caps text-[10px]">{latest.quarter} · Latest</p>
                  </div>
                </div>
                <div>
                  <p className="caps">{latest.quarter}</p>
                  <h2 className="display-lg mt-4 text-stone group-hover:text-gold transition-colors">
                    {latest.title}
                  </h2>
                  <p className="mt-5 font-serif italic text-gold text-lg md:text-xl leading-snug">
                    {latest.subtitle}
                  </p>
                  <p className="mt-6 text-base md:text-lg leading-relaxed text-mute max-w-lg">
                    {latest.summary}
                  </p>

                  {/* Headline stats */}
                  <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 max-w-md">
                    {latest.headlineStats.slice(0, 4).map((s) => (
                      <div key={s.label}>
                        <dt className="caps text-[10px]" style={{ color: 'var(--mute)' }}>
                          {s.label}
                        </dt>
                        <dd className="mt-2 font-serif text-2xl md:text-3xl text-stone">
                          {s.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-10 inline-flex items-center gap-3 caps text-stone group-hover:text-gold transition-colors">
                    Read the full report
                    <span className="block h-px w-10 bg-current transition-all group-hover:w-16" />
                  </div>
                </div>
              </Link>

              {/* Auto-generated snapshot preview + trend chart */}
              {latest.charts && (
                <div className="mt-16 md:mt-24 pt-12 md:pt-16 border-t border-[color:var(--hairline)]">
                  {latestNarrative && latestNarrative.snapshot.length > 0 && (
                    <div className="mb-14 md:mb-20">
                      <p className="caps">Automated read · three key findings</p>
                      <ul className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
                        {latestNarrative.snapshot.slice(0, 3).map((b, i) => (
                          <li key={i} className="border-t border-[color:var(--hairline)] pt-5">
                            <p className="caps text-[10px]">
                              {String(i + 1).padStart(2, '0')} — {b.label}
                            </p>
                            <p className="mt-4 text-base text-stone leading-relaxed">
                              {b.headline}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="caps">At a glance</p>
                  <h3 className="font-serif italic text-2xl md:text-3xl mt-4 text-stone leading-tight max-w-xl">
                    Median price per square foot, last eight quarters.
                  </h3>
                  <div className="mt-10">
                    <TrendChartBlock report={latest} />
                  </div>
                  <div className="mt-8">
                    <Link
                      href={`/market-reports/${latest.slug}`}
                      className="inline-flex items-center gap-3 caps text-stone hover:text-gold transition-colors"
                    >
                      See the full breakdown
                      <span className="block h-px w-10 bg-current" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Earlier reports */}
        {rest.length > 0 && (
          <section
            className="py-16 md:py-20 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]"
            style={{ background: 'var(--ink-surface)' }}
          >
            <div className="max-w-[1400px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <div>
                  <p className="caps">Earlier reports</p>
                  <h2 className="display-lg mt-4 text-stone">The archive.</h2>
                </div>
                <p className="caps text-[10px] max-w-xs md:text-right" style={{ color: 'var(--mute)' }}>
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
                      <div className="mt-5">
                        <h3 className="font-serif text-xl md:text-2xl text-stone group-hover:text-gold transition-colors leading-tight">
                          {r.title}
                        </h3>
                        <p className="mt-3 text-sm text-mute leading-relaxed line-clamp-3">
                          {r.summary}
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 caps text-[10px] text-gold group-hover:text-[color:var(--gold-muted)] transition-colors">
                          Read report
                          <span className="block h-px w-6 bg-current" />
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
          <div className="max-w-3xl mx-auto">
            <p className="caps">Methodology</p>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-mute">
              Data is aggregated from ARMLS recorded transactions, publicly
              filed deeds, and a private registry of off-market trades
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
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 items-center">
            <div>
              <p className="caps">A working dialogue</p>
              <h2 className="display-lg mt-6 text-stone">
                Begin a <em className="font-light">conversation.</em>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-mute">
                The data is one input among many. For a private read on how
                this quarter applies to a specific address, neighborhood, or
                criteria — reach out directly.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 caps text-ink bg-gold hover:bg-[color:var(--gold-muted)] transition-colors text-center"
              >
                Begin a Conversation
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center px-6 py-3 caps text-stone border border-[color:var(--hairline)] hover:border-[color:var(--gold)] hover:text-gold transition-colors text-center"
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
