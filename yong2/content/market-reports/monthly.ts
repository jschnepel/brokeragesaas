/**
 * Yong's Monthly Read — editorial prose seeds.
 *
 * Each entry is one calendar month's read, keyed by "YYYY-MM" slug.
 * The monthly detail template (`MonthlyReport`) renders `headline`
 * as the italic gold sub-title and `body` as the prose paragraphs.
 *
 * Authoring convention:
 *   - `headline`: 6-10 words, sentence case, no terminal punctuation.
 *   - `body`: 2-3 paragraphs of editorial. Plain strings — no
 *     markdown; the template wraps each entry in <p>.
 *   - When unpublished/in-progress: omit the entry entirely. The
 *     template falls back to "Yong is finalizing the {Month} read."
 *
 * The 24 seed entries below carry placeholder prose so the production
 * archive renders without empty states on launch. Replace each entry
 * with Yong's authored read as it publishes (15th of the following
 * month per the cadence).
 */

export interface MonthlyProse {
  /** Slug: "2026-04". */
  period: string;
  /** Sub-title: italic gold line above the prose. */
  headline: string;
  /** Editorial body, paragraph by paragraph. */
  body: string[];
}

/**
 * Generate the trailing 24 monthly periods ending one month before
 * the current calendar month — the same window the manifest exposes
 * — and stamp each with placeholder prose. Yong overrides individual
 * entries by adding them to `OVERRIDES` below.
 */
function trailingMonthSlugs(count: number): string[] {
  const now = new Date();
  const out: string[] = [];
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth(); // 0-based; current month is in-progress
  // Step back one month to land on the most-recently-complete calendar month.
  month -= 1;
  if (month < 0) {
    month = 11;
    year -= 1;
  }
  for (let i = 0; i < count; i += 1) {
    out.push(`${year}-${String(month + 1).padStart(2, '0')}`);
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return out;
}

const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function placeholderEntry(period: string): MonthlyProse {
  const [yStr, mStr] = period.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10) - 1;
  const monthName = MONTH_LONG[month] ?? period;
  return {
    period,
    headline: `${monthName} ${year} read — pending publication`,
    body: [
      `Yong&rsquo;s ${monthName} read is in development; the editorial pass publishes on the 15th of the following calendar month.`,
      `In the interim, the stat tiles above carry the latest closed data from ARMLS — median price-per-sqft, days-on-market, transaction volume, and inventory by tier. The trend chart anchors twelve months of context.`,
      `For a private read on how this month&rsquo;s data applies to a specific address, neighborhood, or representation question — reach out directly.`,
    ],
  };
}

/**
 * Hand-authored overrides — replace placeholders by adding a key here.
 * Empty for now (seed-only); Yong populates as monthly reads publish.
 */
const OVERRIDES: Record<string, MonthlyProse> = {};

const _seeds = trailingMonthSlugs(24).map((slug) =>
  OVERRIDES[slug] ?? placeholderEntry(slug),
);

export const MONTHLY_PROSE: Record<string, MonthlyProse> = Object.fromEntries(
  _seeds.map((e) => [e.period, e]),
);

export function getMonthlyProse(period: string): MonthlyProse | null {
  return MONTHLY_PROSE[period] ?? null;
}
