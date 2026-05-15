import { SectionFrame } from '@/components/shared/SectionFrame';
import type { MonthsOfSupply } from '@/lib/market-reports';
import { StatTile } from './StatTile';

export interface MonthsOfSupplySectionProps {
  data: MonthsOfSupply | null;
}

/**
 * Months of supply — the canonical buyer's-vs-seller's-market gauge.
 * Standard real-estate convention: <4 months = seller's market;
 * 4-6 months = balanced; >6 months = buyer's market.
 *
 * The mart classifies into 5 buckets (strong_sellers / sellers /
 * balanced / buyers / strong_buyers); we surface the bucketed label
 * alongside the raw months figure so the reader gets both the number
 * and dbt's interpretation.
 */

const CLASSIFICATION_COPY: Record<
  string,
  { label: string; copy: string; tone: 'sellers' | 'balanced' | 'buyers' }
> = {
  strong_sellers: {
    label: 'Strong seller’s market',
    copy: 'Active inventory clears in well under a month at the current closing pace. Pricing power sits firmly with the seller side.',
    tone: 'sellers',
  },
  sellers: {
    label: 'Seller’s market',
    copy: 'Inventory clears faster than the year’s average pace. Sellers retain leverage on well-priced listings.',
    tone: 'sellers',
  },
  balanced: {
    label: 'Balanced market',
    copy: 'Supply and absorption are matched — neither side carries structural leverage. Negotiation reduces to listing-specific dynamics.',
    tone: 'balanced',
  },
  buyers: {
    label: 'Buyer’s market',
    copy: 'Active inventory exceeds normal absorption. Sellers face pressure on time-on-market and concession depth.',
    tone: 'buyers',
  },
  strong_buyers: {
    label: 'Strong buyer’s market',
    copy: 'Supply meaningfully outpaces absorption. Buyer leverage is widespread; negotiation room expands across most segments.',
    tone: 'buyers',
  },
};

export function MonthsOfSupplySection({ data }: MonthsOfSupplySectionProps) {
  if (!data) return null;

  const classification = data.marketClassification
    ? CLASSIFICATION_COPY[data.marketClassification]
    : null;
  const fmtMonths = (v: number | null) => (v == null ? null : v.toFixed(2));

  const toneStyle =
    classification?.tone === 'sellers'
      ? 'text-gold'
      : classification?.tone === 'buyers'
        ? 'text-rose-300'
        : 'text-stone';

  return (
    <SectionFrame className="py-16 md:py-20 border-t border-[color:var(--hairline)]">
      <div className="max-w-5xl">
        <div className="mb-10 md:mb-14">
          <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
          <p className="caps">Supply gauge</p>
          <h2 className="display-lg mt-4 text-stone tracking-[-0.005em]">
            Months of supply.
          </h2>
          <p className="mt-3 caps text-[10px] tracking-[0.32em] text-stone/40">
            Active ÷ trailing closings — Phoenix metro
          </p>
        </div>
        {classification ? (
          <p
            className={`caps text-xs tracking-[0.32em] mb-8 ${toneStyle}`}
            aria-label={classification.label}
          >
            {classification.label}
          </p>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          <StatTile
            label="3-month gauge"
            value={fmtMonths(data.months3mo)}
            unit="mo"
            footnote="Most current — closings T3M"
          />
          <StatTile
            label="12-month gauge"
            value={fmtMonths(data.months12mo)}
            unit="mo"
            footnote="Long-run — closings T12M"
          />
          <StatTile
            label="Active inventory"
            value={data.activeCount.toLocaleString()}
            footnote="IDX-displayable across the metro"
          />
        </div>
        {classification ? (
          <p className="mt-8 text-base text-stone/75 leading-relaxed italic max-w-2xl">
            {classification.copy}
          </p>
        ) : null}
      </div>
    </SectionFrame>
  );
}
