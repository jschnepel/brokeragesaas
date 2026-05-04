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
 * "The Read" — bento layout. Desktop: 7 tiles in two rows (asymmetric
 * grid; tile 1 hero spans 2 rows). Mobile: all tiles stack vertically
 * full-width — no horizontal scroll, every tile reads as its own card.
 *
 * Each tile owns its own surface (bg-ink-elevated/30 + hairline border)
 * so unequal content heights read as deliberate rhythm rather than
 * misalignment.
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
    <section data-testid="the-read" data-track="the-read">
      <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
      <CapsLabel as="h2" className="mb-4">The Read</CapsLabel>
      <p className="font-serif italic text-stone text-xl md:text-2xl leading-snug max-w-3xl mb-10 md:mb-12">
        How this property reads against the active market — and the area at large.
      </p>

      {/* ── Row 1: Position hero (2 rows) + chart tiles stacked ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] md:grid-rows-2 gap-4 mb-6 md:auto-rows-fr">
        {/* Tile 1 — Position (md: spans 2 rows) */}
        <Tile className="md:row-span-2 flex flex-col">
          <CapsLabel as="h3" className="text-[10px] text-stone/60 mb-1">
            Position vs Comps
          </CapsLabel>
          <p className="caps text-[10px] text-stone/40 tracking-widest mb-8">
            {comps.count} comps · same community · ±20% size band
          </p>
          <p
            className={`font-serif leading-none tabular-nums tracking-[-0.02em] ${
              positionedAbove ? 'text-gold' : 'text-stone'
            }`}
            style={{ fontSize: 'clamp(56px, 7vw, 88px)' }}
          >
            {positionedAbove ? '+' : ''}
            {ppsfDeltaPct.toFixed(1)}
            <span className="text-[0.5em] align-top ml-0.5">%</span>
          </p>
          <span className="block w-12 h-px bg-gold/40 my-5" />
          <p className="text-stone/65 text-sm md:text-base">
            vs comp median{' '}
            <span className="text-stone tabular-nums">{DOLLAR(comps.p50)}</span>
          </p>
          {compsCommentary ? (
            <p className="mt-auto pt-8 text-sm text-stone/75 leading-relaxed border-l-2 border-gold/40 pl-4 italic">
              {compsCommentary}
            </p>
          ) : null}
        </Tile>

        {/* Tile 2 — Comp distribution chart */}
        <Tile>
          <CapsLabel as="h3" className="text-[10px] text-stone/60 mb-1">
            Comp Distribution
          </CapsLabel>
          <p className="caps text-[10px] text-stone/40 tracking-widest mb-6">
            Subject vs comp pool quartiles
          </p>
          <CompDistributionChart
            p25={comps.p25}
            p50={comps.p50}
            p75={comps.p75}
            subject={subjectPpsf}
          />
        </Tile>

        {/* Tile 3 — 12-month sparkline */}
        <Tile>
          <CapsLabel as="h3" className="text-[10px] text-stone/60 mb-1">
            {area.label}
          </CapsLabel>
          <p className="caps text-[10px] text-stone/40 tracking-widest mb-6">
            12-month signal
          </p>
          <PriceTrendSparkline
            monthlyMedianPpsf={area.monthlyMedianPpsf}
            caption="Median price / sqft, monthly"
          />
        </Tile>
      </div>

      {/* ── Row 2: 3 stat tiles + commentary tile (1.5x width) ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1.5fr] gap-4 md:auto-rows-fr">
        <StatTile
          label="Median Days on Market"
          value={`${area.medianDom}`}
          unit="days"
        />
        <StatTile
          label="Months of Supply"
          value={area.monthsOfSupply.toFixed(1)}
          unit="mo"
        />
        <StatTile
          label="YoY Median Price"
          value={`${yoyPositive ? '+' : ''}${(area.yoyMedianPriceChangePct * 100).toFixed(1)}%`}
          accent={yoyPositive ? 'gold' : undefined}
        />
        {/* Commentary tile — wider to give the prose room */}
        <Tile className="flex items-start">
          {areaCommentary ? (
            <p className="text-sm text-stone/75 leading-relaxed border-l-2 border-gold/40 pl-4 italic self-center">
              {areaCommentary}
            </p>
          ) : (
            <p className="caps text-[10px] text-stone/30 tracking-widest self-center">
              No commentary available for this area.
            </p>
          )}
        </Tile>
      </div>

      <p className="caps text-[9px] text-stone/30 tracking-widest mt-8 pt-6 border-t border-white/5">
        Source · ARMLS Spark · Refreshed hourly
      </p>
    </section>
  );
}

/** Bento tile chrome — consistent surface across every tile in The Read. */
function Tile({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-ink-elevated/30 border border-white/5 hover:border-white/15 transition-colors duration-300 p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

/** Single-stat tile: caps label + serif display number + unit. */
function StatTile({
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
    <Tile className="flex flex-col justify-center">
      <CapsLabel as="h3" className="text-[10px] text-stone/60 mb-3">
        {label}
      </CapsLabel>
      <p
        className={`font-serif leading-none tabular-nums tracking-[-0.015em] ${
          accent === 'gold' ? 'text-gold' : 'text-stone'
        }`}
        style={{ fontSize: 'clamp(32px, 3.6vw, 44px)' }}
      >
        {value}
        {unit ? <span className="text-base text-stone/40 ml-2">{unit}</span> : null}
      </p>
    </Tile>
  );
}
