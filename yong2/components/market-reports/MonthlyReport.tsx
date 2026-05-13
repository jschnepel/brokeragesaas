import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { yongBio } from '@/content/yong';
import {
  type MonthlyStats,
  type TierBreakdown,
  type TrendSeries,
} from '@/lib/market-reports';
import { StatTile } from './StatTile';
import { TierBreakdownSection } from './TierBreakdown';
import { TrendChart } from './TrendChart';
import { MethodologyBlock } from './MethodologyBlock';

export interface MonthlyMdxFrontmatter {
  /** Period this MDX corresponds to: "2026-04". */
  period: string;
  /** Editorial headline displayed above the prose. */
  headline?: string;
  /** ISO timestamp; advisory only (the publish window is computed server-side). */
  publishedAt?: string;
}

export interface MonthlyReportProps {
  stats: MonthlyStats;
  breakdown: TierBreakdown | null;
  trend: TrendSeries | null;
  /** Yong-authored MDX body. Null when no MDX file exists for this
   *  month — template renders a "finalizing" placeholder instead. */
  prose?: ReactNode;
  /** Optional headline from the MDX frontmatter. */
  proseHeadline?: string | null;
}

const DOLLAR = (n: number | null | undefined) =>
  n != null && Number.isFinite(n) ? `$${Math.round(n).toLocaleString()}` : null;

/**
 * "Yong's Monthly Read" template.
 *
 * Stat-tile grid carries the full suite (medianPpsf, medianDom,
 * activeInventory, monthsSupply, closedVolume, newListings). Editorial
 * prose comes from `content/market-reports/monthly/{YYYY-MM}.mdx` —
 * when absent the page falls back to a placeholder block rather than
 * 404'ing (per the spec's "Yong is finalizing the {Month} read"
 * requirement).
 */
