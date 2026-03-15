'use client';

import {
  ChevronRight,
  MapPin,
  Utensils,
  Flag,
  GraduationCap,
  Star,
} from 'lucide-react';
import type { ExploreTab, ExploreItem } from '../lib/types';

const TAB_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  dining: Utensils,
  golf: Flag,
  schools: GraduationCap,
};

interface ExploreMapPanelProps {
  tabs: ExploreTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  selectedItemId: number | null;
  onItemSelect: (item: ExploreItem) => void;
}

export function ExploreMapPanel({
  tabs,
  activeTab,
  onTabChange,
  selectedItemId,
  onItemSelect,
}: ExploreMapPanelProps) {
  const currentTab = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  return (
    <>
      {/* Tab buttons */}
      <div className="flex-1 bg-white">
        {tabs.map((tab) => {
          const TabIcon = TAB_ICON_MAP[tab.key] ?? MapPin;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`w-full p-5 flex items-center gap-5 transition-all duration-300 group border-b border-gray-100 ${
                activeTab === tab.key ? 'bg-cream' : 'hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                  activeTab === tab.key ? 'bg-gold' : 'bg-gray-100 group-hover:bg-gray-200'
                }`}
              >
                <TabIcon
                  size={20}
                  className={activeTab === tab.key ? 'text-white' : 'text-gray-500'}
                />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-serif text-lg transition-colors ${
                      activeTab === tab.key ? 'text-navy' : 'text-gray-600 group-hover:text-navy'
                    }`}
                  >
                    {tab.label}
                  </span>
                  <span
                    className={`text-xl font-serif transition-colors ${
                      activeTab === tab.key ? 'text-gold' : 'text-gray-300'
                    }`}
                  >
                    {tab.items.length}
                  </span>
                </div>
                {tab.desc && (
                  <span className="text-[10px] uppercase tracking-widest text-gray-400">
                    {tab.desc}
                  </span>
                )}
              </div>
              <ChevronRight
                size={16}
                className={`transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'text-gold translate-x-1'
                    : 'text-gray-300 group-hover:text-gray-400'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Item list */}
      <div className="bg-cream flex-1 flex flex-col min-h-0">
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-navy font-bold">
              {currentTab?.label}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            {currentTab?.items.length} locations
          </span>
        </div>
        <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
          {currentTab?.items.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onItemSelect(item)}
              className={`px-5 py-3 cursor-pointer transition-all flex items-center gap-4 ${
                selectedItemId === item.id
                  ? 'bg-gold/10 border-l-2 border-gold'
                  : 'bg-white hover:bg-gray-50 border-l-2 border-transparent'
              }`}
            >
              <span className="text-[10px] text-gray-300 font-mono w-4">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-navy truncate block">{item.name}</span>
                {item.cuisine && (
                  <span className="text-[10px] text-gray-400">{item.cuisine}</span>
                )}
                {item.type && !item.cuisine && (
                  <span className="text-[10px] text-gray-400">{item.type}</span>
                )}
              </div>
              {item.rating != null && (
                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <Star size={10} className="text-gold fill-gold" />
                  <span className="text-xs font-medium text-navy">{item.rating}</span>
                </div>
              )}
              {item.holes != null && (
                <span className="text-sm text-gold font-serif">{item.holes}H</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
