import type { ListingDetail } from '@platform/database/src/queries/listings';
import { parseJsonbArray } from '../lib/types';

function buildTags(listing: ListingDetail): string[] {
  const tags: string[] = [];

  if (listing.pool_private_yn) tags.push('Private Pool');
  const community = parseJsonbArray(listing.community_features);
  const gated = community.filter((f) => /guard.?gated|gated/i.test(f));
  if (gated.length > 0) tags.push(gated[0]);

  const water = parseJsonbArray(listing.water_source);
  if (water.length > 0) tags.push(water[0]);

  if (listing.association_yn === false) {
    tags.push('No HOA');
  } else if (listing.association_fee != null) {
    const freq = listing.association_fee_frequency ?? 'mo';
    tags.push(`HOA $${listing.association_fee.toLocaleString()}/${freq}`);
  }

  const styles = parseJsonbArray(listing.architectural_style);
  styles.forEach((s) => tags.push(s));

  const cooling = parseJsonbArray(listing.cooling);
  cooling.forEach((c) => tags.push(c));

  const covered = listing.covered_spaces ?? 0;
  const carport = listing.carport_spaces ?? 0;
  if (covered > 0) tags.push(`${covered} Covered Parking`);
  if (carport > 0) tags.push(`${carport} Carport`);

  const lot = parseJsonbArray(listing.lot_features);
  lot.slice(0, 3).forEach((l) => tags.push(l));

  return tags;
}

interface PropertyHighlightsProps {
  listing: ListingDetail;
}

export function PropertyHighlights({ listing }: PropertyHighlightsProps) {
  const tags = buildTags(listing);
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-gray-100 text-navy px-4 py-2.5 md:py-2 text-[10px] uppercase tracking-widest font-bold"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
