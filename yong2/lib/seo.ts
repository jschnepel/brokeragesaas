export function siteUrl(path: string = ''): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${clean}`;
}

/**
 * Trim a paragraph to fit a meta-description budget without splitting
 * a word and append a single-character ellipsis when truncated. The
 * audit (2.9) flagged the previous `.slice(0, N)` approach producing
 * mid-word cuts like "kept the neighborhood coherent wh" — this helper
 * pulls back to the last full word before the budget.
 *
 * `max` is the character budget INCLUDING the ellipsis (so a 160-char
 * meta-description budget should pass max=160).
 */
export function truncateMetaDescription(text: string, max: number = 160): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  // Reserve one char for the ellipsis.
  const head = cleaned.slice(0, max - 1);
  const lastSpace = head.lastIndexOf(' ');
  // Pull back to the last full word; fall through to the raw slice if
  // the budget can't hold even one word (shouldn't happen with sane
  // max values but guards against pathological input).
  const safe = lastSpace > 0 ? head.slice(0, lastSpace) : head;
  return `${safe.replace(/[.,;:\-–—]+$/, '')}…`;
}
