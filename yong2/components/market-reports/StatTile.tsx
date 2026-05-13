import type { ReactNode } from 'react';
import { YoYChip, type YoYChipProps } from './YoYChip';

/**
 * Headline-stat tile — caps label, serif numeral, optional unit, and
 * up to two delta chips (e.g. WoW + YoY, or MoM + YoY). When `value`
 * is null the tile renders an em-dash so the page never reflows.
 */
export interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Optional unit, rendered small after the value: "days", "mo", "%". */
  unit?: string;
  /** Up to two delta chips. Order: short-period first, year-over-year second. */
  chips?: YoYChipProps[];
  /** Optional sub-line under the chips for context (e.g. "Phoenix metro · all"). */
  footnote?: string;
  className?: string;
}

export function StatTile({
  label,
  value,
  unit,
  chips,
  footnote,
  className = '',
}: StatTileProps) {
  return (
    <div
      className={`bg-ink-elevated/40 border border-white/5 hover:border-white/15 transition-colors duration-300 p-5 md:p-7 flex flex-col gap-3 ${className}`}
    >
      <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">{label}</p>
      <p
        className="font-serif tabular-nums leading-none tracking-[-0.015em] text-stone"
        style={{ fontSize: 'clamp(28px, 3vw, 38px)' }}
      >
        {value ?? <span className="text-stone/40">—</span>}
        {unit ? (
          <span className="text-base text-stone/40 ml-2 font-sans tracking-normal">
            {unit}
          </span>
        ) : null}
      </p>
      {chips && chips.length > 0 ? (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 pt-1">
          {chips.map((chip, i) => (
            <YoYChip key={`${chip.label}-${i}`} {...chip} />
          ))}
        </div>
      ) : null}
      {footnote ? (
        <p className="caps text-[9px] tracking-[0.32em] text-stone/40 pt-1">{footnote}</p>
      ) : null}
    </div>
  );
}
