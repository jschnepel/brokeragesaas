'use client';

import { ZoneColumn } from './ZoneColumn';
import { ZONES } from '../data';

interface LifestyleGridProps {
  className?: string;
}

export function LifestyleGrid({ className = '' }: LifestyleGridProps) {
  return (
    <section className={`bg-cream py-20 lg:py-28 ${className}`} data-testid="lifestyle-grid">
      <div className="mx-auto max-w-content-lg px-8 lg:px-20">
        {/* Section header */}
        <div className="max-w-2xl mb-16">
          <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
            Compare Lifestyles
          </span>
          <h2 className="text-3xl lg:text-4xl font-serif text-navy tracking-tight">
            Four Ways to Live in Arizona
          </h2>
          <div className="w-12 h-0.5 bg-gold mt-6 mb-6" />
          <p className="text-navy/60 leading-relaxed" style={{ fontSize: 15 }}>
            Every corner of Arizona offers a different way of life. Compare climate, community,
            culture, and cost across four distinct lifestyle zones to find your best fit.
          </p>
        </div>

        {/* Desktop: 4-column grid */}
        <div className="hidden lg:grid grid-cols-4 gap-8">
          {ZONES.map((zone) => (
            <ZoneColumn key={zone.id} zone={zone} />
          ))}
        </div>

        {/* Mobile: Swipeable horizontal scroll */}
        <div className="lg:hidden overflow-x-auto snap-x snap-mandatory flex gap-6 pb-4 -mx-8 px-8">
          {ZONES.map((zone) => (
            <div key={zone.id} className="snap-start flex-shrink-0 w-[85vw] max-w-[340px]">
              <ZoneColumn zone={zone} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
