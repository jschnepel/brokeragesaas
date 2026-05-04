/**
 * Event catalog — typed surface for the 49 named events in the lead-tracking
 * plan. Phase 1 (this commit) only ships the types and the `track()` /
 * `identify()` stubs; no callers fire events yet. Phase 2 wires interactions
 * to these events at their call sites.
 *
 * Extend EventCatalog by adding a key. Properties for each event are typed —
 * `track('listing_view', { ... })` will fail to compile if a required prop is
 * missing, and tsc validates extra props too.
 */

import { posthog } from '@/components/analytics/PostHog';
import { getCurrentSessionContext, type SessionLanding } from './session';

export type EventCatalog = {
  page_view: { pathname: string; referrer?: string };
  external_link_click: { href: string; label?: string };

  // Session lifecycle — every other event in this catalog inherits
  // session_id + step_n from the active session via getCurrentSessionContext().
  session_started: {
    session_id: string;
    landing_pathname: string;
    landing_search: string;
    referrer: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    fbclid?: string;
    msclkid?: string;
    ttclid?: string;
  };
  session_ended: {
    session_id: string;
    total_ms: number;
    active_ms: number;
    page_count: number;
    step_n: number;
    max_scroll_pct: number;
    exit_pathname: string;
    landing: SessionLanding;
    reason: 'pagehide' | 'idle_timeout' | 'consent_revoked';
  };

  // Listing engagement
  listing_view: {
    listingKey: string;
    address: string;
    price: number | null;
    community: string | null;
    source: 'home' | 'portfolio' | 'listings' | 'search' | 'community' | 'direct';
  };
  listing_view_long: { listingKey: string; ms_on_page: number };
  listing_scroll_to_facts: { listingKey: string };
  listing_scroll_to_map: { listingKey: string };
  listing_scroll_to_the_read: { listingKey: string };
  gallery_open: { listingKey: string; initialIndex: number };
  gallery_photo_view: { listingKey: string; index: number };
  gallery_close: { listingKey: string; ms_in_gallery: number; photos_viewed: number };

  // Search / discovery
  search_query: { query_length: number; results_count: number };
  search_query_clear: Record<string, never>;
  filter_chip_toggle: { chip: string; on: boolean };
  map_pan: Record<string, never>;
  map_zoom: { direction: 'in' | 'out'; level: number };
  map_polygon_draw_start: Record<string, never>;
  map_polygon_draw_complete: { area_km2: number; results_count: number };
  map_polygon_clear: Record<string, never>;
  map_pin_click: { listingKey: string };
  result_card_hover: { listingKey: string };
  result_card_click: { listingKey: string; position: number };
  mobile_view_switch: { view: 'both' | 'map' | 'list' };

  // Community / market
  community_view: { slug: string; scopeType: 'community' | 'region' };
  community_card_click: { slug: string; position: number };
  market_report_view: { slug: string; quarter: string };
  chart_interact: { chart_type: string; action: string };

  // Lead funnel
  contact_form_view: { source: 'cta_button' | 'direct' | 'listing_tour' | 'external' };
  contact_form_focus_first: Record<string, never>;
  contact_form_field_complete: { field: string };
  contact_form_field_drop: { field: string };
  contact_form_validation_error: { field: string; reason: string };
  contact_form_submit_attempt: Record<string, never>;
  contact_form_submit_success: { interest: 'Buying' | 'Selling' | 'Both'; source_listing?: string };
  contact_form_submit_failure: { reason: string };
  contact_form_abandon: { fields_completed: string[] };

  // CTAs
  // `surface` lets us see which placement of the same CTA actually
  // converts — the sticky pill versus the closing action row, etc.
  cta_request_tour_click: { listingKey: string; surface?: 'inline' | 'sticky' | 'sticky-mobile' };
  cta_share_click: { method: 'navigator' | 'clipboard'; listingKey: string };
  cta_phone_click: { value: 'mobile' | 'office' };
  /**
   * Listing-detail click-to-call — distinct from the global
   * `cta_phone_click` (which is footer / contact-page scoped) so
   * the per-listing funnel stays clean.
   */
  cta_call_click: { listingKey: string; surface: 'sticky' | 'sticky-mobile' | 'inline' };
  cta_email_click: Record<string, never>;
  cta_instagram_click: Record<string, never>;
  cta_market_intelligence_click: Record<string, never>;

  // Engagement
  scroll_depth_25: { pathname: string };
  scroll_depth_50: { pathname: string };
  scroll_depth_75: { pathname: string };
  scroll_depth_100: { pathname: string };
  time_on_page_30s: { pathname: string };
  time_on_page_120s: { pathname: string };
};

type PostHogClient = {
  __loaded?: boolean;
  capture?: (event: string, props?: Record<string, unknown>) => void;
  identify?: (id: string, props?: Record<string, unknown>) => void;
};

function getClient(): PostHogClient | null {
  if (typeof window === 'undefined') return null;
  const ph = posthog as unknown as PostHogClient | undefined;
  if (!ph || !ph.__loaded) return null;
  return ph;
}

/**
 * Fire a typed event. No-op when:
 *   - SSR (no window)
 *   - PostHog hasn't loaded (e.g. consent.analytics is false)
 * Phase 2 may also POST high-value events to /api/track for server-side ETL;
 * for now only PostHog receives the event.
 *
 * Test hook: when `window.__yong2_test_capture__` is an array (set by
 * Playwright before page scripts run), every fired event is also appended
 * there. We push regardless of PostHog load state so call-site coverage
 * tests don't depend on the SDK being live in CI/dev (no real key).
 */
export function track<K extends keyof EventCatalog>(event: K, props: EventCatalog[K]): void {
  // Merge session context (session_id, step_n, session_age_ms) into every
  // event so PostHog's path/funnel reports stitch automatically. The
  // session_started event already carries its own session_id; merging the
  // same key from getCurrentSessionContext() is harmless and keeps the
  // call site uniform.
  const sessionCtx = typeof window !== 'undefined' ? getCurrentSessionContext() : {};
  const merged = { ...sessionCtx, ...(props as Record<string, unknown>) } as Record<string, unknown>;

  if (typeof window !== 'undefined') {
    const sink = (window as unknown as { __yong2_test_capture__?: Array<{ event: string; props: unknown }> })
      .__yong2_test_capture__;
    if (Array.isArray(sink)) {
      sink.push({ event: event as string, props: merged });
    }
  }
  const client = getClient();
  if (!client || !client.capture) return;
  client.capture(event as string, merged);
}

/**
 * Tag the current visitor with a persistent identifier (typically a hash of
 * their email post-conversion). Safe no-op until PostHog is loaded. Also
 * writes to the same test-capture sink as `track()` so funnel-completion
 * tests can assert identity stitching ran.
 */
export function identify(
  distinctId: string,
  props: { email: string; interest?: string; lead_score?: number },
): void {
  if (typeof window !== 'undefined') {
    const sink = (window as unknown as { __yong2_test_capture__?: Array<{ event: string; props: unknown }> })
      .__yong2_test_capture__;
    if (Array.isArray(sink)) {
      sink.push({ event: '$identify', props: { distinctId, ...props } });
    }
  }
  const client = getClient();
  if (!client || !client.identify) return;
  client.identify(distinctId, props as unknown as Record<string, unknown>);
}
