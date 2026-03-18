import type { LifestyleData } from '../lib/types';

interface LifestyleCardsProps {
  data: LifestyleData;
}

export function LifestyleCards({ data }: LifestyleCardsProps) {
  const items: { label: string; value: string; detail: string }[] = [];

  if (data.elevationFt != null) {
    const diffLabel = data.elevationDiffFt != null && data.elevationDiffFt > 0
      ? `+${data.elevationDiffFt.toLocaleString()} ft vs PHX` : '';
    items.push({ label: 'Elevation', value: `${data.elevationFt.toLocaleString()} ft`, detail: diffLabel });
  }

  if (data.tempDiffF != null && data.tempDiffF < 0) {
    items.push({ label: 'Temperature', value: `${Math.abs(data.tempDiffF)}° cooler`, detail: 'than valley floor' });
  }

  if (data.aqiCurrent != null) {
    const comparison = data.aqiMetroAvg != null
      ? `${data.aqiCurrent < data.aqiMetroAvg ? Math.round(((data.aqiMetroAvg - data.aqiCurrent) / data.aqiMetroAvg) * 100) + '% better than' : 'Similar to'} metro avg` : '';
    items.push({ label: 'Air Quality', value: `AQI ${data.aqiCurrent}`, detail: `${data.aqiCategory ?? ''}${comparison ? ` · ${comparison}` : ''}` });
  }

  if (data.noiseCategory) {
    items.push({ label: 'Noise', value: data.noiseCategory, detail: data.noiseDescriptor ?? '' });
  }

  if (data.bortleScale != null) {
    items.push({ label: 'Light Pollution', value: `Bortle ${data.bortleScale}`, detail: data.bortleLabel ?? '' });
  }

  if (items.length === 0) return null;

  // Matches CommunityQualityOfLife pattern
  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white p-6 shadow-lg shadow-black/5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Lifestyle Intelligence</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="font-bold text-navy text-sm">{item.value}</p>
            <p className="text-[8px] uppercase tracking-widest text-gray-400">{item.label}</p>
            {item.detail && <p className="text-[9px] text-gray-400 mt-0.5">{item.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
