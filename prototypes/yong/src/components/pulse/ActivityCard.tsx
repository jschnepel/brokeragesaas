import { Home, TrendingUp, TrendingDown, Clock, Tag } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'sold' | 'new' | 'price-change' | 'expired';
  address: string;
  community: string;
  price: string;
  priceRaw: number;
  detail: string;
  date: string;
  daysAgo: number;
}

const TYPE_CONFIG = {
  sold: {
    color: 'border-l-emerald-500 bg-emerald-50/50',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: TrendingUp,
    label: 'Sold',
  },
  new: {
    color: 'border-l-blue-500 bg-blue-50/50',
    badge: 'bg-blue-100 text-blue-700',
    icon: Home,
    label: 'New Listing',
  },
  'price-change': {
    color: 'border-l-amber-500 bg-amber-50/50',
    badge: 'bg-amber-100 text-amber-700',
    icon: Tag,
    label: 'Price Change',
  },
  expired: {
    color: 'border-l-rose-500 bg-rose-50/50',
    badge: 'bg-rose-100 text-rose-700',
    icon: Clock,
    label: 'Expired',
  },
};

const ActivityCard: React.FC<{ item: ActivityItem }> = ({ item }) => {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <div className={`border-l-4 ${config.color} p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0">
            <Icon size={16} className="text-gray-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[7px] uppercase tracking-[0.15em] font-bold px-1.5 py-0.5 ${config.badge}`}>
                {config.label}
              </span>
              <span className="text-[8px] text-gray-400">{item.daysAgo === 0 ? 'Today' : `${item.daysAgo}d ago`}</span>
            </div>
            <h4 className="text-sm font-serif text-[#0C1C2E] leading-tight truncate">{item.address}</h4>
            <span className="text-[9px] text-gray-400 block">{item.community}</span>
            <span className="text-[9px] text-gray-500 mt-1 block">{item.detail}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-serif text-[#0C1C2E] block leading-tight">{item.price}</span>
          <span className="text-[8px] text-gray-400">{item.date}</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
