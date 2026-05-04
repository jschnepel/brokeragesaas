/**
 * "The Read" — single dense analytics block for the listing detail page.
 *
 * Composition (per the wireframe at
 * .superpowers/brainstorm/76286-1777260814/content/listing-analytics-wireframe.html):
 *
 *   1. Header — caps kicker + meta line (last-refresh + scope label)
 *   2. Pace KPI strip — 5 cells (DOM / $/sf / Months Supply / Price History / YoY)
 *   3. Two-column body — Active comps table + 12-month area trend
 *
 * Compliance: NO INDIVIDUAL CLOSED RECORDS. The comps section displays only
 * active inventory (Active / Active Under Contract / Pending) which is
 * public IDX. The area trend shows aggregate sold metrics only.
 */

import Link from 'next/link';
import type { Listing } from '@/lib/types';
import type { CompResult, ActiveComp } from '@/lib/analytics/comps';
import type { AreaRead } from '@/lib/analytics/area';
import type { ListingPace } from '@/lib/analytics/listing-pace';

type TheReadProps = {
  listing: Listing;
  pace: ListingPace;
  comps: CompResult;
  area: AreaRead;
  /** ISO date for "Last MV refresh" — defaults to today UTC. */
  lastRefreshIso?: string;
};

function fmtCurrency(n: number | null | undefined, opts: { compact?: boolean } = {}): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (opts.compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  }
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

