import type { LifestyleData } from '../lib/types';

interface ListingHeaderProps {
  lifestyleData: LifestyleData | null;
}

export function ListingHeader({ lifestyleData }: ListingHeaderProps) {
  if (!lifestyleData) return null;

  const cards: { label: string; value: string }[] = [];

  if (lifestyleData.elevationFt != null) {
    cards.push({ label: 'Elevation', value: `${lifestyleData.elevationFt.toLocaleString()} ft` });
  }
  if (lifestyleData.tempDiffF != null && lifestyleData.tempDiffF < 0) {
    cards.push({ label: 'vs Valley', value: `${Math.abs(lifestyleData.tempDiffF)}° Cooler` });
  }
  if (lifestyleData.aqiCurrent != null) {
    cards.push({ label: 'Air Quality', value: `AQI ${lifestyleData.aqiCurrent}` });
  }
  if (lifestyleData.noiseCategory) {
    cards.push({ label: 'Noise Level', value: lifestyleData.noiseCategory });
  }
  if (lifestyleData.bortleScale != null) {
    cards.push({ label: 'Dark Sky', value: `Bortle ${lifestyleData.bortleScale}` });
  }

  if (cards.length === 0) return null;

  return (
    <section className="relative z-10 -mt-10 max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20">
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(cards.length, 5)} gap-3`}>
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
