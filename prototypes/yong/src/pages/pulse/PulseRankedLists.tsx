import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import type { MarketScope } from '../../models/MarketScope';
import type { MarketOverview } from '../../models/MarketOverview';
import type { RegionScope } from '../../models/RegionScope';
import type { ScopeLevel } from '../../models/types';

interface PulseRankedListsProps {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
}

interface RankedItem {
  name: string;
  value: string;
  sub?: string;
  url?: string;
}

interface RankedList {
  title: string;
  emoji: string;
  items: RankedItem[];
  gold?: boolean;
}

function buildRankedLists(scope: MarketScope, overview: MarketOverview, level: ScopeLevel): RankedList[] {
  if (level === 'market') {
    const rankings = overview.getCommunityRankings();
    return [
      {
        title: 'Fastest Selling',
        emoji: '\u26A1',
        gold: true,
        items: rankings.fastestSelling.slice(0, 4).map(r => ({
          name: r.name,
          value: `${r.value}d`,
          sub: r.region,
        })),
      },
      {
        title: 'Top Appreciation',
        emoji: '\u2191',
        gold: true,
        items: rankings.highestAppreciation.slice(0, 4).map(r => ({
          name: r.name,
          value: `+${r.value}%`,
          sub: r.region,
        })),
      },
      {
        title: 'Most Active',
        emoji: '\uD83D\uDCCA',
        items: rankings.mostActive.slice(0, 4).map(r => ({
          name: r.name,
          value: `${r.value} sales`,
          sub: r.region,
        })),
      },
    ];
  }

  if (level === 'region') {
    const region = scope as RegionScope;
    const top = region.getTopCommunities();
    return [
      {
        title: 'Fastest Selling',
        emoji: '\u26A1',
        gold: true,
        items: top.fastestSelling.slice(0, 4).map(r => ({
          name: r.name,
          value: r.value,
          url: r.url,
        })),
      },
      {
        title: 'Highest Value',
        emoji: '$',
        items: top.highestValue.slice(0, 4).map(r => ({
          name: r.name,
          value: r.value,
          url: r.url,
        })),
      },
      {
        title: 'Best Appreciation',
        emoji: '\u2191',
        gold: true,
        items: top.bestAppreciation.slice(0, 4).map(r => ({
          name: r.name,
          value: r.value,
          url: r.url,
        })),
      },
    ];
  }

  // Zipcode + Community: build from children or price segments
  const children = scope.getChildren();
  if (children.length > 0) {
    const withKpis = children.map(c => ({ scope: c, kpis: c.getKpis() }));
    const byDom = [...withKpis].sort((a, b) => a.kpis[1].rawValue - b.kpis[1].rawValue);
    const byPrice = [...withKpis].sort((a, b) => b.kpis[0].rawValue - a.kpis[0].rawValue);
    const byInventory = [...withKpis].sort((a, b) => a.kpis[2].rawValue - b.kpis[2].rawValue);

    return [
      {
        title: 'Fastest Selling',
        emoji: '\u26A1',
        gold: true,
        items: byDom.slice(0, 4).map(r => ({
          name: r.scope.name,
          value: `${r.kpis[1].rawValue}d`,
        })),
      },
      {
        title: 'Highest Priced',
        emoji: '$',
        items: byPrice.slice(0, 4).map(r => ({
          name: r.scope.name,
          value: r.kpis[0].value,
        })),
      },
      {
        title: 'Tightest Inventory',
        emoji: '\uD83D\uDCCA',
        items: byInventory.slice(0, 4).map(r => ({
          name: r.scope.name,
          value: `${r.kpis[2].rawValue}`,
        })),
      },
    ];
  }

  // Community level — show price segments
  const segments = scope.getPriceSegments();
  return [
    {
      title: 'Price Segments',
      emoji: '$',
      gold: true,
      items: segments.map(s => ({
        name: s.range,
        value: `${s.active}A / ${s.sold}S`,
      })),
    },
  ];
}

const PulseRankedLists: React.FC<PulseRankedListsProps> = ({ scope, overview, level }) => {
  const lists = buildRankedLists(scope, overview, level);

  return (
    <div className={`grid gap-6 ${lists.length === 1 ? 'grid-cols-1' : `grid-cols-1 md:grid-cols-${Math.min(lists.length, 3)}`}`}>
      {lists.map((list, li) => (
        <div
          key={li}
          className={`bg-white p-4 shadow-sm overflow-hidden flex flex-col border-l-2 ${
            list.gold ? 'border-[#Bfa67a] hover:shadow-md' : 'border-[#0C1C2E]/20 hover:border-[#Bfa67a] hover:shadow-md'
          } transition-all`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[9px] uppercase tracking-[0.15em] font-bold ${
              list.gold ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/50'
            }`}>
              {list.title}
            </span>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              list.gold ? 'bg-[#Bfa67a]/10' : 'bg-[#0C1C2E]/5'
            }`}>
              <span className={`text-[8px] ${list.gold ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/50'}`}>
                {list.emoji}
              </span>
            </div>
          </div>
          <div className="space-y-[6px] flex-1">
            {list.items.map((item, ii) => (
              <div
                key={ii}
                className={`flex items-center justify-between p-1.5 rounded ${
                  ii === 0
                    ? (list.gold ? 'bg-[#Bfa67a]/10' : 'bg-[#0C1C2E]/5')
                    : 'hover:bg-[#F9F8F6]'
                } transition-colors cursor-pointer`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-serif w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${
                    ii === 0
                      ? (list.gold ? 'bg-[#Bfa67a] text-white' : 'bg-[#0C1C2E] text-white')
                      : (list.gold ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]/40')
                  }`}>
                    {ii + 1}
                  </span>
                  <div className="min-w-0">
                    {item.url ? (
                      <Link to={item.url} className="text-[11px] text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors truncate block">
                        {item.name}
                      </Link>
                    ) : (
                      <span className="text-[11px] text-[#0C1C2E] truncate block">{item.name}</span>
                    )}
                    {item.sub && (
                      <span className="text-[8px] text-gray-400">{item.sub}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-medium shrink-0 ml-2 ${
                  ii === 0
                    ? (list.gold ? 'text-[#Bfa67a]' : 'text-[#0C1C2E]')
                    : 'text-[#0C1C2E]/60'
                }`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PulseRankedLists;
