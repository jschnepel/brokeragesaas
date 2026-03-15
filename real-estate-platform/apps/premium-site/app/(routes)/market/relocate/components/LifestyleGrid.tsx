'use client';

import { ZoneColumn } from './ZoneColumn';
import { ZONES, FACTORS } from '../data';

interface LifestyleGridProps {
  className?: string;
}

export function LifestyleGrid({ className = '' }: LifestyleGridProps) {
  return (
    <section className={`${className}`} data-testid="lifestyle-grid">
      {/* Desktop: 5-column grid */}
      <div className="hidden lg:grid grid-cols-5 gap-6">
        {/* Column 1: Factor labels */}
        <div className="flex flex-col">
          {/* Spacer for thumbnail + header height */}
          <div className="aspect-[4/3] mb-4" />
          <div className="h-[52px] mb-4" />

          {FACTORS.map((meta) => (
            <div key={meta.id} className="border-t border-navy/5 py-3">
              <p className="font-serif text-navy text-[14px] font-medium">
                {meta.label}
              </p>
              <p className="text-navy/40 text-[11px] mt-0.5">
                {meta.description}
              </p>
            </div>
          ))}
        </div>

        {/* Columns 2-5: Zone profiles */}
        {ZONES.map((zone) => (
          <ZoneColumn key={zone.id} zone={zone} />
        ))}
      </div>

      {/* Mobile: Swipeable horizontal scroll */}
      <div className="lg:hidden overflow-x-auto snap-x snap-mandatory flex gap-6 pb-4 -mx-6 px-6">
        {ZONES.map((zone) => (
          <div key={zone.id} className="snap-start flex-shrink-0 w-[85vw] max-w-[340px]">
            <ZoneColumn zone={zone} />
          </div>
        ))}
      </div>
    </section>
  );
}
