'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { CityOption } from '@/lib/listings-search';

type CityAutocompleteProps = {
  /**
   * Full city list pre-fetched on the server. ~200 entries — small enough
   * to filter client-side per keystroke without any roundtrip.
   */
  cityOptions: CityOption[];
  /** Currently selected cities (case as they appear in CityOption.city). */
  value: string[];
  onChange: (next: string[]) => void;
};

const DROPDOWN_LIMIT = 50;
const AUTO_APPLY_MS = 200;

/**
 * Type-ahead city picker. Two behaviours stacked:
 *
 *  1. Filtering — every keystroke narrows the dropdown to prefix matches first,
 *     then substring matches. No DB roundtrip per keystroke; the full list is
 *     hydrated once by SSR.
 *
 *  2. Optimistic auto-apply — if the typed value uniquely identifies a city
 *     (case-insensitive prefix match against exactly one option) and the user
 *     pauses typing for 200ms, that city is silently added to the filter so
 *     the listings panel refetches without requiring a click. The user can
 *     keep typing to pick a different one.
 *
 * Keyboard:
 *  - ↓ / ↑ — move highlight
 *  - Enter — accept highlighted option
 *  - Tab — accept top match and close
 *  - Esc  — close dropdown without committing
 *  - Backspace on empty input — remove the last selected pill
 */
