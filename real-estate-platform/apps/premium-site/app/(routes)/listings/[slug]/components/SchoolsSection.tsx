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
    <div className="mb-16 lg:mb-20">
      <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">Schools</span>
      <div className="w-12 h-0.5 bg-gold mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-3 border-t border-navy/8">
        {schools.map((school) => (
          <div key={school.label} className="border-b border-navy/8 py-4 pr-6">
            <span className="block text-label uppercase tracking-lg text-gold font-bold mb-1">{school.label}</span>
            <span className="block text-sm text-navy font-medium">{school.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
