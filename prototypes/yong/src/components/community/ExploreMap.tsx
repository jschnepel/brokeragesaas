import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import MapGL, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import {
  ChevronRight,
  Compass,
  Utensils,
  Mountain,
  Flag,
  Home,
} from 'lucide-react';
import type { AmenityEntity } from '../../data/types';
import { MAP_STYLE } from '../../data/phoenixLuxuryZones';

// --- Tab config using amenity.type field ---

const ACCESS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  public: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Public' },
  residents: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Residents' },
  'members-only': { bg: 'bg-[#Bfa67a]/10', text: 'text-[#Bfa67a]', label: 'Members Only' },
  'membership-required': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Membership Required' },
};

interface TabConfig {
  id: string;
  label: string;
  desc: string;
  color: string;
  icon: React.FC<{ size?: number; className?: string }>;
  matchTypes: string[];
}

const TAB_DEFS: TabConfig[] = [
  { id: 'all', label: 'All Amenities', desc: 'Everything nearby', color: '#Bfa67a', icon: Home, matchTypes: [] },
  { id: 'dining', label: 'Dining', desc: 'Fine dining & casual', color: '#E07A5F', icon: Utensils, matchTypes: ['restaurant'] },
  { id: 'trails', label: 'Trails', desc: 'Hiking & nature', color: '#81B29A', icon: Mountain, matchTypes: ['trail'] },
  { id: 'golf', label: 'Golf', desc: 'Championship courses', color: '#0C1C2E', icon: Flag, matchTypes: ['golf-course'] },
];

// --- Props ---

interface ExploreMapProps {
  communityName: string;
  coordinates: [number, number]; // [lat, lng] from data
  amenities: AmenityEntity[];
  nearestTrail?: AmenityEntity | null;
}

