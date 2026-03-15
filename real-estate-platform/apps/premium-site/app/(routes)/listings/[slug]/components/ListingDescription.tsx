'use client';

import { useState } from 'react';

interface ListingDescriptionProps {
  remarks: string | null;
}

export function ListingDescription({ remarks }: ListingDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!remarks) return null;

  return (
    <div className="mb-8">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30 mb-3">About This Property</h2>
      <div className={`text-sm text-navy/55 leading-relaxed ${!expanded ? 'md:line-clamp-none line-clamp-4' : ''}`}>{remarks}</div>
      <button onClick={() => setExpanded(!expanded)} className="md:hidden text-xs text-gold font-medium mt-2 hover:text-navy transition-colors">
        {expanded ? 'Show Less' : 'Read More'}
      </button>
    </div>
  );
}
