import type { ListingDetail } from '@platform/database/src/queries/listings';

interface SchoolsSectionProps {
  listing: ListingDetail;
}

export function SchoolsSection({ listing }: SchoolsSectionProps) {
  const schools = [
    { name: listing.elementary_school, type: 'Elementary School' },
    { name: listing.middle_or_junior_school, type: 'Middle School' },
    { name: listing.high_school_district, type: 'High School District' },
  ].filter((s): s is { name: string; type: string } => s.name != null && s.name !== '');

  if (schools.length === 0) return null;

  // Matches CommunitySchools pattern
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Schools</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {schools.map((school) => (
          <div key={school.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="min-w-0">
              <p className="font-bold text-navy text-sm truncate">{school.name}</p>
              <p className="text-[9px] text-gray-400">{school.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
