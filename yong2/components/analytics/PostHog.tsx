'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useConsent } from '@/lib/analytics/use-consent';

let initialized = false;

/**
 * PostHog Cloud — custom events, funnels, identification.
 *
 * Configured events-only:
 *   - autocapture: false           (Clarity covers behavioral observation)
 *   - capture_pageview: false      (PageviewTracker fires SPA pageviews)
 *   - capture_pageleave: true      (cheap, useful for funnel exits)
 *   - disable_session_recording: gated on NEXT_PUBLIC_POSTHOG_RECORDING (off
 *                                  by default so the free-tier recording cap
 *                                  isn't burned silently. Set the env var to
 *                                  '1' to enable; Clarity remains independent
 *                                  of this toggle).
 *   - person_profiles: 'identified_only'  (cheaper — anon visitors are events
 *                                          only until they convert)
 *   - respect_dnt: true            (PostHog itself checks DNT)
 *   - persistence: 'cookie'        (visible to the cookie disclosure)
 *
 * Opt-in / opt-out is bound to the `consent.analytics` toggle so flipping it
 * in the preferences page takes effect immediately.
 */
export function PostHogScript() {
  const consent = useConsent();

  useEffect(() => {
    if (initialized) return;
    if (!consent.analytics) return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    // First-party reverse proxy — see next.config.ts rewrites. The default
    // `/ingest` path keeps the SDK on the same origin so ad blockers that
    // filter `posthog.com` don't drop our events. The env var lets a deploy
    // bypass the proxy if it's misconfigured (point straight at PostHog).
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? '/ingest';
    const uiHost = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? 'https://us.posthog.com';

    const recordingEnabled = process.env.NEXT_PUBLIC_POSTHOG_RECORDING === '1';
    posthog.init(key, {
      api_host: apiHost,
      ui_host: uiHost,
      person_profiles: 'identified_only',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: !recordingEnabled,
      respect_dnt: true,
      persistence: 'cookie',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug();
      },
    });
    initialized = true;
  }, [consent.analytics]);

  // React to consent changes after init: opt out (clears event queue, sets
  // local opt-out cookie) or opt back in.
  useEffect(() => {
    if (!initialized) return;
    if (consent.analytics) posthog.opt_in_capturing();
    else posthog.opt_out_capturing();
  }, [consent.analytics]);

  return null;
}

export { posthog };
