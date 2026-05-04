'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { siteContent } from '@/content/site';
import { track } from '@/lib/analytics/events';

/**
 * Global engagement + CTA-tap tracker. Mounted once in the root layout so
 * every route gets these signals for free:
 *
 *   - scroll_depth_25 / 50 / 75 / 100 — fired once per route
 *   - time_on_page_30s / 120s         — fired once per route
 *   - cta_phone_click                 — delegate on tel: anchors
 *   - cta_email_click                 — delegate on mailto: anchors
 *   - cta_instagram_click             — delegate on instagram.com anchors
 *   - external_link_click             — delegate on any cross-origin anchor
 *                                       that isn't tel:/mailto:/instagram
 *
 * Pathname is read via `usePathname()` so we reset milestones + timers when
 * the user navigates to a new route (Next App Router doesn't unmount the
 * layout). The click delegate is bound on `document` once and lives across
 * route changes — anchor matching is what filters by event type.
 */
export function EngagementTracker() {
  const pathname = usePathname();
  const fired = useRef<Set<string>>(new Set());

  // Per-pathname engagement: scroll-depth + time-on-page.
  useEffect(() => {
    fired.current = new Set();

    const onScroll = () => {
      const total = document.documentElement.scrollHeight;
      if (total <= 0) return;
      const scrolled = window.scrollY + window.innerHeight;
      const pct = Math.floor((scrolled / total) * 100);
      const milestones = [25, 50, 75, 100] as const;
      for (const m of milestones) {
        const key = `scroll_${m}`;
        if (pct >= m && !fired.current.has(key)) {
          fired.current.add(key);
          // Map milestone → typed event name. Static lookup keeps the
          // catalog type-safe; we don't accept any other numbers.
          if (m === 25) track('scroll_depth_25', { pathname });
          else if (m === 50) track('scroll_depth_50', { pathname });
          else if (m === 75) track('scroll_depth_75', { pathname });
          else track('scroll_depth_100', { pathname });
        }
      }
    };

    const t30 = setTimeout(() => {
      if (!fired.current.has('time_30')) {
        fired.current.add('time_30');
        track('time_on_page_30s', { pathname });
      }
    }, 30_000);

    const t120 = setTimeout(() => {
      if (!fired.current.has('time_120')) {
        fired.current.add('time_120');
        track('time_on_page_120s', { pathname });
      }
    }, 120_000);

    window.addEventListener('scroll', onScroll, { passive: true });
    // Fire once on mount in case the page loads already past a milestone
    // (deep-link to long page, browser-restored scroll position).
    onScroll();

    return () => {
      clearTimeout(t30);
      clearTimeout(t120);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  // Global anchor-click delegate. Mounted once on the document so every CTA —
  // including ones rendered deep in MDX, dynamic islands, or 3rd-party widgets
  // — fires the right tracking event without per-component instrumentation.
  useEffect(() => {
    const officeNumberCondensed = siteContent.contact.mobileHref
      .replace(/[^0-9+]/g, '');

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      // tel: → cta_phone_click
      if (anchor.protocol === 'tel:') {
        const condensed = anchor.href.replace(/[^0-9+]/g, '');
        const value: 'mobile' | 'office' =
          condensed === officeNumberCondensed ? 'mobile' : 'office';
        track('cta_phone_click', { value });
        return;
      }

      // mailto: → cta_email_click
      if (anchor.protocol === 'mailto:') {
        track('cta_email_click', {});
        return;
      }

      // Need both href + hostname for the remaining checks. Anchor href can
      // be an empty string, fragment-only, or a relative same-page link.
      if (!anchor.href || !anchor.hostname) return;

      // Instagram → cta_instagram_click
      if (anchor.hostname.endsWith('instagram.com')) {
        track('cta_instagram_click', {});
        return;
      }

      // Any other cross-origin anchor → external_link_click
      if (anchor.hostname !== window.location.hostname) {
        track('external_link_click', {
          href: anchor.href,
          label: anchor.textContent?.trim().slice(0, 64) || undefined,
        });
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
