type PriceTrendSparklineProps = {
  /** 12 monthly median prices, oldest → newest. */
  monthlyMedianPpsf: ReadonlyArray<number>;
  /** Optional caption shown beneath the line. */
  caption?: string;
};

/**
 * 12-month price trend sparkline — inline SVG, no dependency. Line
 * + area-fill in gold, axis hairlines in stone. Final point shown
 * as a small filled dot for emphasis. Designed to read as editorial
 * data — not a financial chart.
 */
export function PriceTrendSparkline({ monthlyMedianPpsf, caption }: PriceTrendSparklineProps) {
  if (monthlyMedianPpsf.length < 2) return null;

  const w = 320;
  const h = 80;
  const pad = 4;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const min = Math.min(...monthlyMedianPpsf);
  const max = Math.max(...monthlyMedianPpsf);
  const range = max - min || 1;

  const points = monthlyMedianPpsf.map((v, i) => {
    const x = pad + (i / (monthlyMedianPpsf.length - 1)) * innerW;
    const y = pad + (1 - (v - min) / range) * innerH;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  const areaPath =
    `M${points[0][0].toFixed(2)},${(h - pad).toFixed(2)} ` +
    points.map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`).join(' ') +
    ` L${points[points.length - 1][0].toFixed(2)},${(h - pad).toFixed(2)} Z`;

  const last = points[points.length - 1];

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-20"
        aria-label="12-month median price-per-square-foot trend"
        role="img"
      >
        {/* Hairline baseline */}
        <line
          x1={pad}
          y1={h - pad}
          x2={w - pad}
          y2={h - pad}
          stroke="rgba(239,233,223,0.12)"
          strokeWidth="0.5"
        />
        {/* Area fill */}
        <path d={areaPath} fill="rgba(212,184,138,0.10)" />
        {/* Trend line */}
        <path
          d={linePath}
          fill="none"
          stroke="#D4B88A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Endpoint dot */}
        <circle cx={last[0]} cy={last[1]} r="2.5" fill="#D4B88A" />
      </svg>
      {caption ? (
        <p className="caps text-[9px] text-stone/40 tracking-widest text-center">{caption}</p>
      ) : null}
    </div>
  );
}
