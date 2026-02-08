import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../shared/useScrollAnimation';

interface ComparisonRow {
  name: string;
  url: string;
  columns: string[];
}

interface ScopeComparisonTableProps {
  title: string;
  headers: string[];
  rows: ComparisonRow[];
  variant?: 'light' | 'dark';
}

const ScopeComparisonTable: React.FC<ScopeComparisonTableProps> = ({ title, headers, rows, variant = 'light' }) => {
  const anim = useScrollAnimation();
  const isDark = variant === 'dark';

  return (
    <div
      ref={anim.ref}
      className={`
        p-6 lg:p-8 h-full
        transition-all duration-1000
        ${isDark ? 'bg-[#0C1C2E] text-white' : 'bg-white'}
        ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
    >
      <span className={`text-[10px] uppercase tracking-[0.3em] font-bold mb-6 block ${isDark ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]'}`}>
        {title}
      </span>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className={`text-[9px] uppercase tracking-widest font-bold py-3 ${
                    i === 0 ? 'text-left' : 'text-right'
                  } ${isDark ? 'text-white/40' : 'text-gray-400'}`}
                >
                  {header}
                </th>
              ))}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b transition-colors ${
                  isDark
                    ? 'border-white/5 hover:bg-white/5'
                    : 'border-gray-50 hover:bg-gray-50'
                }`}
              >
                <td className="py-4">
                  <Link
                    to={row.url}
                    className={`text-sm font-medium hover:text-[#Bfa67a] transition-colors ${isDark ? 'text-white' : 'text-[#0C1C2E]'}`}
                  >
                    {row.name}
                  </Link>
                </td>
                {row.columns.map((col, j) => (
                  <td key={j} className={`py-4 text-sm text-right ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {col}
                  </td>
                ))}
                <td className="py-4 text-right">
                  <Link to={row.url} className="text-[#Bfa67a] hover:text-white transition-colors">
                    <ArrowRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScopeComparisonTable;
