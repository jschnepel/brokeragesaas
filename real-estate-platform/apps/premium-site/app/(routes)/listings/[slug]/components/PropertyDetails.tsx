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
    <section className="bg-navy py-12 lg:py-16">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
        <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">Property Details</span>
        <div className="w-12 h-0.5 bg-gold mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-white/10">
          {details.map((d) => (
            <div key={d.label} className="flex justify-between py-2.5 border-b border-white/8 pr-8">
              <span className="text-label uppercase tracking-sm text-white/40">{d.label}</span>
              <span className="text-sm text-white">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
