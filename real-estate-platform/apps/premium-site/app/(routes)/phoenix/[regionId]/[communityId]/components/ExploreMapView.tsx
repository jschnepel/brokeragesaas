'use client';

import { useMemo } from 'react';
import MapGL, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl';
import type { ExploreData, ExploreItem } from '../lib/types';

import 'maplibre-gl/dist/maplibre-gl.css';

interface ExploreMapViewProps {
  exploreData: ExploreData;
  activeTab: string;
  selectedItem: ExploreItem | null;
  boundaryGeoJson: Record<string, unknown> | null;
  onMarkerClick: (item: ExploreItem) => void;
}

function TeardropMarker({ color }: { color: string }) {
  return (
    <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
        fill={color}
      />
      <circle cx="12" cy="12" r="5" fill="white" />
    </svg>
  );
}

export function ExploreMapView({
  exploreData,
  activeTab,
  selectedItem,
  boundaryGeoJson,
  onMarkerClick,
}: ExploreMapViewProps) {
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';
  const mapStyle = useMemo(
    () => `https://api.maptiler.com/maps/streets-v2-light/style.json?key=${mapTilerKey}`,
    [mapTilerKey]
  );

  const currentTab = exploreData.tabs.find((t) => t.key === activeTab) ?? exploreData.tabs[0];

  const boundaryFill: FillLayerSpecification = {
    id: 'boundary-fill',
    type: 'fill',
    source: 'boundary',
    paint: { 'fill-color': '#Bfa67a', 'fill-opacity': 0.08 },
  };

  const boundaryLine: LineLayerSpecification = {
    id: 'boundary-line',
    type: 'line',
    source: 'boundary',
    paint: {
      'line-color': '#Bfa67a',
      'line-width': 2,
      'line-opacity': 0.8,
      'line-dasharray': [6, 4],
    },
  };

  return (
    <div className="col-span-12 lg:col-span-7 h-[400px] lg:h-[580px] relative bg-cream">
      <MapGL
        initialViewState={{
          longitude: exploreData.center[1],
          latitude: exploreData.center[0],
          zoom: exploreData.zoom,
        }}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" />

        {boundaryGeoJson && (
          <Source
            id="boundary"
            type="geojson"
            data={boundaryGeoJson as unknown as GeoJSON.GeoJSON}
          >
            <Layer {...boundaryFill} />
            <Layer {...boundaryLine} />
          </Source>
        )}

        {currentTab.items.map((item) => (
          <Marker
            key={item.id}
            longitude={item.coords[1]}
            latitude={item.coords[0]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onMarkerClick(item);
            }}
          >
            <TeardropMarker color={currentTab.markerColor} />
          </Marker>
        ))}

        {selectedItem && (
          <Popup
            longitude={selectedItem.coords[1]}
            latitude={selectedItem.coords[0]}
            anchor="bottom"
            offset={[0, -32] as [number, number]}
            onClose={() => onMarkerClick(selectedItem)}
            closeOnClick={false}
          >
            <div className="p-3 min-w-[200px]">
              <h4 className="font-serif text-navy text-lg mb-1">{selectedItem.name}</h4>
              {selectedItem.cuisine && (
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                  {selectedItem.cuisine}
                </p>
              )}
              {selectedItem.rating != null && (
                <span className="font-serif text-lg text-navy">{selectedItem.rating}</span>
              )}
              {selectedItem.type && (
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                  {selectedItem.type}
                </p>
              )}
              {selectedItem.holes != null && (
                <span className="text-gold font-serif text-lg">{selectedItem.holes} Holes</span>
              )}
            </div>
          </Popup>
        )}
      </MapGL>

      {/* Showing label */}
      <div className="absolute top-6 left-6 bg-white px-5 py-3 shadow-xl z-10">
        <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-1">
          Showing
        </span>
        <span className="text-lg font-serif text-navy">{currentTab.label}</span>
      </div>

      {/* Location count */}
      <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentTab.markerColor }}
          />
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            {currentTab.items.length} Locations
          </span>
        </div>
      </div>
    </div>
  );
}
