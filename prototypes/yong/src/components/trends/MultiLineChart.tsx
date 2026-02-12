import { useState, useRef } from 'react';

export interface ChartSeries {
  label: string;
  data: number[];
  color: string;
  yAxis: 'left' | 'right';
  format?: (v: number) => string;
}

interface MultiLineChartProps {
  labels: string[];
  series: ChartSeries[];
  height?: number;
}

const MultiLineChart: React.FC<MultiLineChartProps> = ({ labels, series, height = 240 }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 600;
  const H = height;
  const pad = { top: 20, right: 60, bottom: 30, left: 60 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const leftSeries = series.filter(s => s.yAxis === 'left');
  const rightSeries = series.filter(s => s.yAxis === 'right');

  const leftMin = Math.min(...leftSeries.flatMap(s => s.data));
  const leftMax = Math.max(...leftSeries.flatMap(s => s.data));
  const leftRange = leftMax - leftMin || 1;

  const rightMin = rightSeries.length > 0 ? Math.min(...rightSeries.flatMap(s => s.data)) : 0;
  const rightMax = rightSeries.length > 0 ? Math.max(...rightSeries.flatMap(s => s.data)) : 100;
  const rightRange = rightMax - rightMin || 1;

  const n = labels.length;

  const xScale = (i: number) => pad.left + (i / (n - 1)) * plotW;
  const yScaleLeft = (v: number) => pad.top + plotH - ((v - leftMin) / leftRange) * plotH;
  const yScaleRight = (v: number) => pad.top + plotH - ((v - rightMin) / rightRange) * plotH;

  const buildPath = (data: number[], yScale: (v: number) => number) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');

  // Y-axis tick labels
  const leftTicks = [leftMin, leftMin + leftRange * 0.5, leftMax];
  const rightTicks = rightSeries.length > 0 ? [rightMin, rightMin + rightRange * 0.5, rightMax] : [];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((x - pad.left) / plotW) * (n - 1));
    setHoverIdx(Math.max(0, Math.min(n - 1, idx)));
  };

  const defaultFormat = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `${v}`;

  return (
    <div className="bg-white border border-gray-100 p-4">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        {series.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-[8px] uppercase tracking-[0.15em] font-bold text-gray-500">
            <span className="w-3 h-[2px] block" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        className="overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line
            key={i}
            x1={pad.left}
            x2={W - pad.right}
            y1={pad.top + plotH * (1 - pct)}
            y2={pad.top + plotH * (1 - pct)}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}

        {/* Left Y-axis labels */}
        {leftTicks.map((tick, i) => {
          const fmt = leftSeries[0]?.format ?? defaultFormat;
          return (
            <text
              key={`l${i}`}
              x={pad.left - 6}
              y={yScaleLeft(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-[8px] fill-gray-400"
            >
              {fmt(tick)}
            </text>
          );
        })}

        {/* Right Y-axis labels */}
        {rightTicks.map((tick, i) => {
          const fmt = rightSeries[0]?.format ?? ((v: number) => `${Math.round(v)}`);
          return (
            <text
              key={`r${i}`}
              x={W - pad.right + 6}
              y={yScaleRight(tick)}
              textAnchor="start"
              dominantBaseline="middle"
              className="text-[8px] fill-gray-400"
            >
              {fmt(tick)}
            </text>
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={H - 6}
            textAnchor="middle"
            className="text-[8px] fill-gray-400"
          >
            {i % Math.ceil(n / 6) === 0 ? label : ''}
          </text>
        ))}

        {/* Data lines */}
        {series.map((s, si) => {
          const yScale = s.yAxis === 'left' ? yScaleLeft : yScaleRight;
          return (
            <path
              key={si}
              d={buildPath(s.data, yScale)}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Hover line + dots */}
        {hoverIdx !== null && (
          <>
            <line
              x1={xScale(hoverIdx)}
              x2={xScale(hoverIdx)}
              y1={pad.top}
              y2={pad.top + plotH}
              stroke="#0C1C2E"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity={0.3}
            />
            {series.map((s, si) => {
              const yScale = s.yAxis === 'left' ? yScaleLeft : yScaleRight;
              const val = s.data[hoverIdx];
              return (
                <circle
                  key={si}
                  cx={xScale(hoverIdx)}
                  cy={yScale(val)}
                  r={4}
                  fill="white"
                  stroke={s.color}
                  strokeWidth="2"
                />
              );
            })}
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && (
        <div className="flex items-center gap-4 mt-2 px-2">
          <span className="text-[9px] font-bold text-[#0C1C2E]">{labels[hoverIdx]}</span>
          {series.map((s, si) => {
            const fmt = s.format ?? defaultFormat;
            return (
              <span key={si} className="text-[9px] text-gray-500">
                <span style={{ color: s.color }}>{s.label}:</span> {fmt(s.data[hoverIdx])}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiLineChart;
