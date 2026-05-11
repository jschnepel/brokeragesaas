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
 * Snapshot of a saved listing, persisted in localStorage so the /saved
 * index page can render without re-fetching every listing from Spark.
 * Kept intentionally minimal — only the fields the saved-listings
 * tile needs.
 */
export interface SavedListingSnapshot {
  key: string;
  slug: string;
  address: string;
  community: string;
  price: number | null;
  imageUrl: string | null;
  beds: number | null;
  baths: number | null;
  livingArea: number | null;
  savedAt: string; // ISO timestamp, drives recency sort on /saved
}

const STORAGE_KEY = 'yong2_saved_listings_v2';
const STORAGE_KEY_LEGACY = 'yong2_saved_listings';
const SAVED_LISTINGS_CHANGE_EVENT = 'yong2:saved-listings-change';
const RECENT_STORAGE_KEY = 'yong2_recently_viewed_v1';
const RECENT_VIEWED_CHANGE_EVENT = 'yong2:recently-viewed-change';
const RECENT_CAP = 20;

function readSavedSnapshots(): SavedListingSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is SavedListingSnapshot =>
      x && typeof x === 'object' && typeof x.key === 'string',
    );
  } catch {
    return [];
  }
}

function writeSavedSnapshots(next: SavedListingSnapshot[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(SAVED_LISTINGS_CHANGE_EVENT));
  } catch {
    /* localStorage unavailable */
  }
}

/**
 * Public reader for /saved page. Returns a stable array sorted by
 * most-recently-saved descending. Safe to call client-side only.
 */
export function getSavedListings(): SavedListingSnapshot[] {
  return [...readSavedSnapshots()].sort((a, b) => {
    const ta = new Date(a.savedAt).getTime() || 0;
    const tb = new Date(b.savedAt).getTime() || 0;
    return tb - ta;
  });
}

/** Subscribe to localStorage saves so the nav badge stays in sync. */
export function onSavedListingsChange(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const wrapped = () => handler();
  window.addEventListener(SAVED_LISTINGS_CHANGE_EVENT, wrapped);
  // storage event fires across tabs.
  window.addEventListener('storage', wrapped);
  return () => {
    window.removeEventListener(SAVED_LISTINGS_CHANGE_EVENT, wrapped);
    window.removeEventListener('storage', wrapped);
  };
}

/**
 * Snapshot of a recently-viewed listing, persisted alongside saves
 * so the /saved page can render a "Recently viewed" strip without
 * re-fetching from Spark. Shape mirrors SavedListingSnapshot except
 * the timestamp tracks the visit, not the save.
 */
export type RecentlyViewedSnapshot = SavedListingSnapshot;

function readRecentSnapshots(): RecentlyViewedSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is RecentlyViewedSnapshot =>
      x && typeof x === 'object' && typeof x.key === 'string',
    );
  } catch {
    return [];
  }
}

function writeRecentSnapshots(next: RecentlyViewedSnapshot[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(RECENT_VIEWED_CHANGE_EVENT));
  } catch {
    /* localStorage unavailable */
  }
}

/**
 * Public reader for /saved page. Returns recently-viewed listings
 * sorted by most-recent visit descending. Capped at RECENT_CAP.
 */
export function getRecentlyViewed(): RecentlyViewedSnapshot[] {
  return [...readRecentSnapshots()].sort((a, b) => {
    const ta = new Date(a.savedAt).getTime() || 0;
    const tb = new Date(b.savedAt).getTime() || 0;
    return tb - ta;
  });
}

export function onRecentlyViewedChange(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const wrapped = () => handler();
  window.addEventListener(RECENT_VIEWED_CHANGE_EVENT, wrapped);
  window.addEventListener('storage', wrapped);
  return () => {
    window.removeEventListener(RECENT_VIEWED_CHANGE_EVENT, wrapped);
    window.removeEventListener('storage', wrapped);
  };
}

/**
 * Record a visit to a listing. Called once on listing-detail mount.
 * Dedupes by key (revisiting bumps to the top, doesn't duplicate).
 */
export function recordRecentView(snapshot: Omit<RecentlyViewedSnapshot, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  const current = readRecentSnapshots();
  const filtered = current.filter((s) => s.key !== snapshot.key);
  const entry: RecentlyViewedSnapshot = { ...snapshot, savedAt: new Date().toISOString() };
  const next = [entry, ...filtered].slice(0, RECENT_CAP);
  writeRecentSnapshots(next);
}

/**
 * Effect hook to record a listing-detail visit. Called once per
 * listing mount; the snapshot becomes the rendered tile on
 * /saved → Recently viewed.
 */
export function useRecordRecentView(
  snapshot: Omit<RecentlyViewedSnapshot, 'savedAt'>,
): void {
  useEffect(() => {
    recordRecentView(snapshot);
    // We intentionally only record on mount; useEffect's deps would
    // re-record on every snapshot identity change which double-counts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.key]);
}

/**
 * Convenience hook for localStorage-backed save state. When a snapshot
 * is supplied, saving stores the full record so the /saved page can
 * render the tile without re-fetching from Spark. When omitted, only
 * the key is tracked (back-compat for callers that don't need the
 * snapshot — e.g. card-level Save controls on the search page).
 */
export function useSavedListing(
  listingKey: string,
  snapshot?: Omit<SavedListingSnapshot, 'key' | 'savedAt'>,
): {
  isSaved: boolean;
  toggle: () => void;
} {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // One-time migration: drop the legacy string[] format. Old
    // entries don't have enough data to render anyway.
    if (window.localStorage.getItem(STORAGE_KEY_LEGACY)) {
      window.localStorage.removeItem(STORAGE_KEY_LEGACY);
    }
    setIsSaved(readSavedSnapshots().some((s) => s.key === listingKey));
    const unsub = onSavedListingsChange(() => {
      setIsSaved(readSavedSnapshots().some((s) => s.key === listingKey));
    });
    return unsub;
  }, [listingKey]);

  function toggle() {
    if (typeof window === 'undefined') return;
    const current = readSavedSnapshots();
    const has = current.some((s) => s.key === listingKey);
    const next: SavedListingSnapshot[] = has
      ? current.filter((s) => s.key !== listingKey)
      : (() => {
          const stub: SavedListingSnapshot = {
            key: listingKey,
            slug: snapshot?.slug ?? '',
            address: snapshot?.address ?? '',
            community: snapshot?.community ?? '',
            price: snapshot?.price ?? null,
            imageUrl: snapshot?.imageUrl ?? null,
            beds: snapshot?.beds ?? null,
            baths: snapshot?.baths ?? null,
            livingArea: snapshot?.livingArea ?? null,
            savedAt: new Date().toISOString(),
          };
          return [stub, ...current].slice(0, 50);
        })();
    writeSavedSnapshots(next);
  }

  return { isSaved, toggle };
}
