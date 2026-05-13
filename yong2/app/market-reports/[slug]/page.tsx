import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getPeriodStats,
  getTierBreakdown,
  getTrendSeries,
  listAvailablePeriods,
  monthLabel,
  parsePeriodSlug,
  weekBounds,
  weekRangeLabel,
} from '@/lib/market-reports';
import { getMonthlyProse } from '@/content/market-reports/monthly';
import { WeeklyReport } from '@/components/market-reports/WeeklyReport';
import { MonthlyReport } from '@/components/market-reports/MonthlyReport';
import { breadcrumbListSchema } from '@/lib/jsonld';
import { JsonLdScript } from '@/components/shared/JsonLdScript';
import { siteUrl } from '@/lib/seo';

// ISR — hourly. Charts redraw on the next request whenever dbt
// refreshes the underlying parquet (currently ~4h cadence).
export const revalidate = 3600;
// New periods that publish between deploys generate on-demand. The
// page itself calls `parsePeriodSlug` and `getPeriodStats`; both gate
// on parquet availability + the AZ publish window and notFound() if
// the period isn't yet published.
export const dynamicParams = true;

type Params = { slug: string };
type PageProps = { params: Promise<Params> };

// Pre-render every currently-published period so the build emits the
// 52 + 24 archive set. Less-recent periods are generated on demand
// via ISR (dynamicParams = true above).
export async function generateStaticParams(): Promise<Params[]> {
  const manifest = await listAvailablePeriods().catch(() => ({
    weeks: [] as string[],
    months: [] as string[],
    latest: null,
  }));
  return [...manifest.weeks, ...manifest.months].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const period = parsePeriodSlug(slug);
  if (!period) return { title: 'Market report' };
  const canonical = siteUrl(`/market-reports/${slug}`);
  if (period.kind === 'week') {
    const range = weekRangeLabel(period);
    return {
      // Absolute title — opt out of the layout template so the brand
      // name isn't double-stamped on a string that already ends with it.
      title: { absolute: `The Market Desk · ${range} | Yong Choi` },
      description: `Phoenix metro supply pulse — weekly new-listing cadence + rolling averages for ${range}. Auto-generated from ARMLS listing data.`,
      alternates: { canonical },
      openGraph: {
        type: 'article',
        title: `The Market Desk · ${range}`,
        url: canonical,
        siteName: 'Yong Choi',
      },
      twitter: { card: 'summary_large_image', title: `The Market Desk · ${range}` },
    };
  }
  const label = monthLabel(period);
  return {
    title: { absolute: `${label} Market Read | Yong Choi` },
    description: `Yong Choi's ${label} read on the Phoenix luxury market — median price-per-sqft, days-on-market, transaction volume, and tier breakdown for the calendar month.`,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: `${label} Market Read`,
      url: canonical,
      siteName: 'Yong Choi',
    },
    twitter: { card: 'summary_large_image', title: `${label} Market Read` },
  };
}

export default async function MarketReportDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const period = parsePeriodSlug(slug);
  if (!period) notFound();

  const [statsResult, breakdown, trend] = await Promise.all([
    getPeriodStats(period),
    getTierBreakdown(period),
    getTrendSeries(period),
  ]);
  if (!statsResult) notFound();

  const canonical = siteUrl(`/market-reports/${slug}`);
  const breadcrumbName =
    period.kind === 'week' ? weekRangeLabel(period) : `${monthLabel(period)} read`;
  const breadcrumbs = breadcrumbListSchema([
    { name: 'Home', url: siteUrl('/') },
    { name: 'Market Reports', url: siteUrl('/market-reports') },
    { name: breadcrumbName, url: canonical },
  ]);

  if (statsResult.kind === 'week') {
    const bounds = weekBounds(period as Parameters<typeof weekBounds>[0]);
    return (
      <>
        <JsonLdScript data={breadcrumbs} />
        <WeeklyReport
          stats={{
            ...statsResult.stats,
            weekStart: bounds?.start ?? statsResult.stats.weekStart,
            weekEnd: bounds?.end ?? statsResult.stats.weekEnd,
          }}
          breakdown={breakdown}
          trend={trend}
        />
      </>
    );
  }

  // Monthly cadence — pull Yong's prose from the seed table.
  const proseEntry = getMonthlyProse(period.iso);
  const proseBody = proseEntry ? (
    <>
      {proseEntry.body.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </>
  ) : null;

  return (
    <>
      <JsonLdScript data={breadcrumbs} />
      <MonthlyReport
        stats={statsResult.stats}
        breakdown={breakdown}
        trend={trend}
        prose={proseBody}
        proseHeadline={proseEntry?.headline ?? null}
      />
    </>
  );
}
