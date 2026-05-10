import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { siteUrl } from '@/lib/seo';
import { PhoenixSubnav } from '../components/PhoenixSubnav';
import {
  getInventorySnapshot,
  getPaceWeeks,
  getDomDistribution,
  type InventorySnapshot,
  type PaceWeek,
  type DomBucket,
} from '../lib/inventory-data';

export const metadata: Metadata = {
  title: 'Inventory — Phoenix Market Intelligence',
  description:
    'Active listings, pending sales, months of supply, new-listing pace, and days-on-market distribution across the Phoenix metro.',
  alternates: { canonical: siteUrl('/phoenix/inventory') },
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
function fmtMonths(n: number | null): string {
  if (n == null) return '—';
  return `${n.toFixed(1)} mo`;
}
function fmtPctNum(n: number | null, digits = 1): string {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}
function classifyColor(c: string | null): string {
  switch (c) {
    case 'sellers':  return 'text-emerald-400';
    case 'balanced': return 'text-stone';
    case 'buyers':   return 'text-rose-400';
    default:         return 'text-mute';
  }
}
function classifyLabel(c: string | null): string {
  switch (c) {
    case 'sellers':  return "Seller's Market";
    case 'balanced': return 'Balanced';
    case 'buyers':   return "Buyer's Market";
    default:         return '—';
  }
}
function fmtWeek(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function KpiCard({ label, value, sub, valueClass }: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div
      className="border border-white/10 bg-[var(--color-ink-elevated)]/40 px-6 py-7 backdrop-blur-sm"
      style={{ borderRadius: 0 }}
    >
      <CapsLabel className="block mb-3">{label}</CapsLabel>
      <div className={`font-serif text-[2.5rem] leading-none tracking-tight ${valueClass ?? 'text-stone'}`}>
        {value}
      </div>
      {sub && <div className="mt-2 text-sm text-mute">{sub}</div>}
    </div>
  );
}

function HeroKpis({ snap }: { snap: InventorySnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
      <KpiCard
        label="Total Active Inventory"
        value={fmtCount(snap.totalActive)}
        sub={`${fmtCount(snap.strictActive)} active · ${fmtCount(snap.pending)} pending · ${fmtCount(snap.comingSoon)} coming soon`}
      />
      <KpiCard
        label="Months of Supply (3mo)"
        value={fmtMonths(snap.monthsOfSupply3mo)}
        sub="recent absorption pace"
      />
      <KpiCard
        label="Market Classification"
        value={classifyLabel(snap.marketClassification)}
        sub={`MoS 12mo: ${fmtMonths(snap.monthsOfSupply12mo)}`}
        valueClass={`font-serif ${classifyColor(snap.marketClassification)}`}
      />
      <KpiCard
        label="Avg Closings / Month (3mo)"
        value={fmtCount(snap.avgMonthlyClosings3mo)}
        sub={`12mo avg: ${fmtCount(snap.avgMonthlyClosings12mo)}`}
      />
    </div>
  );
}

function SecondaryKpis({ snap }: { snap: InventorySnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
      <KpiCard
        label="Median List Price"
        value={fmtMoney(snap.medianListPrice)}
        sub="active inventory"
      />
      <KpiCard
        label="Median List $/SqFt"
        value={snap.medianPpsf != null ? `$${Math.round(snap.medianPpsf)}` : '—'}
        sub="active inventory"
      />
      <KpiCard
        label="Median DOM"
        value={snap.medianDom != null ? `${Math.round(snap.medianDom)}` : '—'}
        sub="active inventory"
      />
    </div>
  );
}

function DomTable({ buckets }: { buckets: DomBucket[] }) {
  const total = buckets.reduce((s, b) => s + b.count, 0);
  return (
    <div className="border border-white/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-[var(--color-ink-elevated)]/30">
            <th className="px-6 py-4"><CapsLabel>DOM Band</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Active</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>% of Total</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Mean List</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Median $/SqFt</CapsLabel></th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.band} className="border-b border-white/5 last:border-b-0">
              <td className="px-6 py-4 font-serif text-lg text-stone">{b.band} days</td>
              <td className="px-6 py-4 text-right text-stone tabular-nums">{fmtCount(b.count)}</td>
              <td className="px-6 py-4 text-right text-gold tabular-nums">
                {total > 0 ? `${((b.count / total) * 100).toFixed(1)}%` : '—'}
              </td>
              <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                {fmtMoney(b.meanListPrice, { compact: true })}
              </td>
              <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                {b.medianPpsf != null ? `$${Math.round(b.medianPpsf)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaceTable({ weeks }: { weeks: PaceWeek[] }) {
  return (
    <div className="border border-white/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-[var(--color-ink-elevated)]/30">
            <th className="px-6 py-4"><CapsLabel>Week of</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>New Listings</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>4-Wk Avg</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>52-Wk Avg</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>vs 52-Wk</CapsLabel></th>
          </tr>
        </thead>
        <tbody>
          {weeks.slice().reverse().map((w) => (
            <tr key={w.week} className="border-b border-white/5 last:border-b-0">
              <td className="px-6 py-4 text-stone tabular-nums">{fmtWeek(w.week)}</td>
              <td className="px-6 py-4 text-right text-stone tabular-nums">{fmtCount(w.newListings)}</td>
              <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                {w.fourWkAvg != null ? Math.round(w.fourWkAvg).toLocaleString() : '—'}
              </td>
              <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                {w.fiftyTwoWkAvg != null ? Math.round(w.fiftyTwoWkAvg).toLocaleString() : '—'}
              </td>
              <td className={`px-6 py-4 text-right tabular-nums ${w.pctVs52 != null && w.pctVs52 > 0 ? 'text-emerald-400' : w.pctVs52 != null && w.pctVs52 < 0 ? 'text-rose-400' : 'text-mute'}`}>
                {fmtPctNum(w.pctVs52)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PhoenixInventoryPage() {
  const [snap, weeks, dom] = await Promise.all([
    getInventorySnapshot(),
    getPaceWeeks(12),
    getDomDistribution(),
  ]);

  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/market.jpg"
        kicker="Phoenix · Inventory"
        headline="What's available,"
        headlineItalic="and how fresh."
        sub="Active listings, months of supply, new-listing pace, and the days-on-market distribution."
      />
      <PhoenixSubnav current="/phoenix/inventory" />
      <main>
        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10">
            <CapsLabel className="block mb-3">Supply Snapshot</CapsLabel>
            <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
              The shape of
              <span className="italic font-light"> the market.</span>
            </h2>
          </div>
          <HeroKpis snap={snap} />
        </SectionFrame>

        <SectionFrame className="pb-16 md:pb-20">
          <SecondaryKpis snap={snap} />
        </SectionFrame>

        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <CapsLabel className="block mb-3">Days on Market</CapsLabel>
              <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
                How long listings
                <span className="italic font-light"> have been waiting.</span>
              </h2>
            </div>
            <p className="text-mute max-w-md text-sm">
              Active inventory bucketed by days on market.
              The freshest tier (0–7 days) includes Coming Soon listings.
            </p>
          </div>
          <DomTable buckets={dom} />
        </SectionFrame>

        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <CapsLabel className="block mb-3">Listing Pace</CapsLabel>
              <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
                The flow of
                <span className="italic font-light"> new supply.</span>
              </h2>
            </div>
            <p className="text-mute max-w-md text-sm">
              Weekly new-listing count vs the 4-week and 52-week averages.
              "vs 52-Wk" measures seasonality-adjusted change.
            </p>
          </div>
          <PaceTable weeks={weeks} />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
