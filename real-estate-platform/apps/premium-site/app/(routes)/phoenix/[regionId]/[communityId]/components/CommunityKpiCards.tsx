import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MarketMetric } from '../lib/types';

interface CommunityKpiCardsProps {
  metrics: MarketMetric[];
}

export function CommunityKpiCards({ metrics }: CommunityKpiCardsProps) {
  if (metrics.length === 0) return null;

  return (
    <section className="relative z-10 -mt-10 max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.slice(0, 6).map((metric) => {
          const TrendIcon =
            metric.trendDir === 'up' ? TrendingUp :
            metric.trendDir === 'down' ? TrendingDown : Minus;
          const trendColor =
            metric.trendDir === 'up' ? 'text-emerald-500' :
            metric.trendDir === 'down' ? 'text-rose-500' : 'text-gray-400';

          return (
            <div
              key={metric.label}
              className="bg-white p-5 shadow-lg shadow-black/5 text-center"
            >
              <span className="text-2xl font-serif text-navy block">{metric.value}</span>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mt-1">
                {metric.label}
              </span>
              <div className={`flex items-center justify-center gap-1 mt-2 ${trendColor}`}>
                <TrendIcon size={12} />
                <span className="text-[10px] font-bold">{metric.trend}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
