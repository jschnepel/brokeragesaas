import { SectionFrame } from '@/components/shared/SectionFrame';
import type { PriceReduction } from '@/lib/market-reports';
import { StatTile } from './StatTile';

export interface PriceReductionSectionProps {
  data: PriceReduction | null;
}

/**
 * "Are sellers blinking?" Sourced from fct_pricereduction_metro
 * rolled up across all price bands (count-weighted) for the latest
 * month. Two signals:
 *   - Share of closings with at least one recorded reduction.
 *   - Median net change percent — the typical reduction depth.
 *
 * Higher share-with-reduction + deeper net-change-pct = capitulating
 * supply side, friendlier negotiating climate for buyers.
 */
export function PriceReductionSection({ data }: PriceReductionSectionProps) {
  if (!data) return null;

  const pctReduction = data.pctWithReduction;
  const netChangePct = data.medianNetChangePct;
  const yoyDeltaPp = data.yoyChangePctReduction;

  const fmtPct = (v: number | null, digits = 1) =>
    v == null ? null : `${(v * 100).toFixed(digits)}%`;
  const fmtCutDepth = (v: number | null) => {
    if (v == null) return null;
    // median_net_change_pct comes in as a negative percentage (e.g. -4.2 → 4.2% off).
    // Some marts express it as a decimal; coerce by magnitude.
    const abs = Math.abs(v);
    const pct = abs <= 1 ? abs * 100 : abs;
    return `${pct.toFixed(1)}%`;
  };
  const fmtYoy = (v: number | null) => {
    if (v == null) return undefined;
    return v > 0 ? `+${v.toFixed(1)}pp YoY` : `${v.toFixed(1)}pp YoY`;
  };

  const commentary =
    pctReduction == null
      ? null
      : pctReduction >= 0.4
        ? 'Heavy capitulation — nearly half of closings carried a recorded reduction. Buyer-leaning negotiation climate.'
        : pctReduction >= 0.25
          ? 'Sellers are giving ground on a meaningful share of listings. Selective buyer leverage.'
          : 'Restrained price-cutting. Sellers are holding their initial ask in most segments.';

  return (
    <SectionFrame className="py-16 md:py-20 border-t border-[color:var(--hairline)]">
      <div className="max-w-5xl">
        <div className="mb-10 md:mb-14">
          <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
          <p className="caps">Sellers blinking</p>
          <h2 className="display-lg mt-4 text-stone tracking-[-0.005em]">
            Reductions inside the close pool.
          </h2>
          <p className="mt-3 caps text-[10px] tracking-[0.32em] text-stone/40">
            Monthly snapshot · {data.asOfMonth} · n = {data.closingCount.toLocaleString()} closings
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <StatTile
            label="Closings with a reduction"
            value={fmtPct(pctReduction)}
            chips={
              yoyDeltaPp != null
                ? [
                    {
                      pct: yoyDeltaPp,
                      label: fmtYoy(yoyDeltaPp) ?? 'YoY',
                      direction: 'neutral' as const,
                    },
                  ]
                : []
            }
            footnote="At least one cut from list"
          />
          <StatTile
            label="Typical reduction depth"
            value={fmtCutDepth(netChangePct)}
            footnote="Median net change from original list"
          />
        </div>
        {commentary ? (
          <p className="mt-8 text-base text-stone/75 leading-relaxed italic max-w-2xl">
            {commentary}
          </p>
        ) : null}
      </div>
    </SectionFrame>
  );
}
