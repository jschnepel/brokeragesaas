import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { siteUrl } from '@/lib/seo';
import { PhoenixSubnav } from './components/PhoenixSubnav';
import {
  getMetroSnapshot,
  getTopRegions,
  getNotableCommunities,
  type MetroSnapshot,
  type RegionRow,
  type CommunityHighlightRow,
} from './lib/data';

export const metadata: Metadata = {
  title: 'Phoenix Market Intelligence',
  description:
    'Real-time market statistics for Greater Phoenix luxury real estate — active inventory, median price, days on market, and regional activity, refreshed hourly from ARMLS data.',
  alternates: { canonical: siteUrl('/phoenix') },
};

// Hourly ISR — matches the dbt schedule. Built once per dbt cycle, served
// from edge cache for the next hour. yong2's other dashboards use the same
// pattern.
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
      {sub && (
        <div className="mt-2 text-sm text-mute">{sub}</div>
      )}
    </div>
  );
}

function KpiStrip({ snap }: { snap: MetroSnapshot }) {
  const totalActive = snap.active + snap.pending + snap.comingSoon;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
      <KpiCard
        label="Active Inventory"
        value={fmtCount(totalActive)}
        sub={`${fmtCount(snap.active)} active · ${fmtCount(snap.pending)} pending · ${fmtCount(snap.comingSoon)} coming soon`}
      />
      <KpiCard
        label={`Median Close (${fmtMonth(snap.latestMonthLabel)})`}
        value={fmtMoney(snap.medianClose)}
        sub={snap.medianPpsf ? `${fmtMoney(snap.medianPpsf)} / sqft` : undefined}
      />
      <KpiCard
        label="Median Days on Market"
        value={snap.medianDom != null ? `${Math.round(snap.medianDom)}` : '—'}
        sub={`Latest cohort, metro-wide`}
      />
      <KpiCard
        label="6-Month Volume"
        value={fmtMoney(snap.totalVolume6mo, { compact: true })}
        sub={`${fmtCount(snap.closingCount6mo)} closings`}
      />
    </div>
  );
}

function RegionsTable({ regions }: { regions: RegionRow[] }) {
  return (
    <div className="border border-white/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-[var(--color-ink-elevated)]/30">
            <th className="px-6 py-4 text-stone-muted">
              <CapsLabel>Region</CapsLabel>
            </th>
            <th className="px-6 py-4 text-stone-muted text-right">
              <CapsLabel>Closings</CapsLabel>
            </th>
            <th className="px-6 py-4 text-stone-muted text-right hidden md:table-cell">
              <CapsLabel>Median Close</CapsLabel>
            </th>
            <th className="px-6 py-4 text-stone-muted text-right hidden md:table-cell">
              <CapsLabel>Median DOM</CapsLabel>
            </th>
            <th className="px-6 py-4 text-stone-muted text-right">
              <CapsLabel>Volume</CapsLabel>
            </th>
          </tr>
        </thead>
        <tbody>
          {regions.map((r) => (
            <tr key={r.scopeKey} className="border-b border-white/5 last:border-b-0">
              <td className="px-6 py-5 font-serif text-lg text-stone">{r.name}</td>
              <td className="px-6 py-5 text-right text-stone tabular-nums">
                {fmtCount(r.closingCount)}
              </td>
              <td className="px-6 py-5 text-right text-stone tabular-nums hidden md:table-cell">
                {fmtMoney(r.medianClose)}
              </td>
              <td className="px-6 py-5 text-right text-stone tabular-nums hidden md:table-cell">
                {r.medianDom != null ? Math.round(r.medianDom) : '—'}
              </td>
              <td className="px-6 py-5 text-right text-gold tabular-nums">
                {fmtMoney(r.totalVolume, { compact: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommunityCard({ row }: { row: CommunityHighlightRow }) {
  const closes = typeof row.closes_12mo === 'bigint' ? Number(row.closes_12mo) : row.closes_12mo ?? 0;
  const medianClose = typeof row.median_close_12mo === 'bigint' ? Number(row.median_close_12mo) : row.median_close_12mo;
  const medianPpsf = typeof row.median_ppsf_12mo === 'bigint' ? Number(row.median_ppsf_12mo) : row.median_ppsf_12mo;
  const medianDom = typeof row.median_dom_12mo === 'bigint' ? Number(row.median_dom_12mo) : row.median_dom_12mo;
  return (
    <div className="border border-white/10 bg-[var(--color-ink-elevated)]/30 px-6 py-6">
      <CapsLabel className="block mb-2">{row.region_name ?? ''}</CapsLabel>
      <div className="font-serif text-2xl text-stone leading-tight">
        {row.community_name ?? row.scope_key}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-mute uppercase text-xs tracking-wider">Closes (12mo)</div>
          <div className="text-stone tabular-nums mt-1">{closes ? fmtCount(closes) : '—'}</div>
        </div>
        <div>
          <div className="text-mute uppercase text-xs tracking-wider">Median Close</div>
          <div className="text-stone tabular-nums mt-1">{fmtMoney(medianClose ?? null)}</div>
        </div>
        <div>
          <div className="text-mute uppercase text-xs tracking-wider">Median $/sqft</div>
          <div className="text-stone tabular-nums mt-1">{fmtMoney(medianPpsf ?? null)}</div>
        </div>
        <div>
          <div className="text-mute uppercase text-xs tracking-wider">Median DOM</div>
          <div className="text-stone tabular-nums mt-1">
            {medianDom != null ? Math.round(medianDom) : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function PhoenixPage() {
  const [snap, regions, communities] = await Promise.all([
    getMetroSnapshot(),
    getTopRegions(6),
    getNotableCommunities(8),
  ]);

  return (
    <>
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/market.jpg"
        kicker="Phoenix Market Intelligence"
        headline="The metro at"
        headlineItalic="a glance."
        sub="Real-time inventory, pricing, and pace, refreshed hourly from ARMLS."
      />
      <PhoenixSubnav current="/phoenix" />
      <main>
        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10">
            <CapsLabel className="block mb-3">Metro snapshot</CapsLabel>
            <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
              The numbers that matter,
              <span className="italic font-light"> right now.</span>
            </h2>
          </div>
          <KpiStrip snap={snap} />
        </SectionFrame>

        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <CapsLabel className="block mb-3">By Region</CapsLabel>
              <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
                Where the deals
                <span className="italic font-light"> are closing.</span>
              </h2>
            </div>
            <p className="text-mute max-w-md text-sm">
              Latest month per region. Ranked by closing count. Volume in
              dollars closed.
            </p>
          </div>
          <RegionsTable regions={regions} />
        </SectionFrame>

        <SectionFrame className="py-16 md:py-20">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <CapsLabel className="block mb-3">Notable Communities</CapsLabel>
              <h2 className="font-serif text-3xl md:text-4xl text-stone leading-tight">
                Highest-velocity
                <span className="italic font-light"> enclaves.</span>
              </h2>
            </div>
            <p className="text-mute max-w-md text-sm">
              Top eight communities by trailing-12-month closes. Median price,
              $/sqft, and days on market for each.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
            {communities.map((c) => (
              <CommunityCard key={c.scope_key} row={c} />
            ))}
          </div>
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
