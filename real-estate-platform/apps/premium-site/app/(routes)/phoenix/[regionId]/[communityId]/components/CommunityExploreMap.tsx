'use client';

import { useState } from 'react';
import { Compass } from 'lucide-react';
import type { ExploreData, ExploreItem } from '../lib/types';
import { ExploreMapPanel } from './ExploreMapPanel';
import { ExploreMapView } from './ExploreMapView';

interface CommunityExploreMapProps {
  exploreData: ExploreData | null;
  boundaryGeoJson: Record<string, unknown> | null;
}

export function CommunityExploreMap({ exploreData, boundaryGeoJson }: CommunityExploreMapProps) {
  const [activeTab, setActiveTab] = useState(exploreData?.tabs[0]?.key ?? '');
  const [selectedItem, setSelectedItem] = useState<ExploreItem | null>(null);

  if (!exploreData || !exploreData.center || exploreData.center[0] === 0) return null;

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSelectedItem(null);
  };

  return (
    <div className="col-span-12 shadow-lg shadow-black/5 overflow-hidden">
      <div className="grid grid-cols-12">
        {/* Header */}
        <div className="col-span-12 lg:col-span-5 flex flex-col h-auto lg:h-[580px]">
          <div className="p-8 bg-navy">
            <div className="flex items-center gap-2 mb-3">
              <Compass size={14} className="text-gold" />
              <span className="text-[9px] uppercase tracking-[0.25em] text-gold font-bold">
                Explore the Area
              </span>
            </div>
            <h3 className="text-2xl font-serif text-white">
              What&apos;s <span className="italic font-light">Nearby</span>
            </h3>
          </div>

          <ExploreMapPanel
            tabs={exploreData.tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            selectedItemId={selectedItem?.id ?? null}
            onItemSelect={setSelectedItem}
          />
        </div>

        <ExploreMapView
          exploreData={exploreData}
          activeTab={activeTab}
          selectedItem={selectedItem}
          boundaryGeoJson={boundaryGeoJson}
          onMarkerClick={setSelectedItem}
        />
      </div>
    </div>
  );
}
