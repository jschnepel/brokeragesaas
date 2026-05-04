'use client';

import { useEffect, useState } from 'react';
import {
  buildDecision,
  readConsent,
  writeConsent,
  type ConsentState,
} from '@/lib/analytics/consent';

type ConsentSettingsProps = {
  /** Called after a successful save. Banner uses this to dismiss itself. */
  onSaved?: (next: ConsentState) => void;
  /** Show or hide the "Reject all / Accept all" shortcut row. */
  showShortcuts?: boolean;
  /** Compact layout for the banner; verbose layout for the preferences page. */
  variant?: 'banner' | 'page';
};

function dispatchConsentChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('consentChanged'));
}

function dispatchConsentGranted() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('consentGranted'));
}

/**
 * Per-category toggles plus the three "decision shortcuts" (reject all,
 * accept all, save preferences). Used in two places:
 *   1. Inside <CookieBanner /> as the expanded-preferences view.
 *   2. On /privacy/preferences as the standalone settings UI.
 *
 * Save dispatches `consentChanged` (always) and `consentGranted` (only when
 * analytics flips true) so SDK initializers and the `useConsent` hook react
 * without a page reload.
 */
export function ConsentSettings({
  onSaved,
  showShortcuts = true,
  variant = 'page',
}: ConsentSettingsProps) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const current = readConsent();
    setAnalytics(current.analytics);
    setMarketing(current.marketing);
    setHydrated(true);
  }, []);

  function persist(next: { analytics: boolean; marketing: boolean }) {
    const decision = buildDecision(next);
    writeConsent(decision);
    const fresh = readConsent();
    dispatchConsentChanged();
    if (next.analytics) dispatchConsentGranted();
    onSaved?.(fresh);
  }

  function handleSave() {
    persist({ analytics, marketing });
  }
  function handleAcceptAll() {
    setAnalytics(true);
    setMarketing(true);
    persist({ analytics: true, marketing: true });
  }
  function handleRejectAll() {
    setAnalytics(false);
    setMarketing(false);
    persist({ analytics: false, marketing: false });
  }

  if (!hydrated) {
    // Avoid SSR/CSR mismatch on toggle states.
    return null;
  }

  const isBanner = variant === 'banner';

  return (
    <div className={isBanner ? 'space-y-4' : 'space-y-8'}>
      <ul className={isBanner ? 'space-y-2' : 'space-y-4'}>
        <CategoryRow
          label="Strictly necessary"
          description="Required for the site to function (consent record, anonymous session id). Always on."
          checked
          disabled
          onChange={() => {
            /* noop */
          }}
        />
        <CategoryRow
          label="Analytics"
          description="Microsoft Clarity (session replay), PostHog (event metrics), Vercel Web Analytics (performance). IPs anonymized at ingestion."
          checked={analytics}
          onChange={setAnalytics}
        />
        <CategoryRow
          label="Marketing"
          description="Reserved for future advertising partners. No marketing pixels are loaded today."
          checked={marketing}
          onChange={setMarketing}
        />
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        {showShortcuts ? (
          <>
            <button
              type="button"
              onClick={handleRejectAll}
              className="caps text-stone/80 hover:text-gold transition-colors"
            >
              Reject All
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="caps bg-gold text-ink px-5 py-2 hover:bg-gold-muted transition-colors"
            >
              Accept All
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={handleSave}
          className="caps text-gold border border-gold/40 px-5 py-2 hover:border-gold transition-colors"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

type CategoryRowProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
};

function CategoryRow({ label, description, checked, disabled, onChange }: CategoryRowProps) {
  return (
    <li className="flex items-start justify-between gap-6 border-t border-white/5 pt-4 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <div className="caps text-gold text-xs">{label}</div>
        <p className="text-sm text-stone/70 mt-1 leading-relaxed">{description}</p>
      </div>
      <label className="shrink-0 inline-flex items-center cursor-pointer">
        <span className="sr-only">{label} toggle</span>
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={[
            'w-10 h-5 rounded-full relative transition-colors',
            disabled ? 'bg-gold/40 cursor-not-allowed' : checked ? 'bg-gold' : 'bg-white/15',
          ].join(' ')}
          aria-hidden
        >
          <span
            className={[
              'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-stone transition-transform',
              checked ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </span>
      </label>
    </li>
  );
}
