'use client';

import { useState } from 'react';

interface ListingDescriptionProps {
  remarks: string | null;
}

export function ListingDescription({ remarks }: ListingDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!remarks) return null;

  return (
    <div className="mb-10">
      <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-6 block">
        About This Property
      </span>
      <div className={`text-gray-500 font-light leading-relaxed text-[16px] ${!expanded ? 'md:line-clamp-none line-clamp-4' : ''}`}>
        <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-navy first-letter:mr-3 first-letter:float-left first-letter:leading-none">
          {remarks}
        </p>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="md:hidden text-[10px] uppercase tracking-widest text-gold font-bold mt-3 hover:text-navy transition-all"
      >
        {expanded ? 'Show Less' : 'Read More'}
      </button>
    </div>
  );
}
