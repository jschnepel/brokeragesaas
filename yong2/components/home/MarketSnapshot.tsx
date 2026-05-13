import Link from 'next/link';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';
import {
  getMonthlyStats,
  getWeeklyStats,
  listAvailablePeriods,
  monthLabel,
  parsePeriodSlug,
  weekRangeLabel,
  type Period,
} from '@/lib/market-reports';

/**
 * Homepage market-intelligence snapshot — surfaces the strongest
 * content asset (Market Reports) above the inventory fold rather
 * than burying it as nav item 4.
 *
 * Single source of truth: every number rendered here is pulled from
 * the same `lib/market-reports.ts` functions that drive
 * /market-reports and its detail pages. The lib has per-Lambda
 * in-memory caching on top of CloudFront's per-edge cache, so the
 * homepage's added parquet fetches are effectively free after the
 * first cold call in any given Lambda instance.
 *
 * Layout: two cards side-by-side — "This week" (supply pulse from
 * `getWeeklyStats`) + "This month" (Yong's editorial read from
 * `getMonthlyStats`). Mirrors the "At a glance" cards on
 * /market-reports so a visitor who clicks through finds the same
 * shape, just expanded.
 *
 * Empty-state: if `listAvailablePeriods()` returns no published
 * periods (extremely unlikely outside of a parquet outage), the
 * module renders nothing rather than empty tiles. The page flow
 * collapses cleanly.
 */
export async function MarketSnapshot() {
  const manifest = await listAvailablePeriods().catch(() => ({
    weeks: [] as string[],
    months: [] as string[],
    latest: null as Period | null,
  }));

  const latestWeekSlug = manifest.weeks[0] ?? null;
  const latestMonthSlug = manifest.months[0] ?? null;
  const latestWeek = latestWeekSlug ? parsePeriodSlug(latestWeekSlug) : null;
  const latestMonth = latestMonthSlug ? parsePeriodSlug(latestMonthSlug) : null;

  const [weekStats, monthStats] = await Promise.all([
    latestWeek?.kind === 'week' ? getWeeklyStats(latestWeek).catch(() => null) : null,
    latestMonth?.kind === 'month' ? getMonthlyStats(latestMonth).catch(() => null) : null,
  ]);

  // If neither cadence has shipped a published period yet, suppress
  // the module entirely — better than a half-empty placeholder.
  if (!weekStats && !monthStats) return null;

  return (
    <SectionFrame className="py-20 md:py-28 border-t border-white/5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <CapsLabel as="div">The Market</CapsLabel>
          <h2 className="display-lg mt-4 text-balance text-stone max-w-2xl">
            Where the Valley stands, this week and this month.
          </h2>
        </div>
        <Link
          href="/market-reports"
          className="caps inline-flex items-center gap-3 text-stone/75 hover:text-gold transition-colors self-start md:self-auto"
        >
          <span>Read the full reports</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {weekStats && latestWeek?.kind === 'week' ? (
          <WeekCard
            period={latestWeek}
            newListings={weekStats.newListings}
            yoyPct={weekStats.yoy?.newListings ?? null}
            wowPct={weekStats.wow?.newListings ?? null}
          />
        ) : null}
        {monthStats && latestMonth?.kind === 'month' ? (
          <MonthCard
            period={latestMonth}
            medianPpsf={monthStats.medianPpsf}
            medianDom={monthStats.medianDom}
            monthsSupply={monthStats.monthsSupply12mo}
            yoyPpsfPct={monthStats.yoy?.medianPpsf ?? null}
          />
        ) : null}
      </div>
    </SectionFrame>
  );
}

// ───────── Cards ─────────

