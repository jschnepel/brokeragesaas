'use client';

import { FactorRow } from './FactorRow';
import { FACTORS } from '../data';
import type { ZoneProfile } from '../data';

interface ZoneColumnProps {
  zone: ZoneProfile;
  className?: string;
}

export function ZoneColumn({ zone, className = '' }: ZoneColumnProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={zone.thumbnail}
          alt={zone.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header */}
      <h3 className="font-serif text-navy text-lg mb-1">{zone.name}</h3>
      <p className="text-navy/50 text-[11px] uppercase tracking-[0.15em] font-medium mb-4">
        {zone.tagline}
      </p>

      {/* Factor rows */}
      {FACTORS.map((meta) => (
        <div key={meta.id} className="border-t border-navy/5">
          <FactorRow factor={zone.factors[meta.id]} />
        </div>
      ))}
    </div>
  );
}
