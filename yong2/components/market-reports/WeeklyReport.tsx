import Link from 'next/link';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import {
  type WeeklyStats,
  type TierBreakdown,
  type TrendSeries,
  weekRangeLabel,
} from '@/lib/market-reports';
import { generateWeeklySummary } from '@/lib/market-reports/auto-summary';
import { StatTile } from './StatTile';
import { TierBreakdownSection } from './TierBreakdown';
import { TrendChart } from './TrendChart';
import { MethodologyBlock } from './MethodologyBlock';

export interface WeeklyReportProps {
  stats: WeeklyStats;
  breakdown: TierBreakdown | null;
  trend: TrendSeries | null;
}

/**
 * "The Market Desk" weekly cadence template.
 *
 * No Yong byline — weekly is intentionally framed as a desk product
 * (auto-summary + parquet-driven tiles) rather than personal editorial.
 * Stat-tile grid is narrower than monthly's by design: the parquet
 * exposes only new-listings at weekly granularity, so we don't fake
 * medianPpsf/DOM/closed volume here.
 */
export function WeeklyReport({ stats, breakdown, trend }: WeeklyReportProps) {
  const summary = generateWeeklySummary(stats, breakdown, trend);
  return (
    <>
      <Navigation />
      <main className="bg-ink text-stone pt-24">
        {/* Header */}
        <SectionFrame className="pt-12 pb-16 md:pt-16 md:pb-20">
          <p className="caps text-[10px] text-gold tracking-[0.32em]">The Market Desk</p>
          <h1 className="display-xl mt-4 text-stone tracking-[-0.005em]">
            {weekRangeLabel(stats.period)}
          </h1>
          <p className="mt-6 max-w-3xl text-base md:text-lg leading-relaxed text-stone/80">
            {summary}
          </p>
          <p className="mt-5 caps text-[10px] tracking-[0.32em] text-stone/40">
            Phoenix metro · Supply pulse · Auto-generated from ARMLS listing data
          </p>
        </SectionFrame>

        {/* Stat tiles — weekly is supply-pulse only */}
        <SectionFrame className="pb-16 md:pb-20 border-t border-[color:var(--hairline)] pt-12 md:pt-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <StatTile
              label="New listings"
              value={stats.newListings.toLocaleString()}
              chips={[
                stats.wow?.newListings != null
                  ? { pct: stats.wow.newListings, label: 'WoW', direction: 'neutral' as const }
                  : null,
                stats.yoy?.newListings != null
                  ? { pct: stats.yoy.newListings, label: 'YoY', direction: 'neutral' as const }
                  : null,
              ].filter((c): c is NonNullable<typeof c> => c !== null)}
            />
            <StatTile
              label="4-week average"
              value={stats.newListings4wAvg != null ? stats.newListings4wAvg.toFixed(1) : null}
              footnote="Smoothed signal"
            />
            <StatTile
              label="52-week average"
              value={stats.newListings52wAvg != null ? stats.newListings52wAvg.toFixed(1) : null}
              footnote="Long-run baseline"
            />
            <StatTile
              label="Period"
              value={
                <span className="font-serif text-2xl md:text-3xl leading-tight">
                  {stats.weekStart}
                  <span className="text-stone/40 mx-2">→</span>
                  {stats.weekEnd}
                </span>
              }
              footnote="ISO 8601 week"
            />
          </div>
        </SectionFrame>

        {/* Trend chart — 12 weeks of new-listings + 4wk overlay */}
        {trend ? (
          <SectionFrame className="py-16 md:py-20 border-t border-[color:var(--hairline)]">
            <div className="max-w-5xl">
              <div className="mb-10 md:mb-14">
                <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
                <p className="caps">Twelve-week pulse</p>
                <h2 className="display-lg mt-4 text-stone tracking-[-0.005em]">
                  New listings by week.
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
