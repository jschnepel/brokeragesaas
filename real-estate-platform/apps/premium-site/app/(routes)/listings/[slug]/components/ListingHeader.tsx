import Link from 'next/link';
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
      <div className="bg-cream-alt border-b border-navy/10 py-3">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-20">
          <Link href="/listings" className="text-xs text-navy/40 hover:text-gold transition-colors duration-300 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Listings
          </Link>
        </div>
      </div>
      {cards.length > 0 && (
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-20 py-6">
          <div className="flex gap-4">
            {cards.map((card) => (
              <div key={card.label} className="border border-navy/10 bg-cream px-5 py-3 flex-1 max-w-[200px]">
                <span className="block text-lg text-navy font-medium">{card.value}</span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-navy/30 mt-0.5">{card.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
