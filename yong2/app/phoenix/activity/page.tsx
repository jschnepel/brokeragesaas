import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { siteUrl } from '@/lib/seo';
import { PhoenixSubnav } from '../components/PhoenixSubnav';
import {
  getActivitySnapshot,
  getClosingsByMonth,
  getTopBuyerOffices,
  getLatestBuyerOfficeYear,
  type ActivitySnapshot,
  type ClosingsMonth,
  type BuyerOfficeRanking,
} from '../lib/activity-data';

export const metadata: Metadata = {
  title: 'Activity — Phoenix Market Intelligence',
  description:
    'Closings, pending sales, days-to-pending velocity, and the most active buyer offices across the Phoenix metro.',
  alternates: { canonical: siteUrl('/phoenix/activity') },
};

export const revalidate = 3600;

function fmtMoney(n: number | null, opts: { compact?: boolean } = {}): string {
  if (n == null) return '—';
  if (opts.compact) {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}
function fmtCount(n: number | null): string {
  if (n == null) return '—';
  return Math.round(n).toLocaleString();
}
function fmtDays(n: number | null): string {
  if (n == null) return '—';
  return `${Math.round(n)} days`;
}
function fmtPctRaw(n: number | null, digits = 1): string {
  if (n == null) return '—';
  return `${n.toFixed(digits)}%`;
}
function fmtMonth(iso: string): string {
  if (!iso) return '';
  const [y, m] = iso.split('-');
  const month = new Date(`${y}-${m}-01`).toLocaleString('en-US', { month: 'long' });
  return `${month} ${y}`;
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="border border-white/10 bg-[var(--color-ink-elevated)]/40 px-6 py-7 backdrop-blur-sm"
      style={{ borderRadius: 0 }}
    >
      <CapsLabel className="block mb-3">{label}</CapsLabel>
      <div className="font-serif text-stone text-[2.5rem] leading-none tracking-tight">
        {value}
      </div>
      {sub && <div className="mt-2 text-sm text-mute">{sub}</div>}
    </div>
  );
}

function HeroKpis({ snap }: { snap: ActivitySnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
      <KpiCard
        label="Pending Sales"
        value={fmtCount(snap.pending)}
        sub="under contract right now"
      />
      <KpiCard
        label={`Closings (${fmtMonth(snap.latestMonthLabel)})`}
        value={fmtCount(snap.closingsLastMonth)}
        sub={`${fmtCount(snap.closingsLast3mo)} over last 3 months`}
      />
      <KpiCard
        label="3-Month Volume"
        value={fmtMoney(snap.totalVolumeLast3mo, { compact: true })}
        sub="aggregate close price"
      />
      <KpiCard
        label="% Back on Market"
        value={fmtPctRaw(snap.pctBackOnMarket)}
        sub={`cohort: ${fmtMonth(snap.velocityCohortMonth)}`}
      />
    </div>
  );
}

function VelocityKpis({ snap }: { snap: ActivitySnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
      <KpiCard
        label="Median Days to Pending"
        value={fmtDays(snap.medianDaysToPending)}
        sub="from list to under contract"
      />
      <KpiCard
        label="Median Days Pending → Closed"
        value={fmtDays(snap.medianDaysPendingToClosed)}
        sub="contract to close"
      />
      <KpiCard
        label="Median Days Active → Closed"
        value={fmtDays(snap.medianDaysActiveToClosed)}
        sub="full deal cycle"
      />
    </div>
  );
}

function ClosingsTable({ months }: { months: ClosingsMonth[] }) {
  return (
    <div className="border border-white/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-[var(--color-ink-elevated)]/30">
            <th className="px-6 py-4"><CapsLabel>Month</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Closings</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Median Close</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Total Volume</CapsLabel></th>
          </tr>
        </thead>
        <tbody>
          {months.slice().reverse().map((m) => (
            <tr key={m.month} className="border-b border-white/5 last:border-b-0">
              <td className="px-6 py-4 text-stone tabular-nums">{fmtMonth(m.month)}</td>
              <td className="px-6 py-4 text-right text-stone tabular-nums">{fmtCount(m.closings)}</td>
              <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                {fmtMoney(m.medianClose)}
              </td>
              <td className="px-6 py-4 text-right text-gold tabular-nums">
                {fmtMoney(m.totalVolume, { compact: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BuyerOfficeTable({ rows, year }: { rows: BuyerOfficeRanking[]; year: number }) {
  return (
    <div className="border border-white/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-[var(--color-ink-elevated)]/30">
            <th className="px-6 py-4"><CapsLabel>Office ({year})</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Buyer Deals</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Median Close</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Median DOM</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Total Volume</CapsLabel></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.office}-${i}`} className="border-b border-white/5 last:border-b-0">
              <td className="px-6 py-4 font-serif text-lg text-stone">{r.office}</td>
              <td className="px-6 py-4 text-right text-stone tabular-nums">{fmtCount(r.deals)}</td>
              <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                {fmtMoney(r.medianClose)}
              </td>
              <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                {r.medianDom != null ? Math.round(r.medianDom) : '—'}
              </td>
              <td className="px-6 py-4 text-right text-gold tabular-nums">
                {fmtMoney(r.totalVolume, { compact: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PhoenixActivityPage() {
  const [snap, months, offices, year] = await Promise.all([
    getActivitySnapshot(),
    getClosingsByMonth(12),
    getTopBuyerOffices(10),
    getLatestBuyerOfficeYear(),
  ]);

  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/market.jpg"
        kicker="Phoenix · Activity"
        headline="Where deals"
        headlineItalic="are moving."
        sub="Closings, pending sales, deal velocity, and the brokers winning the most contracts."
      />
      <PhoenixSubnav current="/phoenix/activity" />
      <main>
        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10">
            <CapsLabel className="block mb-3">Activity Snapshot</CapsLabel>
            <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
              The pulse of
              <span className="italic font-light"> the market.</span>
            </h2>
          </div>
          <HeroKpis snap={snap} />
        </SectionFrame>

        <SectionFrame className="pb-16 md:pb-20">
          <div className="mb-8">
            <CapsLabel className="block mb-2">Deal Velocity</CapsLabel>
            <p className="text-mute text-sm">
              Median time from list → pending → closed for the latest reliable cohort
              ({fmtMonth(snap.velocityCohortMonth)}).
            </p>
          </div>
          <VelocityKpis snap={snap} />
        </SectionFrame>

        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <CapsLabel className="block mb-3">Monthly Closings</CapsLabel>
              <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
                The closing tape,
                <span className="italic font-light"> month by month.</span>
              </h2>
            </div>
            <p className="text-mute max-w-md text-sm">
              Last 12 months of closed transactions across the metro.
              Total volume aggregates every close-price.
            </p>
          </div>
          <ClosingsTable months={months} />
        </SectionFrame>

        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <CapsLabel className="block mb-3">Buyer Offices</CapsLabel>
              <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
                Top 10 brokers
                <span className="italic font-light"> by buyer-side deals.</span>
              </h2>
            </div>
            <p className="text-mute max-w-md text-sm">
              Brokerages representing the most buyers across the calendar year.
              Volume is total close-price across the office's buyer-side deals.
            </p>
          </div>
          <BuyerOfficeTable rows={offices} year={year} />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
