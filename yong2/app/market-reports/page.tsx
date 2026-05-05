import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { siteContent } from '@/content/site';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { PageHero } from '@/components/shared/PageHero';
import { PriceTrendSparkline } from '@/components/portfolio/PriceTrendSparkline';
import { MARKET_REPORT_COPY } from '@/content/market-reports';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: `Market Reports · ${siteContent.brand.name}`,
  description: `Quarterly luxury market intelligence for Silverleaf, Desert Mountain, Estancia, Paradise Valley, and DC Ranch — authored by ${siteContent.brand.name} of Russ Lyon Sotheby's International Realty.`,
  alternates: { canonical: siteUrl('/market-reports') },
};

// Index page is intentionally DB-free — see reference_yong2_amplify.md.
// All numbers + charts come from the editorial copy layer (hand-authored
// quarterly with the report). Detail pages keep live RDS queries where
// users expect deeper analytics. Static-rendered: instant TTFB.

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

        {/* ── ② AT A GLANCE — pulse bar ───────────────────────────── */}
        {latest?.pulse && (
          <section
            className="py-12 md:py-14 px-6 md:px-12 lg:px-20 border-b border-[color:var(--hairline)]"
            style={{ background: 'var(--ink-elevated)' }}
            aria-labelledby="at-a-glance-eyebrow"
          >
            <div className="max-w-[1400px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
                <div>
                  <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-4" />
                  <p id="at-a-glance-eyebrow" className="caps text-[10px] tracking-[0.32em] text-stone/70">
                    {latest.quarter} · At a glance
                  </p>
                </div>
                <p className="caps text-[10px] tracking-[0.3em] text-stone/45">
                  {latest.pulse.asOfLabel}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
                <PulseStat label="Median PPSF" value={latest.pulse.medianPpsf} />
                <PulseStat
                  label="QoQ change"
                  value={`${latest.pulse.qoqDeltaPct >= 0 ? '+' : ''}${latest.pulse.qoqDeltaPct.toFixed(1)}%`}
                  trend={latest.pulse.qoqDeltaPct >= 0 ? 'up' : 'down'}
                  accent={latest.pulse.qoqDeltaPct >= 0 ? 'gold' : undefined}
                />
                <PulseStat label="Median DOM" value={`${latest.pulse.medianDom}`} unit="days" />
                <PulseStat label="Months supply" value={latest.pulse.monthsSupply.toFixed(1)} unit="mo" />
                <PulseStat label="Active inventory" value={`${latest.pulse.activeCount}`} className="col-span-2 sm:col-span-1" />
              </div>
            </div>
          </section>
        )}

        {/* ── ③ WHY THESE MATTER ──────────────────────────────────── */}
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

        {/* ── ④ FEATURED LATEST REPORT ─────────────────────────────── */}
        {latest && (
          <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20">
            <div className="max-w-[1400px] mx-auto">
              <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
              <p className="caps">The latest report</p>

              {/* — Cover + intro panel (items-start prevents image overflow) — */}
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
                      background: 'linear-gradient(to top, rgba(11,22,32,0.55) 0%, transparent 60%)',
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: 'linear-gradient(to top, rgba(11,22,32,0.75) 0%, transparent 65%)',
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

                  {/* Headline stats — restored, sourced from copy.editorialStats */}
                  {latest.editorialStats && latest.editorialStats.length > 0 && (
                    <div className="mt-10 pt-8 border-t border-[color:var(--hairline)] max-w-md">
                      <p className="caps text-[10px] text-stone/55 mb-6">Headline numbers</p>
                      <dl className="grid grid-cols-2 gap-x-8 gap-y-7">
                        {latest.editorialStats.slice(0, 4).map((s) => (
                          <div key={s.label}>
                            <dt className="caps text-[10px]" style={{ color: 'var(--mute)' }}>
                              {s.label}
                            </dt>
                            <dd
                              className="mt-2.5 font-serif text-stone tabular-nums leading-none tracking-[-0.015em]"
                              style={{ fontSize: 'clamp(28px, 3vw, 38px)' }}
                            >
                              {s.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  <div className="mt-10 inline-flex items-center gap-3 caps text-stone group-hover:text-gold transition-colors">
                    Read the full report
                    <span className="block h-px w-10 bg-current transition-all group-hover:w-16" />
                  </div>
                </div>
              </Link>

              {/* — Three curated findings + 12-month trend — */}
              {(latest.curatedFindings?.length || latest.monthlyTrend?.length) ? (
                <div className="mt-16 md:mt-24 pt-12 md:pt-16 border-t border-[color:var(--hairline)]">
                  {latest.curatedFindings && latest.curatedFindings.length > 0 && (
                    <div className="mb-14 md:mb-20">
                      <p className="caps">Three key findings · curated</p>
                      <ul className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10">
                        {latest.curatedFindings.slice(0, 3).map((f, i) => (
                          <li key={i} className="border-t border-[color:var(--hairline)] pt-6">
                            <p className="caps text-[10px] tracking-[0.32em] text-stone/70">
                              {String(i + 1).padStart(2, '0')} — {f.label.toUpperCase()}
                            </p>
                            <p className="mt-5 text-base text-stone leading-relaxed">
                              {f.headline}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latest.monthlyTrend && latest.monthlyTrend.length >= 2 && (
                    <>
                      <p className="caps">At a glance</p>
                      <p className="font-serif italic text-stone/85 text-lg md:text-xl mt-4 leading-snug max-w-xl">
                        Median price per square foot, last 12 months.
                      </p>
                      <div className="mt-10 max-w-3xl">
                        <PriceTrendSparkline
                          monthlyMedianPpsf={latest.monthlyTrend}
                          caption="Monthly · Valley top-tier"
                        />
                      </div>
                      <div className="mt-8">
                        <Link
                          href={`/market-reports/${latest.slug}`}
                          className="inline-flex items-center gap-3 caps text-stone hover:text-gold transition-colors"
                        >
                          See the full breakdown
                          <span className="block h-px w-10 bg-current transition-all hover:w-16" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        )}

        {/* ── ⑤ BY THE TIER ────────────────────────────────────────── */}
        {latest?.tierBreakdown && latest.tierBreakdown.length > 0 && (
          <section
            className="py-20 md:py-24 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]"
            style={{ background: 'var(--ink-surface)' }}
          >
            <div className="max-w-[1400px] mx-auto">
              <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
              <p className="caps">By the tier</p>
              <h2 className="display-lg mt-4 text-stone tracking-[-0.005em] max-w-2xl">
                Three price bands. Three different markets.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-mute">
                The top tier doesn&rsquo;t move as one. Liquidity, pace, and
                negotiating posture differ sharply by band.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12">
                {latest.tierBreakdown.map((tier) => (
                  <TierCard key={tier.band} tier={tier} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── ⑥ EARLIER REPORTS ────────────────────────────────────── */}
        {rest.length > 0 && (
          <section
            className="py-20 md:py-24 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]"
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
                            background: 'linear-gradient(to top, rgba(11,22,32,0.55) 0%, transparent 60%)',
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

        {/* ── ⑦ HOW WE READ THE MARKET (was Methodology) ───────────── */}
        <section className="py-16 md:py-20 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]">
          <div className="max-w-3xl mx-auto">
            <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
            <p className="caps">How we read the market</p>
            <h2 className="display-lg mt-4 text-stone tracking-[-0.005em] max-w-2xl">
              Three inputs.
            </h2>

            <ol className="mt-12 space-y-8 md:space-y-10">
              <MethodInput
                num="01"
                label="ARMLS recorded closes"
                meta="1.84M Valley records · refreshed every 4 hours"
                body="The full set of MLS-listed transactions. Source-of-record for headline volume + closed-price stats."
              />
              <MethodInput
                num="02"
                label="Public deed filings"
                meta="County recorder · weekly cross-reference"
                body="Captures recorded transactions that didn’t pass through the MLS — including off-market trades, intra-family transfers, and entity-to-entity sales."
              />
              <MethodInput
                num="03"
                label="Private RLSIR registry"
                meta="Off-market trades facilitated by the network"
                body="Yong’s and the Russ Lyon Sotheby’s International Realty network’s direct knowledge of pocket trades, club-membership-driven transfers, and pre-MLS introductions."
              />
            </ol>

            <p className="mt-12 pt-8 border-t border-[color:var(--hairline)] text-sm text-stone/55 leading-relaxed">
              Stats reflect a three-month rolling window per quarter. Neighborhood
              boundaries follow municipal and ARMLS conventions. Adjustments are
              noted inline where applicable.
            </p>
          </div>
        </section>

        {/* ── ⑧ PRIVATE READ CTA ───────────────────────────────────── */}
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

/** Tile chrome for the pulse bar — single stat with caps label + serif number. */
function PulseStat({
  label,
  value,
  unit,
  trend,
  accent,
  className = '',
}: {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down';
  accent?: 'gold';
  className?: string;
}) {
  return (
    <div
      className={`bg-ink/40 border border-white/5 hover:border-white/15 transition-colors duration-300 p-5 md:p-6 ${className}`}
    >
      <p className="caps text-[10px] text-stone/55 mb-3 tracking-[0.32em]">{label}</p>
      <p
        className={`font-serif tabular-nums leading-none tracking-[-0.015em] ${
          accent === 'gold' ? 'text-gold' : 'text-stone'
        }`}
        style={{ fontSize: 'clamp(28px, 3vw, 38px)' }}
      >
        {value}
        {unit ? <span className="text-base text-stone/40 ml-2">{unit}</span> : null}
        {trend ? (
          <span
            aria-hidden="true"
            className={`inline-block ml-2 text-base ${trend === 'up' ? 'text-gold' : 'text-stone/40'}`}
          >
            {trend === 'up' ? '↑' : '↓'}
          </span>
        ) : null}
      </p>
    </div>
  );
}

/** Tier breakdown card — 3 panels under the featured report. */
function TierCard({
  tier,
}: {
  tier: import('@/content/market-reports').TierBreakdownRow;
}) {
  return (
    <article className="bg-ink-elevated/40 border border-white/5 hover:border-white/15 transition-colors duration-300 p-7 md:p-8 flex flex-col">
      <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">Price band</p>
      <h3
        className="mt-3 font-serif text-stone tabular-nums tracking-[-0.015em] leading-none"
        style={{ fontSize: 'clamp(28px, 3vw, 36px)' }}
      >
        {tier.band}
      </h3>

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
        <div>
          <dt className="caps text-[10px] text-stone/45 tracking-[0.3em]">Active</dt>
          <dd
            className="mt-2 font-serif text-stone tabular-nums leading-none"
            style={{ fontSize: 'clamp(24px, 2.4vw, 30px)' }}
          >
            {tier.activeCount}
          </dd>
        </div>
        <div>
          <dt className="caps text-[10px] text-stone/45 tracking-[0.3em]">Closed (90d)</dt>
          <dd
            className="mt-2 font-serif text-stone tabular-nums leading-none"
            style={{ fontSize: 'clamp(24px, 2.4vw, 30px)' }}
          >
            {tier.closedCount}
          </dd>
        </div>
        <div>
          <dt className="caps text-[10px] text-stone/45 tracking-[0.3em]">Median PPSF</dt>
          <dd
            className="mt-2 font-serif text-gold tabular-nums leading-none"
            style={{ fontSize: 'clamp(20px, 2vw, 26px)' }}
          >
            {tier.ppsf}
          </dd>
        </div>
        <div>
          <dt className="caps text-[10px] text-stone/45 tracking-[0.3em]">Median DOM</dt>
          <dd
            className="mt-2 font-serif text-stone tabular-nums leading-none"
            style={{ fontSize: 'clamp(20px, 2vw, 26px)' }}
          >
            {tier.medianDom}
            <span className="text-sm text-stone/40 ml-1.5">days</span>
          </dd>
        </div>
      </dl>

      <p className="mt-8 pt-6 border-t border-white/5 text-sm text-stone/75 leading-relaxed italic">
        {tier.note}
      </p>
    </article>
  );
}

/** Methodology input row — numbered, with caps label + meta + body. */
function MethodInput({
  num,
  label,
  meta,
  body,
}: {
  num: string;
  label: string;
  meta: string;
  body: string;
}) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-5 md:gap-8 items-start">
      <span className="caps text-[10px] tracking-[0.32em] text-gold/70 tabular-nums pt-1">
        {num}
      </span>
      <div>
        <p className="caps text-[11px] tracking-[0.32em] text-stone">{label}</p>
        <p className="mt-2 caps text-[10px] tracking-[0.3em] text-stone/45">{meta}</p>
        <p className="mt-4 text-base leading-relaxed text-mute">{body}</p>
      </div>
    </li>
  );
}
