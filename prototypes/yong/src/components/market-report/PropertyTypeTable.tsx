import { Home } from 'lucide-react';
import type { PropertyType } from '../../models/types';

interface PropertyTypeTableProps {
  data: PropertyType[];
}

const PropertyTypeTable: React.FC<PropertyTypeTableProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Home size={16} className="text-[#Bfa67a]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Property Type Analysis</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Type</th>
              <th className="text-center text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Active</th>
              <th className="text-center text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Sold (Q4)</th>
              <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Avg Price</th>
              <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">$/SqFt</th>
            </tr>
          </thead>
          <tbody>
            {data.map((type, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-4 text-sm font-medium text-[#0C1C2E]">{type.type}</td>
                <td className="py-4 text-sm text-center">
                  <span className="bg-[#0C1C2E] text-white px-2 py-1 rounded text-xs">{type.active}</span>
                </td>
                <td className="py-4 text-sm text-center">
                  <span className="bg-[#Bfa67a] text-white px-2 py-1 rounded text-xs">{type.sold}</span>
                </td>
                <td className="py-4 text-sm text-right font-serif text-[#0C1C2E]">{type.avgPrice}</td>
                <td className="py-4 text-sm text-right text-gray-500">{type.ppsf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertyTypeTable;
