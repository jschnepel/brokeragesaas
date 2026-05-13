import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MARKET_REPORT_COPY, type MarketReport, type MarketReportCopy } from '@/content/market-reports';
import { siteContent } from '@/content/site';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { NeighborhoodBarsChart } from '@/components/charts/NeighborhoodBarsChart';
import {
  TrendChartBlock,
  VolumeChartBlock,
  SupplyDemandChartBlock,
  InventoryAgeChartBlock,
} from '@/components/charts/ReportCharts';
import { MethodologySection } from '@/components/charts/MethodologySection';
import { ReportSnapshot } from '@/components/charts/ReportSnapshot';
import { ChartCaption } from '@/components/charts/ChartCaption';
import { buildReportNarrative } from '@/lib/narrative';
import { ReportStatCounter } from '@/components/reports/ReportStatCounter';
import { DownloadReportButton } from '@/components/reports/DownloadReportButton';
import { MarketReportViewTracker } from '@/components/reports/MarketReportViewTracker';
import { breadcrumbListSchema } from '@/lib/jsonld';
import { siteUrl } from '@/lib/seo';
import { communitiesContent, communitySlugs } from '@/content/communities';

// Map curated community display name → /communities/[slug] for B6 internal linking.
// The neighborhood-notes section quietly links each community by name when a
// curated detail page exists, deepening crawl depth + topical authority.
const COMMUNITY_NAME_TO_SLUG: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const slug of communitySlugs) {
    out[communitiesContent[slug].name.toLowerCase()] = slug;
  }
  return out;
})();

type Params = { slug: string };

// ISR — hourly. Page renders purely from `MARKET_REPORT_COPY` so any
// editorial edit reaches CloudFront edges within an hour.
//
// HISTORICAL: until the dbt cutover (Phase 6, 2026-05-10) this page
// composed live charts from `analytics_base` + `mv_*` materialised
// views. Those relations were dropped when the analytics pipeline
// migrated to dbt parquet on CloudFront, which left getReport() throwing
// "relation does not exist" and the page hard-404'ing for every quarter.
// Until live charts get rewired against the parquet feed, the page is
// editorial-copy only — every chart slot is conditional on
// `report.charts`, so omitting charts collapses those sections without
// breaking layout.
export const revalidate = 3600;

