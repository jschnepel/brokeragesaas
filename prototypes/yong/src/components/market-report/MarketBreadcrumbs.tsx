import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Breadcrumb } from '../../models/types';

interface MarketBreadcrumbsProps {
  breadcrumbs: Breadcrumb[];
  variant?: 'light' | 'dark';
}

const MarketBreadcrumbs: React.FC<MarketBreadcrumbsProps> = ({ breadcrumbs, variant = 'dark' }) => {
  const textColor = variant === 'light' ? 'text-white/60' : 'text-gray-400';
  const activeColor = variant === 'light' ? 'text-white' : 'text-[#0C1C2E]';
  const hoverColor = variant === 'light' ? 'hover:text-white' : 'hover:text-[#0C1C2E]';
  const chevronColor = variant === 'light' ? 'text-white/30' : 'text-gray-300';

  return (
    <nav className="flex items-center gap-2 flex-wrap">
      {breadcrumbs.map((crumb, i) => {
        const isLast = i === breadcrumbs.length - 1;
        return (
          <span key={crumb.url} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={12} className={chevronColor} />}
            {isLast ? (
              <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${activeColor}`}>
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.url}
                className={`text-[10px] uppercase tracking-[0.2em] font-bold ${textColor} ${hoverColor} transition-colors`}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default MarketBreadcrumbs;
