import type { CommunityKpis as KpisData } from '@/lib/types';
import { formatPrice, formatDom } from '@/components/shared/formatters';

type Props = { kpis: KpisData | null };

export function CommunityKpis({ kpis }: Props) {
  if (!kpis) return null;
  const cells = [
    { label: 'Median Sale', value: kpis.medianPrice ? formatPrice(kpis.medianPrice) : '—' },
    { label: 'Active Listings', value: kpis.totalActive.toString() },
    { label: 'Median Days on Market', value: formatDom(kpis.medianDom) },
    { label: 'Avg $/Sqft', value: kpis.avgPpsf ? `$${Math.round(kpis.avgPpsf).toLocaleString()}` : '—' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border border-white/10 my-10">
      {cells.map((c, i) => (
        <div key={c.label} className={`p-6 text-center ${i < 3 ? 'border-b md:border-b-0 md:border-r border-white/10' : ''}`}>
          <div className="font-serif text-2xl">{c.value}</div>
          <div className="caps mt-2">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
