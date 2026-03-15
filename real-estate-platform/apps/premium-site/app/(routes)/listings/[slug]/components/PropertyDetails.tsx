import type { ListingDetail } from '@platform/database/src/queries/listings';

interface PropertyDetailsProps {
  listing: ListingDetail;
}

export function PropertyDetails({ listing }: PropertyDetailsProps) {
  const details = [
    { label: 'Type', value: listing.property_type },
    { label: 'SubType', value: listing.property_sub_type },
    { label: 'Status', value: listing.standard_status },
    { label: 'County', value: listing.county_or_parish },
    { label: 'Tax', value: listing.tax_annual_amount ? `$${listing.tax_annual_amount.toLocaleString()}/yr` : null },
    { label: 'Parcel', value: listing.parcel_number },
  ].filter((d): d is { label: string; value: string } => d.value != null && d.value !== '');

  if (details.length === 0) return null;

  return (
    <div className="mb-16 lg:mb-20">
      <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">Property Details</span>
      <div className="w-12 h-0.5 bg-gold mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 border-t border-navy/8">
        {details.map((d) => (
          <div key={d.label} className="flex justify-between py-2 border-b border-navy/5 pr-8">
            <span className="text-label uppercase tracking-sm text-navy/40">{d.label}</span>
            <span className="text-sm text-navy">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
