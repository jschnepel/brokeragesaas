'use client';

import { useState } from 'react';

interface ListingDescriptionProps {
  remarks: string | null;
}

export function ListingDescription({ remarks }: ListingDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!remarks) return null;

  return (
    <div className="mb-16 lg:mb-20">
      <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">About This Property</span>
      <div className="w-12 h-0.5 bg-gold mb-8" />
      <div className={`text-narrative text-navy/60 ${!expanded ? 'md:line-clamp-none line-clamp-4' : ''}`}>{remarks}</div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="md:hidden text-xs text-gold font-bold mt-2 hover:text-navy transition-all duration-500"
      >
        {expanded ? 'Show Less' : 'Read More'}
      </button>
    </div>
  );
}
