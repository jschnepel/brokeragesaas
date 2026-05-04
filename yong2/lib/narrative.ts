/**
 * Deterministic narrative engine for market reports.
 *
 * Composes natural-language insights from the underlying chart data so
 * every report has a machine-backed "read" beside Yong's editorial copy.
 * These are pure functions — no AI, just rules + templates.
 */

import type {
  MarketReport,
  MedianBar,
  PriceBandPoint,
  QuarterPoint,
  Tier,
} from '@/content/market-reports';
import { COMMUNITY_TIERS } from '@/content/market-reports';

export type NarrativeBlock = {
  /** Short uppercase kicker — e.g. "Biggest mover" */
  label: string;
  /** Single-sentence key finding. */
  headline: string;
  /** Optional follow-up sentence with supporting detail. */
  detail?: string;
};

export type ReportNarrative = {
  /** 3–5 blocks surfaced as an "at-a-glance" snapshot near the top. */
  snapshot: NarrativeBlock[];
  /** Caption printed beneath the per-sqft trend chart. */
  trend: NarrativeBlock;
  /** Caption printed beneath the volume-by-price-band chart. */
  volume: NarrativeBlock;
  /** Caption printed beneath the neighborhood-median bars. */
  medians: NarrativeBlock;
};

/* ==================================================================
 * Formatting helpers
 * ================================================================== */

