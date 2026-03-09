'use client';

/**
 * Inline metric switcher dropdown for the heatmap header bar.
 * Navy glass dropdown with gold accents.
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { METRIC_DEFS } from './types';
import type { HeatmapMetricId } from './types';

export interface MapMetricSwitcherProps {
  current: HeatmapMetricId;
  onChange: (id: HeatmapMetricId) => void;
}

export function MapMetricSwitcher({ current, onChange }: MapMetricSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentDef = METRIC_DEFS.find(m => m.id === current)!;

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
          open ? 'border-gold bg-white/5' : 'border-white/10 hover:border-gold/50'
        }`}
      >
        <span className="text-[8px] uppercase tracking-[0.15em] text-gold font-bold">Metric</span>
        <span className="text-[11px] font-serif">{currentDef.label}</span>
        <ChevronDown size={11} className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-navy border border-white/10 shadow-2xl min-w-[200px] overflow-hidden rounded-sm z-50">
          <div className="px-3 pt-2.5 pb-1">
            <span className="text-[7px] uppercase tracking-widest text-gold font-bold">
              Market Metrics
            </span>
          </div>
          {METRIC_DEFS.map(m => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[11px] font-serif transition-colors ${
                m.id === current
                  ? 'bg-gold/15 text-gold'
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
}
