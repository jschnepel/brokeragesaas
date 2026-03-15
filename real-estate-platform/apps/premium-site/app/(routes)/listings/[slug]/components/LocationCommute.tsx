import { getCommuteData } from '../lib/enrichment';
import { CommuteMap } from './CommuteMap';
import { DestinationsTable } from './DestinationsTable';

interface LocationCommuteProps {
  listingKey: string;
  lat: number;
  lng: number;
  address: string;
}

export async function LocationCommute({ listingKey, lat, lng, address }: LocationCommuteProps) {
  const commuteData = await getCommuteData(listingKey, lat, lng);
  return (
    <div className="mb-16 lg:mb-20">
      <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">Location &amp; Commute</span>
      <div className="w-12 h-0.5 bg-gold mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <CommuteMap lat={lat} lng={lng} address={address} />
        {commuteData && <DestinationsTable commuteData={commuteData} />}
      </div>
    </div>
  );
}
