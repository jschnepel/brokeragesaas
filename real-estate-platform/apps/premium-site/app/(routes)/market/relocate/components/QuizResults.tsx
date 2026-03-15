'use client';

import { FactorIndicator } from './FactorIndicator';
import { ZONES, FACTORS } from '../data';
import type { ZoneId, ZipProfile } from '../data';

interface QuizResultsProps {
  matchedZones: [ZoneId, ZoneId];
  zipProfile: ZipProfile;
  onRetake: () => void;
  className?: string;
}

export function QuizResults({ matchedZones, zipProfile, onRetake, className = '' }: QuizResultsProps) {
  const leftZone = ZONES.find((z) => z.id === matchedZones[0])!;
  const rightZone = ZONES.find((z) => z.id === matchedZones[1])!;

  return (
    <div className={className} data-testid="quiz-results">
      <div className="text-center mb-8">
        <p className="text-gold text-[10px] uppercase tracking-[0.3em] font-bold mb-3">
          Your Top Matches
        </p>
        <h2 className="font-serif text-navy text-2xl lg:text-3xl">
          {leftZone.name} & {rightZone.name}
        </h2>
      </div>

      {/* 3-column comparison (stacks on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 lg:gap-6">
        {/* Left match */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={leftZone.thumbnail} alt={leftZone.name} className="w-full h-full object-cover" />
            <span className="absolute top-2 left-2 bg-gold text-white text-[9px] uppercase tracking-[0.15em] font-bold px-2 py-1">
              Best Match
            </span>
          </div>
          <h3 className="font-serif text-navy text-[15px] mb-0.5">{leftZone.name}</h3>
          <p className="text-navy/40 text-[10px] uppercase tracking-[0.1em] mb-3">{leftZone.tagline}</p>
          {FACTORS.map((meta) => (
            <div key={meta.id} className="border-t border-navy/5 py-2">
              <p className="text-[10px] uppercase tracking-[0.1em] text-navy/40 font-medium mb-1">{meta.label}</p>
              <FactorIndicator rating={leftZone.factors[meta.id].rating} className="mb-1" />
              <p className="text-navy/60 text-[12px] leading-relaxed">{leftZone.factors[meta.id].description}</p>
            </div>
          ))}
        </div>

        {/* Center: user's ZIP */}
        <div className="border-x border-navy/10 px-4">
          <div className="aspect-[4/3] mb-3 bg-cream flex items-center justify-center">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-navy/40 font-bold mb-1">Your Area</p>
              <p className="font-serif text-navy text-xl">{zipProfile.name}</p>
            </div>
          </div>
          <h3 className="font-serif text-navy text-[15px] mb-0.5">{zipProfile.name}</h3>
          <p className="text-navy/40 text-[10px] uppercase tracking-[0.1em] mb-3">Your current location</p>
          {FACTORS.map((meta) => (
            <div key={meta.id} className="border-t border-navy/5 py-2">
              <p className="text-[10px] uppercase tracking-[0.1em] text-navy/40 font-medium mb-1">{meta.label}</p>
              <FactorIndicator rating={zipProfile.factors[meta.id].rating} className="mb-1" />
              <p className="text-navy/60 text-[12px] leading-relaxed">{zipProfile.factors[meta.id].description}</p>
            </div>
          ))}
        </div>

        {/* Right match */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rightZone.thumbnail} alt={rightZone.name} className="w-full h-full object-cover" />
            <span className="absolute top-2 left-2 bg-navy text-white text-[9px] uppercase tracking-[0.15em] font-bold px-2 py-1">
              Runner Up
            </span>
          </div>
          <h3 className="font-serif text-navy text-[15px] mb-0.5">{rightZone.name}</h3>
          <p className="text-navy/40 text-[10px] uppercase tracking-[0.1em] mb-3">{rightZone.tagline}</p>
          {FACTORS.map((meta) => (
            <div key={meta.id} className="border-t border-navy/5 py-2">
              <p className="text-[10px] uppercase tracking-[0.1em] text-navy/40 font-medium mb-1">{meta.label}</p>
              <FactorIndicator rating={rightZone.factors[meta.id].rating} className="mb-1" />
              <p className="text-navy/60 text-[12px] leading-relaxed">{rightZone.factors[meta.id].description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-10">
        <button
          onClick={onRetake}
          data-testid="quiz-retake-btn"
          className="text-gold text-[11px] uppercase tracking-[0.2em] font-bold hover:text-navy transition-colors"
        >
          Retake Quiz
        </button>
      </div>
    </div>
  );
}