function fmtPct(n: number, decimals = 1): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(decimals)}%`;
}

/** Unsigned percent — for shares / ratios (vs. change). */
function fmtPctShare(n: number, decimals = 0): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

function fmtDollar(n: number): string {
  return `$${n.toLocaleString()}`;
}

function fmtPerSqft(n: number): string {
  return `${fmtDollar(n)}/sqft`;
}

/* ==================================================================
 * Aggregations
 * ================================================================== */

function tierOf(neighborhood: string): Tier | undefined {
  return COMMUNITY_TIERS[neighborhood];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/* ==================================================================
 * Medians analysis
 * ================================================================== */

function biggestGainer(medians: MedianBar[]): MedianBar | undefined {
  return [...medians].sort((a, b) => b.yoyChange - a.yoyChange)[0];
}

function smallestGainer(medians: MedianBar[]): MedianBar | undefined {
  return [...medians].sort((a, b) => a.yoyChange - b.yoyChange)[0];
}

function highestMedian(medians: MedianBar[]): MedianBar | undefined {
  return [...medians].sort((a, b) => b.median - a.median)[0];
}

function lowestMedian(medians: MedianBar[]): MedianBar | undefined {
  return [...medians].sort((a, b) => a.median - b.median)[0];
}

function tierAvgYoY(medians: MedianBar[], tier: Tier): number {
  const subset = medians.filter((m) => m.tier === tier);
  return mean(subset.map((m) => m.yoyChange));
}

function medianSpread(medians: MedianBar[]): {
  top: MedianBar;
  bottom: MedianBar;
  delta: number;
} | null {
  if (medians.length === 0) return null;
  const top = highestMedian(medians);
  const bottom = lowestMedian(medians);
  if (!top || !bottom) return null;
  return { top, bottom, delta: top.median - bottom.median };
}

/* ==================================================================
 * Trend analysis — quarter-over-quarter movement
 * ================================================================== */

type QoQMove = {
  neighborhood: string;
  from: number;
  to: number;
  pct: number;
};

function qoqMoves(trend: QuarterPoint[]): QoQMove[] {
  if (trend.length < 2) return [];
  const last = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  const moves: QoQMove[] = [];
  for (const key of Object.keys(last)) {
    if (key === 'quarter') continue;
    const to = Number(last[key]);
    const from = Number(prev[key]);
    if (Number.isFinite(to) && Number.isFinite(from) && from > 0) {
      moves.push({
        neighborhood: key,
        from,
        to,
        pct: (to - from) / from,
      });
    }
  }
  return moves;
}

function qoqSweep(
  trend: QuarterPoint[],
  tier: Tier,
): { up: number; total: number } {
  const moves = qoqMoves(trend).filter((m) => tierOf(m.neighborhood) === tier);
  const up = moves.filter((m) => m.pct > 0).length;
  return { up, total: moves.length };
}

/* ==================================================================
 * Volume analysis
 * ================================================================== */

function totalSold(volume: PriceBandPoint[]): number {
  return sum(volume.map((v) => v.sold));
}

function totalActive(volume: PriceBandPoint[]): number {
  return sum(volume.map((v) => v.forSale));
}

function busiestBand(volume: PriceBandPoint[]): PriceBandPoint | undefined {
  return [...volume].sort((a, b) => b.sold - a.sold)[0];
}

function topEndAbsorption(volume: PriceBandPoint[]): {
  band: string;
  pct: number;
} | null {
  // Combine the top two bands as "top end"
  if (volume.length < 2) return null;
  const top = volume.slice(-2);
  const sold = sum(top.map((v) => v.sold));
  const active = sum(top.map((v) => v.forSale));
  const total = sold + active;
  if (total === 0) return null;
  return {
    band: `${volume[volume.length - 2].band} + ${volume[volume.length - 1].band}`,
    pct: sold / total,
  };
}

/* ==================================================================
 * Block builders
 * ================================================================== */

function bigMoverBlock(medians: MedianBar[]): NarrativeBlock | null {
  const winner = biggestGainer(medians);
  if (!winner) return null;
  return {
    label: 'Biggest mover',
    headline: `${winner.neighborhood} led the quarter with a ${fmtPct(winner.yoyChange)} year-over-year gain.`,
    detail: `Current median stands at ${fmtPerSqft(winner.median)}.`,
  };
}

function tierAverageBlock(medians: MedianBar[]): NarrativeBlock | null {
  const sig = tierAvgYoY(medians, 'signature');
  const not = tierAvgYoY(medians, 'notable');
  if (!Number.isFinite(sig) || !Number.isFinite(not)) return null;

  const sigCount = medians.filter((m) => m.tier === 'signature').length;
  const notCount = medians.filter((m) => m.tier === 'notable').length;
  if (sigCount === 0 || notCount === 0) return null;

  const comparison =
    Math.abs(sig - not) < 0.005
      ? 'in line with'
      : sig > not
        ? 'outpaced'
        : 'trailed';

  return {
    label: 'Tier lens',
    headline: `Signature-tier communities averaged ${fmtPct(sig)} YoY, ${comparison} the notable tier at ${fmtPct(not)}.`,
    detail: `Aggregated across ${sigCount} signature and ${notCount} notable communities.`,
  };
}

function spreadBlock(medians: MedianBar[]): NarrativeBlock | null {
  const spread = medianSpread(medians);
  if (!spread) return null;
  const ratio = spread.top.median / spread.bottom.median;
  return {
    label: 'Portfolio spread',
    headline: `${spread.top.neighborhood} leads the portfolio at ${fmtPerSqft(spread.top.median)} — ${ratio.toFixed(1)}× ${spread.bottom.neighborhood} at ${fmtPerSqft(spread.bottom.median)}.`,
    detail: `A per-sqft gap of ${fmtDollar(Math.round(spread.delta))} between the top and bottom communities tracked.`,
  };
}

function qoqBlock(trend: QuarterPoint[]): NarrativeBlock | null {
  const sweep = qoqSweep(trend, 'signature');
  if (sweep.total === 0) return null;
  const phrase =
    sweep.up === sweep.total
      ? 'clean-sweep quarter'
      : sweep.up === 0
        ? 'across-the-board pullback'
        : `${sweep.up}-of-${sweep.total} signature communities trending up`;
  return {
    label: 'Signature direction',
    headline:
      sweep.up === sweep.total
        ? `All ${sweep.total} signature communities moved up quarter-over-quarter — a ${phrase}.`
        : `${sweep.up} of ${sweep.total} signature communities posted QoQ gains this quarter.`,
    detail: `Measured against last quarter's median per-sqft.`,
  };
}

