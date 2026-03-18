import { getCommuteData } from '../lib/enrichment';
import { CommuteMap } from './CommuteMap';
import { DestinationsTable } from './DestinationsTable';

interface LocationCommuteProps {
  listingKey: string;
  lat: number;
  lng: number;
  address: string;
  price?: string;
}

export async function LocationCommute({ listingKey, lat, lng, address, price }: LocationCommuteProps) {
  const commuteData = await getCommuteData(listingKey, lat, lng);

  // Matches CommunityExploreMap pattern — navy panel + map side by side
  return (
    <div className="col-span-12 shadow-lg shadow-black/5 overflow-hidden">
      <div className="grid grid-cols-12">
        {/* Left: Navy panel with distances */}
        <div className="col-span-12 lg:col-span-5 flex flex-col h-auto lg:h-[500px]">
          <div className="p-8 bg-navy">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] uppercase tracking-[0.25em] text-gold font-bold">
                Explore the Area
              </span>
            </div>
            <h3 className="text-2xl font-serif text-white mb-6">
              Location &amp; <span className="italic font-light">Commute</span>
            </h3>
          </div>
          <div className="flex-1 bg-navy px-8 pb-8 overflow-y-auto">
            {commuteData && <DestinationsTable commuteData={commuteData} />}
          </div>
        </div>

        {/* Right: Map */}
        <div className="col-span-12 lg:col-span-7 h-96 lg:h-[500px]">
          <CommuteMap lat={lat} lng={lng} address={address} price={price} />
        </div>
      </div>
    </div>
  );
}
