'use client';

import dynamic from 'next/dynamic';
import type { TrendSeries } from '@/lib/market-reports';

const TrendChartClient = dynamic(
  () => import('./TrendChartClient').then((m) => m.TrendChartClient),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return (
    <div
      className="w-full h-[300px] border border-[color:var(--hairline)] animate-pulse"
      style={{ background: 'var(--ink-elevated)' }}
    />
  );
}

export interface TrendChartProps {
  series: TrendSeries;
}

/**
 * Cadence-aware trend chart.
 *
 *   - Weekly cadence (`metric === 'newListings'`): bar chart of weekly
 *     new-listings counts + a champagne line overlay for the 4-week
 *     rolling average (smoothed signal).
 *   - Monthly cadence (`metric === 'medianPpsf'`): line chart of
 *     median price-per-sqft over 12 months.
 *
 * recharts is heavy; dynamic-imported client-side to keep the SSR
 * payload tight. Skeleton fills the slot during hydration.
 */
export function TrendChart({ series }: TrendChartProps) {
  if (series.points.length === 0) {
    return (
      <div
        className="w-full h-[280px] border border-[color:var(--hairline)] flex items-center justify-center"
        style={{ background: 'var(--ink-elevated)' }}
      >
        <p className="caps text-[10px] text-mute">{series.windowLabel} — no data yet</p>
      </div>
    );
  }
  return <TrendChartClient series={series} />;
}
