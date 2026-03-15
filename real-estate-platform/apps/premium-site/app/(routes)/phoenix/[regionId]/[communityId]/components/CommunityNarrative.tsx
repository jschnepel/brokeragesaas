'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import type { NarrativeData } from '../lib/types';

interface CommunityNarrativeProps {
  narrative: NarrativeData;
  features: string[];
  communityId: string;
}

export function CommunityNarrative({ narrative, features, communityId }: CommunityNarrativeProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="col-span-12 lg:col-span-8 bg-white p-6 md:p-10 shadow-lg shadow-black/5">
      <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">
        The Narrative
      </span>

      {narrative.tagline && (
        <h2 className="text-3xl md:text-4xl font-serif leading-[1.1] text-navy mb-8">
          {narrative.tagline}
        </h2>
      )}

      {/* Tabbed narrative */}
      {narrative.tabs && narrative.tabs.length > 0 && (
        <div className="mb-8">
          <div className="flex gap-3 mb-10 border-b border-navy/10 pb-0 overflow-x-auto">
            {narrative.tabs.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`relative px-4 md:px-5 pb-4 pt-2 text-[11px] uppercase tracking-[0.25em] font-bold transition-all duration-300 whitespace-nowrap min-h-[44px] ${
                  activeTab === i
                    ? 'text-navy'
                    : 'text-navy/30 hover:text-navy/60'
                }`}
              >
                <span className="relative z-10">{tab.tab}</span>
                <span
                  className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
                    activeTab === i ? 'h-[3px] bg-gold' : 'h-[1px] bg-transparent'
                  }`}
                />
              </button>
            ))}
          </div>

          {narrative.tabs.map((tab, i) => (
            <div key={i} className={activeTab === i ? 'block' : 'hidden'}>
              <div className="text-gray-500 font-light leading-relaxed text-[16px]">
                {tab.content.split('\n\n').map((p, pi) => (
                  <p key={pi} className={pi > 0 ? 'mt-6' : ''}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plain text fallback */}
      {!narrative.tabs && narrative.plainText && (
        <div className="text-gray-500 font-light leading-relaxed text-[16px] mb-8">
          {narrative.plainText.split('\n\n').map((p, pi) => (
            <p
              key={pi}
              className={
                pi === 0
                  ? 'first-letter:text-5xl first-letter:font-serif first-letter:text-navy first-letter:mr-3 first-letter:float-left first-letter:leading-none'
                  : 'mt-6'
              }
            >
              {p}
            </p>
          ))}
        </div>
      )}

      {/* Feature tags */}
      {features.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {features.map((feature, i) => (
            <span
              key={i}
              className="bg-gray-100 text-navy px-4 py-2.5 md:py-2 text-[10px] uppercase tracking-widest font-bold"
            >
              {feature}
            </span>
          ))}
        </div>
      )}

      {/* Action links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/listings?subdivisionName=${encodeURIComponent(communityId)}`}
          className="bg-navy text-white px-6 py-4 md:py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-gold transition-all flex items-center gap-2 group"
        >
          View Active Listings
          <ArrowUpRight
            size={14}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </Link>
        <button className="border border-navy text-navy px-6 py-4 md:py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-navy hover:text-white transition-all flex items-center gap-2">
          Get Property Alerts
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
