'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  buildDecision,
  readConsent,
  respectsDoNotTrack,
  shouldPromptAgain,
  writeConsent,
  type ConsentState,
} from '@/lib/analytics/consent';
import { ConsentSettings } from './ConsentSettings';

/**
 * Bottom-fixed cookie consent banner. Renders only when:
 *   - the cookie is missing, OR
 *   - the schema version has been bumped, OR
 *   - the prior decision is older than 365 days.
 *
 * Browsers sending DNT auto-reject and the banner never paints.
 *
 * The banner intentionally renders client-side only — first-paint flash is
 * acceptable and auditable, and SSR rendering would either leak the banner
 * to all visitors regardless of cookie or require server-side cookie reads
 * we don't need yet.
 */
export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (respectsDoNotTrack()) {
      // DNT users get an implicit "reject all" stamped now so we don't keep
      // re-evaluating the prompt on every nav.
      const current = readConsent();
      if (shouldPromptAgain(current)) {
        writeConsent(buildDecision({ analytics: false, marketing: false }));
        window.dispatchEvent(new CustomEvent('consentChanged'));
      }
      setShow(false);
      return;
    }

    setShow(shouldPromptAgain(readConsent()));
  }, []);

  function handleSaved(_next: ConsentState) {
    setShow(false);
    setShowPrefs(false);
  }

  function handleAcceptAll() {
    writeConsent(buildDecision({ analytics: true, marketing: true }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('consentChanged'));
      window.dispatchEvent(new CustomEvent('consentGranted'));
    }
    setShow(false);
    setShowPrefs(false);
  }

  function handleRejectAll() {
    writeConsent(buildDecision({ analytics: false, marketing: false }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('consentChanged'));
    }
    setShow(false);
    setShowPrefs(false);
  }

  // Mobile starts collapsed as a corner pill (bottom-right) so the hero
  // fold isn't dominated by a full-width 3-button strip. Tapping the pill
  // expands the bottom-sheet form. Desktop keeps the full strip layout.
  const [mobileExpanded, setMobileExpanded] = useState(false);

  if (!show) return null;

  // Mobile collapsed state — small bottom-right pill.
  if (!mobileExpanded && !showPrefs) {
    return (
      <>
        {/* Mobile pill (< md) */}
        <button
          type="button"
          onClick={() => setMobileExpanded(true)}
          className="md:hidden fixed bottom-4 right-4 z-50 bg-ink/90 backdrop-blur-sm border border-gold/30 text-gold caps text-[10px] px-4 py-2.5 rounded-full shadow-lg hover:border-gold transition-colors"
          aria-label="Cookie preferences"
          data-testid="cookie-banner-pill"
        >
          Cookies ⚙
        </button>
        {/* Desktop full bar (>= md) */}
        <DesktopBar
          onAccept={handleAcceptAll}
          onReject={handleRejectAll}
          onPrefs={() => setShowPrefs(true)}
        />
      </>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-0 inset-x-0 z-50 bg-ink/95 backdrop-blur-sm border-t border-white/10 text-stone"
      data-testid="cookie-banner"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-5 md:py-6">
        {!showPrefs ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <p className="text-sm leading-relaxed text-stone/85 max-w-2xl">
              We use cookies for analytics and to improve your experience.{' '}
              <Link href="/privacy/policy" className="text-gold hover:text-gold-muted underline underline-offset-4">
                Read our Privacy Policy
              </Link>
              .
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRejectAll}
                className="caps text-stone/80 hover:text-gold transition-colors"
                data-testid="cookie-banner-reject"
              >
                Reject All
              </button>
              <button
                type="button"
                onClick={() => setShowPrefs(true)}
                className="caps text-gold border border-gold/40 px-4 py-2 hover:border-gold transition-colors"
                data-testid="cookie-banner-prefs"
              >
                Preferences
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="caps bg-gold text-ink px-5 py-2 hover:bg-gold-muted transition-colors"
                data-testid="cookie-banner-accept"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="caps">Cookie Preferences</div>
                <p className="text-sm text-stone/70 mt-1 max-w-2xl">
                  Choose which categories of cookies you allow. You can change this any time at{' '}
                  <Link href="/privacy/preferences" className="text-gold underline underline-offset-4">
                    /privacy/preferences
                  </Link>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrefs(false)}
                className="caps text-stone/60 hover:text-gold transition-colors"
              >
                Back
              </button>
            </div>
            <ConsentSettings variant="banner" onSaved={handleSaved} showShortcuts />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Desktop-only full strip — used when mobile is collapsed to its pill.
 * Hides at < md so it doesn't compete with the pill.
 */
function DesktopBar({
  onAccept,
  onReject,
  onPrefs,
}: {
  onAccept: () => void;
  onReject: () => void;
  onPrefs: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="hidden md:block fixed bottom-0 inset-x-0 z-40 bg-ink/95 backdrop-blur-sm border-t border-white/10 text-stone"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-4">
        <div className="flex items-center justify-between gap-5">
          <p className="text-sm leading-relaxed text-stone/85 max-w-2xl">
            We use cookies for analytics and to improve your experience.{' '}
            <Link href="/privacy/policy" className="text-gold hover:text-gold-muted underline underline-offset-4">
              Read our Privacy Policy
            </Link>
            .
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={onReject} className="caps text-stone/80 hover:text-gold transition-colors">
              Reject All
            </button>
            <button
              type="button"
              onClick={onPrefs}
              className="caps text-gold border border-gold/40 px-4 py-2 hover:border-gold transition-colors"
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="caps bg-gold text-ink px-5 py-2 hover:bg-gold-muted transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
