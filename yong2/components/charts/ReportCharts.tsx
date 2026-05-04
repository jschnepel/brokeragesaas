'use client';

import dynamic from 'next/dynamic';
import type { MarketReport } from '@/content/market-reports';

const PriceTrendChart = dynamic(
  () => import('./PriceTrendChart').then((m) => m.PriceTrendChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

const VolumeBandsChart = dynamic(
  () => import('./VolumeBandsChart').then((m) => m.VolumeBandsChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

const SupplyDemandChart = dynamic(
  () => import('./SupplyDemandChart').then((m) => m.SupplyDemandChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

const InventoryAgeChart = dynamic(
  () => import('./InventoryAgeChart').then((m) => m.InventoryAgeChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return (
    <div
      className="w-full h-[340px] border border-[color:var(--hairline)] animate-pulse"
      style={{ background: 'var(--ink-elevated)' }}
    />
  );
}

/**
 * Trend chart block — used by report detail + index "latest" feature.
 */
export function TrendChartBlock({ report }: { report: MarketReport }) {
  if (!report.charts) return null;
  return <PriceTrendChart data={report.charts.trend} />;
}

/**
 * Volume bands bar chart — used by report detail.
 */
export function VolumeChartBlock({ report }: { report: MarketReport }) {
  if (!report.charts) return null;
  return <VolumeBandsChart data={report.charts.volume} />;
}

/**
 * Supply-vs-demand monthly area chart — trailing 12 months. Used by
 * report detail in a dedicated "Pace of the market" section.
 */
export function SupplyDemandChartBlock({ report }: { report: MarketReport }) {
  if (!report.charts) return null;
  return <SupplyDemandChart data={report.charts.supplyDemand} />;
}

/**
 * Inventory-age stacked bars — current snapshot. Used by report detail.
 */
export function InventoryAgeChartBlock({ report }: { report: MarketReport }) {
  if (!report.charts || !report.charts.inventoryAge) return null;
  return <InventoryAgeChart data={report.charts.inventoryAge} />;
}
