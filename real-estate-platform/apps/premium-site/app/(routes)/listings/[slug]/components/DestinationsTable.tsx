import type { CommuteData } from '../lib/types';

interface DestinationsTableProps {
  commuteData: CommuteData;
}

export function DestinationsTable({ commuteData }: DestinationsTableProps) {
  const allDestinations = [
    ...commuteData.destinations,
    ...(commuteData.groceryName
      ? [{
          name: `Nearest Grocery — ${commuteData.groceryName}`,
          distanceMiles: commuteData.groceryDistanceMiles,
          driveMinutes: commuteData.groceryDriveMinutes,
        }]
      : []),
  ].filter((d) => d.distanceMiles != null);

  if (allDestinations.length === 0) return null;

  // Matches CommunityTransportation "Key Distances" pattern
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Key Distances</span>
      </div>
      <div className="space-y-2">
        {allDestinations.map((dest) => (
          <div key={dest.name} className="flex justify-between items-center py-1.5 border-b border-white/10 last:border-0">
            <span className="text-white/60 text-sm">{dest.name}</span>
            <div className="flex items-center gap-3">
              {dest.distanceMiles != null && <span className="text-lg font-serif text-white">{dest.distanceMiles} mi</span>}
              {dest.driveMinutes != null && <span className="text-[9px] text-gray-400">{dest.driveMinutes} min</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
