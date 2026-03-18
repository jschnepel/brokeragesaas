'use client';

import { useState } from 'react';

interface FeatureSection {
  label: string;
  items: string[];
}

interface FeaturesAccordionProps {
  sections: FeatureSection[];
}

export function FeaturesAccordion({ sections }: FeaturesAccordionProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (sections.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Features &amp; Amenities</span>
      </div>

      {/* Tab navigation — matches CommunityNarrative tabs */}
      <div className="flex gap-3 mb-8 border-b border-gray-100 pb-0 overflow-x-auto">
        {sections.map((section, i) => (
          <button
            key={section.label}
            onClick={() => setActiveTab(i)}
            className={`relative px-4 md:px-5 pb-4 pt-2 text-[11px] uppercase tracking-[0.25em] font-bold transition-all duration-300 whitespace-nowrap min-h-[44px] ${
              activeTab === i ? 'text-navy' : 'text-navy/30 hover:text-navy/60'
            }`}
          >
            <span>{section.label}</span>
            <span
              className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
                activeTab === i ? 'h-[3px] bg-gold' : 'h-[1px] bg-transparent'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-wrap gap-2">
        {sections[activeTab]?.items.map((item) => (
          <span
            key={item}
            className="bg-gray-100 text-navy px-4 py-2.5 md:py-2 text-[10px] uppercase tracking-widest font-bold"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
