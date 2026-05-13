import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { PageHero } from '@/components/shared/PageHero';
import { SectionFrame } from '@/components/shared/SectionFrame';
import {
  type Period,
  type WeeklyStats,
  type MonthlyStats,
  getMonthlyStats,
  getTierBreakdown,
  getTrendSeries,
  getWeeklyStats,
  listAvailablePeriods,
  monthLabel,
  parsePeriodSlug,
  weekRangeLabel,
} from '@/lib/market-reports';
import { siteContent } from '@/content/site';
import { siteUrl } from '@/lib/seo';
import { StatTile } from '@/components/market-reports/StatTile';
import { TierBreakdownSection } from '@/components/market-reports/TierBreakdown';
import { TrendChart } from '@/components/market-reports/TrendChart';
import { MethodologyBlock } from '@/components/market-reports/MethodologyBlock';

// ISR — hourly. The index page is the entry point for both cadences;
// rebuilding hourly keeps the "latest period" hero accurate as new
// Tuesday-AM weekly + 15th-of-month monthly cadences publish.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: `Market Reports · ${siteContent.brand.name}` },
  description: `Weekly supply pulse and monthly editorial market reads for the Phoenix luxury market — authored by ${siteContent.brand.name} of Russ Lyon Sotheby's International Realty.`,
  alternates: { canonical: siteUrl('/market-reports') },
};

type SearchParams = Promise<{ view?: string }>;

const DOLLAR = (n: number | null | undefined) =>
  n != null && Number.isFinite(n) ? `$${Math.round(n).toLocaleString()}` : null;