function absorptionBlock(volume: PriceBandPoint[]): NarrativeBlock | null {
  const top = topEndAbsorption(volume);
  if (!top) return null;
  return {
    label: 'Top-end absorption',
    headline: `The ${top.band} segment cleared at a ${fmtPctShare(top.pct)} sold-to-active ratio this quarter.`,
    detail: `The upper two price bands historically show the tightest absorption — a useful read on top-tier buyer depth.`,
  };
}

function transactionCountBlock(volume: PriceBandPoint[]): NarrativeBlock | null {
  const sold = totalSold(volume);
  const active = totalActive(volume);
  const busiest = busiestBand(volume);
  if (sold === 0 || !busiest) return null;
  const share = busiest.sold / sold;
  return {
    label: 'Transaction flow',
    headline: `${sold} luxury homes closed this quarter, with ${fmtPctShare(share)} in the ${busiest.band} band.`,
    detail: `An additional ${active} homes remain actively listed at close of quarter.`,
  };
}

/* ==================================================================
 * Chart-level captions
 * ================================================================== */

function trendCaption(trend: QuarterPoint[]): NarrativeBlock {
  const sweep = qoqSweep(trend, 'signature');
  const moves = qoqMoves(trend).filter(
    (m) => tierOf(m.neighborhood) === 'signature',
  );
  if (moves.length === 0) {
    return {
      label: 'Trend read',
      headline: 'Per-sqft medians plotted across the last eight quarters.',
    };
  }
  const biggest = [...moves].sort((a, b) => b.pct - a.pct)[0];
  return {
    label: 'Trend read',
    headline:
      sweep.up === sweep.total
        ? `All ${sweep.total} signature communities moved up this quarter; ${biggest.neighborhood} led at ${fmtPct(biggest.pct)} QoQ.`
        : `${biggest.neighborhood} posted the largest quarter-over-quarter gain at ${fmtPct(biggest.pct)}.`,
    detail: `Use the toggles above to overlay the notable and broader tiers.`,
  };
}

function volumeCaption(volume: PriceBandPoint[]): NarrativeBlock {
  const sold = totalSold(volume);
  const active = totalActive(volume);
  const ratio = active === 0 ? 0 : sold / active;
  const busiest = busiestBand(volume);
  return {
    label: 'Volume read',
    headline: busiest
      ? `${sold} closings vs. ${active} active listings across the tracked bands; ${busiest.band} was the busiest band.`
      : `${sold} closings vs. ${active} active listings across the tracked bands.`,
    detail: `Overall sold-to-active ratio: ${fmtPctShare(ratio)}.`,
  };
}

function mediansCaption(medians: MedianBar[]): NarrativeBlock {
  const mover = biggestGainer(medians);
  const lagger = smallestGainer(medians);
  if (!mover || !lagger) {
    return {
      label: 'Medians read',
      headline: 'Per-sqft medians by community, with year-over-year change.',
    };
  }
  if (mover.neighborhood === lagger.neighborhood) {
    return {
      label: 'Medians read',
      headline: `${mover.neighborhood} recorded a ${fmtPct(mover.yoyChange)} YoY move on a ${fmtPerSqft(mover.median)} median.`,
    };
  }
  return {
    label: 'Medians read',
    headline: `${mover.neighborhood} (${fmtPct(mover.yoyChange)}) led YoY gains; ${lagger.neighborhood} (${fmtPct(lagger.yoyChange)}) ran the softest.`,
    detail: `Sort the bars above to reorder by value, YoY change, or alphabetically.`,
  };
}

/* ==================================================================
 * Public API
 * ================================================================== */

export function buildReportNarrative(report: MarketReport): ReportNarrative | null {
  if (!report.charts) return null;
  const { trend, volume, medians } = report.charts;

  const snapshot: NarrativeBlock[] = [
    bigMoverBlock(medians),
    qoqBlock(trend),
    tierAverageBlock(medians),
    absorptionBlock(volume),
    transactionCountBlock(volume),
    spreadBlock(medians),
  ].filter((b): b is NarrativeBlock => b !== null);

  return {
    snapshot,
    trend: trendCaption(trend),
    volume: volumeCaption(volume),
    medians: mediansCaption(medians),
  };
}
