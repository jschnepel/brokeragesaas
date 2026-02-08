import { FileText } from 'lucide-react';
import type { RecentSale } from '../../models/types';

interface RecentSalesTableProps {
  data: RecentSale[];
}

const RecentSalesTable: React.FC<RecentSalesTableProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <FileText size={16} className="text-[#Bfa67a]" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#0C1C2E] font-bold">Recent Notable Sales</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Address</th>
              <th className="text-left text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Community</th>
              <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Price</th>
              <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">DOM</th>
              <th className="text-right text-[9px] uppercase tracking-widest text-gray-400 font-bold py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((sale, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-4 text-sm text-gray-600">{sale.address}</td>
                <td className="py-4 text-sm font-medium text-[#0C1C2E]">{sale.community}</td>
                <td className="py-4 text-sm text-right font-serif text-[#0C1C2E]">{sale.price}</td>
                <td className="py-4 text-sm text-right">
                  <span className={`font-bold ${sale.dom < 30 ? 'text-emerald-600' : sale.dom < 60 ? 'text-[#Bfa67a]' : 'text-gray-500'}`}>
                    {sale.dom}d
                  </span>
                </td>
                <td className="py-4 text-sm text-right text-gray-400">{sale.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentSalesTable;
