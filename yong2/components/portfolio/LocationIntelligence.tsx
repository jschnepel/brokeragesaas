import { CapsLabel } from '@/components/shared/CapsLabel';
import { ListingMap } from './ListingMap';

type Distance = { label: string; value: string };

type LocationIntelligenceProps = {
  latitude: number;
  longitude: number;
  address: string;
  community: string;
  /** Editorial paragraph from `content/communities.ts`. */
  communityNarrative: string;
  /** Distance-to rows — pre-computed at narrative time (Distance Matrix). */
  distances: ReadonlyArray<Distance>;
};

/**
 * Combined map + neighborhood narrative + distances. Single section
 * (was 3 separate rows in v2). Map left, editorial right with the
 * privacy note at the bottom. Hairline rules separate distance rows.
 */
export function LocationIntelligence({
  latitude,
  longitude,
  address,
  community,
  communityNarrative,
  distances,
}: LocationIntelligenceProps) {
  return (
    <section data-track="map" className="border-t border-white/5">
      <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
      <CapsLabel as="h2" className="mb-8">Location</CapsLabel>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-12 items-start">
        {/* Map */}
        <div className="relative">
          <ListingMap latitude={latitude} longitude={longitude} address={address} />
        </div>

        {/* Right column — neighborhood + distances + privacy */}
        <div>
          <p className="caps text-[10px] text-stone/55 tracking-widest mb-3">
            {community} · North Scottsdale
          </p>
          <p className="font-serif italic text-stone/90 text-lg md:text-xl leading-snug mb-8 max-w-md">
            {communityNarrative}
          </p>

          {distances.length > 0 ? (
            <>
              <CapsLabel as="h3" className="text-[10px] text-stone/55 mb-4">
                Distance to
              </CapsLabel>
              <dl className="space-y-0">
                {distances.map((d, i) => (
                  <div
                    key={d.label}
                    className={`flex justify-between items-baseline py-2.5 text-sm ${
                      i === distances.length - 1 ? '' : 'border-b border-white/5'
                    }`}
                  >
                    <dt className="text-stone/65">{d.label}</dt>
                    <dd className="text-stone tabular-nums">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}

          <p className="caps text-[10px] text-stone/40 tracking-widest mt-8 pt-6 border-t border-white/5">
            Address shared with qualified buyers following inquiry.
          </p>
        </div>
      </div>
    </section>
  );
}
