import { CapsLabel } from '@/components/shared/CapsLabel';
import { CompDistributionChart } from './CompDistributionChart';
import { PriceTrendSparkline } from './PriceTrendSparkline';

const DOLLAR = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

type TheReadVisualizedProps = {
  /** Subject ppsf and the comp pool quartiles. */
  subjectPpsf: number;
  comps: { p25: number; p50: number; p75: number; count: number };
  /** 12-month area aggregates. */
  area: {
    label: string;
    medianDom: number;
    monthsOfSupply: number;
    yoyMedianPriceChangePct: number;
    monthlyMedianPpsf: ReadonlyArray<number>;
  };
  /** Narrative-supplied 1-sentence interpretations. */
  compsCommentary?: string;
  areaCommentary?: string;
};

/**
 * "The Read" — visualized analytics block. 2-col on desktop, stacks
 * on mobile. Left: comp distribution bar chart (subject highlighted).
 * Right: 12-month price-trend sparkline + DOM/Supply/YoY stats.
 *
 * Editorial luxury treatment: hairlines, gold accents on subject /
 * direction-of-trend numbers, narrative blockquotes beneath each
 * column with a left gold rule (not a box).
 */
export function TheReadVisualized({
  subjectPpsf,
  comps,
  area,
  compsCommentary,
  areaCommentary,
}: TheReadVisualizedProps) {
  const positionedAbove = subjectPpsf > comps.p50;
  const ppsfDeltaPct = ((subjectPpsf - comps.p50) / comps.p50) * 100;
  const yoyPositive = area.yoyMedianPriceChangePct >= 0;

  return (
    <section
      data-testid="the-read"
      data-track="the-read"
      className="bg-ink-elevated/40 px-6 md:px-12 lg:px-16 py-12 md:py-16 border border-white/5"
    >
      <div className="max-w-[1200px] mx-auto">
        <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
        <CapsLabel as="h2" className="mb-4">The Read</CapsLabel>
        <p className="font-serif italic text-stone text-xl md:text-2xl leading-snug max-w-3xl mb-12">
          How this property reads against the active market — and the area at large.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* ── Left: Comps ─────────────────────────────── */}
          <div>
            <CapsLabel as="h3" className="text-[10px] text-stone/60 mb-1">
              vs. Active Comps
            </CapsLabel>
            <p className="caps text-[10px] text-stone/40 tracking-widest mb-8">
              {comps.count} comps · same community · ±20% size band
            </p>

            <CompDistributionChart
              p25={comps.p25}
              p50={comps.p50}
              p75={comps.p75}
              subject={subjectPpsf}
            />

            <div className="mt-8 pt-6 border-t border-white/10">
              <span className="caps text-[10px] text-stone/55 tracking-widest">
                Position vs. comps
              </span>
              <p
                className={`font-serif text-3xl md:text-4xl mt-1 ${
                  positionedAbove ? 'text-gold' : 'text-stone'
                }`}
              >
                {positionedAbove ? '+' : ''}
                {ppsfDeltaPct.toFixed(1)}%
                <span className="text-base text-stone/55 ml-3">
                  vs comp median {DOLLAR(comps.p50)}
                </span>
              </p>
            </div>

            {compsCommentary ? (
              <p className="mt-6 text-sm text-stone/75 leading-relaxed border-l-2 border-gold/40 pl-4 italic">
                {compsCommentary}
              </p>
            ) : null}
          </div>

          {/* ── Right: Area aggregate ───────────────────── */}
          <div>
            <CapsLabel as="h3" className="text-[10px] text-stone/60 mb-1">
              {area.label}
            </CapsLabel>
            <p className="caps text-[10px] text-stone/40 tracking-widest mb-8">
              Last 12 months · aggregate market signal
            </p>

            <PriceTrendSparkline
              monthlyMedianPpsf={area.monthlyMedianPpsf}
              caption="Median price / sqft, monthly"
            />

            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
              <Stat label="Median DOM" value={`${area.medianDom}`} unit="days" />
              <Stat label="Months supply" value={area.monthsOfSupply.toFixed(1)} unit="mo" />
              <Stat
                label="YoY median price"
                value={`${yoyPositive ? '+' : ''}${(area.yoyMedianPriceChangePct * 100).toFixed(1)}%`}
                accent={yoyPositive ? 'gold' : undefined}
              />
            </div>

            {areaCommentary ? (
              <p className="mt-6 text-sm text-stone/75 leading-relaxed border-l-2 border-gold/40 pl-4 italic">
                {areaCommentary}
              </p>
            ) : null}
          </div>
        </div>

        <p className="caps text-[9px] text-stone/30 tracking-widest mt-12 pt-6 border-t border-white/5">
          Source · ARMLS Spark · Refreshed hourly
        </p>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: 'gold';
}) {
  return (
    <div>
      <span className="caps text-[9px] text-stone/55 tracking-widest block mb-1">{label}</span>
      <p className={`font-serif text-2xl ${accent === 'gold' ? 'text-gold' : 'text-stone'}`}>
        {value}
        {unit ? <span className="text-xs text-stone/40 ml-1">{unit}</span> : null}
      </p>
    </div>
  );
}
