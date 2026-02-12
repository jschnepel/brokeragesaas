/**
 * Gradient bar legend overlay for the H3 heatmap.
 * Matches /map overlay style: navy glass + gold title + border-white/10.
 */

import type { HeatmapMetricDef } from '../../data/h3HeatmapData';
import { getGradientCss } from '../../data/h3HeatmapData';

interface HeatmapLegendProps {
  metricDef: HeatmapMetricDef;
  min: number;
  max: number;
}

const HeatmapLegend: React.FC<HeatmapLegendProps> = ({ metricDef, min, max }) => {
  const gradient = getGradientCss(metricDef.colorScale);

  return (
    <div className="absolute bottom-3 right-3 z-[1000] bg-[#0C1C2E]/90 backdrop-blur border border-white/10 px-3 py-2.5 pointer-events-auto">
      <span className="text-[8px] uppercase tracking-widest text-[#Bfa67a] font-bold block mb-1.5">
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
};

export default HeatmapLegend;
