'use client';

import { useEffect, useRef, useState } from 'react';

type SearchBarProps = {
  initialValue?: string;
  onChange: (value: string) => void;
  drawingActive: boolean;
  onToggleDrawing: () => void;
  onClearShape?: () => void;
  hasShape: boolean;
  loading?: boolean;
  resultCount?: number;
};

/**
 * Debounced text input + draw-toggle button. Owns its own input ref so
 * keystrokes feel local; it only fires `onChange` after a 250ms idle window.
 *
 * Uses `requestAnimationFrame`-friendly patterns — no synchronous DOM reads
 * — so typing remains 60fps even with the map repainting alongside.
 */
export function SearchBar({
  initialValue = '',
  onChange,
  drawingActive,
  onToggleDrawing,
  onClearShape,
  hasShape,
  loading = false,
  resultCount,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function handleChange(next: string) {
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(next), 250);
  }

  function handleClear() {
    setValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange('');
  }

  return (
    <div className="border-b border-white/10 bg-ink-elevated/95 backdrop-blur-sm">
      <div className="px-4 md:px-6 py-3 flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            aria-hidden
            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-mute"
            fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Address, city, community…"
            aria-label="Search listings"
            className="w-full bg-transparent border-b border-white/15 focus:border-gold focus:outline-none pl-8 pr-8 py-2 text-stone placeholder:text-mute"
          />
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-mute hover:text-stone text-lg leading-none"
            >
              ×
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggleDrawing}
          aria-pressed={drawingActive}
          className={`caps whitespace-nowrap px-3 py-2 border ${
            drawingActive
              ? 'border-gold text-gold bg-gold/10'
              : 'border-white/15 text-stone hover:border-gold hover:text-gold'
          } transition-colors`}
        >
          {drawingActive ? 'Drawing…' : 'Draw on map'}
        </button>
      </div>
      <div className="px-4 md:px-6 pb-3 flex items-center gap-3 text-xs text-mute">
        {loading ? <span className="text-gold">Searching…</span>
          : typeof resultCount === 'number'
            ? <span>{resultCount.toLocaleString('en-US')} listings</span>
            : null}
        {hasShape && onClearShape ? (
          <button
            type="button"
            onClick={onClearShape}
            className="caps text-gold hover:text-stone underline-offset-2 hover:underline ml-auto"
          >
            Clear shape
          </button>
        ) : null}
      </div>
    </div>
  );
}
