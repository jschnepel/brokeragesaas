import type { ListingDetail } from '@platform/database/src/queries/listings';

interface SchoolsSectionProps {
  listing: ListingDetail;
}

export function SchoolsSection({ listing }: SchoolsSectionProps) {
  const schools = [
    { label: 'Elementary', value: listing.elementary_school },
    { label: 'Middle', value: listing.middle_or_junior_school },
    { label: 'HS District', value: listing.high_school_district },
  ].filter((s): s is { label: string; value: string } => s.value != null && s.value !== '');

  if (schools.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/30 mb-4">Schools</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 border-t border-navy/8">
        {schools.map((school) => (
          <div key={school.label} className="border-b border-navy/8 py-3 pr-4">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-navy/30 mb-1">{school.label}</span>
            <span className="block text-sm text-navy font-medium">{school.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
