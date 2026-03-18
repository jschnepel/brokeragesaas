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

  // Matches CommunityEconomy — navy full-width card in the grid
  return (
    <div className="col-span-12 bg-navy p-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold mb-4 block">
            Property Details
          </span>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {details.map((d) => (
              <div key={d.label}>
                <span className="text-2xl font-serif text-white block">{d.value}</span>
                <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
