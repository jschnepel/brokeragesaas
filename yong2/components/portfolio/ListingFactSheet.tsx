import type { Listing } from '@/lib/types';
import { formatPrice, formatSqft, formatAcres } from '@/components/shared/formatters';

type Props = { listing: Listing };
type Row = { label: string; value: string };

export function ListingFactSheet({ listing }: Props) {
  const rows: Row[] = [
    { label: 'Price', value: formatPrice(listing.listPrice) },
    { label: 'Bedrooms', value: listing.bedrooms?.toString() ?? '—' },
    { label: 'Bathrooms', value: listing.bathroomsTotal?.toString() ?? '—' },
    { label: 'Interior', value: formatSqft(listing.livingArea) },
    { label: 'Lot', value: formatAcres(listing.lotAcres) },
    { label: 'Year Built', value: listing.yearBuilt?.toString() ?? '—' },
    { label: 'MLS', value: listing.listingId ?? '—' },
    { label: 'Status', value: listing.status },
  ];
  return (
    <div className="bg-ink-elevated/30 p-6 md:p-8">
      {/* Price row gets visual elevation: serif display size, no caps
       * label, treated as the headline of the fact sheet. */}
      <div className="pb-5 mb-2 border-b border-white/10">
        <div className="caps text-stone/60 text-[10px]">List Price</div>
        <div className="font-serif text-3xl md:text-4xl text-stone mt-1">
          {formatPrice(listing.listPrice)}
        </div>
      </div>
      <dl>
        {rows.slice(1).map((r) => (
          <div
            key={r.label}
            className="flex justify-between items-baseline py-3 border-b border-white/5 last:border-b-0 text-sm"
          >
            <dt className="caps text-stone/70">{r.label}</dt>
            <dd className="text-stone">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