export function MonthlyReport({
  stats,
  breakdown,
  trend,
  prose,
  proseHeadline,
}: MonthlyReportProps) {
  return (
    <>
      <Navigation />
      <main className="bg-ink text-stone pt-24">
        {/* Header */}
        <SectionFrame className="pt-12 pb-16 md:pt-16 md:pb-20">
          <p className="caps text-[10px] text-gold tracking-[0.32em]">Yong&rsquo;s Monthly Read</p>
          <h1 className="display-xl mt-4 text-stone tracking-[-0.005em]">{stats.monthLabel}</h1>
          {proseHeadline ? (
            <p className="mt-5 font-serif italic text-gold text-xl md:text-2xl lg:text-3xl leading-snug max-w-3xl">
              {proseHeadline}
            </p>
          ) : null}
          <p className="mt-6 caps text-[10px] tracking-[0.32em] text-stone/40">
            Phoenix metro · Full stat suite + Yong&rsquo;s read
          </p>
        </SectionFrame>

        {/* Stat tiles */}
        <SectionFrame className="pb-16 md:pb-20 border-t border-[color:var(--hairline)] pt-12 md:pt-16">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            <StatTile
              label="Median PPSF"
              value={DOLLAR(stats.medianPpsf)}
              chips={[
                stats.mom?.medianPpsf != null
                  ? { pct: stats.mom.medianPpsf, label: 'MoM' }
                  : null,
                stats.yoy?.medianPpsf != null
                  ? { pct: stats.yoy.medianPpsf, label: 'YoY' }
                  : null,
              ].filter((c): c is NonNullable<typeof c> => c !== null)}
            />
            <StatTile
              label="Median DOM"
              value={stats.medianDom != null ? Math.round(stats.medianDom) : null}
              unit="days"
              chips={[
                stats.mom?.medianDom != null
                  ? { pct: stats.mom.medianDom, label: 'MoM', direction: 'up-is-bad' as const }
                  : null,
                stats.yoy?.medianDom != null
                  ? { pct: stats.yoy.medianDom, label: 'YoY', direction: 'up-is-bad' as const }
                  : null,
              ].filter((c): c is NonNullable<typeof c> => c !== null)}
            />
            <StatTile
              label="Closings"
              value={stats.closingCount.toLocaleString()}
              chips={[
                stats.mom?.closingCount != null
                  ? { pct: stats.mom.closingCount, label: 'MoM' }
                  : null,
                stats.yoy?.closingCount != null
                  ? { pct: stats.yoy.closingCount, label: 'YoY' }
                  : null,
              ].filter((c): c is NonNullable<typeof c> => c !== null)}
            />
            <StatTile
              label="Closed volume"
              value={
                stats.totalVolume != null
                  ? `$${(stats.totalVolume / 1_000_000).toFixed(1)}M`
                  : null
              }
              chips={[
                stats.yoy?.totalVolume != null
                  ? { pct: stats.yoy.totalVolume, label: 'YoY' }
                  : null,
              ].filter((c): c is NonNullable<typeof c> => c !== null)}
            />
            <StatTile
              label="New listings"
              value={stats.newListings != null ? stats.newListings.toLocaleString() : null}
              footnote="Sum of weekly mart"
            />
            <StatTile
              label="Months of supply"
              value={
                stats.monthsSupply12mo != null ? stats.monthsSupply12mo.toFixed(1) : null
              }
              unit="mo"
              footnote={
                stats.marketClassification
                  ? `Trailing 12 · ${stats.marketClassification.replace(/_/g, ' ')}`
                  : 'Trailing 12 · current snapshot'
              }
            />
          </div>
        </SectionFrame>

        {/* Editorial prose — Yong's monthly read */}
        <SectionFrame className="py-20 md:py-28 border-t border-[color:var(--hairline)]">
          <div className="max-w-3xl">
            <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
            <p className="caps">The read</p>
            {prose ? (
              <div className="prose prose-invert max-w-none mt-8 text-base md:text-lg leading-relaxed text-stone/85 [&_p]:mt-5 [&_p:first-child]:mt-0">
                {prose}
              </div>
            ) : (
              <div className="mt-8 border-l border-gold/30 pl-6 py-2">
                <p className="font-serif italic text-stone/70 text-lg md:text-xl leading-snug">
                  Yong is finalizing the {stats.monthLabel} read.
                </p>
                <p className="mt-3 text-sm text-stone/55 leading-relaxed">
                  Editorial prose is published mid-month covering the prior calendar period.
                  The stat tiles above reflect the latest closed data.
                </p>
              </div>
            )}
            {/* Byline */}
            <div className="mt-12 pt-8 border-t border-[color:var(--hairline)] flex items-center gap-4">
              <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-full border border-gold/30">
                <Image
                  src={yongBio.photoUrl}
                  alt={`Portrait of ${yongBio.name}`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-serif text-stone text-lg leading-tight">{yongBio.name}</p>
                <p className="caps text-[10px] tracking-[0.32em] text-stone/55 mt-1">
                  {yongBio.title}
                </p>
              </div>
            </div>
          </div>
        </SectionFrame>

        {/* Trend chart — 12 months PPSF */}
        {trend ? (
          <SectionFrame className="py-16 md:py-20 border-t border-[color:var(--hairline)]">
            <div className="max-w-5xl">
              <div className="mb-10 md:mb-14">
                <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
                <p className="caps">Twelve-month trend</p>
                <h2 className="display-lg mt-4 text-stone tracking-[-0.005em]">
                  Median price per square foot.
                </h2>
              </div>
              <TrendChart series={trend} />
            </div>
          </SectionFrame>
        ) : null}

        {/* Tier breakdown */}
        <TierBreakdownSection breakdown={breakdown} />

        {/* Methodology */}
        <MethodologyBlock />

        {/* Back link */}
        <SectionFrame className="py-16 border-t border-[color:var(--hairline)]">
          <Link
            href="/market-reports"
            className="caps text-[10px] tracking-[0.3em] text-stone/75 hover:text-gold transition-colors inline-flex items-center gap-2"
          >
            <span aria-hidden="true">←</span>
            <span>All market reports</span>
          </Link>
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
