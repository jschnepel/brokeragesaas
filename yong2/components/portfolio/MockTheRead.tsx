import { CapsLabel } from '@/components/shared/CapsLabel';

const DOLLAR = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

type MockReadProps = {
  /** Subject listing's price-per-square-foot. */
  subjectPpsf: number;
  /** Median PPSF of the active comp pool. */
  compMedianPpsf: number;
  /** Number of comps in the pool. */
  compPoolSize: number;
  /** Median days-on-market in the area. */
  areaMedianDom: number;
  /** Months of supply in the area. */
  areaMonthsOfSupply: number;
  /** Year-over-year median price change in the area (decimal, e.g. 0.082). */
  areaYoYPriceChangePct: number;
  /** Area scope label — "Silverleaf", "North Scottsdale", etc. */
  areaLabel: string;
};

/**
 * Mock "The Read" analytics block — shows how the subject listing
 * sits relative to active comps + the area aggregate. Yong-distinct
 * value-add not present in Jeane's listing detail; renders below the
 * features grid as the page's most quantitative section.
 *
 * Real version (yong2/components/listing/TheRead.tsx) pulls from
 * `lib/analytics/comps.ts` + `lib/analytics/area.ts` against the
 * listing's community/region. This mock displays the same visual
 * pattern fed by props so the preview shows the editorial intent.
 *
 * Rename / merge with the real TheRead when the data layer ships and
 * this can read live values.
 */
export function MockTheRead({
  subjectPpsf,
  compMedianPpsf,
  compPoolSize,
  areaMedianDom,
  areaMonthsOfSupply,
  areaYoYPriceChangePct,
  areaLabel,
}: MockReadProps) {
  const ppsfDelta = subjectPpsf - compMedianPpsf;
  const ppsfDeltaPct = (ppsfDelta / compMedianPpsf) * 100;
  const positionedAbove = ppsfDelta >= 0;

  return (
    <section data-testid="the-read" data-track="the-read" className="bg-ink-elevated/40 p-8 md:p-12 border border-white/5">
      <CapsLabel as="h2" className="mb-8">The Read</CapsLabel>
      <p className="font-serif italic text-stone text-xl md:text-2xl mb-10 max-w-3xl leading-snug">
        How this property reads against the active market — and the area at large.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left: Comp pool */}
        <div>
          <CapsLabel as="h3" className="mb-3 text-stone/70">vs. Active Comps</CapsLabel>
          <p className="text-xs text-stone/50 mb-6">
            {compPoolSize} active comparables — same community, same property type, ±20% size band.
          </p>
          <dl className="space-y-4">
            <Row label="Subject price / sqft" value={DOLLAR(subjectPpsf)} />
            <Row label="Comp median / sqft" value={DOLLAR(compMedianPpsf)} />
            <Row
              label={`Position vs. comps`}
              value={`${positionedAbove ? '+' : ''}${ppsfDeltaPct.toFixed(1)}%`}
              accent={positionedAbove ? 'gold' : 'stone'}
            />
          </dl>
        </div>
        {/* Right: Area aggregate */}
        <div>
          <CapsLabel as="h3" className="mb-3 text-stone/70">{areaLabel} · 12-month read</CapsLabel>
          <p className="text-xs text-stone/50 mb-6">
            Aggregate market signal for the immediate area.
          </p>
          <dl className="space-y-4">
            <Row label="Median days on market" value={`${areaMedianDom} days`} />
            <Row label="Months of supply" value={`${areaMonthsOfSupply.toFixed(1)} mo`} />
            <Row
              label="YoY median price"
              value={`${areaYoYPriceChangePct >= 0 ? '+' : ''}${(areaYoYPriceChangePct * 100).toFixed(1)}%`}
              accent={areaYoYPriceChangePct >= 0 ? 'gold' : 'stone'}
            />
          </dl>
        </div>
      </div>
      <p className="caps text-stone/40 text-[10px] mt-10 tracking-wider">
        Source · ARMLS Spark · Refreshed hourly
      </p>
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: 'gold' | 'stone' }) {
  return (
    <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
      <dt className="caps text-stone/70 text-[10px]">{label}</dt>
      <dd className={`font-serif text-2xl md:text-3xl ${accent === 'gold' ? 'text-gold' : 'text-stone'}`}>
        {value}
      </dd>
    </div>
  );
}
