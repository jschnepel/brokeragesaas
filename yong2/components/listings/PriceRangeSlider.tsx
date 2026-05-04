'use client';

import { useId, useRef } from 'react';

type PriceRangeSliderProps = {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  /** Minimum gap between the two thumbs, in the same units as value. */
  minGap?: number;
};

/**
 * Dual-thumb range slider — both thumbs share one track.
 *
 * Implementation: two native <input type="range"> overlaid, with a visual
 * track drawn underneath and the active range segment highlighted between
 * the two thumb positions. Thumb styling lives in `app/globals.css` under
 * `.range-thumb` so the component itself stays declarative. No runtime deps.
 *
 * Ported from Jeane's site; the visual treatment was retuned for the
 * midnight/gold palette (gold accent track, ink-filled thumb that fills
 * gold on hover/active).
 */
export function PriceRangeSlider({
  min,
  max,
  step = 250_000,
  value,
  onChange,
  minGap = 500_000,
}: PriceRangeSliderProps) {
  const [minVal, maxVal] = value;
  const trackRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const minPct = ((minVal - min) / (max - min)) * 100;
  const maxPct = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between caps text-mute mb-3">
        <span>Price</span>
        <span className="text-stone normal-case tracking-normal text-xs">
          {fmtPrice(minVal)} — {maxVal >= max ? `${fmtPrice(max)}+` : fmtPrice(maxVal)}
        </span>
      </div>

      <div ref={trackRef} className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/15" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-gold"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />

        <input
          aria-label="Minimum price"
          id={`${id}-min`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(e) => {
            const next = Math.min(+e.target.value, maxVal - minGap);
            onChange([next, maxVal]);
          }}
          className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: minVal > max - step ? 5 : 3 }}
        />

        <input
          aria-label="Maximum price"
          id={`${id}-max`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={(e) => {
            const next = Math.max(+e.target.value, minVal + minGap);
            onChange([minVal, next]);
          }}
          className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 caps text-mute opacity-70">
        <span>{fmtPrice(min)}</span>
        <span>{fmtPrice(max)}+</span>
      </div>
    </div>
  );
}

function fmtPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}
