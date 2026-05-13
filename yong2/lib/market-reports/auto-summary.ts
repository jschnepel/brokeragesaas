/**
 * Deterministic weekly summary generator. Pure template interpolation
 * — no LLM, no external service, no randomness. Same input → same
 * paragraph every time.
 *
 * Branch thresholds (chosen to read honest at luxury-metro scale):
 *   - "flat":           |delta| < 1.0%
 *   - "modest":         1.0%  ≤ |delta| < 3.0%
 *   - "notable":        3.0%  ≤ |delta| < 8.0%
 *   - "sharp":          8.0%  ≤ |delta|
 *
 * Auto-summary intentionally avoids editorial framings ("the market
 * is hot", "buyers are returning") — that's Yong's territory in the
 * monthly read. Weekly stays in the observational register.
 */

import type { TierBreakdown, TrendSeries, WeeklyStats } from '../market-reports';

type Magnitude = 'flat' | 'modest' | 'notable' | 'sharp';

function magnitude(deltaPct: number): Magnitude {
  const abs = Math.abs(deltaPct);
  if (abs < 1.0) return 'flat';
  if (abs < 3.0) return 'modest';
  if (abs < 8.0) return 'notable';
  return 'sharp';
}

function describeDelta(deltaPct: number | null | undefined): {
  verb: string;
  qualifier: string;
  signed: string;
} | null {
  if (deltaPct == null || !Number.isFinite(deltaPct)) return null;
  const mag = magnitude(deltaPct);
  const isFlat = mag === 'flat';
  const isUp = deltaPct > 0;
  const verb = isFlat
    ? 'held roughly flat'
    : isUp
      ? mag === 'sharp'
        ? 'jumped'
        : mag === 'notable'
          ? 'rose'
          : 'edged up'
      : mag === 'sharp'
        ? 'fell sharply'
        : mag === 'notable'
          ? 'pulled back'
          : 'edged down';
  const qualifier = isFlat
    ? ''
    : `${isUp ? '+' : ''}${deltaPct.toFixed(1)}%`;
  const signed = `${isUp && !isFlat ? '+' : ''}${deltaPct.toFixed(1)}%`;
  return { verb, qualifier, signed };
}

function tierLine(breakdown: TierBreakdown | null): string {
  if (!breakdown || breakdown.tiers.length === 0) return '';
  const sorted = [...breakdown.tiers].sort((a, b) => b.active - a.active);
  const heavy = sorted[0];
  if (!heavy || heavy.active === 0) return '';
  const domPart = heavy.medianDom != null ? `, median ${Math.round(heavy.medianDom)} days on market` : '';
  return ` The ${heavy.label} band carried the most inventory — ${heavy.active} active listings${domPart}.`;
}

function trendContext(trend: TrendSeries | null): string {
  if (!trend || trend.metric !== 'newListings' || trend.points.length < 4) return '';
  const last = trend.points[trend.points.length - 1].value;
  const avg = trend.points[trend.points.length - 1].rollingAvg;
  if (avg == null || avg === 0) return '';
  const ratio = (last - avg) / avg;
  if (Math.abs(ratio) < 0.05) return '';
  const direction = ratio > 0 ? 'above' : 'below';
  const pct = Math.abs(ratio * 100).toFixed(0);
  return ` The week's pace ran ${pct}% ${direction} its trailing 4-week average.`;
}

/**
 * Compose the 1-paragraph weekly read.
 *
 *   "The week ending {Sunday}: new listings {verb} {qualifier} vs the
 *    prior week{, +/-X% YoY}. {Trend context line}. {Tier line}."
 *
 * Returns "" when stats are entirely null (e.g. period is published
 * but the supply mart has gone silent — extremely unlikely but the
 * UI shouldn't crash on it).
 */
export function generateWeeklySummary(
  stats: WeeklyStats,
  breakdown: TierBreakdown | null,
  trend: TrendSeries | null,
): string {
  const parts: string[] = [];
  const sundayDate = stats.weekEnd;

  const wow = describeDelta(stats.wow?.newListings);
  const yoy = describeDelta(stats.yoy?.newListings);

  if (wow) {
    const wowQual = wow.qualifier ? ` (${wow.qualifier} vs the prior week)` : '';
    parts.push(
      `The week ending ${sundayDate} closed with ${stats.newListings} new listings, which ${wow.verb}${wowQual}.`,
    );
  } else {
    parts.push(`The week ending ${sundayDate} closed with ${stats.newListings} new listings.`);
  }

  if (yoy && yoy.qualifier) {
    parts.push(
      `Year-over-year the count ${yoy.verb} ${yoy.signed}.`,
    );
  }

  parts.push(trendContext(trend).trim());
  parts.push(tierLine(breakdown).trim());

  return parts.filter(Boolean).join(' ');
}

/**
 * Monthly cadence summary is intentionally NOT auto-generated — that's
 * Yong's prose in MDX. This stub exists so consumers can call a
 * single helper and get either an auto-string (weekly) or null
 * (monthly = MDX-sourced).
 */
export function generateAutoSummary(): null {
  return null;
}
