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

  return (
    <div>
      <span className="text-label uppercase tracking-lg text-gold font-bold block mb-3">Distances</span>
      <div className="border-t border-navy/8">
        {allDestinations.map((dest) => (
          <div key={dest.name} className="flex items-center justify-between py-2.5 border-b border-navy/5">
            <span className="text-sm text-navy">{dest.name}</span>
            <div className="flex gap-4 text-sm text-navy/50">
              {dest.distanceMiles != null && <span>{dest.distanceMiles} mi</span>}
              {dest.driveMinutes != null && <span>{dest.driveMinutes} min</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
