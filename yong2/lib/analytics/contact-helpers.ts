/**
 * Helpers for the contact-form funnel events. Pulled out so the contact
 * tracking logic stays declarative and these can be unit-tested in isolation
 * without dragging the form mount lifecycle into the test rig.
 *
 *   - sha256Hex: Web Crypto SHA-256 → lowercase-hex string. Used to hash an
 *     email before passing it to PostHog `identify()` so we never write the
 *     raw PII into PostHog event properties.
 *   - deriveContactSource: classify how the visitor arrived at /contact based
 *     on the URL/referrer.
 *   - deriveSourceListing: read `?listing=…` if present.
 *   - deriveLeadScore: P2 placeholder — returns 0 for now. Proper scoring
 *     (recent listing views, time on site, etc.) is a P3 task.
 */

export type ContactSource = 'cta_button' | 'direct' | 'listing_tour' | 'external';

/**
 * Classify the contact-form entry point.
 *
 * Order matters:
 *   - `?listing=...` → 'listing_tour' (the request-tour CTA on listing pages
 *     forwards through this query param)
 *   - same-host referrer → 'cta_button' (any internal CTA that ends up here)
 *   - external referrer → 'external'
 *   - no referrer → 'direct' (typed URL, bookmark, app open)
 */
export function deriveContactSource(opts: {
  search: string;
  referrer: string;
  hostname: string;
}): ContactSource {
  const params = new URLSearchParams(opts.search);
  if (params.get('listing')) return 'listing_tour';
  if (!opts.referrer) return 'direct';
  try {
    const r = new URL(opts.referrer);
    if (r.hostname === opts.hostname) return 'cta_button';
    return 'external';
  } catch {
    return 'direct';
  }
}

/** Pull `?listing=…` for source-listing attribution. */
export function deriveSourceListing(search: string): string | undefined {
  const params = new URLSearchParams(search);
  const v = params.get('listing');
  return v ?? undefined;
}

/**
 * P2 placeholder. P3 will score using PostHog history (recent listing_view
 * count, time on page, depth of engagement). For now we don't gate the form
 * on any signal, so 0 is a safe constant.
 */
export function deriveLeadScore(): number {
  return 0;
}

/**
 * SHA-256 hex digest using Web Crypto. Lower-cased + trimmed so the same
 * email always hashes to the same id regardless of how the visitor typed it.
 */
export async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input.toLowerCase().trim());
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
