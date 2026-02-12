import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import type { MarketScope } from '../../models/MarketScope';
import type { Breadcrumb } from '../../models/types';
import { GaugeMini } from './components/widgets';

interface AnalyticsHeaderProps {
  scope: MarketScope;
}

function rewriteUrl(url: string): string {
  if (url === '/insights') return '/temp/analytics';
  if (url.startsWith('/insights/')) return url.replace('/insights/', '/temp/analytics/');
  return url;
}

function rewriteBreadcrumbs(crumbs: Breadcrumb[]): Breadcrumb[] {
  return crumbs.map(c => ({
    ...c,
    label: c.label === 'Market Insights' ? 'Analytics' : c.label,
    url: rewriteUrl(c.url),
  }));
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ scope }) => {
  const kpis = scope.getKpis();
  const score = scope.getConditionScore();
  const label = scope.getMarketLabel();
  const breadcrumbs = rewriteBreadcrumbs(scope.getBreadcrumbs());
  const trendHistory = scope.getTrendHistory();

  // Build sparkline from trend history
  const sparkPrices = trendHistory.map(t => t.price);
  const sparkW = 56;
  const sparkH = 20;
  let sparkPath = '';
  if (sparkPrices.length >= 2) {
    const max = Math.max(...sparkPrices);
    const min = Math.min(...sparkPrices);
    const range = max - min || 1;
    sparkPath = sparkPrices
      .map((p, i) => {
        const x = (i / (sparkPrices.length - 1)) * sparkW;
        const y = sparkH - ((p - min) / range) * (sparkH - 2) - 1;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  const conditionColor =
    score >= 70 ? 'bg-emerald-500/20 text-emerald-300' :
    score >= 55 ? 'bg-amber-500/20 text-amber-300' :
    score >= 40 ? 'bg-blue-500/20 text-blue-300' :
    'bg-rose-500/20 text-rose-300';

  return (
    <div className="bg-[#0C1C2E] py-3">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Row 1: Breadcrumbs */}
        <nav className="flex items-center gap-1.5 mb-2 flex-wrap">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={crumb.url} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={9} className="text-white/20" />}
                {isLast ? (
                  <span className="text-[8px] uppercase tracking-[0.15em] font-bold text-white/80">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.url}
                    className="text-[8px] uppercase tracking-[0.15em] font-bold text-white/40 hover:text-white/70 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        {/* Row 2: Name + Gauge + Sparkline + KPIs */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Left: Name + condition */}
          <div className="flex items-center gap-3 shrink-0">
            <h1 className="text-lg font-serif text-white leading-tight">{scope.name}</h1>
            <span className={`text-[7px] uppercase tracking-[0.12em] font-bold px-2 py-0.5 rounded-sm ${conditionColor}`}>
              {label}
            </span>
            <div className="hidden md:block">
              <GaugeMini score={score} label="Condition" size={32} dark />
            </div>
            {/* Sparkline */}
            {sparkPath && (
              <svg width={sparkW} height={sparkH} className="hidden md:block shrink-0 opacity-50">
                <path d={sparkPath} fill="none" stroke="#Bfa67a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          {/* Right: KPI strip */}
          <div className="flex items-center gap-0 lg:ml-auto overflow-x-auto">
            {kpis.map((kpi, i) => (
              <div key={i} className="flex items-center">
                <div className="px-3 py-0.5 text-right whitespace-nowrap">
                  <span className="text-sm font-serif text-white block leading-tight">{kpi.value}</span>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[7px] uppercase tracking-widest text-white/35">{kpi.label}</span>
                    <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${
                      kpi.trendDirection === 'up' ? 'text-emerald-400' :
                      kpi.trendDirection === 'down' ? 'text-rose-400' : 'text-white/40'
                    }`}>
                      {kpi.trendDirection === 'up' ? <TrendingUp size={8} /> :
                       kpi.trendDirection === 'down' ? <TrendingDown size={8} /> :
                       <Minus size={8} />}
                      {kpi.trend}
                    </span>
                  </div>
                </div>
                {i < kpis.length - 1 && (
                  <div className="h-6 w-px bg-white/10 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