function fmtPpsf(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function fmtPctSigned(n: number | null | undefined, fractional = false): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const v = fractional ? n * 100 : n;
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

function bedBathSqftLine(c: ActiveComp): string {
  const parts: string[] = [];
  if (c.bedrooms != null) parts.push(`${c.bedrooms} bd`);
  if (c.bathroomsTotal != null) parts.push(`${c.bathroomsTotal} ba`);
  if (c.livingArea != null) parts.push(`${Math.round(c.livingArea).toLocaleString('en-US')} sf`);
  return parts.join(' · ');
}

function mosQualifier(mos: number | null): string {
  if (mos == null) return '—';
  if (mos < 3) return "seller's market";
  if (mos > 6) return "buyer's market";
  return 'balanced market';
}

function compStatusPill(status: ActiveComp['status']): { dot: string; label: string } | null {
  if (status === 'Active') return null;
  if (status === 'Active Under Contract') {
    return { dot: 'bg-gold', label: 'Under Contract' };
  }
  return { dot: 'bg-stone/40', label: 'Pending' };
}

/**
 * Plain SVG sparkline with a soft fill underneath.
 */
function TrendSparkline({ data }: { data: { month: string; value: number }[] }) {
  if (data.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-mute text-[11px] italic">
        Insufficient trend data
      </div>
    );
  }
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const range = Math.max(1, max - min);
  const w = 200;
  const h = 60;
  const pad = 2;
  const xStep = (w - pad * 2) / (data.length - 1);
  const points = data
    .map((d, i) => {
      const x = pad + i * xStep;
      const y = pad + (1 - (d.value - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  const fillPoints = `${points} ${pad + (data.length - 1) * xStep},${h} ${pad},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="100%">
      <polyline points={fillPoints} fill="rgba(212,184,138,0.10)" stroke="none" />
      <polyline points={points} fill="none" stroke="#D4B88A" strokeWidth="1.5" />
    </svg>
  );
}

function PaceCell({
  label,
  value,
  delta,
  valueClass = '',
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="px-3 py-4 md:py-5 text-center border-b md:border-b-0 md:border-r border-white/10 last:border-r-0 last:border-b-0">
      <p className="caps text-[8px] text-mute leading-tight">{label}</p>
      <p
        className={`font-serif text-xl md:text-2xl text-stone mt-2 leading-none tracking-tight ${valueClass}`}
      >
        {value}
      </p>
      {delta && <p className="text-[9px] text-mute mt-2 leading-tight">{delta}</p>}
    </div>
  );
}

function AreaSubStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="px-3 py-3 border border-white/10">
      <p className="caps text-[8px] text-mute">{label}</p>
      <p className="font-serif text-base md:text-lg text-stone mt-1">
        {value}
        {unit && <span className="text-gold text-xs ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export function TheRead({ listing, pace, comps, area, lastRefreshIso }: TheReadProps) {
  const refreshDate = (lastRefreshIso ?? new Date().toISOString()).slice(0, 10);
  const meta = `Live · Last refresh ${refreshDate} · ${area.scopeLabel}`;

  // Pace strip
  const domDelta = pace.communityMedianDom != null
    ? <>vs <span className="text-stone">{Math.round(pace.communityMedianDom)}</span> community median</>
    : 'community median —';

  const ppsfDeltaPct = pace.vsCompMedianPctDelta;
  const ppsfDelta = ppsfDeltaPct != null
    ? (
      <>
        <span className={ppsfDeltaPct >= 0 ? 'text-gold' : 'text-[#c97a5a]'}>
          {fmtPctSigned(ppsfDeltaPct, true)}
        </span>{' '}
        vs comp median
      </>
    ) : 'no comps';

  const mosDelta = mosQualifier(pace.monthsOfSupply);

  const reductionDelta = pace.hasPriceReduction
    ? <span className="text-[#c97a5a]">−1 reduction</span>
    : 'no reductions';

  const yoyDelta = pace.yoyPriceChangePct != null
    ? <>price-per-sqft, residential</>
    : '—';

  return (
    <section className="bg-ink-elevated border border-white/10 px-6 md:px-10 py-8 md:py-10">
      {/* Header */}
      <header className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-white/10 mb-6">
        <span className="caps text-[10px] text-gold tracking-[0.3em]">The Read</span>
        <span className="caps text-[9px] text-mute tracking-[0.25em]">{meta}</span>
      </header>

      {/* Pace KPI strip — 5 cells desktop / 2-col mobile */}
      <div className="grid grid-cols-2 md:grid-cols-5 border border-white/10 mb-6">
        <PaceCell
          label="Days on Market"
          value={pace.daysOnMarket != null ? String(pace.daysOnMarket) : '—'}
          delta={domDelta}
        />
        <PaceCell
          label="$/Sqft"
          value={fmtPpsf(pace.pricePerSqft)}
          delta={ppsfDelta}
        />
        <PaceCell
          label="Months of Supply"
          value={pace.monthsOfSupply != null ? pace.monthsOfSupply.toFixed(1) : '—'}
          delta={mosDelta}
          valueClass="text-gold italic"
        />
        <PaceCell
          label="Price History"
          value={fmtCurrency(listing.listPrice, { compact: true })}
          delta={reductionDelta}
        />
        <PaceCell
          label={`YoY · ${area.scopeLabel}`}
          value={fmtPctSigned(pace.yoyPriceChangePct)}
          delta={yoyDelta}
          valueClass="text-gold italic"
        />
      </div>

      {/* Two-column body — comps left, area trend right */}
      <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr] gap-7">
        {/* COMPS */}
        <div>
          <p className="caps text-[10px] text-gold tracking-[0.3em] mb-3">
            Currently Listed Nearby
            {area.scopeLabel ? <span className="text-mute"> · {area.scopeLabel}</span> : null}
          </p>

          {comps.comps.length === 0 ? (
            <p className="font-serif italic text-mute text-sm py-6 border-t border-b border-white/10">
              Insufficient comparable inventory at this time.
            </p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left caps text-[8px] text-mute py-2 border-b border-white/10 font-medium">
                    Property
                  </th>
                  <th className="text-right caps text-[8px] text-mute py-2 border-b border-white/10 font-medium">
                    Ask
                  </th>
                  <th className="text-right caps text-[8px] text-mute py-2 border-b border-white/10 font-medium">
                    $/Sqft
                  </th>
                  <th className="text-right caps text-[8px] text-mute py-2 border-b border-white/10 font-medium">
                    DOM
                  </th>
                </tr>
              </thead>
              <tbody>
                {comps.comps.map((c) => {
                  const pill = compStatusPill(c.status);
                  return (
                    <tr key={c.listingKey} className="border-b border-white/5 last:border-b-0">
                      <td className="py-3 pr-2">
                        <Link
                          href={`/portfolio/${c.slug}`}
                          className="font-serif text-[13px] text-stone hover:text-gold transition-colors"
                        >
                          {c.unparsedAddress || 'Address withheld'}
                        </Link>
                        <div className="caps text-[9px] text-mute mt-1 flex items-center gap-2">
                          <span>{bedBathSqftLine(c)}</span>
                          {pill && (
                            <span className="inline-flex items-center gap-1.5 ml-2">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                              <span className="text-[8px]">{pill.label}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-3 text-stone tabular-nums text-[12px]">
                        {fmtCurrency(c.listPrice, { compact: true })}
                      </td>
                      <td className="text-right py-3 text-gold tabular-nums text-[11px]">
                        {fmtPpsf(c.pricePerSqft)}
                      </td>
                      <td className="text-right py-3 text-mute tabular-nums text-[11px]">
                        {c.daysOnMarket != null ? c.daysOnMarket : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Footer */}
          {comps.comps.length > 0 && (
            <div className="flex flex-wrap justify-between items-baseline gap-2 mt-3 pt-2 border-t border-white/10">
              <span className="caps text-[10px] text-mute tracking-[0.25em]">
                Median ask{' '}
                <strong className="font-serif italic text-stone text-[14px] not-italic">
                  {fmtPpsf(comps.medianAskingPpsf)} / sf
                </strong>
              </span>
              {comps.fallbackNote && (
                <span className="caps text-[10px] text-gold tracking-[0.25em]">
                  {comps.fallbackNote}
                </span>
              )}
            </div>
          )}
        </div>

        {/* AREA TREND */}
        <div>
          <p className="caps text-[10px] text-gold tracking-[0.3em] mb-3">
            {area.scopeLabel} · 12 Months
          </p>

          {/* Chart */}
          <div className="relative border border-white/10 px-3 pt-3 pb-2 h-[140px]">
            <span className="absolute top-2 left-3 caps text-[8px] text-mute tracking-[0.25em]">
              $/sqft trend
            </span>
            <span className="absolute top-2 right-3 font-serif italic text-gold text-sm">
              {fmtPpsf(area.currentPpsf)}
            </span>
            <div className="absolute left-0 right-0 bottom-3 h-[80px] px-1">
              <TrendSparkline data={area.trend} />
            </div>
            <div className="absolute left-3 right-3 bottom-1 flex justify-between text-[7px] caps text-stone/45 tracking-[0.2em]">
              {area.trend.length >= 2 ? (
                <>
                  <span>{area.trend[0].month}</span>
                  {area.trend.length > 4 && (
                    <span>{area.trend[Math.floor(area.trend.length / 2)].month}</span>
                  )}
                  <span>{area.trend[area.trend.length - 1].month}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Sub-stats grid: 4 cells, 2x2 always */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <AreaSubStat
              label="YoY $/Sqft"
              value={
                area.yoyPriceChangePct != null
                  ? `${area.yoyPriceChangePct > 0 ? '+' : ''}${area.yoyPriceChangePct.toFixed(1)}`
                  : '—'
              }
              unit={area.yoyPriceChangePct != null ? '%' : undefined}
            />
            <AreaSubStat
              label="Closes / mo"
              value={area.closesPerMonth != null ? area.closesPerMonth.toFixed(1) : '—'}
            />
            <AreaSubStat
              label="List / Sale"
              value={
                area.listToSaleRatio != null ? `${area.listToSaleRatio.toFixed(1)}` : '—'
              }
              unit={area.listToSaleRatio != null ? '%' : undefined}
            />
            <AreaSubStat
              label="Med DOM"
              value={area.medianDom != null ? `${Math.round(area.medianDom)}` : '—'}
              unit={area.medianDom != null ? 'd' : undefined}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// re-export the types most consumers will need so the page can import from
// one location.
export type { ListingPace } from '@/lib/analytics/listing-pace';
export type { CompResult, ActiveComp } from '@/lib/analytics/comps';
export type { AreaRead } from '@/lib/analytics/area';
export { fmtInt, fmtCurrency };
