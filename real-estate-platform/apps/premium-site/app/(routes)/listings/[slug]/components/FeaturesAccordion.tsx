'use client';

import { useState } from 'react';

interface FeatureSection {
  label: string;
  items: string[];
}

interface FeaturesAccordionProps {
  sections: FeatureSection[];
}

const DEFAULT_EXPANDED = ['Interior', 'Exterior', 'Pool', 'Community'];

export function FeaturesAccordion({ sections }: FeaturesAccordionProps) {
  const expandAll = sections.length <= 4;
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    if (expandAll) return new Set(sections.map((s) => s.label));
    return new Set(sections.filter((s) => DEFAULT_EXPANDED.includes(s.label)).map((s) => s.label));
  });

  if (sections.length === 0) return null;

  function toggle(label: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Features &amp; Amenities</span>
      </div>
      <div className="border-t border-gray-100">
        {sections.map((section) => {
          const isOpen = openSections.has(section.label);
          return (
            <div key={section.label} className="border-b border-gray-100">
              <button onClick={() => toggle(section.label)} className="w-full flex items-center justify-between py-4 text-left group" aria-expanded={isOpen}>
                <span className="font-serif text-lg text-navy">{section.label}</span>
                <svg className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="overflow-hidden transition-[max-height] duration-300 ease-in-out" style={{ maxHeight: isOpen ? `${section.items.length * 24 + 24}px` : '0px' }}>
                <p className="text-gray-500 font-light leading-relaxed text-[15px] pb-4">{section.items.join(' · ')}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