// Build a chart-less MarketReport from MarketReportCopy. Detail page is
// editorial-only until the live-chart rewire (see comment on revalidate
// above). The downstream chart components are all guarded by
// `{report.charts && ...}` so an undefined charts field skips them.
function copyToReport(copy: MarketReportCopy): MarketReport {
  return {
    ...copy,
    headlineStats: copy.editorialStats ?? [],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const copy = MARKET_REPORT_COPY.find((c) => c.slug === slug);
  if (!copy) return { title: 'Report not found' };
  return {
    // Absolute title — opt out of the layout's "%s · Yong Choi" template
    // so we don't double-stamp the brand on a title that already ends
    // with the site name (audit item 2.7).
    title: { absolute: `${copy.title} · ${copy.quarter} · ${siteContent.brand.name}` },
    description: copy.summary,
    alternates: { canonical: siteUrl(`/market-reports/${copy.slug}`) },
  };
}

// Pre-render every quarter known to the editorial layer. New quarters
// added to MARKET_REPORT_COPY will be picked up automatically on the
// next deploy or ISR refresh.
export function generateStaticParams(): Params[] {
  return MARKET_REPORT_COPY.map((c) => ({ slug: c.slug }));
}

export default async function MarketReportDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const copy = MARKET_REPORT_COPY.find((c) => c.slug === slug);
  if (!copy) notFound();

  const report = copyToReport(copy);
  const others = MARKET_REPORT_COPY
    .filter((r) => r.slug !== copy.slug)
    .slice(0, 3)
    .map(copyToReport);
  // buildReportNarrative returns null when `report.charts` is undefined —
  // which is always the case until live charts are rewired against the
  // parquet feed. Every `{narrative && …}` block in the JSX below
  // collapses cleanly.
  const narrative = buildReportNarrative(report);
  const breadcrumbs = breadcrumbListSchema([
    { name: 'Home', url: siteUrl('/') },
    { name: 'Market Reports', url: siteUrl('/market-reports') },
    { name: `${report.quarter} · ${report.title}`, url: siteUrl(`/market-reports/${report.slug}`) },
  ]);

  return (
    <>
      {/* Stringified internal Schema.org object; no user input. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <Navigation />
      <MarketReportViewTracker slug={report.slug} quarter={report.quarter} />
      <main className="bg-ink text-stone pt-16">
        {/* Hero */}
        <section className="relative h-[60svh] md:h-[75svh] min-h-[480px] overflow-hidden">
          <Image
            src={report.coverImage}
            alt=""
            fill
            priority
            fetchPriority="high"
            quality={70}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-ink/60" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, var(--ink) 0%, rgba(11,22,32,0.4) 60%, transparent 100%)',
            }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full px-6 md:px-12 lg:px-20 pb-10 md:pb-14 lg:pb-20">
              <div className="max-w-5xl animate-fade-up">
                <p className="caps text-[10px] md:text-[11px]">
                  Market Report · {report.quarter}
                </p>
                <h1 className="display-xl mt-5">{report.title}</h1>
                <p className="mt-5 font-serif italic text-gold text-xl md:text-2xl lg:text-3xl leading-snug">
                  {report.subtitle}
                </p>
                <p className="mt-6 text-sm md:text-base text-stone/75 max-w-2xl leading-relaxed">
                  Published{' '}
                  {new Date(report.datePublished).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary + headline stats */}
        <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20 border-b border-[color:var(--hairline)]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-start">
            <div>
              <p className="caps">Summary</p>
              <p className="display-lg mt-6 text-stone">{report.summary}</p>
              <div className="mt-10">
                <DownloadReportButton />
              </div>
            </div>

            {/* Headline stats with scroll-triggered count-up */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-10">
              {report.headlineStats.map((s) => (
                <ReportStatCounter key={s.label} value={s.value} label={s.label} />
              ))}
            </dl>
          </div>
        </section>

        {/* Auto-generated snapshot */}
        {narrative && <ReportSnapshot blocks={narrative.snapshot} />}

        {/* Chart — per-sqft trend across neighborhoods */}
        {report.charts && (
          <section
            className="py-20 md:py-28 px-6 md:px-12 lg:px-20 border-b border-[color:var(--hairline)]"
            style={{ background: 'var(--ink-surface)' }}
          >
            <div className="max-w-5xl mx-auto">
              <div className="mb-10 md:mb-14">
                <p className="caps">Eight-quarter trend</p>
                <h2 className="display-lg mt-6 text-stone">
                  Median price per square foot,
                  <br />
                  by signature community.
                </h2>
                <p className="mt-5 text-base text-mute max-w-2xl leading-relaxed">
                  A two-year running view. Values reflect ARMLS-recorded
                  closes; off-market transactions are excluded from the trend
                  to keep the series comparable across quarters.
                </p>
              </div>
              <TrendChartBlock report={report} />
              {narrative && <ChartCaption block={narrative.trend} />}
            </div>
          </section>
        )}

        {/* Observations */}
        <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mx-auto">
            <p className="caps">Key observations</p>
            <h2 className="display-lg mt-6 text-stone">
              Quarter in
              <br />
              <em className="font-light">a nutshell.</em>
            </h2>
            <ul className="mt-14 md:mt-20 space-y-8 md:space-y-10">
              {report.observations.map((obs, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[60px_1fr] md:grid-cols-[100px_1fr] gap-4 md:gap-8 border-t border-[color:var(--hairline)] pt-6 md:pt-8"
                >
                  <p className="caps text-[11px]">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className="text-base md:text-lg text-stone leading-relaxed">
                    {obs}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Chart — transaction volume by price band */}
        {report.charts && (
          <section
            className="py-20 md:py-28 px-6 md:px-12 lg:px-20 border-y border-[color:var(--hairline)]"
            style={{ background: 'var(--ink-surface)' }}
          >
            <div className="max-w-5xl mx-auto">
              <div className="mb-10 md:mb-14">
                <p className="caps">Transaction flow</p>
                <h2 className="display-lg mt-6 text-stone">
                  Active inventory vs. closed,
                  <br />
                  by price band.
                </h2>
                <p className="mt-5 text-base text-mute max-w-2xl leading-relaxed">
                  The ratio between active and closed at each band is a
                  cleaner indicator of absorption than raw inventory or days
                  on market — especially at the top, where single transactions
                  distort both metrics.
                </p>
              </div>
              <VolumeChartBlock report={report} />
              {narrative && <ChartCaption block={narrative.volume} />}
            </div>
          </section>
        )}

        {/* Pace of the market — supply vs demand */}
        {report.charts && (
          <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20 border-b border-[color:var(--hairline)]">
            <div className="max-w-5xl mx-auto">
              <div className="mb-10 md:mb-14">
                <p className="caps">Pace of the market</p>
                <h2 className="display-lg mt-6 text-stone">
                  Supply versus demand,
                  <br />
                  <em className="font-light">trailing twelve months.</em>
                </h2>
                <p className="mt-5 text-base text-mute max-w-2xl leading-relaxed">
                  Closed sales (gold) read as demand. New listings (bronze)
                  read as fresh supply. The cleaner signal is the gap — when
                  supply runs above demand for several months, inventory is
                  building; when demand overtakes, the market is absorbing.
                </p>
              </div>
              <SupplyDemandChartBlock report={report} />
            </div>
          </section>
        )}

        {/* Inventory age — current snapshot (only attached to the latest report). */}
        {report.charts && report.charts.inventoryAge && report.charts.inventoryAge.length > 0 && (
          <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20 border-b border-[color:var(--hairline)]">
            <div className="max-w-5xl mx-auto">
              <div className="mb-10 md:mb-14">
                <p className="caps">Inventory age</p>
                <h2 className="display-lg mt-6 text-stone">
                  Where listings are
                  <br />
                  <em className="font-light">moving — and where they aren&rsquo;t.</em>
                </h2>
                <p className="mt-5 text-base text-mute max-w-2xl leading-relaxed">
                  A current-snapshot read of how long active inventory has
                  been on the market, by community. Mass on the left =
                  fresh and absorbing; mass on the right = stale.
                </p>
              </div>
              <InventoryAgeChartBlock report={report} />
            </div>
          </section>
        )}

        {/* Chart + Neighborhood notes side-by-side */}
        <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20">
          <div className="max-w-6xl mx-auto">
            <div className="mb-14 md:mb-20">
              <p className="caps">Neighborhood-level</p>
              <h2 className="display-lg mt-6 text-stone">
                Where the Valley
                <br />
                <em className="font-light">moved this quarter.</em>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-start">
              {/* Chart — per-sqft medians with YoY */}
              {report.charts && (
                <div className="lg:sticky lg:top-24">
                  <p className="caps text-[10px]">This quarter · per sqft</p>
                  <h3 className="font-serif italic text-xl md:text-2xl mt-3 text-stone leading-tight mb-10">
                    Median values, YoY change.
                  </h3>
                  <NeighborhoodBarsChart data={report.charts.medians} />
                  {narrative && <ChartCaption block={narrative.medians} />}
                </div>
              )}

              {/* Notes */}
              <dl className="divide-y divide-[color:var(--hairline)]">
                {report.neighborhoodNotes.map((n) => {
                  const linkSlug = COMMUNITY_NAME_TO_SLUG[n.neighborhood.toLowerCase()];
                  return (
                    <div key={n.neighborhood} className="py-8 grid grid-cols-1 gap-2">
                      <dt className="font-serif text-lg md:text-xl text-stone">
                        {linkSlug ? (
                          <Link
                            href={`/communities/${linkSlug}`}
                            className="hover:text-gold transition-colors"
                          >
                            {n.neighborhood}
                          </Link>
                        ) : (
                          n.neighborhood
                        )}
                      </dt>
                      <dd className="text-base text-mute leading-relaxed">
                        {n.note}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>
        </section>

        {/* Outlook */}
        <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mx-auto">
            <p className="caps">Outlook</p>
            <h2 className="display-lg mt-6 text-stone">
              What to <em className="font-light">watch.</em>
            </h2>
            <div className="mt-12 space-y-6 text-base md:text-lg leading-relaxed text-mute max-w-2xl">
              {report.outlook.map((p, i) => (
                <p key={i} className={i === 0 ? 'text-stone' : ''}>
                  {p}
                </p>
              ))}
            </div>
            <p className="mt-14 font-serif italic text-gold text-xl md:text-2xl leading-snug max-w-xl">
              &ldquo;The data is a starting point. The context is the work.&rdquo;
            </p>
            <p className="mt-4 caps">— {siteContent.brand.name}</p>
          </div>
        </section>

        {/* Methodology */}
        {report.coverage && (
          <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]">
            <MethodologySection
              trend={report.coverage.trend}
              medians={report.coverage.medians}
              inventoryAge={report.coverage.inventoryAge}
            />
          </section>
        )}

        {/* Other reports */}
        {others.length > 0 && (
          <section
            className="py-20 md:py-28 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]"
            style={{ background: 'var(--ink-surface)' }}
          >
            <div className="max-w-[1400px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <div>
                  <p className="caps">Earlier reports</p>
                  <h2 className="display-lg mt-4 text-stone">
                    Also in the archive.
                  </h2>
                </div>
                <Link
                  href="/market-reports"
                  className="caps text-stone hover:text-gold transition-colors inline-flex items-center gap-3 self-start md:self-auto"
                >
                  View All Reports
                  <span className="block h-px w-10 bg-current" />
                </Link>
              </div>

              <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                {others.map((r) => (
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
                          sizes="(min-width: 768px) 33vw, 100vw"
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
                      <h3 className="mt-4 font-serif text-lg md:text-xl text-stone group-hover:text-gold transition-colors leading-tight">
                        {r.title}
                      </h3>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Contact CTA */}
        <section
          className="py-20 md:py-28 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]"
          style={{ background: 'var(--ink-surface)' }}
        >
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10 md:gap-16 items-center">
            <div>
              <p className="caps">Want the detail on a specific neighborhood?</p>
              <h2 className="display-lg mt-6 text-stone">
                The data,
                <br />
                <em className="font-light">made personal.</em>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-mute">
                For a private read on how this quarter&rsquo;s market applies
                to a specific address or purchase criteria — send a note.
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
