'use client';

import { useEffect, useState } from 'react';

type MediaTab = {
  key: 'photos' | 'floor-plan' | 'tour';
  label: string;
  count?: number;
  href?: string;
  onClick?: () => void;
};

type HeroTopBarProps = {
  status: string;
  daysOnMarket?: number | null;
  listingId?: string | null;
  /** Media tabs that exist for this listing. Photos always present; the
   *  others render only when their respective assets exist. */
  mediaTabs: ReadonlyArray<MediaTab>;
  /** Toggle controls for the saved-listing localStorage state. */
  isSaved: boolean;
  onToggleSave: () => void;
  /** Currently active media tab (visual underline). */
  activeTab: MediaTab['key'];
};

/**
 * Hero top overlay — single row anchored top of the gallery section.
 * Three slots: status (left), media tabs (center), save + MLS# (right).
 *
 * Reads as a thin chrome bar over the photo, never competes with the
 * bottom overlay where the address/price live. Caps tracking, hairline
 * separators, restrained — editorial luxury chrome.
 */
export function HeroTopBar({
  status,
  daysOnMarket,
  listingId,
  mediaTabs,
  isSaved,
  onToggleSave,
  activeTab,
}: HeroTopBarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left — status + DOM */}
      <div className="flex items-center gap-3 md:gap-4 caps text-[10px] md:text-[11px]">
        <span className="bg-ink/80 backdrop-blur-sm border border-stone/20 px-3 py-2 text-stone tracking-[0.32em] leading-none">
          {status.toUpperCase()}
        </span>
        {daysOnMarket != null ? (
          <span className="hidden md:inline text-stone/65 tracking-[0.28em] tabular-nums">
            {daysOnMarket} {daysOnMarket === 1 ? 'day' : 'days'} on market
          </span>
        ) : null}
      </div>

      {/* Center — media tabs (only when more than 1 tab exists) */}
      {mediaTabs.length > 1 ? (
        <div className="hidden md:flex items-center gap-1 bg-ink/70 backdrop-blur-sm border border-stone/15 px-1 py-1">
          {mediaTabs.map((tab) => (
            <MediaTabButton key={tab.key} tab={tab} active={activeTab === tab.key} />
          ))}
        </div>
      ) : null}

      {/* Right — save + MLS# */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSave}
          className={`caps inline-flex items-center gap-2 text-[10px] md:text-[11px] tracking-[0.3em] px-3 py-2 backdrop-blur-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors ${
            isSaved
              ? 'bg-gold/95 text-ink border-gold'
              : 'bg-ink/70 text-stone border-stone/20 hover:border-gold hover:text-gold'
          }`}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remove from saved' : 'Save this listing'}
        >
          <SaveIcon filled={isSaved} />
          <span className="hidden md:inline">{isSaved ? 'Saved' : 'Save'}</span>
        </button>
        {listingId ? (
          <span className="hidden md:inline caps text-stone/45 text-[10px] tracking-[0.28em] tabular-nums">
            MLS# {listingId}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MediaTabButton({ tab, active }: { tab: MediaTab; active: boolean }) {
  const className = `caps inline-flex items-center gap-2 px-3 py-1.5 text-[11px] tracking-widest transition-colors ${
    active
      ? 'bg-gold text-ink'
      : 'text-stone/85 hover:text-gold'
  }`;
  if (tab.href) {
    return (
      <a href={tab.href} className={className}>
        {tab.label}
        {tab.count != null ? <span className="opacity-70">· {tab.count}</span> : null}
      </a>
    );
  }
  return (
    <button type="button" onClick={tab.onClick} className={className}>
      {tab.label}
      {tab.count != null ? <span className="opacity-70">· {tab.count}</span> : null}
    </button>
  );
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/**
 * Convenience hook for localStorage-backed save state. Stores a flat
 * array of listingKey strings under `yong2_saved_listings`.
 */
export function useSavedListing(listingKey: string): {
  isSaved: boolean;
  toggle: () => void;
} {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('yong2_saved_listings');
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      setIsSaved(list.includes(listingKey));
    } catch {
      /* localStorage unavailable — feature degrades silently */
    }
  }, [listingKey]);

  function toggle() {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('yong2_saved_listings');
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const next = list.includes(listingKey)
        ? list.filter((k) => k !== listingKey)
        : [listingKey, ...list].slice(0, 50); // cap at 50
      window.localStorage.setItem('yong2_saved_listings', JSON.stringify(next));
      setIsSaved(next.includes(listingKey));
    } catch {
      /* localStorage unavailable */
    }
  }

  return { isSaved, toggle };
}
