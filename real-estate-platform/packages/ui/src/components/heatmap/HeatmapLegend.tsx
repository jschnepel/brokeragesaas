'use client';

/**
 * Gradient bar legend overlay for the H3 heatmap.
 * Navy glass background with gold accent title.
 */

import type { HeatmapMetricDef } from './types';
import { getGradientCss } from './types';

export interface HeatmapLegendProps {
  metricDef: HeatmapMetricDef;
  min: number;
  max: number;
}

export function HeatmapLegend({ metricDef, min, max }: HeatmapLegendProps) {
  const gradient = getGradientCss();

  return (
    <div className="absolute bottom-3 right-3 z-10 bg-navy/90 backdrop-blur border border-white/10 px-3 py-2.5 pointer-events-auto">
      <span className="text-[8px] uppercase tracking-widest text-gold font-bold block mb-1.5">
        {metricDef.label}
      </span>
      <div
        className="h-2 rounded-sm border border-white/10"
        style={{ width: 140, background: gradient }}
      />
      <div className="flex justify-between mt-1" style={{ width: 140 }}>
        <span className="text-[9px] text-white/50 font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {metricDef.format(min)}
        </span>
        <span className="text-[9px] text-white/50 font-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {metricDef.format(max)}
        </span>
      </div>
    </div>
  );
}