export default async function MarketReportsIndex({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  const view: 'weekly' | 'monthly' = params.view === 'weekly' ? 'weekly' : 'monthly';

  const manifest = await listAvailablePeriods().catch(() => ({
    weeks: [] as string[],
    months: [] as string[],
    latest: null as Period | null,
  }));

  const latestWeekSlug = manifest.weeks[0] ?? null;
  const latestMonthSlug = manifest.months[0] ?? null;
  const latestWeek = latestWeekSlug ? parsePeriodSlug(latestWeekSlug) : null;
  const latestMonth = latestMonthSlug ? parsePeriodSlug(latestMonthSlug) : null;

  const [
    weekStats,
    monthStats,
    tierBreakdown,
    monthlyTrend,
  ] = await Promise.all([
    latestWeek?.kind === 'week' ? getWeeklyStats(latestWeek) : Promise.resolve(null),
    latestMonth?.kind === 'month' ? getMonthlyStats(latestMonth) : Promise.resolve(null),
    manifest.latest ? getTierBreakdown(manifest.latest) : Promise.resolve(null),
    latestMonth?.kind === 'month' ? getTrendSeries(latestMonth) : Promise.resolve(null),
  ]);

  const featured: FeaturedHero | null = (() => {
    if (manifest.latest?.kind === 'week' && weekStats) {
      return { kind: 'week', stats: weekStats };
    }
    if (manifest.latest?.kind === 'month' && monthStats) {
      return { kind: 'month', stats: monthStats };
    }
    if (monthStats) return { kind: 'month', stats: monthStats };
    if (weekStats) return { kind: 'week', stats: weekStats };
    return null;
  })();

  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/market.jpg"
        kicker="Market Reports"
        headline="The desk"
        headlineItalic="reads the market."
        sub="Weekly supply pulse on Tuesdays. Yong's editorial read on the 15th. Both grounded in ARMLS data."
      />
      <main className="bg-ink text-stone">
        {/* ── 1. HERO BLOCK — latest published period ──────────── */}
        {featured ? <HeroBlock featured={featured} /> : <NoDataHero />}

        {/* ── 2. SNAPSHOT CARDS — this week + this month ───────── */}
        {(weekStats || monthStats) && (
          <SectionFrame className="py-16 md:py-20 border-t border-[color:var(--hairline)]">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-4" />
                <p className="caps">At a glance</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {weekStats && latestWeek?.kind === 'week' ? (
                <WeekSnapshotCard stats={weekStats} period={latestWeek} />
              ) : null}
              {monthStats && latestMonth?.kind === 'month' ? (
                <MonthSnapshotCard stats={monthStats} period={latestMonth} />
              ) : null}
            </div>
          </SectionFrame>
        )}

        {/* ── 3. TWELVE-MONTH BANNER — PPSF trend ──────────────── */}
        {monthlyTrend ? (
          <SectionFrame className="py-16 md:py-20 border-t border-[color:var(--hairline)]">
            <div className="mb-10 md:mb-14">
              <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
              <p className="caps">Twelve-month read</p>
              <h2 className="display-lg mt-4 text-stone tracking-[-0.005em] max-w-2xl">
                Median price per sqft, Phoenix metro.
              </h2>
            </div>
            <TrendChart series={monthlyTrend} />
          </SectionFrame>
        ) : null}

        {/* ── 4. THREE-TIER BREAKDOWN ──────────────────────────── */}
        <TierBreakdownSection breakdown={tierBreakdown} />

        {/* ── 5. METHODOLOGY ──────────────────────────────────── */}
        <MethodologyBlock />

        {/* ── 6. ARCHIVE TABS ─────────────────────────────────── */}
        <ArchiveSection manifest={manifest} view={view} />
      </main>
      <Footer />
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Section components — server components, no hooks.
// ──────────────────────────────────────────────────────────────

type FeaturedHero =
  | { kind: 'week'; stats: WeeklyStats }
  | { kind: 'month'; stats: MonthlyStats };

function HeroBlock({ featured }: { featured: FeaturedHero }) {
  if (featured.kind === 'week') {
    const range = weekRangeLabel(featured.stats.period);
    const newListings = featured.stats.newListings;
    const yoy = featured.stats.yoy?.newListings ?? null;
    return (
      <SectionFrame className="py-20 md:py-28">
        <p className="caps text-[10px] text-gold tracking-[0.32em]">The Market Desk</p>
        <h2 className="display-xl mt-4 text-stone tracking-[-0.005em]">{range}</h2>
        <div className="mt-10 flex flex-col md:flex-row md:items-end gap-8 md:gap-12">
          <div>
            <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">New listings · weekly</p>
            <p
              className="font-serif text-gold tabular-nums leading-none mt-3"
              style={{ fontSize: 'clamp(56px, 6vw, 88px)' }}
            >
              {newListings.toLocaleString()}
            </p>
          </div>
          {yoy != null ? (
            <div>
              <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">YoY change</p>
              <p
                className="font-serif tabular-nums leading-none mt-3 text-stone"
                style={{ fontSize: 'clamp(32px, 3.6vw, 48px)' }}
              >
                {yoy > 0 ? '+' : ''}
                {yoy.toFixed(1)}%
              </p>
            </div>
          ) : null}
          <div className="md:ml-auto">
            <Link
              href={`/market-reports/${featured.stats.period.iso}`}
              className="caps inline-flex items-center gap-3 bg-gold text-ink px-7 py-4 hover:bg-[color:var(--gold-muted)] transition-colors"
            >
              <span>Read the weekly</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </SectionFrame>
    );
  }
  // Monthly hero
  const label = monthLabel(featured.stats.period);
  const ppsf = featured.stats.medianPpsf;
  const yoyPpsf = featured.stats.yoy?.medianPpsf ?? null;
  return (
    <SectionFrame className="py-20 md:py-28">
      <p className="caps text-[10px] text-gold tracking-[0.32em]">Yong&rsquo;s Monthly Read</p>
      <h2 className="display-xl mt-4 text-stone tracking-[-0.005em]">{label}</h2>
      <div className="mt-10 flex flex-col md:flex-row md:items-end gap-8 md:gap-12">
        <div>
          <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">Median price · per sqft</p>
          <p
            className="font-serif text-gold tabular-nums leading-none mt-3"
            style={{ fontSize: 'clamp(56px, 6vw, 88px)' }}
          >
            {DOLLAR(ppsf) ?? '—'}
          </p>
        </div>
        {yoyPpsf != null ? (
          <div>
            <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">YoY change</p>
            <p
              className="font-serif tabular-nums leading-none mt-3 text-stone"
              style={{ fontSize: 'clamp(32px, 3.6vw, 48px)' }}
            >
              {yoyPpsf > 0 ? '+' : ''}
              {yoyPpsf.toFixed(1)}%
            </p>
          </div>
        ) : null}
        <div className="md:ml-auto">
          <Link
            href={`/market-reports/${featured.stats.period.iso}`}
            className="caps inline-flex items-center gap-3 bg-gold text-ink px-7 py-4 hover:bg-[color:var(--gold-muted)] transition-colors"
          >
            <span>Read the monthly</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </SectionFrame>
  );
}

function NoDataHero() {
  return (
    <SectionFrame className="py-20 md:py-28">
      <p className="caps text-[10px] text-gold tracking-[0.32em]">Market Reports</p>
      <h2 className="display-xl mt-4 text-stone tracking-[-0.005em]">
        First read publishing soon.
      </h2>
      <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-stone/80">
        Weekly supply-pulse reports publish Tuesday mornings. Monthly editorial reads publish on the
        15th. The first cycle lands as the parquet feed catches up.
      </p>
    </SectionFrame>
  );
}

function WeekSnapshotCard({
  stats,
  period,
}: {
  stats: WeeklyStats;
  period: Period & { kind: 'week' };
}) {
  return (
    <Link
      href={`/market-reports/${period.iso}`}
      className="group block bg-ink-elevated/30 border border-white/5 hover:border-gold/40 transition-colors duration-300 p-7 md:p-9"
    >
      <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">This week · supply pulse</p>
      <h3 className="font-serif text-stone group-hover:text-gold transition-colors mt-3 text-2xl md:text-3xl leading-tight">
        {weekRangeLabel(period)}
      </h3>
      <div className="mt-8 grid grid-cols-3 gap-6">
        <StatTile label="New listings" value={stats.newListings.toLocaleString()} />
        <StatTile
          label="WoW"
          value={
            stats.wow?.newListings != null
              ? `${stats.wow.newListings > 0 ? '+' : ''}${stats.wow.newListings.toFixed(1)}%`
              : null
          }
        />
        <StatTile
          label="YoY"
          value={
            stats.yoy?.newListings != null
              ? `${stats.yoy.newListings > 0 ? '+' : ''}${stats.yoy.newListings.toFixed(1)}%`
              : null
          }
        />
      </div>
      <p className="mt-6 caps text-[10px] text-gold/80 group-hover:text-gold transition-colors inline-flex items-center gap-2">
        Read the weekly <span aria-hidden="true">→</span>
      </p>
    </Link>
  );
}

function MonthSnapshotCard({
  stats,
  period,
}: {
  stats: MonthlyStats;
  period: Period & { kind: 'month' };
}) {
  return (
    <Link
      href={`/market-reports/${period.iso}`}
      className="group block bg-ink-elevated/30 border border-white/5 hover:border-gold/40 transition-colors duration-300 p-7 md:p-9"
    >
      <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">This month · editorial read</p>
      <h3 className="font-serif text-stone group-hover:text-gold transition-colors mt-3 text-2xl md:text-3xl leading-tight">
        {monthLabel(period)}
      </h3>
      <div className="mt-8 grid grid-cols-3 gap-6">
        <StatTile label="Median PPSF" value={DOLLAR(stats.medianPpsf)} />
        <StatTile
          label="MoM"
          value={
            stats.mom?.medianPpsf != null
              ? `${stats.mom.medianPpsf > 0 ? '+' : ''}${stats.mom.medianPpsf.toFixed(1)}%`
              : null
          }
        />
        <StatTile
          label="YoY"
          value={
            stats.yoy?.medianPpsf != null
              ? `${stats.yoy.medianPpsf > 0 ? '+' : ''}${stats.yoy.medianPpsf.toFixed(1)}%`
              : null
          }
        />
      </div>
      <p className="mt-6 caps text-[10px] text-gold/80 group-hover:text-gold transition-colors inline-flex items-center gap-2">
        Read the monthly <span aria-hidden="true">→</span>
      </p>
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────
// Archive tabs — server-rendered, ?view=weekly|monthly
// ──────────────────────────────────────────────────────────────

interface ArchiveSectionProps {
  manifest: { weeks: string[]; months: string[]; latest: Period | null };
  view: 'weekly' | 'monthly';
}

function ArchiveSection({ manifest, view }: ArchiveSectionProps) {
  const slugs = view === 'weekly' ? manifest.weeks : manifest.months;
  return (
    <SectionFrame className="py-20 md:py-24 border-t border-[color:var(--hairline)]">
      <div className="mb-12">
        <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
        <p className="caps">Archive</p>
        <h2 className="display-lg mt-4 text-stone tracking-[-0.005em]">All published reads.</h2>
      </div>

      <div className="flex flex-wrap items-baseline gap-2 mb-10" role="tablist" aria-label="Archive view">
        <ArchiveTab
          href="/market-reports?view=monthly"
          active={view === 'monthly'}
          label="Monthly archive"
          count={manifest.months.length}
        />
        <ArchiveTab
          href="/market-reports?view=weekly"
          active={view === 'weekly'}
          label="Weekly archive"
          count={manifest.weeks.length}
        />
      </div>

      {slugs.length === 0 ? (
        <p className="text-sm text-stone/55 italic">No published periods in this cadence yet.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slugs.map((slug) => {
            const period = parsePeriodSlug(slug);
            if (!period) return null;
            const labelText =
              period.kind === 'week' ? weekRangeLabel(period) : monthLabel(period);
            const cadenceTag = period.kind === 'week' ? 'Weekly' : 'Monthly';
            return (
              <li key={slug}>
                <Link
                  href={`/market-reports/${slug}`}
                  className="group block border border-white/5 hover:border-gold/40 transition-colors duration-300 p-5 md:p-6"
                >
                  <p className="caps text-[10px] text-stone/45 tracking-[0.32em]">{cadenceTag}</p>
                  <p className="font-serif text-stone group-hover:text-gold transition-colors mt-2 text-lg leading-tight">
                    {labelText}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SectionFrame>
  );
}

function ArchiveTab({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      role="tab"
      aria-selected={active}
      href={href}
      className={`caps text-[10px] tracking-[0.32em] px-4 py-2 border transition-colors ${
        active
          ? 'bg-gold text-ink border-gold'
          : 'border-[color:var(--hairline)] text-stone/75 hover:border-gold hover:text-gold'
      }`}
    >
      {label} ({count})
    </Link>
  );
}
