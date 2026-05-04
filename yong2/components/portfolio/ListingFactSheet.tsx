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
    <dl className="border-t border-white/10">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between py-3 border-b border-white/10 text-sm">
          <dt className="caps">{r.label}</dt>
          <dd className={r.label === 'Price' ? 'font-serif text-base' : ''}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
