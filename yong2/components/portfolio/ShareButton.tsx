'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics/events';

interface ShareButtonProps {
  url: string;
  title: string;
  /**
   * Listing key for analytics. Optional only because some old call sites
   * may not have one yet — listing-detail always passes this.
   */
  listingKey?: string;
}

/**
 * Share affordance for the listing detail page. Tries the native Web
 * Share sheet first (mobile + supported desktops), then falls back to
 * copying the URL to clipboard with inline "Link copied" feedback.
 *
 * Either path fires `cta_share_click` so we can compare share-method
 * adoption across visitors.
 */
export function ShareButton({ url, title, listingKey }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator === 'undefined') return;
    const navAny = navigator as Navigator & {
      share?: (data: { url: string; title: string }) => Promise<void>;
    };
    if (typeof navAny.share === 'function') {
      try {
        await navAny.share({ url, title });
        if (listingKey) {
          track('cta_share_click', { method: 'navigator', listingKey });
        }
        return;
      } catch {
        // User cancelled or sheet failed — fall through to clipboard.
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        if (listingKey) {
          track('cta_share_click', { method: 'clipboard', listingKey });
        }
      } catch {
        // Clipboard blocked — silently no-op.
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="caps border border-gold/40 text-stone px-6 py-4 hover:bg-gold hover:text-ink transition-colors"
      aria-live="polite"
    >
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}
