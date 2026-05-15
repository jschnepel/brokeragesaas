import { SectionFrame } from '@/components/shared/SectionFrame';
import type { Negotiation } from '@/lib/market-reports';
import { StatTile } from './StatTile';

export interface NegotiationSectionProps {
  data: Negotiation | null;
}

/**
 * "What can a buyer actually negotiate today?" Sourced from
 * fct_negotiation_metro (closed-sale gap to list, share above/below
 * asking). Surfaces a single month-snapshot — the freshest the
 * dbt mart has — alongside YoY drift.
 *
 * Negotiation latency: this is monthly cadence, not weekly, so the
 * same numbers ship on every weekly + monthly detail page in a
 * given calendar month. The asOfMonth label keeps that visible.
 */
export function NegotiationSection({ data }: NegotiationSectionProps) {
  if (!data) return null;

  const formatPct = (v: number | null, digits = 1) =>
    v == null ? null : `${(v * 100).toFixed(digits)}%`;
  const formatGap = (v: number | null) => {
    // median_sale_to_list of 0.977 reads as "2.3% below ask".
    if (v == null) return null;
    const gap = (1 - v) * 100;
    if (Math.abs(gap) < 0.05) return 'At list';
    return gap > 0 ? `${gap.toFixed(1)}% below` : `${Math.abs(gap).toFixed(1)}% over`;
  };
  const formatYoy = (v: number | null) => {
    if (v == null) return undefined;
    // pct_change_sale_to_list_yoy is in percentage points (e.g. 1.8 means +1.8pp).
    return v > 0
      ? `+${v.toFixed(1)}pp YoY`
      : v < 0
        ? `${v.toFixed(1)}pp YoY`
        : 'flat YoY';
  };

  const commentary =
    data.medianSaleToList == null
      ? null
      : data.medianSaleToList >= 1.0
        ? 'Buyers are paying at or above list — a thin negotiation window.'
        : data.medianSaleToList >= 0.97
          ? 'Buyers are negotiating a modest gap off list. Selective seller leverage holds.'
          : 'Sellers are conceding meaningful ground. Stronger negotiating posture for prepared buyers.';

  return (
    <SectionFrame className="py-16 md:py-20 border-t border-[color:var(--hairline)]">
      <div className="max-w-5xl">
        <div className="mb-10 md:mb-14">
          <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
          <p className="caps">Negotiation pulse</p>
          <h2 className="display-lg mt-4 text-stone tracking-[-0.005em]">
            What the gap looked like.
          </h2>
          <p className="mt-3 caps text-[10px] tracking-[0.32em] text-stone/40">
            Monthly snapshot · {data.asOfMonth}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <StatTile
            label="Median gap to list"
            value={formatGap(data.medianSaleToList)}
            chips={
              data.yoyChangeSaleToList != null
                ? [
                    {
                      pct: data.yoyChangeSaleToList,
                      label: formatYoy(data.yoyChangeSaleToList) ?? 'YoY',
                      direction: 'neutral' as const,
                    },
                  ]
                : []
            }
            footnote="Closed sale ÷ list"
          />
          <StatTile
            label="Closed over asking"
            value={formatPct(data.pctAboveList == null ? null : data.pctAboveList / 100)}
            footnote="Share of closings"
          />
          <StatTile
            label="Closed below asking"
            value={formatPct(data.pctBelowList == null ? null : data.pctBelowList / 100)}
            footnote="Share of closings"
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