function WeekCard({
  period,
  newListings,
  wowPct,
  yoyPct,
}: {
  period: Period & { kind: 'week' };
  newListings: number;
  wowPct: number | null;
  yoyPct: number | null;
}) {
  return (
    <Link
      href={`/market-reports/${period.iso}`}
      className="group block bg-ink-elevated/30 border border-white/5 hover:border-gold/40 transition-colors duration-300 p-7 md:p-9"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">
          This week · supply pulse
        </p>
        <p className="caps text-[10px] text-stone/40 tracking-[0.32em]">
          {weekRangeLabel(period)}
        </p>
      </div>
      <div className="mt-6 flex items-baseline gap-3">
        <p
          className="font-serif text-gold tabular-nums leading-none"
          style={{ fontSize: 'clamp(44px, 5vw, 64px)' }}
        >
          {newListings.toLocaleString()}
        </p>
        <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">new listings</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <DeltaLabel label="WoW" pct={wowPct} />
        <DeltaLabel label="YoY" pct={yoyPct} />
      </div>
      <p className="mt-7 caps text-[10px] text-gold/80 group-hover:text-gold transition-colors inline-flex items-center gap-2">
        Read the weekly <span aria-hidden="true">→</span>
      </p>
    </Link>
  );
}

function MonthCard({
  period,
  medianPpsf,
  medianDom,
  monthsSupply,
  yoyPpsfPct,
}: {
  period: Period & { kind: 'month' };
  medianPpsf: number | null;
  medianDom: number | null;
  monthsSupply: number | null;
  yoyPpsfPct: number | null;
}) {
  return (
    <Link
      href={`/market-reports/${period.iso}`}
      className="group block bg-ink-elevated/30 border border-white/5 hover:border-gold/40 transition-colors duration-300 p-7 md:p-9"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">
          This month · editorial read
        </p>
        <p className="caps text-[10px] text-stone/40 tracking-[0.32em]">{monthLabel(period)}</p>
      </div>
      <div className="mt-6 flex items-baseline gap-3">
        <p
          className="font-serif text-gold tabular-nums leading-none"
          style={{ fontSize: 'clamp(44px, 5vw, 64px)' }}
        >
          {medianPpsf != null ? `$${medianPpsf.toLocaleString('en-US')}` : '—'}
        </p>
        <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">median per sqft</p>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-4">
        <MiniStat label="YoY" value={yoyPpsfPct != null ? formatSignedPct(yoyPpsfPct) : null} />
        <MiniStat
          label="Median DOM"
          value={medianDom != null ? `${Math.round(medianDom)}d` : null}
        />
        <MiniStat
          label="Months supply"
          value={monthsSupply != null ? monthsSupply.toFixed(1) : null}
        />
      </div>
      <p className="mt-7 caps text-[10px] text-gold/80 group-hover:text-gold transition-colors inline-flex items-center gap-2">
        Read the monthly <span aria-hidden="true">→</span>
      </p>
    </Link>
  );
}

// ───────── Helpers ─────────

function DeltaLabel({ label, pct }: { label: string; pct: number | null }) {
  if (pct == null || !Number.isFinite(pct)) {
    return (
      <span className="caps text-[10px] tracking-[0.25em] text-stone/40">
        {label} · —
      </span>
    );
  }
  const flat = Math.abs(pct) < 0.1;
  const arrow = flat ? '·' : pct > 0 ? '↑' : '↓';
  return (
    <span className="caps text-[10px] tracking-[0.25em] text-stone/75 inline-flex items-baseline gap-1">
      <span aria-hidden="true">{arrow}</span>
      <span className="tabular-nums">{formatSignedPct(pct)}</span>
      <span className="text-stone/40">{label}</span>
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="caps text-[9px] tracking-[0.3em] text-stone/45">{label}</p>
      <p className="mt-1.5 font-serif text-stone tabular-nums leading-none text-lg md:text-xl">
        {value ?? <span className="text-stone/40">—</span>}
      </p>
    </div>
  );
}

function formatSignedPct(pct: number): string {
  if (Math.abs(pct) < 0.1) return '0.0%';
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
}
