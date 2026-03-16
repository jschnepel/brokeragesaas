'use client';

import { ZONES } from '../data';
import type { ZoneId, ZoneProfile } from '../data';

interface InlineQuizResultsProps {
  matchedZones: [ZoneId, ZoneId];
  onRetake: () => void;
  className?: string;
}

const STAT_HIGHLIGHTS: { key: keyof ZoneProfile['stats']; label: string }[] = [
  { key: 'medianPrice', label: 'Median Price' },
  { key: 'avgSummerHigh', label: 'Summer High' },
  { key: 'driveToAirport', label: 'Airport' },
  { key: 'topSchoolDistrict', label: 'Schools' },
];

export function InlineQuizResults({ matchedZones, onRetake, className = '' }: InlineQuizResultsProps) {
  const bestMatch = ZONES.find((z) => z.id === matchedZones[0])!;
  const runnerUp = ZONES.find((z) => z.id === matchedZones[1])!;

  return (
    <section className={`bg-cream py-20 lg:py-28 ${className}`} data-testid="quiz-results">
      <div className="mx-auto max-w-content-lg px-8 lg:px-20">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
            Your Results
          </span>
          <h2 className="text-3xl lg:text-4xl font-serif text-navy tracking-tight">
            Your Best Match
          </h2>
          <div className="w-12 h-0.5 bg-gold mt-6 mx-auto" />
        </div>

        {/* Results cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Best Match — larger, gold accent */}
          <ResultCard zone={bestMatch} badge="Best Match" accentBorder />

          {/* Runner Up */}
          <ResultCard zone={runnerUp} badge="Runner Up" />
        </div>

        {/* Retake */}
        <div className="text-center mt-12">
          <button
            onClick={onRetake}
            data-testid="quiz-retake-btn"
            className="text-gold text-[11px] uppercase tracking-[0.2em] font-bold hover:text-navy transition-colors"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    </section>
  );
}

function ResultCard({ zone, badge, accentBorder }: { zone: ZoneProfile; badge: string; accentBorder?: boolean }) {
  return (
    <div
      className={`bg-white overflow-hidden ${accentBorder ? 'border-2 border-gold' : 'border border-navy/8'}`}
      style={{ borderRadius: 4 }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={zone.thumbnail} alt={zone.name} className="w-full h-full object-cover" />
        <span
          className={`absolute top-3 left-3 text-white text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-1.5 ${
            accentBorder ? 'bg-gold' : 'bg-navy'
          }`}
          style={{ borderRadius: 2 }}
        >
          {badge}
        </span>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-serif text-navy text-xl mb-1">{zone.name}</h3>
        <p className="text-navy/50 text-[11px] uppercase tracking-[0.15em] font-medium mb-5">
          {zone.tagline}
        </p>

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {STAT_HIGHLIGHTS.map((stat) => (
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

        {/* Link */}
        <a
          href="/phoenix"
          className="inline-flex items-center gap-2 mt-6 text-[10px] uppercase tracking-widest font-bold text-gold hover:text-navy transition-colors"
        >
          View Communities
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
