'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { REGIONS_DATA } from './data';
import type { RegionData, CommunityItem } from './data';

interface SearchResult {
  type: 'region' | 'community';
  regionId: string;
  regionName: string;
  communityId?: string;
  communityName?: string;
  price?: string;
  zipCode?: string;
  image: string;
}

function fuzzyMatch(text: string, query: string): boolean {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  if (textLower.includes(queryLower)) return true;
  let qi = 0;
  for (let i = 0; i < textLower.length && qi < queryLower.length; i++) {
    if (textLower[i] === queryLower[qi]) qi++;
  }
  return qi === queryLower.length;
}

/* ── Inline SVG Icons ── */
function IconSearch({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconMapPin({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function HeroSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focused, setFocused] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const inputBoxRef = useRef<HTMLDivElement>(null);

  // Position the dropdown relative to the input box
  const updateDropdownPos = useCallback(() => {
    if (!inputBoxRef.current) return;
    const rect = inputBoxRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!focused) return;
    updateDropdownPos();
    window.addEventListener('scroll', updateDropdownPos, true);
    window.addEventListener('resize', updateDropdownPos);
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [focused, updateDropdownPos]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // Also check if click is inside the portal dropdown
        const portal = document.getElementById('search-dropdown-portal');
        if (portal && portal.contains(e.target as Node)) return;
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const found: SearchResult[] = [];

    REGIONS_DATA.forEach((region: RegionData) => {
      if (fuzzyMatch(region.name, query)) {
        found.push({
          type: 'region',
          regionId: region.id,
          regionName: region.name,
          image: region.heroImage,
        });
      }

      region.communities.forEach((community: CommunityItem) => {
        const nameMatch = fuzzyMatch(community.name, query);
        const zipMatch = community.zipCode.startsWith(query.trim());
        if (nameMatch || zipMatch) {
          found.push({
            type: 'community',
            regionId: region.id,
            regionName: region.name,
            communityId: community.id,
            communityName: community.name,
            price: community.price,
            zipCode: community.zipCode,
            image: region.heroImage,
          });
        }
      });
    });

    setResults(found.slice(0, 8));
  }, [query]);

  return (
    <div ref={ref} className="relative max-w-2xl mt-8">
      {/* Search Input */}
      <div
        ref={inputBoxRef}
        className={`relative flex items-center transition-all duration-500 ${
          focused ? 'bg-white shadow-2xl' : 'bg-white/95 shadow-xl'
        }`}
      >
        <div className="flex items-center gap-3 pl-6 pr-2 border-r border-navy/10">
          <span className={`transition-colors ${focused ? 'text-gold' : 'text-navy/30'}`}>
            <IconSearch />
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-navy/30 hidden sm:block">Find</span>
        </div>
        <input
          type="text"
          placeholder="Search region, community, or zip..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          className="flex-1 bg-transparent text-navy placeholder-navy/30 px-5 py-5 text-sm focus:outline-none font-light"
        />
        {query ? (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="mr-3 p-2 text-navy/30 hover:text-navy hover:bg-navy/5 transition-all"
          >
            <IconX />
          </button>
        ) : (
          <div className="mr-4 px-4 py-2 bg-navy text-white text-[9px] uppercase tracking-[0.15em] font-bold">
            Search
          </div>
        )}
      </div>

      {/* Results Dropdown — rendered via portal to avoid z-index issues */}
      {focused && results.length > 0 && typeof document !== 'undefined' &&
        createPortal(
          <div id="search-dropdown-portal" style={dropdownStyle} className="bg-white shadow-2xl max-h-[420px] overflow-y-auto border-t-2 border-gold">
            <div className="p-3 bg-cream border-b border-navy/5">
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-navy/40">
                {results.length} Result{results.length !== 1 ? 's' : ''} Found
              </span>
            </div>
            {results.map((result, idx) => (
              <Link
                key={`${result.regionId}-${result.communityId || 'region'}-${idx}`}
                href={
                  result.type === 'region'
                    ? `#${result.regionId}`
                    : `/phoenix/${result.regionId}/${result.communityId}`
                }
                onClick={() => { setQuery(''); setFocused(false); }}
                className="flex items-center gap-4 p-4 hover:bg-cream transition-all duration-300 border-b border-navy/5 last:border-0 group"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 shrink-0 overflow-hidden">
                  <img
                    src={`${result.image}&w=96&h=96`}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-[8px] uppercase tracking-[0.15em] font-bold ${
                        result.type === 'region' ? 'text-navy' : 'text-gold'
                      }`}
                    >
                      {result.type === 'region' ? '● Region' : '○ Community'}
                    </span>
                  </div>
                  <h4 className="text-navy font-serif text-base truncate group-hover:text-gold transition-colors">
                    {result.communityName || result.regionName}
                  </h4>
                  {result.type === 'community' && (
                    <p className="text-navy/30 text-[11px] truncate flex items-center gap-2">
                      <span className="text-gold"><IconMapPin /></span>
                      {result.regionName}
                      <span className="text-gold">·</span>
                      {result.zipCode}
                      <span className="text-gold">·</span>
                      {result.price}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gold">View</span>
                  <span className="text-gold group-hover:translate-x-1 transition-transform inline-block">
                    <IconArrowRight />
                  </span>
                </div>
              </Link>
            ))}
          </div>,
          document.body,
        )
      }

      {/* No Results — also via portal */}
      {focused && query && results.length === 0 && typeof document !== 'undefined' &&
        createPortal(
          <div id="search-dropdown-portal" style={dropdownStyle} className="bg-white shadow-2xl border-t-2 border-gold">
            <div className="p-8 text-center">
              <span className="text-navy/20 block mb-3"><IconSearch size={32} /></span>
              <p className="text-navy font-serif text-lg mb-1">No Results Found</p>
              <p className="text-navy/40 text-sm">
                No regions, communities, or zip codes match &ldquo;{query}&rdquo;
              </p>
            </div>
          </div>,
          document.body,
        )
      }
    </div>
  );
}
