import type { CalculatedInsights } from '../lib/types';
import type { ListingDetail } from '@platform/database/src/queries/listings';

interface ListingHeaderProps {
  insights: CalculatedInsights;
  listing: ListingDetail;
}

function formatNumber(n: number | null | undefined): string {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

function formatLotSize(acres: number | null, sqft: number | null): string {
  const a = acres != null ? Number(acres) : 0;
  const s = sqft != null ? Number(sqft) : 0;
  if (a >= 1) return `${a.toFixed(2)} ac`;
  if (s > 0) return `${formatNumber(s)} SF`;
  return '';
}

export function ListingHeader({ insights, listing }: ListingHeaderProps) {
  const cards: { label: string; value: string }[] = [];

  if (insights.pricePerSqFt != null) {
    cards.push({ label: 'Price / SF', value: `$${insights.pricePerSqFt.toLocaleString()}` });
  }
  if (insights.domListing != null) {
    cards.push({ label: 'Days on Market', value: String(insights.domListing) });
  }
  if (listing.year_built) {
    cards.push({ label: 'Year Built', value: String(listing.year_built) });
  }
  const lot = formatLotSize(listing.lot_size_acres, listing.lot_size_square_feet);
  if (lot) {
    cards.push({ label: 'Lot Size', value: lot });
  }
  if (listing.garage_spaces) {
    cards.push({ label: 'Garage', value: `${listing.garage_spaces}-Car` });
  }
  if (listing.stories_total) {
    cards.push({ label: 'Stories', value: String(listing.stories_total) });
  }

  if (cards.length === 0) return null;

  return (
    <section className="relative z-10 -mt-10 max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-5 shadow-lg shadow-black/5 text-center">
            <span className="text-2xl font-serif text-navy block">{card.value}</span>
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mt-1">{card.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
