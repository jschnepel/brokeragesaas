import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Search, Plus } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { getCommunityById, getAllCommunities } from '../../data/communities';
import { fuzzyMatch } from '../../data/communitiesPage';

const CompareFloatingBar: React.FC = () => {
  const { items, add, remove, clear, openModal } = useCompare();
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFull = items.length >= 3;

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen) inputRef.current?.focus();
  }, [isSearchOpen]);

  // Filter communities for dropdown
  const allCommunities = getAllCommunities();
  const searchResults = query.trim()
    ? allCommunities
        .filter(c => !items.includes(c.id))
        .filter(c => fuzzyMatch(c.name, query) || c.zipCode.startsWith(query.trim()))
        .slice(0, 6)
    : [];

  if (items.length === 0) return null;

  const communities = items
    .map(id => getCommunityById(id))
    .filter(Boolean);

  const handleAdd = (id: string) => {
    add(id);
    setQuery('');
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-[#0C1C2E] border-t-2 border-[#Bfa67a]/30 shadow-2xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center gap-3 sm:gap-6">
          {/* Selected communities */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-x-auto">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] font-bold text-[#Bfa67a] shrink-0 hidden sm:block">
              Comparing
            </span>
            {communities.map(c => c && (
              <div
                key={c.id}
                className="flex items-center gap-2 bg-white/10 px-3 py-1.5 shrink-0"
              >
                <div className="w-6 h-6 overflow-hidden shrink-0">
                  <img src={c.heroImage} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-white text-[11px] font-medium truncate max-w-[100px] sm:max-w-[140px]">
                  {c.name}
                </span>
                <button
                  onClick={() => remove(c.id)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Search to add — replaces "+N more" */}
            {!isFull && (
              <div ref={searchRef} className="relative shrink-0">
                {isSearchOpen ? (
                  <div className="relative">
                    <div className="flex items-center bg-white/10 border border-white/20 overflow-hidden">
                      <Search size={12} className="text-[#Bfa67a] ml-2.5 shrink-0" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search communities..."
                        className="bg-transparent text-white placeholder-white/30 text-[11px] px-2 py-1.5 w-[160px] sm:w-[200px] focus:outline-none"
                      />
                      {query && (
                        <button
                          onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                          className="text-white/30 hover:text-white mr-2 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>

                    {/* Search results dropdown (opens upward) */}
                    {searchResults.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-white shadow-2xl max-h-[280px] overflow-y-auto border-t-2 border-[#Bfa67a]">
                        {searchResults.map(c => (
                          <button
                            key={c.id}
                            onClick={() => handleAdd(c.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F9F8F6] transition-colors text-left group border-b border-gray-100 last:border-0"
                          >
                            <div className="w-8 h-8 overflow-hidden shrink-0">
                              <img src={c.heroImage} alt={c.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[#0C1C2E] text-[11px] font-medium block truncate group-hover:text-[#Bfa67a] transition-colors">
                                {c.name}
                              </span>
                              <span className="text-[#0C1C2E]/40 text-[9px] truncate block">
                                {c.city} — {c.priceRange}
                              </span>
                            </div>
                            <Plus size={12} className="text-[#Bfa67a] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No results */}
                    {query.trim() && searchResults.length === 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-white shadow-2xl p-4 text-center border-t-2 border-[#Bfa67a]">
                        <span className="text-[#0C1C2E]/40 text-[11px]">No communities found</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#Bfa67a]/40 px-3 py-1.5 transition-all group"
                  >
                    <Search size={10} className="text-white/30 group-hover:text-[#Bfa67a] transition-colors" />
                    <span className="text-white/30 group-hover:text-white/60 text-[10px] font-medium transition-colors">
                      Add community
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={clear}
              className="text-white/40 hover:text-white text-[9px] uppercase tracking-widest font-bold transition-colors px-2 py-2"
            >
              Clear
            </button>
            <button
              onClick={openModal}
              disabled={items.length < 2}
              className={`
                flex items-center gap-2 px-4 sm:px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold
                transition-all group
                ${items.length >= 2
                  ? 'bg-[#Bfa67a] text-white hover:bg-white hover:text-[#0C1C2E]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
            >
              Compare
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareFloatingBar;
