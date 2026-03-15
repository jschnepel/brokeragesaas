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
      <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30 mb-4">Features &amp; Amenities</h2>
      <div className="border-t border-navy/8">
        {sections.map((section) => {
          const isOpen = openSections.has(section.label);
          return (
            <div key={section.label} className="border-b border-navy/8">
              <button onClick={() => toggle(section.label)} className="w-full flex items-center justify-between py-3 text-left group" aria-expanded={isOpen}>
                <span className="text-sm text-navy font-medium">{section.label}</span>
                <svg className={`w-4 h-4 text-navy/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="overflow-hidden transition-[max-height] duration-300 ease-in-out" style={{ maxHeight: isOpen ? `${section.items.length * 24 + 16}px` : '0px' }}>
                <p className="text-sm text-navy/60 pb-3">{section.items.join(' · ')}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
