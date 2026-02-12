interface RadarChartProps {
  dimensions: string[];
  datasets: {
    label: string;
    values: number[]; // 0-100 normalized
    color: string;
  }[];
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ dimensions, datasets, size = 340 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 80) / 2;
  const n = dimensions.length;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const getPoint = (dimIdx: number, value: number): [number, number] => {
    const angle = startAngle + dimIdx * angleStep;
    const dist = (value / 100) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  };

  const rings = [20, 40, 60, 80, 100];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {rings.map(ring => {
          const points = Array.from({ length: n }, (_, i) => getPoint(i, ring));
          const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
          return (
            <path
              key={ring}
              d={d}
              fill={ring === 100 ? 'none' : 'none'}
              stroke="#0C1C2E"
              strokeOpacity={0.06}
              strokeWidth="0.5"
            />
          );
        })}

        {/* Axis lines */}
        {dimensions.map((_, i) => {
          const [ex, ey] = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#0C1C2E" strokeOpacity={0.06} strokeWidth="0.5" />;
        })}

        {/* Data polygons */}
        {datasets.map((ds, di) => {
          const points = ds.values.map((v, i) => getPoint(i, v));
          const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
          return (
            <g key={di}>
              <path
                d={d}
                fill={ds.color}
                fillOpacity={0.1}
                stroke={ds.color}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p[0]}
                  cy={p[1]}
                  r={3}
                  fill="white"
                  stroke={ds.color}
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}

        {/* Dimension labels */}
        {dimensions.map((dim, i) => {
          const [lx, ly] = getPoint(i, 118);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] fill-[#0C1C2E] font-bold uppercase"
              style={{ letterSpacing: '0.12em', fillOpacity: 0.5 }}
            >
              {dim}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        {datasets.map((ds, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-[10px] font-medium text-[#0C1C2E]/60">
            <span
              className="w-3 h-[2px] rounded-full"
              style={{ backgroundColor: ds.color }}
            />
            {ds.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;
