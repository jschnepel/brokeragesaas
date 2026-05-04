/**
 * Analytics data confidence thresholds.
 *
 * Based on industry standards (Redfin, Zillow, Case-Shiller methodology)
 * and statistical literature on median reliability.
 *
 * n < 20:  Suppress entirely — median unreliable
 * n 20-49: Low confidence — show with caveat
 * n >= 50: Full confidence
 */

export const SAMPLE_THRESHOLDS = {
  /** Below this: suppress metric, show "--" */
  SUPPRESS: 20,
  /** Below this: show with low-confidence styling */
  LOW_CONFIDENCE: 50,
} as const;

export const YOY_THRESHOLDS = {
  /** Both periods must have at least this many observations */
  MIN_BOTH_PERIODS: 30,
  /** Smaller period must be at least this fraction of larger */
  MIN_RATIO: 0.2,
} as const;

export type ConfidenceLevel = 'high' | 'low' | 'suppressed';

export function getConfidence(sampleCount: number): ConfidenceLevel {
  if (sampleCount < SAMPLE_THRESHOLDS.SUPPRESS) return 'suppressed';
  if (sampleCount < SAMPLE_THRESHOLDS.LOW_CONFIDENCE) return 'low';
  return 'high';
}

export function isYoyReliable(currentN: number, priorN: number): boolean {
  if (currentN < YOY_THRESHOLDS.MIN_BOTH_PERIODS) return false;
  if (priorN < YOY_THRESHOLDS.MIN_BOTH_PERIODS) return false;
  const ratio = Math.min(currentN, priorN) / Math.max(currentN, priorN);
  return ratio >= YOY_THRESHOLDS.MIN_RATIO;
}

/**
 * Returns the last fully-elapsed calendar month as "March 2026" format.
 * Used for "Data through [Month Year]" display.
 */
export function getLastCompleteMonthLabel(): string {
  const now = new Date();
  const prior = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  return `${months[prior.getUTCMonth()]} ${prior.getUTCFullYear()}`;
}
