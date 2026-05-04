'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useConsent } from '@/lib/analytics/use-consent';
import { track } from '@/lib/analytics/events';
import {
  bumpStep,
  endSession,
  getOrCreateSession,
  recordActivity,
  recordScrollPct,
} from '@/lib/analytics/session';
import { bumpSessionStart } from '@/lib/analytics/contact-payload';

/**
 * Session lifecycle manager — owns the visitor journey from arrival to exit.
 *
 *   Mount  → open or resume a session, fire `session_started` if new.
 *   Route  → bump step counter on each pathname change ($pageview already
 *            fires from PageviewTracker; we just keep the step index in sync).
 *   Active → record activity ticks (mousemove/keydown/scroll/click/touch +
 *            visibilitychange→visible) so active_ms excludes idle/background.
 *   Scroll → keep max-scroll-pct on the live session for the end summary.
 *   Exit   → fire `session_ended` via posthog.capture on `pagehide`. PostHog's
 *            SDK uses navigator.sendBeacon on unload, so the event survives
 *            even if the network is closing.
 *
 * The component renders nothing — all behavior is effects on `document`.
 */
export function SessionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consent = useConsent();
  // Track whether we've already fired session_ended for the current session
  // — pagehide can fire twice (bfcache transitions) and we don't want a
  // double-end event.
  const endedRef = useRef(false);

  // Open / resume the session on mount + on every route change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const referrer = document.referrer || '';
    const search = searchParams?.toString() ?? '';
    const { session, isNew } = getOrCreateSession({
      analyticsConsent: consent.analytics,
      pathname: pathname ?? '/',
      search,
      referrer,
    });
    bumpStep({ analyticsConsent: consent.analytics, pathname: pathname ?? '/' });
    if (isNew) {
      // Increment the persistent session counter in localStorage so
      // returning-visitor signal feeds into the contact-form lead score.
      bumpSessionStart(Date.now());
      track('session_started', {
        session_id: session.id,
        landing_pathname: session.landing.pathname,
        landing_search: session.landing.search,
        referrer: session.landing.referrer,
        ...(session.landing.utmSource ? { utm_source: session.landing.utmSource } : {}),
        ...(session.landing.utmMedium ? { utm_medium: session.landing.utmMedium } : {}),
        ...(session.landing.utmCampaign ? { utm_campaign: session.landing.utmCampaign } : {}),
        ...(session.landing.utmTerm ? { utm_term: session.landing.utmTerm } : {}),
        ...(session.landing.utmContent ? { utm_content: session.landing.utmContent } : {}),
        ...(session.landing.gclid ? { gclid: session.landing.gclid } : {}),
        ...(session.landing.fbclid ? { fbclid: session.landing.fbclid } : {}),
        ...(session.landing.msclkid ? { msclkid: session.landing.msclkid } : {}),
        ...(session.landing.ttclid ? { ttclid: session.landing.ttclid } : {}),
      });
      // A new session in this tab means the prior end has already either
      // fired or expired; reset the local guard.
      endedRef.current = false;
    }
  }, [pathname, searchParams, consent.analytics]);

  // Activity ticks — passive listeners on document. Throttle ourselves: the
  // recordActivity helper only writes to storage when active_ms accumulated
  // by ≥1s, so high-frequency mousemove is cheap.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!consent.analytics) return;

    const tick = () => {
      const visible =
        typeof document !== 'undefined' && document.visibilityState === 'visible';
      recordActivity({ analyticsConsent: consent.analytics, visible });
    };
    const events: Array<keyof DocumentEventMap> = [
      'mousemove',
      'keydown',
      'scroll',
      'click',
      'touchstart',
    ];
    for (const e of events) {
      document.addEventListener(e, tick, { passive: true } as AddEventListenerOptions);
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      for (const e of events) {
        document.removeEventListener(e, tick);
      }
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [consent.analytics]);

  // Mirror scroll percentage onto the session so the end-event reports it.
  // EngagementTracker already fires depth milestones; this is the running
  // max for the session-summary payload.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!consent.analytics) return;
    const onScroll = () => {
      const total = document.documentElement.scrollHeight;
      if (total <= 0) return;
      const scrolled = window.scrollY + window.innerHeight;
      const pct = Math.min(100, Math.floor((scrolled / total) * 100));
      recordScrollPct(pct, { analyticsConsent: consent.analytics });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [consent.analytics, pathname]);

  // Exit handler — fire session_ended on pagehide. PostHog's transport uses
  // navigator.sendBeacon on unload paths so the event reliably ships even
  // when the tab is closing.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!consent.analytics) return;

    const fireEnd = (reason: 'pagehide' | 'idle_timeout' | 'consent_revoked') => {
      if (endedRef.current) return;
      const summary = endSession({
        exitPathname: pathname ?? '/',
        analyticsConsent: consent.analytics,
      });
      if (!summary) return;
      endedRef.current = true;
      track('session_ended', { ...summary, reason });
    };

    const onPageHide = () => fireEnd('pagehide');
    const onBeforeUnload = () => fireEnd('pagehide');

    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [pathname, consent.analytics]);

  return null;
}
