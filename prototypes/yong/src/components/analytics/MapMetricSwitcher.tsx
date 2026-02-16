/**
 * Inline metric switcher for the heatmap header bar.
 * Groups into IDX (public) and VOW (authenticated) sections.
 * Design: navy glass dropdown, gold accents, serif labels.
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { METRIC_DEFS, type HeatmapMetricId } from '../../data/h3HeatmapData';

interface MapMetricSwitcherProps {
  current: HeatmapMetricId;
  onChange: (id: HeatmapMetricId) => void;
}

const idxMetrics = METRIC_DEFS.filter(m => !m.isVow);

const MapMetricSwitcher: React.FC<MapMetricSwitcherProps> = ({ current, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentDef = METRIC_DEFS.find(m => m.id === current)!;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-white px-2.5 py-1 rounded-sm border transition-all ${
          open ? 'border-[#Bfa67a] bg-white/5' : 'border-white/10 hover:border-[#Bfa67a]/50'
        }`}
      >
        <span className="text-[8px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold">Metric</span>
        <span className="text-[11px] font-serif">{currentDef.label}</span>
        <ChevronDown size={11} className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-[#0C1C2E] border border-white/10 shadow-2xl min-w-[200px] overflow-hidden rounded-sm z-50">
          <div className="px-3 pt-2.5 pb-1">
            <span className="text-[7px] uppercase tracking-widest text-[#Bfa67a] font-bold">
              IDX Metrics
            </span>
          </div>
          {idxMetrics.map(m => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[11px] font-serif transition-colors ${
                m.id === current
                  ? 'bg-[#Bfa67a]/15 text-[#Bfa67a]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapMetricSwitcher;
