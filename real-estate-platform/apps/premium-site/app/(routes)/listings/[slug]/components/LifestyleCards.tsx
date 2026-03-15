import type { LifestyleData } from '../lib/types';

interface LifestyleCardsProps {
  data: LifestyleData;
}

export function LifestyleCards({ data }: LifestyleCardsProps) {
  const cards: { label: string; value: string; detail: string }[] = [];

  if (data.elevationFt != null) {
    const diffLabel = data.elevationDiffFt != null && data.elevationDiffFt > 0
      ? `+${data.elevationDiffFt.toLocaleString()} ft vs PHX` : '';
    cards.push({ label: 'Elevation', value: `${data.elevationFt.toLocaleString()} ft`, detail: diffLabel });
  }

  if (data.tempDiffF != null && data.tempDiffF < 0) {
    cards.push({ label: 'Temperature', value: `${Math.abs(data.tempDiffF)}° cooler`, detail: 'than valley floor' });
  }

  if (data.aqiCurrent != null) {
    const comparison = data.aqiMetroAvg != null
      ? `${data.aqiCurrent < data.aqiMetroAvg ? Math.round(((data.aqiMetroAvg - data.aqiCurrent) / data.aqiMetroAvg) * 100) + '% better than' : 'Similar to'} metro avg` : '';
    cards.push({ label: 'Air Quality', value: `AQI ${data.aqiCurrent}`, detail: `${data.aqiCategory ?? ''}${comparison ? ` · ${comparison}` : ''}` });
  }

  if (data.noiseCategory) {
    cards.push({ label: 'Noise', value: data.noiseCategory, detail: data.noiseDescriptor ?? '' });
  }

  if (data.bortleScale != null) {
    cards.push({ label: 'Light Pollution', value: `Bortle ${data.bortleScale}`, detail: data.bortleLabel ?? '' });
  }

  if (cards.length === 0) return null;

  return (
    <div className="mb-16 lg:mb-20">
      <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">Lifestyle Intelligence</span>
      <div className="w-12 h-0.5 bg-gold mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-3 border-t border-navy/8">
        {cards.map((card) => (
          <div key={card.label} className="border-b border-navy/8 py-4 pr-6">
            <span className="block text-label uppercase tracking-lg text-gold font-bold mb-1">{card.label}</span>
            <span className="block text-sm text-navy font-medium">{card.value}</span>
            {card.detail && <span className="block text-tab text-navy/40 mt-0.5">{card.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
