import type { CalculatedInsights } from '../lib/types';

interface ListingHeaderProps {
  insights: CalculatedInsights;
}

export function ListingHeader({ insights }: ListingHeaderProps) {
  const cards: { value: string; label: string }[] = [];

  if (insights.pricePerSqFt != null) {
    cards.push({ value: `$${insights.pricePerSqFt.toLocaleString()}/SF`, label: 'Price per SF' });
  }

  if (insights.domListing != null) {
    const avgLabel = insights.domAreaAvg != null ? ` · Avg: ${Math.round(insights.domAreaAvg)}` : '';
    cards.push({ value: `${insights.domListing} DOM`, label: `Days on Market${avgLabel}` });
  }

  return (
    <>
      {cards.length > 0 && (
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-20 py-6">
          <div className="flex gap-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className="bg-white border border-navy/8 px-5 py-3 flex-1 max-w-[200px] shadow-lg shadow-black/5"
                style={{ borderRadius: 4 }}
              >
                <span className="block text-lg text-navy font-medium">{card.value}</span>
                <span className="block text-label uppercase tracking-xl text-gold font-bold mt-0.5">{card.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
