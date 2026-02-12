import { TrendingUp, TrendingDown, Minus, DollarSign, Clock, Layers, Target } from 'lucide-react';
import type { MarketScope } from '../../models/MarketScope';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import { useScrollAnimation } from '../../components/shared/useScrollAnimation';

interface PulseSummaryStripProps {
  scope: MarketScope;
}

const PulseSummaryStrip: React.FC<PulseSummaryStripProps> = ({ scope }) => {
  const kpis = scope.getKpis();
  const anim = useScrollAnimation(0.2);

  const cards = [
    {
      icon: DollarSign,
      label: kpis[0]?.label ?? 'Median List Price',
      value: kpis[0]?.rawValue ?? 0,
      suffix: kpis[0]?.rawValue >= 1000000 ? 'M' : 'K',
      formatted: kpis[0]?.value ?? '—',
      trend: kpis[0]?.trend ?? '',
      trendDir: kpis[0]?.trendDirection ?? 'neutral',
      decimals: kpis[0]?.rawValue >= 1000000 ? 2 : 0,
      counterValue: kpis[0]?.rawValue >= 1000000
        ? kpis[0].rawValue / 1000000
        : kpis[0]?.rawValue >= 1000
          ? kpis[0].rawValue / 1000
          : kpis[0]?.rawValue ?? 0,
      prefix: '$',
    },
    {
      icon: Clock,
      label: kpis[1]?.label ?? 'Avg Days on Market',
      value: kpis[1]?.rawValue ?? 0,
      suffix: ' days',
      formatted: kpis[1]?.value ?? '—',
      trend: kpis[1]?.trend ?? '',
      trendDir: kpis[1]?.trendDirection ?? 'neutral',
      decimals: 0,
      counterValue: kpis[1]?.rawValue ?? 0,
      prefix: '',
    },
    {
      icon: Layers,
      label: kpis[2]?.label ?? 'Active Inventory',
      value: kpis[2]?.rawValue ?? 0,
      suffix: '',
      formatted: kpis[2]?.value ?? '—',
      trend: kpis[2]?.trend ?? '',
      trendDir: kpis[2]?.trendDirection ?? 'neutral',
      decimals: 0,
      counterValue: kpis[2]?.rawValue ?? 0,
      prefix: '',
    },
    {
      icon: Target,
      label: kpis[3]?.label ?? 'List-to-Sale Ratio',
      value: kpis[3]?.rawValue ?? 0,
      suffix: '%',
      formatted: kpis[3]?.value ?? '—',
      trend: kpis[3]?.trend ?? '',
      trendDir: kpis[3]?.trendDirection ?? 'neutral',
      decimals: 1,
      counterValue: kpis[3]?.rawValue ?? 0,
      prefix: '',
    },
  ];

  const trendLabel = (dir: string) => {
    if (dir === 'up') return 'text-emerald-500';
    if (dir === 'down') return 'text-rose-500';
    return 'text-gray-400';
  };

  const trendText = (dir: string, trend: string) => {
    if (dir === 'up') return trend;
    if (dir === 'down') return trend;
    return 'Stable';
  };

  return (
    <div
      ref={anim.ref}
      className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Icon size={20} className="text-[#Bfa67a]" />
              <span className={`text-xs font-medium flex items-center gap-1 ${trendLabel(card.trendDir)}`}>
                {card.trendDir === 'up' ? <TrendingUp size={12} /> :
                 card.trendDir === 'down' ? <TrendingDown size={12} /> :
                 <Minus size={12} />}
                {trendText(card.trendDir, card.trend)}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
              {card.label}
            </span>
            <span className="text-3xl font-serif text-[#0C1C2E]">
              {card.prefix}<AnimatedCounter value={card.counterValue} suffix={card.suffix} decimals={card.decimals} />
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PulseSummaryStrip;
