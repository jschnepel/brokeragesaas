import { Plane } from 'lucide-react';
import type { Airport } from '../../data/types';

interface TransportationCardProps {
  airports: Airport[];
}

const TransportationCard: React.FC<TransportationCardProps> = ({ airports }) => {
  if (airports.length === 0) return null;

  return (
    <div className="bg-white p-6 shadow-lg shadow-black/5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Plane size={16} className="text-[#Bfa67a]" />
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Air Travel</span>
      </div>

      <div className="space-y-3">
        {airports.map((airport, i) => (
          <div key={airport.code} className={`flex justify-between items-center ${i < airports.length - 1 ? 'pb-3 border-b border-gray-100' : ''}`}>
            <div>
              <p className="font-bold text-[#0C1C2E] text-sm">{airport.name} ({airport.code})</p>
              <p className={`text-[9px] uppercase tracking-widest font-bold ${airport.type.includes('Private') ? 'text-[#Bfa67a]' : 'text-gray-400'}`}>{airport.type}</p>
            </div>
            <span className="text-xl font-serif text-[#0C1C2E]">{airport.distance}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransportationCard;
