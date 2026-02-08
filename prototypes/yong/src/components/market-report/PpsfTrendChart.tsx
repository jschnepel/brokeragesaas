import { LineChart } from 'lucide-react';
import type { PpsfPoint } from '../../models/types';

interface PpsfTrendChartProps {
  data: PpsfPoint[];
}

const PpsfTrendChart: React.FC<PpsfTrendChartProps> = ({ data }) => {
  const minPpsf = Math.min(...data.map(d => d.ppsf));
  const maxPpsf = Math.max(...data.map(d => d.ppsf));
  const range = maxPpsf - minPpsf || 1;
  const twoYearChange = (((data[data.length - 1].ppsf - data[0].ppsf) / data[0].ppsf) * 100).toFixed(1);

  return (
    <div className="bg-white p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <LineChart size={16} className="text-[#Bfa67a]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Price Per SqFt Trend</span>
      </div>
      <div className="relative h-48">
        <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
          {[0, 37.5, 75, 112.5, 150].map(y => (
            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#f3f4f6" strokeWidth="1" />
          ))}

          <path
            d={`M 0 150 ${data.map((d, i) => {
              const x = (i / (data.length - 1)) * 400;
              const y = 150 - ((d.ppsf - (minPpsf - 25)) / (range + 50)) * 150;
              return `L ${x} ${y}`;
            }).join(' ')} L 400 150 Z`}
            fill="url(#ppsfGrad)"
          />

          <path
            d={`M ${data.map((d, i) => {
              const x = (i / (data.length - 1)) * 400;
              const y = 150 - ((d.ppsf - (minPpsf - 25)) / (range + 50)) * 150;
              return `${x} ${y}`;
            }).join(' L ')}`}
            fill="none"
            stroke="#Bfa67a"
            strokeWidth="3"
          />

          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 400;
            const y = 150 - ((d.ppsf - (minPpsf - 25)) / (range + 50)) * 150;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="4" fill="white" stroke="#Bfa67a" strokeWidth="2" />
                <text x={x} y="165" textAnchor="middle" className="text-[8px] fill-gray-400">
                  {d.month}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="ppsfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#Bfa67a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#Bfa67a" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
        <div>
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">2-Year Change</span>
          <span className="text-emerald-600 font-bold">+{twoYearChange}%</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">Current $/SqFt</span>
          <span className="text-xl font-serif text-[#0C1C2E]">${data[data.length - 1].ppsf}</span>
        </div>
      </div>
    </div>
  );
};

export default PpsfTrendChart;
