import type { ListingDetail } from '@platform/database/src/queries/listings';
import { parseJsonbArray } from '../lib/types';

interface HighlightItem {
  label: string;
  value: string;
}

function buildHighlights(listing: ListingDetail): HighlightItem[] {
  const items: HighlightItem[] = [];

  if (listing.pool_private_yn) {
    const features = parseJsonbArray(listing.pool_features);
    const detail = features.length > 0 ? `Private Pool · ${features.slice(0, 3).join(', ')}` : 'Private Pool';
    items.push({ label: 'Pool', value: detail });
  }

  const communityFeatures = parseJsonbArray(listing.community_features);
  const gatedKeywords = communityFeatures.filter((f) => /guard.?gated|gated|age.?restrict/i.test(f));
  if (gatedKeywords.length > 0) {
    items.push({ label: 'Community', value: gatedKeywords.join(', ') });
  }

  const waterSources = parseJsonbArray(listing.water_source);
  if (waterSources.length > 0) {
    items.push({ label: 'Water', value: waterSources[0] });
  }

  if (listing.association_yn === false) {
    items.push({ label: 'HOA', value: 'None' });
  } else if (listing.association_fee != null) {
    const freq = listing.association_fee_frequency ?? 'mo';
    items.push({ label: 'HOA', value: `$${listing.association_fee.toLocaleString()}/${freq}` });
  }

  const styles = parseJsonbArray(listing.architectural_style);
  if (styles.length > 0) items.push({ label: 'Style', value: styles.join(', ') });

  const cooling = parseJsonbArray(listing.cooling);
  if (cooling.length > 0) items.push({ label: 'Cooling', value: cooling.join(', ') });

  const covered = listing.covered_spaces ?? 0;
  const carport = listing.carport_spaces ?? 0;
  const open = listing.open_parking_spaces ?? 0;
  const parkingParts: string[] = [];
  if (covered > 0) parkingParts.push(`${covered} Covered`);
  if (carport > 0) parkingParts.push(`${carport} Carport`);
  if (open > 0) parkingParts.push(`${open} Open`);
  if (parkingParts.length > 0) items.push({ label: 'Parking', value: parkingParts.join(', ') });

  const lotFeatures = parseJsonbArray(listing.lot_features);
  if (lotFeatures.length > 0) items.push({ label: 'Lot', value: lotFeatures.slice(0, 3).join(', ') });

  return items;
}

interface PropertyHighlightsProps {
  listing: ListingDetail;
}

export function PropertyHighlights({ listing }: PropertyHighlightsProps) {
  const highlights = buildHighlights(listing);
  if (highlights.length === 0) return null;

  return (
    <div className="mb-16 lg:mb-20">
      <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">Property Highlights</span>
      <div className="w-12 h-0.5 bg-gold mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-3 border-t border-navy/8">
        {highlights.map((item) => (
          <div key={item.label} className="border-b border-navy/8 py-4 pr-6">
            <span className="block text-label uppercase tracking-lg text-gold font-bold mb-1">{item.label}</span>
            <span className="block text-sm text-navy font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
