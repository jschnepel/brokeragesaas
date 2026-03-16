'use client';

import { FactorRow } from './FactorRow';
import { FACTORS } from '../data';
import type { ZoneProfile } from '../data';

interface ZoneColumnProps {
  zone: ZoneProfile;
  className?: string;
}

const STAT_LABELS: { key: keyof ZoneProfile['stats']; label: string }[] = [
  { key: 'medianPrice', label: 'Median Price' },
  { key: 'avgLotSize', label: 'Lot Size' },
  { key: 'elevation', label: 'Elevation' },
  { key: 'avgSummerHigh', label: 'Summer High' },
  { key: 'avgWinterLow', label: 'Winter Low' },
  { key: 'driveToAirport', label: 'Airport' },
  { key: 'topSchoolDistrict', label: 'Schools' },
];

export function ZoneColumn({ zone, className = '' }: ZoneColumnProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden mb-4" style={{ borderRadius: 4 }}>
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

      {/* Stats card */}
      <div className="bg-navy/5 p-4 mb-4" style={{ borderRadius: 4 }}>
        <p className="text-[10px] uppercase tracking-[0.2em] text-navy/40 font-bold mb-3">
          Key Stats
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {STAT_LABELS.map((stat) => (
            <div key={stat.key}>
              <p className="text-[10px] uppercase tracking-[0.1em] text-navy/40 font-medium">
                {stat.label}
              </p>
              <p className="text-navy text-[13px] font-medium">
                {zone.stats[stat.key]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Factor rows */}
      {FACTORS.map((meta) => (
        <div key={meta.id} className="border-t border-navy/5">
          <FactorRow factor={zone.factors[meta.id]} label={meta.label} />
        </div>
      ))}

      {/* Explore link */}
      <div className="mt-auto pt-4">
        <a
          href="/phoenix"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gold hover:text-navy transition-colors"
        >
          Explore Communities
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
