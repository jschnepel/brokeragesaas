import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { siteUrl } from '@/lib/seo';
import { PhoenixSubnav } from '../components/PhoenixSubnav';
import {
  getTimingSummary,
  getSeasonalOverlay,
  getVelocityTrend,
  type TimingSummary,
  type SeasonalRow,
  type VelocityTrendPoint,
} from '../lib/timing-data';

export const metadata: Metadata = {
  title: 'Timing — Phoenix Market Intelligence',
  description:
    'Seasonality, year-over-year comparisons, and deal-velocity trends across the Phoenix metro.',
  alternates: { canonical: siteUrl('/phoenix/timing') },
};

export const revalidate = 3600;

function fmtMoney(n: number | null, opts: { compact?: boolean } = {}): string {
  if (n == null) return '—';
  if (opts.compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}
function fmtCount(n: number | null): string {
  if (n == null) return '—';
  return Math.round(n).toLocaleString();
}
function fmtPctNum(n: number | null, digits = 1): string {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}
function fmtMonth(iso: string): string {
  if (!iso) return '';
  const [y, m] = iso.split('-');
  const month = new Date(`${y}-${m}-01`).toLocaleString('en-US', { month: 'long' });
  return `${month} ${y}`;
}

function KpiCard({ label, value, sub, change }: {
  label: string;
  value: string;
  sub?: string;
  change?: number | null;
}) {
  const trendColor =
    change == null ? '' : change > 0 ? 'text-emerald-400' : change < 0 ? 'text-rose-400' : 'text-mute';
  return (
    <div
      className="border border-white/10 bg-[var(--color-ink-elevated)]/40 px-6 py-7 backdrop-blur-sm"
      style={{ borderRadius: 0 }}
    >
      <CapsLabel className="block mb-3">{label}</CapsLabel>
      <div className="font-serif text-stone text-[2.5rem] leading-none tracking-tight">
        {value}
      </div>
      <div className="mt-2 flex items-baseline gap-3 text-sm">
        {change != null && (
          <span className={`tabular-nums ${trendColor}`}>{fmtPctNum(change)}</span>
        )}
        {sub && <span className="text-mute">{sub}</span>}
      </div>
    </div>
  );
}

function HeroKpis({ summary }: { summary: TimingSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
      <KpiCard
        label="Best Month (last 12)"
        value={summary.bestMonth?.label ?? '—'}
        sub={`${fmtCount(summary.bestMonth?.closings ?? null)} closings`}
      />
      <KpiCard
        label="Slowest Month (last 12)"
        value={summary.worstMonth?.label ?? '—'}
        sub={`${fmtCount(summary.worstMonth?.closings ?? null)} closings`}
      />
      <KpiCard
        label={`Closings vs Prior Year (${fmtMonth(summary.currentMonthLabel)})`}
        value={fmtPctNum(summary.yoyClosingsPct)}
        change={summary.yoyClosingsPct}
        sub="YoY"
      />
      <KpiCard
        label="Median Close vs Prior Year"
        value={fmtPctNum(summary.yoyMedianClosePct)}
        change={summary.yoyMedianClosePct}
        sub="YoY"
      />
    </div>
  );
}

function SeasonalTable({ rows }: { rows: SeasonalRow[] }) {
  return (
    <div className="border border-white/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-[var(--color-ink-elevated)]/30">
            <th className="px-6 py-4"><CapsLabel>Month</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Current Closings</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Prior-Year Closings</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>YoY Δ</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Median Close (Cur)</CapsLabel></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const yoy = r.currentClosings != null && r.priorClosings != null && r.priorClosings > 0
              ? ((r.currentClosings - r.priorClosings) / r.priorClosings) * 100
              : null;
            const yoyClass =
              yoy == null ? 'text-mute' : yoy > 0 ? 'text-emerald-400' : yoy < 0 ? 'text-rose-400' : 'text-mute';
            return (
              <tr key={r.monthOfYear} className="border-b border-white/5 last:border-b-0">
                <td className="px-6 py-4 font-serif text-lg text-stone">{r.monthLabel}</td>
                <td className="px-6 py-4 text-right text-stone tabular-nums">{fmtCount(r.currentClosings)}</td>
                <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                  {fmtCount(r.priorClosings)}
                </td>
                <td className={`px-6 py-4 text-right tabular-nums ${yoyClass}`}>
                  {fmtPctNum(yoy)}
                </td>
                <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                  {fmtMoney(r.currentMedianClose)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VelocityTrendTable({ rows }: { rows: VelocityTrendPoint[] }) {
  return (
    <div className="border border-white/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-[var(--color-ink-elevated)]/30">
            <th className="px-6 py-4"><CapsLabel>Cohort Month</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Cohort Size</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Days to Pending</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Pending → Closed</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Confidence</CapsLabel></th>
          </tr>
        </thead>
        <tbody>
          {rows.slice().reverse().map((r) => (
            <tr key={r.month} className="border-b border-white/5 last:border-b-0">
              <td className="px-6 py-4 text-stone tabular-nums">{fmtMonth(r.month)}</td>
              <td className="px-6 py-4 text-right text-stone tabular-nums">{fmtCount(r.cohortSize)}</td>
              <td className="px-6 py-4 text-right text-stone tabular-nums">
                {r.medianDaysToPending != null ? `${Math.round(r.medianDaysToPending)} d` : '—'}
              </td>
              <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                {r.medianDaysPendingToClosed != null ? `${Math.round(r.medianDaysPendingToClosed)} d` : '—'}
              </td>
              <td className="px-6 py-4 text-right text-mute uppercase text-xs tracking-wider">
                {r.confidence ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PhoenixTimingPage() {
  const [summary, overlay, velocity] = await Promise.all([
    getTimingSummary(),
    getSeasonalOverlay(),
    getVelocityTrend(12),
  ]);

  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/market.jpg"
        kicker="Phoenix · Timing"
        headline="When the market"
        headlineItalic="moves."
        sub="Seasonality, year-over-year comparisons, and the velocity arc that tells buyers when to act."
      />
      <PhoenixSubnav current="/phoenix/timing" />
      <main>
        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10">
            <CapsLabel className="block mb-3">Year-Over-Year</CapsLabel>
            <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
              How this year stacks up
              <span className="italic font-light"> against last.</span>
            </h2>
          </div>
          <HeroKpis summary={summary} />
        </SectionFrame>

        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <CapsLabel className="block mb-3">Seasonality</CapsLabel>
              <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
                When buyers
                <span className="italic font-light"> actually close.</span>
              </h2>
            </div>
            <p className="text-mute max-w-md text-sm">
              Closings by calendar month, current 12-month period vs the
              prior 12. Spring (March–May) historically dominates; soak this
              up before timing a list.
            </p>
          </div>
          <SeasonalTable rows={overlay} />
        </SectionFrame>

        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <CapsLabel className="block mb-3">Velocity Trend</CapsLabel>
              <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
                How fast deals
                <span className="italic font-light"> reach contract.</span>
              </h2>
            </div>
            <p className="text-mute max-w-md text-sm">
              Median days to pending, by close-month cohort. Smaller cohorts
              (low confidence) get noisy — interpret accordingly.
            </p>
          </div>
          <VelocityTrendTable rows={velocity} />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
