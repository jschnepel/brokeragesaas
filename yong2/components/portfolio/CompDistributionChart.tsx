type CompDistributionChartProps = {
  /** Comp pool quartiles in $/sqft. */
  p25: number;
  p50: number;
  p75: number;
  /** Subject listing's $/sqft. Highlighted with the gold pin. */
  subject: number;
};

const DOLLAR = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/**
 * Horizontal bar chart — 4 rows showing where the subject sits
 * relative to the comp pool's interquartile range. Inline SVG, no
 * dependency. Reads as a quiet editorial chart, not a dashboard.
 *
 * Bars are the same length-scale; subject highlighted with gold.
 * Numbers right-aligned next to each bar, caps labels left-aligned
 * to a fixed gutter so the visual rhythm holds.
 */
export function CompDistributionChart({ p25, p50, p75, subject }: CompDistributionChartProps) {
  const max = Math.max(p25, p50, p75, subject);
  const min = Math.min(p25, p50, p75, subject);
  // Pad the scale so the longest bar is ~92% of the chart width — not
  // pinned to the edge. Keeps a calm visual.
  const scaleMax = max * 1.08;

  const rows: { key: string; label: string; value: number; subject?: boolean }[] = [
    { key: 'p25', label: '25th percentile', value: p25 },
    { key: 'p50', label: 'Comp median', value: p50 },
    { key: 'p75', label: '75th percentile', value: p75 },
    { key: 'subject', label: 'Subject', value: subject, subject: true },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const widthPct = (row.value / scaleMax) * 100;
        return (
          <div key={row.key} className="grid grid-cols-[120px_1fr_auto] items-center gap-4">
            <span
              className={`caps text-[10px] tracking-widest ${
                row.subject ? 'text-gold' : 'text-stone/55'
              }`}
            >
              {row.label}
            </span>
            <div className="relative h-6 bg-white/5">
              <div
                className={`absolute inset-y-0 left-0 ${
                  row.subject ? 'bg-gold' : 'bg-stone/30'
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span
              className={`font-serif text-base tabular-nums tracking-[-0.005em] ${
                row.subject ? 'text-gold' : 'text-stone/85'
              }`}
            >
              {DOLLAR(row.value)}
            </span>
          </div>
        );
      })}
      <p className="caps text-[9px] text-stone/35 tracking-[0.28em] pt-1">
        Range across comp set: <span className="tabular-nums">{DOLLAR(min)} – {DOLLAR(max)}</span> per sqft
      </p>
    </div>
  );
}
