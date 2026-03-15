import { Plane, Car } from 'lucide-react';
import type { AirportInfo, KeyDistance } from '../lib/types';

interface CommunityTransportationProps {
  airports: {
    private: AirportInfo;
    commercial: AirportInfo;
  };
  keyDistances: KeyDistance[];
}

export function CommunityTransportation({ airports, keyDistances }: CommunityTransportationProps) {
  return (
    <>
      {/* Airports */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white p-6 shadow-lg shadow-black/5">
        <div className="flex items-center gap-2 mb-4">
          <Plane size={16} className="text-gold" />
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
            Air Travel
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <p className="font-bold text-navy text-sm">{airports.private.name}</p>
              <p className="text-[9px] uppercase tracking-widest text-gold font-bold">
                {airports.private.type}
              </p>
            </div>
            <span className="text-xl font-serif text-navy">{airports.private.distance}</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-navy text-sm">{airports.commercial.name}</p>
              <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
                {airports.commercial.type}
              </p>
            </div>
            <span className="text-xl font-serif text-navy">{airports.commercial.distance}</span>
          </div>
        </div>
      </div>

      {/* Key Distances */}
      <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white p-6 shadow-lg shadow-black/5">
        <div className="flex items-center gap-2 mb-4">
          <Car size={16} className="text-gold" />
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
            Key Distances
          </span>
        </div>
        <div className="space-y-2">
          {keyDistances.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0"
            >
              <span className="text-gray-600 text-sm">{item.place}</span>
              <span className="text-lg font-serif text-navy">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
