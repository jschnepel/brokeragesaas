/**
 * Visual gauge for the Months-of-Supply section — a horizontal spectrum
 * with five labelled bands (strong buyers → strong sellers) and a
 * triangular marker showing where the current metro reading falls.
 *
 * Real-estate convention thresholds (consensus across NAR / Inman /
 * regional MLS publications):
 *   < 2 mo  → strong seller's market
 *   2–4 mo  → seller's market
 *   4–6 mo  → balanced
 *   6–8 mo  → buyer's market
 *   ≥ 8 mo  → strong buyer's market
 *
 * Marker position math: months ≥ 10 → far left (strong buyers),
 * months ≤ 0 → far right (strong sellers). Linear interpolation in
 * between. Capped at 10 because anything above is off the chart
 * anyway and shows as "all the way left."
 */
export interface SupplyGaugeBarProps {
  /** Months of supply — 3-month gauge is the most current signal. */
  months: number | null;
  /** dbt's bucketed classification (strong_sellers, etc.). Affects
   *  marker color so the gauge reads at-a-glance. */
  classification: string | null;
}

const SCALE_MAX_MONTHS = 10;

// Band stops (left edge of each band as a fraction of the scale).
// Bands from LEFT to RIGHT: strong_buyers → buyers → balanced → sellers → strong_sellers.
// Months from HIGH to LOW: ≥8 / 6-8 / 4-6 / 2-4 / <2
const BANDS: Array<{ label: string; widthPct: number; tone: 'buyers' | 'balanced' | 'sellers' }> = [
  { label: 'Strong buyers', widthPct: 20, tone: 'buyers' },
  { label: 'Buyers', widthPct: 20, tone: 'buyers' },
  { label: 'Balanced', widthPct: 20, tone: 'balanced' },
  { label: 'Sellers', widthPct: 20, tone: 'sellers' },
  { label: 'Strong sellers', widthPct: 20, tone: 'sellers' },
];

export function SupplyGaugeBar({ months, classification }: SupplyGaugeBarProps) {
  if (months == null) return null;

  // Position from LEFT (0 = strong buyers, 1 = strong sellers).
  // Higher months count = more buyer-friendly = closer to left.
  const clamped = Math.max(0, Math.min(months, SCALE_MAX_MONTHS));
  const positionPct = (1 - clamped / SCALE_MAX_MONTHS) * 100;

  const markerColor =
    classification === 'strong_sellers' || classification === 'sellers'
      ? 'var(--gold, #C9A96E)'
      : classification === 'strong_buyers' || classification === 'buyers'
        ? '#FB7185'
        : 'var(--stone, #EFE9DF)';

  return (
    <div className="mb-10" aria-label={`Months of supply gauge: ${months.toFixed(2)} months`}>
      <div className="relative h-3 rounded-sm overflow-hidden">
        {/* Background band gradient — buyer-leaning rose on the left,
            balanced stone in the middle, seller-leaning gold on the right.
            Per-band subtle vertical dividers reinforce the discrete buckets. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(251,113,133,0.30) 0%, rgba(251,113,133,0.18) 20%, rgba(239,233,223,0.10) 40%, rgba(239,233,223,0.10) 60%, rgba(201,169,110,0.18) 80%, rgba(201,169,110,0.30) 100%)',
          }}
        />
        <div className="absolute inset-0 flex">
          {BANDS.map((b, i) => (
            <div
              key={b.label}
              style={{ width: `${b.widthPct}%` }}
              className={i === 0 ? '' : 'border-l border-white/8'}
            />
          ))}
        </div>
        {/* Marker — a slim vertical line + a small downward chevron. */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${positionPct}%`,
            background: markerColor,
            boxShadow: `0 0 8px ${markerColor}`,
          }}
        />
      </div>
      {/* Labels below — same band positions, smaller caps. */}
      <div className="mt-2 flex text-[9px] uppercase tracking-[0.22em] text-stone/35">
        {BANDS.map((b) => (
          <div
            key={b.label}
            style={{ width: `${b.widthPct}%` }}
            className="text-center first:text-left last:text-right"
          >
            {b.label}
          </div>
        ))}
      </div>
      {/* Pointer caption */}
      <div
        className="mt-3 caps text-[10px] tracking-[0.28em] text-stone/65"
        style={{
          marginLeft: `min(${Math.max(positionPct - 8, 0)}%, 84%)`,
        }}
      >
        ↑ {months.toFixed(2)} mo
      </div>
    </div>
  );
}