export function CityAutocomplete({ cityOptions, value, onChange }: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the filtered + ranked list. Prefix matches outrank substring
  // matches so typing "Sco" surfaces Scottsdale at the top even though
  // many other cities contain "co".
  const matches = useMemo<CityOption[]>(() => {
    const selectedSet = new Set(value.map((c) => c.toLowerCase()));
    const available = cityOptions.filter((c) => !selectedSet.has(c.city.toLowerCase()));
    const needle = inputValue.trim().toLowerCase();
    if (!needle) return available.slice(0, DROPDOWN_LIMIT);
    const prefix: CityOption[] = [];
    const substring: CityOption[] = [];
    for (const opt of available) {
      const lower = opt.city.toLowerCase();
      if (lower.startsWith(needle)) prefix.push(opt);
      else if (lower.includes(needle)) substring.push(opt);
    }
    return [...prefix, ...substring].slice(0, DROPDOWN_LIMIT);
  }, [cityOptions, inputValue, value]);

  // Reset highlight when the match list shifts under it.
  useEffect(() => {
    setHighlight(0);
  }, [matches]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Optimistic auto-apply: when typed text uniquely identifies a city
  // (single prefix match, OR exact-equal substring match) and the user
  // has paused, commit that city silently.
  useEffect(() => {
    if (autoApplyTimerRef.current) clearTimeout(autoApplyTimerRef.current);
    const needle = inputValue.trim().toLowerCase();
    if (!needle) return;

    const prefixMatches = matches.filter((m) => m.city.toLowerCase().startsWith(needle));
    const exact = matches.find((m) => m.city.toLowerCase() === needle);
    const candidate = exact ?? (prefixMatches.length === 1 ? prefixMatches[0] : null);
    if (!candidate) return;

    autoApplyTimerRef.current = setTimeout(() => {
      commit(candidate.city);
    }, AUTO_APPLY_MS);

    return () => {
      if (autoApplyTimerRef.current) clearTimeout(autoApplyTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, matches]);

  const commit = useCallback(
    (city: string) => {
      if (autoApplyTimerRef.current) {
        clearTimeout(autoApplyTimerRef.current);
        autoApplyTimerRef.current = null;
      }
      if (value.some((c) => c.toLowerCase() === city.toLowerCase())) {
        setInputValue('');
        return;
      }
      onChange([...value, city]);
      setInputValue('');
      setHighlight(0);
      // keep focus so the user can chain selections
      inputRef.current?.focus();
    },
    [onChange, value],
  );

  const removeAt = useCallback(
    (idx: number) => {
      const next = value.filter((_, i) => i !== idx);
      onChange(next);
    },
    [onChange, value],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setHighlight((h) => Math.min(h + 1, matches.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const pick = matches[highlight];
        if (pick) commit(pick.city);
      } else if (e.key === 'Tab' && matches.length > 0 && inputValue.trim()) {
        // Tab accepts the top match without losing focus to the next form
        // control. Plays the role of "accept the ghost completion."
        e.preventDefault();
        commit(matches[0].city);
      } else if (e.key === 'Escape') {
        setOpen(false);
        setInputValue('');
      } else if (e.key === 'Backspace' && inputValue.length === 0 && value.length > 0) {
        removeAt(value.length - 1);
      }
    },
    [commit, highlight, inputValue, matches, removeAt, value.length],
  );

  // The "ghost completion" overlay: shows the suffix of the top prefix
  // match grayed out behind the input text. Purely visual hint that
  // Tab will fill it in.
  const ghost = useMemo(() => {
    if (!inputValue) return '';
    const top = matches[0];
    if (!top) return '';
    const lowerNeedle = inputValue.toLowerCase();
    const lowerCity = top.city.toLowerCase();
    if (!lowerCity.startsWith(lowerNeedle)) return '';
    return top.city.slice(inputValue.length);
  }, [inputValue, matches]);

  return (
    <div
      ref={containerRef}
      className="relative border-b border-white/10 bg-ink-elevated/95 backdrop-blur-sm"
    >
      <div className="px-4 md:px-6 py-3 flex flex-wrap items-center gap-2">
        {value.map((city, idx) => (
          <span
            key={`${city}-${idx}`}
            className="inline-flex items-center gap-1.5 border border-gold/40 bg-gold/10 text-gold px-2 py-1 text-xs"
          >
            {city}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              aria-label={`Remove ${city}`}
              className="hover:text-stone leading-none text-base"
            >
              ×
            </button>
          </span>
        ))}

        <div className="relative flex-1 min-w-[12rem]">
          {/* Ghost completion — absolutely positioned span behind the
              caret that renders the suffix the user can Tab-complete. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center pl-8 pr-3 text-stone whitespace-pre overflow-hidden"
          >
            <span className="invisible">{inputValue}</span>
            <span className="text-mute/70">{ghost}</span>
          </div>

          <svg
            aria-hidden
            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-mute"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.828 0L6.343 16.657a8 8 0 1 1 11.314 0Z"
            />
            <circle cx="12" cy="11" r="3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? 'Type any city — Scottsdale, Mesa, Buckeye…' : 'Add another…'}
            aria-label="Filter by city"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="city-autocomplete-listbox"
            autoComplete="off"
            spellCheck={false}
            className="relative w-full bg-transparent border-b border-white/15 focus:border-gold focus:outline-none pl-8 pr-3 py-2 text-stone placeholder:text-mute"
          />
        </div>

        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="caps text-xs text-mute hover:text-stone"
          >
            Clear cities
          </button>
        ) : null}
      </div>

      {open && (
        <div
          id="city-autocomplete-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 max-h-80 overflow-y-auto border-b border-white/10 bg-ink shadow-xl"
        >
          {matches.length === 0 ? (
            <p className="px-4 md:px-6 py-3 text-xs text-mute">
              {inputValue ? `No cities match “${inputValue}”` : 'No cities available'}
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {matches.map((opt, idx) => {
                const active = idx === highlight;
                return (
                  <li key={opt.city}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => commit(opt.city)}
                      className={`w-full flex items-center justify-between gap-3 px-4 md:px-6 py-2 text-left text-sm ${
                        active ? 'bg-gold/10 text-gold' : 'text-stone hover:bg-white/5'
                      }`}
                    >
                      <span>{opt.city}</span>
                      <span className="text-[10px] tabular-nums text-mute">
                        {opt.count.toLocaleString('en-US')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
