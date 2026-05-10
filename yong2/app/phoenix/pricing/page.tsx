import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { siteUrl } from '@/lib/seo';
import { PhoenixSubnav } from '../components/PhoenixSubnav';
import {
  getPricingSnapshot,
  getPriceTrends,
  getActiveByPriceTier,
  type PricingSnapshot,
  type PriceTrendPoint,
  type PriceTier,
} from '../lib/pricing-data';

export const metadata: Metadata = {
  title: 'Pricing — Phoenix Market Intelligence',
  description:
    'Median sale price, $/sqft, list-to-sale ratio, and price reduction patterns across the Phoenix metro.',
  alternates: { canonical: siteUrl('/phoenix/pricing') },
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

function fmtPctNum(n: number | null, digits = 1): string {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

function fmtPctRaw(n: number | null, digits = 1): string {
  if (n == null) return '—';
  return `${n.toFixed(digits)}%`;
}

function fmtRatio(n: number | null): string {
  // dbt mart stores list-to-sale as decimal (e.g., 0.978 = 97.8%). Some MV
  // versions store as percentage already. Auto-detect and normalize.
  if (n == null) return '—';
  const pct = n > 2 ? n : n * 100;
  return `${pct.toFixed(1)}%`;
}

function fmtMonth(iso: string): string {
  if (!iso) return '';
  const [y, m] = iso.split('-');
  const month = new Date(`${y}-${m}-01`).toLocaleString('en-US', { month: 'long' });
  return `${month} ${y}`;
}

function fmtBand(band: string): string {
  return band
    .replace(/_plus$/, '+')
    .replace(/_/g, '–')
    .replace(/k/g, 'K')
    .replace(/m/g, 'M')
    .replace('under–', 'Under $')
    .replace(/^(\d)/, '$$$1');
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

function HeroKpiStrip({ snap }: { snap: PricingSnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
      <KpiCard
        label={`Median Close (${fmtMonth(snap.latestMonthLabel)})`}
        value={fmtMoney(snap.medianClose)}
        change={snap.medianCloseYoyPct}
        sub="YoY"
      />
      <KpiCard
        label="Median $/SqFt"
        value={snap.medianPpsf != null ? `$${Math.round(snap.medianPpsf)}` : '—'}
        change={snap.medianPpsfYoyPct}
        sub="YoY"
      />
      <KpiCard
        label="List-to-Sale Ratio"
        value={fmtRatio(snap.listToSale)}
        sub="median, latest cohort"
      />
      <KpiCard
        label="% Above List"
        value={fmtPctRaw(snap.pctAboveList)}
        sub="latest cohort"
      />
    </div>
  );
}

function SecondaryKpiStrip({ snap }: { snap: PricingSnapshot }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
      <KpiCard
        label="% Below List"
        value={fmtPctRaw(snap.pctBelowList)}
        sub="latest cohort"
      />
      <KpiCard
        label="% With Price Cut"
        value={fmtPctRaw(snap.pctWithReduction)}
        sub="of listings closed"
      />
      <KpiCard
        label="Avg Reduction"
        value={fmtMoney(snap.meanReduction)}
        sub="when reduced"
      />
      <KpiCard
        label="Net Negotiation"
        value={
          snap.pctBelowList != null && snap.pctAboveList != null
            ? fmtPctNum(snap.pctAboveList - snap.pctBelowList)
            : '—'
        }
        sub="above − below"
      />
    </div>
  );
}

function PriceTrendsTable({ rows }: { rows: PriceTrendPoint[] }) {
  return (
    <div className="border border-white/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-[var(--color-ink-elevated)]/30">
            <th className="px-6 py-4"><CapsLabel>Month</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Closings</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Median Close</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Median $/SqFt</CapsLabel></th>
          </tr>
        </thead>
        <tbody>
          {rows
            .slice()
            .reverse()
            .map((r) => (
              <tr key={r.month} className="border-b border-white/5 last:border-b-0">
                <td className="px-6 py-4 text-stone tabular-nums">{fmtMonth(r.month)}</td>
                <td className="px-6 py-4 text-right text-stone tabular-nums">{fmtCount(r.closingCount)}</td>
                <td className="px-6 py-4 text-right text-stone tabular-nums">{fmtMoney(r.medianClose)}</td>
                <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                  {r.medianPpsf != null ? `$${Math.round(r.medianPpsf)}` : '—'}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function PriceTierTable({ tiers }: { tiers: PriceTier[] }) {
  const total = tiers.reduce((s, t) => s + t.count, 0);
  return (
    <div className="border border-white/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-[var(--color-ink-elevated)]/30">
            <th className="px-6 py-4"><CapsLabel>Price Band</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>Active</CapsLabel></th>
            <th className="px-6 py-4 text-right"><CapsLabel>% of Total</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Median $/SqFt</CapsLabel></th>
            <th className="px-6 py-4 text-right hidden md:table-cell"><CapsLabel>Median DOM</CapsLabel></th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((t) => (
            <tr key={t.band} className="border-b border-white/5 last:border-b-0">
              <td className="px-6 py-4 font-serif text-lg text-stone">{fmtBand(t.band)}</td>
              <td className="px-6 py-4 text-right text-stone tabular-nums">{fmtCount(t.count)}</td>
              <td className="px-6 py-4 text-right text-gold tabular-nums">
                {total > 0 ? `${((t.count / total) * 100).toFixed(1)}%` : '—'}
              </td>
              <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                {t.medianPpsf != null ? `$${Math.round(t.medianPpsf)}` : '—'}
              </td>
              <td className="px-6 py-4 text-right text-stone tabular-nums hidden md:table-cell">
                {t.medianDom != null ? Math.round(t.medianDom) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PhoenixPricingPage() {
  const [snap, trends, tiers] = await Promise.all([
    getPricingSnapshot(),
    getPriceTrends(12),
    getActiveByPriceTier(),
  ]);

  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/market.jpg"
        kicker="Phoenix · Pricing"
        headline="What buyers"
        headlineItalic="are paying."
        sub="Median price, $/sqft, list-to-sale ratio, and price reductions across the metro."
      />
      <PhoenixSubnav current="/phoenix/pricing" />
      <main>
        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10">
            <CapsLabel className="block mb-3">Latest Cohort</CapsLabel>
            <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
              Headline pricing,
              <span className="italic font-light"> right now.</span>
            </h2>
          </div>
          <HeroKpiStrip snap={snap} />
        </SectionFrame>

        <SectionFrame className="pb-16 md:pb-20">
          <SecondaryKpiStrip snap={snap} />
        </SectionFrame>

        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <CapsLabel className="block mb-3">12-Month Trend</CapsLabel>
              <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
                The price arc,
                <span className="italic font-light"> month by month.</span>
              </h2>
            </div>
            <p className="text-mute max-w-md text-sm">
              Median close price and price-per-square-foot for every closed
              residential transaction in the metro, by month.
            </p>
          </div>
          <PriceTrendsTable rows={trends} />
        </SectionFrame>

        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <CapsLabel className="block mb-3">Active Inventory by Price Band</CapsLabel>
              <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
                Where the listings
                <span className="italic font-light"> are sitting.</span>
              </h2>
            </div>
            <p className="text-mute max-w-md text-sm">
              Distribution of currently-active listings by asking price.
              $/sqft and days on market for each band.
            </p>
          </div>
          <PriceTierTable tiers={tiers} />
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
