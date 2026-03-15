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
    <div>
      <CommuteMap lat={lat} lng={lng} address={address} />
      {commuteData && <DestinationsTable commuteData={commuteData} />}
    </div>
  );
}
