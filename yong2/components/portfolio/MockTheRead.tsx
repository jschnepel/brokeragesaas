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
  /** Optional — median sale-to-list ratio (0.964 = 96.4% of list). */
  saleToListRatio?: number | null;
  /** Optional — median days from Pending → Closed in the area. */
  medianDaysPendingToClosed?: number | null;
  /** Optional — % of closings in the period that had a price reduction (0.31 = 31%). */
  pctWithReduction?: number | null;
  /**
   * Narrative-workflow-supplied 1-sentence interpretation of the
   * comp-position number. Templated against the magnitude + sign of
   * the delta. Optional — workflow may omit if delta is too small to
   * warrant commentary (within ±2%).
   */
  compsCommentary?: string;
  /**
   * Narrative-workflow-supplied 1-sentence interpretation of the area
   * aggregate vs metro baseline. Optional.
   */
  areaCommentary?: string;
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
  saleToListRatio,
  medianDaysPendingToClosed,
  pctWithReduction,
  compsCommentary,
  areaCommentary,
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
          {compsCommentary ? (
            <p className="mt-5 text-sm text-stone/70 leading-relaxed border-l-2 border-gold/40 pl-4">
              {compsCommentary}
            </p>
          ) : null}
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
          {areaCommentary ? (
            <p className="mt-5 text-sm text-stone/70 leading-relaxed border-l-2 border-gold/40 pl-4">
              {areaCommentary}
            </p>
          ) : null}
        </div>
      </div>
      {/* Advanced market signals — rendered when any of the three
       *  optional metrics has a value. Three compact tiles below the
       *  primary 2-column read so the page rhythm holds. */}
      {(saleToListRatio != null ||
        medianDaysPendingToClosed != null ||
        pctWithReduction != null) && (
        <div className="mt-12 pt-10 border-t border-white/5">
          <CapsLabel as="h3" className="mb-6 text-stone/70 text-[10px]">
            Advanced market signals · Phoenix Metro
          </CapsLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {saleToListRatio != null && (
              <AdvancedTile
                label="Sale-to-list"
                value={`${(saleToListRatio * 100).toFixed(1)}%`}
                caption="Median across recent closes — how close buyers are landing to ask."
              />
            )}
            {medianDaysPendingToClosed != null && (
              <AdvancedTile
                label="Pending → Closed"
                value={`${medianDaysPendingToClosed} d`}
                caption="Median days from accepted offer to closing across recent metro deals."
              />
            )}
            {pctWithReduction != null && (
              <AdvancedTile
                label="With price cut"
                // The fct_negotiation_metro.pct_with_reduction value is
                // already expressed as a percentage (e.g. 25.77 means
                // 25.77%). The mart's `pct_*` columns differ from
                // `median_sale_to_list` which is a decimal ratio.
                value={`${pctWithReduction.toFixed(0)}%`}
                caption="Share of recent closes that took at least one price reduction."
              />
            )}
          </div>
        </div>
      )}

      <p className="caps text-stone/40 text-[10px] mt-10 tracking-wider">
        Source · ARMLS Spark · Refreshed hourly
      </p>
    </section>
  );
}

function AdvancedTile({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="border border-white/5 bg-ink/40 p-5">
      <CapsLabel as="div" className="text-stone/55 text-[10px] mb-2">
        {label}
      </CapsLabel>
      <p className="font-serif text-3xl text-stone tabular-nums mb-2">{value}</p>
      <p className="text-xs text-stone/55 leading-relaxed">{caption}</p>
    </div>
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