const ExploreMap: React.FC<ExploreMapProps> = ({
  communityName,
  coordinates,
  amenities,
  nearestTrail,
}) => {
  const mapRef = useRef<MapRef>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);
  const [popupInfo, setPopupInfo] = useState<AmenityEntity | null>(null);

  // Combine amenities + trail (if trail isn't already in amenities)
  const allAmenities = useMemo(() => {
    if (!nearestTrail || amenities.some(a => a.id === nearestTrail.id)) return amenities;
    return [...amenities, nearestTrail];
  }, [amenities, nearestTrail]);

  // Derive which tabs should be visible
  const visibleTabs = useMemo(() => {
    const allTypes = new Set(allAmenities.map(a => a.type));
    return TAB_DEFS.filter(tab => {
      if (tab.id === 'all') return true;
      return tab.matchTypes.some(t => allTypes.has(t));
    });
  }, [allAmenities]);

  // Count per tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of TAB_DEFS) {
      if (tab.id === 'all') {
        counts[tab.id] = allAmenities.length;
      } else {
        counts[tab.id] = allAmenities.filter(a => tab.matchTypes.includes(a.type)).length;
      }
    }
    return counts;
  }, [allAmenities]);

  // Filter amenities by active tab
  const filteredAmenities = useMemo(() => {
    if (activeTab === 'all') return allAmenities;
    const tabDef = TAB_DEFS.find(t => t.id === activeTab);
    if (!tabDef) return allAmenities;
    return allAmenities.filter(a => tabDef.matchTypes.includes(a.type));
  }, [activeTab, allAmenities]);

  // Amenities with coordinates for map
  const mappableAmenities = filteredAmenities.filter(a => a.coordinates !== null);

  // Icon for current tab
  const activeColor = TAB_DEFS.find(t => t.id === activeTab)?.color ?? '#Bfa67a';

  // Active tab label for map overlay
  const activeTabLabel = TAB_DEFS.find(t => t.id === activeTab)?.label ?? 'Amenities';

  // Fly to coordinates when they change
  // coordinates from data are [lat, lng], MapLibre needs [lng, lat]
  useEffect(() => {
    mapRef.current?.flyTo({ center: [coordinates[1], coordinates[0]], zoom: 13, duration: 800 });
  }, [coordinates]);

  const handleMarkerClick = useCallback((amenity: AmenityEntity) => {
    setSelectedAmenity(amenity.id);
    setPopupInfo(amenity);
  }, []);

  return (
    <div className="grid grid-cols-12 h-[580px] overflow-hidden shadow-lg shadow-black/5">
      {/* Left panel — 3 zones: navy header, white tabs, cream items */}
      <div className="col-span-12 lg:col-span-5 flex flex-col h-[580px]">

        {/* Zone 1: Navy header */}
        <div className="p-8 bg-[#0C1C2E]">
          <div className="flex items-center gap-2 mb-3">
            <Compass size={14} className="text-[#Bfa67a]" />
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#Bfa67a] font-bold">Explore the Area</span>
          </div>
          <h3 className="text-2xl font-serif text-white">What's <span className="italic font-light">Nearby</span></h3>
        </div>

        {/* Zone 2: White tab buttons */}
        <div className="bg-white flex-shrink-0">
          {visibleTabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedAmenity(null); setPopupInfo(null); }}
                className={`w-full p-5 flex items-center gap-5 transition-all duration-300 group border-b border-gray-100 ${
                  activeTab === tab.id ? 'bg-[#F9F8F6]' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                  activeTab === tab.id ? 'bg-[#Bfa67a]' : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <TabIcon size={20} className={activeTab === tab.id ? 'text-white' : 'text-gray-500'} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-serif text-lg transition-colors ${
                      activeTab === tab.id ? 'text-[#0C1C2E]' : 'text-gray-600 group-hover:text-[#0C1C2E]'
                    }`}>
                      {tab.label}
                    </span>
                    <span className={`text-xl font-serif transition-colors ${
                      activeTab === tab.id ? 'text-[#Bfa67a]' : 'text-gray-300'
                    }`}>
                      {tabCounts[tab.id]}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400">
                    {tab.desc}
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className={`transition-all duration-300 ${
                    activeTab === tab.id ? 'text-[#Bfa67a] translate-x-1' : 'text-gray-300 group-hover:text-gray-400'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Zone 3: Cream items list */}
        <div className="bg-[#F9F8F6] flex-1 flex flex-col min-h-0">
          <div className="px-5 py-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#0C1C2E] font-bold">
                {activeTab === 'all' ? 'All Amenities' : activeTabLabel}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">
              {filteredAmenities.length} locations
            </span>
          </div>
          <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
            {filteredAmenities.map((amenity, i) => {
              const access = ACCESS_COLORS[amenity.access] ?? ACCESS_COLORS.public;
              const isSelected = selectedAmenity === amenity.id;
              return (
                <div
                  key={amenity.id}
                  onClick={() => setSelectedAmenity(isSelected ? null : amenity.id)}
                  className={`px-5 py-3 cursor-pointer transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'bg-[#Bfa67a]/10 border-l-2 border-[#Bfa67a]'
                      : 'bg-white hover:bg-gray-50 border-l-2 border-transparent'
                  }`}
                >
                  <span className="text-[10px] text-gray-300 font-mono w-4">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[#0C1C2E] truncate block">{amenity.name}</span>
                    <span className="text-[10px] text-gray-400">{amenity.tags.slice(0, 2).join(' · ')}</span>
                  </div>
                  <span className={`${access.bg} ${access.text} px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold whitespace-nowrap shrink-0`}>
                    {access.label}
                  </span>
                </div>
              );
            })}

            {filteredAmenities.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No amenities in this category</p>
            )}
          </div>
        </div>
      </div>

      {/* Right panel — Map */}
      <div className="col-span-12 lg:col-span-7 h-[400px] lg:h-[580px] relative bg-[#F9F8F6]">
        <MapGL
          ref={mapRef}
          initialViewState={{
            longitude: coordinates[1],
            latitude: coordinates[0],
            zoom: 13,
          }}
          mapStyle={MAP_STYLE.light}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="bottom-right" />

          {/* Amenity markers */}
          {mappableAmenities.map((amenity) => {
            const coords = amenity.coordinates as [number, number]; // [lat, lng] from data
            const color = amenity.type === 'trail' ? '#81B29A' : activeColor;
            return (
              <Marker
                key={amenity.id}
                longitude={coords[1]}
                latitude={coords[0]}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleMarkerClick(amenity);
                }}
              >
                <div
                  style={{
                    backgroundColor: color,
                    width: 32,
                    height: 32,
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                  }}
                />
              </Marker>
            );
          })}

          {/* Popup for selected amenity */}
          {popupInfo && popupInfo.coordinates && (
            <Popup
              longitude={(popupInfo.coordinates as [number, number])[1]}
              latitude={(popupInfo.coordinates as [number, number])[0]}
              anchor="bottom"
              offset={[0, -32] as [number, number]}
              onClose={() => setPopupInfo(null)}
              closeOnClick={false}
            >
              <div className="p-3 min-w-[200px]">
                <h4 className="font-serif text-[#0C1C2E] text-lg mb-1">{popupInfo.name}</h4>
                <p className="text-gray-500 text-sm mb-2">{popupInfo.description}</p>
                <span className={`inline-block ${ACCESS_COLORS[popupInfo.access]?.bg ?? 'bg-gray-50'} ${ACCESS_COLORS[popupInfo.access]?.text ?? 'text-gray-600'} px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold`}>
                  {ACCESS_COLORS[popupInfo.access]?.label ?? popupInfo.access}
                </span>
              </div>
            </Popup>
          )}
        </MapGL>

        {/* "Showing" category label — top left */}
        <div className="absolute top-6 left-6 bg-white px-5 py-3 shadow-xl z-[1000]">
          <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-1">Showing</span>
          <span className="text-lg font-serif text-[#0C1C2E]">{activeTabLabel}</span>
        </div>

        {/* Legend — bottom right */}
        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg z-[1000]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeColor }} />
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              {mappableAmenities.length} Locations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreMap;
