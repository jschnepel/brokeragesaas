/**
 * Inline delta chip — "↑ 4.2% YoY", "↓ 1.1% WoW", etc.
 *
 * `pct` is a signed percentage (e.g. -1.1 or 4.2). When null the chip
 * renders nothing — keep the consumer's surface clean of placeholders.
 *
 * `direction` controls colour semantics:
 *   - 'up-is-good'   → ↑ gold, ↓ stone (pricing, volume, sales)
 *   - 'up-is-bad'    → ↑ stone, ↓ gold (DOM, months supply)
 *   - 'neutral'      → both ↑ ↓ in stone (new-listing supply pulse)
 *
 * Default is 'up-is-good' since most chips on a luxury report read
 * "more value / more activity is good".
 */
export type DeltaDirection = 'up-is-good' | 'up-is-bad' | 'neutral';

export interface YoYChipProps {
  pct: number | null | undefined;
  /** Label suffix: "YoY", "MoM", "WoW", "vs 52wk". */
  label: string;
  /** Colour semantics; default 'up-is-good'. */
  direction?: DeltaDirection;
  /** Pct values smaller than this in absolute terms render as "flat"
   *  without an arrow. Default 0.1 (one-tenth of a percent). */
  flatThreshold?: number;
}

export function YoYChip({
  pct,
  label,
  direction = 'up-is-good',
  flatThreshold = 0.1,
}: YoYChipProps) {
  if (pct == null || !Number.isFinite(pct)) return null;

  const isFlat = Math.abs(pct) < flatThreshold;
  const isUp = pct > 0;
  const arrow = isFlat ? '·' : isUp ? '↑' : '↓';
  const display = `${isUp && !isFlat ? '+' : ''}${pct.toFixed(1)}%`;

  // Colour: gold when "good", muted stone when "bad", neutral stone
  // for cadences that don't have a directional preference.
  const isGood = isFlat
    ? false
    : direction === 'up-is-good'
      ? isUp
      : direction === 'up-is-bad'
        ? !isUp
        : false;
  const tone =
    direction === 'neutral' || isFlat
      ? 'text-stone/70'
      : isGood
        ? 'text-gold'
        : 'text-stone/55';

  return (
    <span
      className={`inline-flex items-baseline gap-1 caps text-[10px] tracking-[0.25em] ${tone}`}
      aria-label={`${display} ${label}`}
    >
      <span aria-hidden="true" className="text-[11px] leading-none">
        {arrow}
      </span>
      <span className="tabular-nums">{display}</span>
      <span className="text-stone/40">{label}</span>
    </span>
  );
}
