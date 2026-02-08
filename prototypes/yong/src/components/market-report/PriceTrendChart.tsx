import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useScrollAnimation } from '../shared/useScrollAnimation';
import type { TrendPoint } from '../../models/types';

interface PriceTrendChartProps {
  data: TrendPoint[];
  className?: string;
}

const PriceTrendChart: React.FC<PriceTrendChartProps> = ({ data, className = '' }) => {
  const [hoveredChart, setHoveredChart] = useState<number | null>(null);
  const anim = useScrollAnimation();

  return (
    <div
      ref={anim.ref}
      className={`
        bg-white p-8 h-full
        transition-all duration-1000
        ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[#Bfa67a]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Price & Volume Trend</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest">
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#0C1C2E] rounded-full"></span> Price ($M)</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#Bfa67a]/30 rounded"></span> Volume</span>
        </div>
      </div>

      <div className="relative h-64 w-full">
        <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
          {[0, 50, 100, 150, 200].map(y => (
            <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#f3f4f6" strokeWidth="1" />
          ))}

          {data.map((d, i) => (
            <g key={`bar-${i}`}>
              <rect
                x={i * 100 + 35}
                y={200 - (d.vol * 6)}
                width="30"
                height={d.vol * 6}
                fill={hoveredChart === i ? '#Bfa67a' : '#Bfa67a20'}
                className="transition-colors duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredChart(i)}
                onMouseLeave={() => setHoveredChart(null)}
              />
            </g>
          ))}

          <path
            d={`M ${data.map((d, i) => {
              const minPrice = Math.min(...data.map(p => p.price));
              const maxPrice = Math.max(...data.map(p => p.price));
              const range = maxPrice - minPrice + 0.5;
              const y = 180 - ((d.price - minPrice) / range) * 160;
              return `${i * 100 + 50} ${y}`;
            }).join(' L ')}`}
            fill="none"
            stroke="#0C1C2E"
            strokeWidth="3"
            className="drop-shadow-sm"
          />

          {data.map((d, i) => {
            const minPrice = Math.min(...data.map(p => p.price));
            const maxPrice = Math.max(...data.map(p => p.price));
            const range = maxPrice - minPrice + 0.5;
            const y = 180 - ((d.price - minPrice) / range) * 160;
            return (
              <g key={`point-${i}`}>
                <circle
                  cx={i * 100 + 50}
                  cy={y}
                  r={hoveredChart === i ? 8 : 5}
                  fill="white"
                  stroke="#0C1C2E"
                  strokeWidth="2"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredChart(i)}
                  onMouseLeave={() => setHoveredChart(null)}
                />
                <text x={i * 100 + 50} y="220" textAnchor="middle" className="text-[10px] fill-gray-400 font-bold">
                  {d.month}
                </text>
                {hoveredChart === i && (
                  <g>
                    <rect x={i * 100 + 10} y={y - 50} width="80" height="40" fill="#0C1C2E" rx="4" />
                    <text x={i * 100 + 50} y={y - 32} textAnchor="middle" className="text-[10px] fill-white font-bold">
                      ${d.price.toFixed(2)}M
                    </text>
                    <text x={i * 100 + 50} y={y - 18} textAnchor="middle" className="text-[9px] fill-white/60">
                      {d.vol} Sales
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default PriceTrendChart;
