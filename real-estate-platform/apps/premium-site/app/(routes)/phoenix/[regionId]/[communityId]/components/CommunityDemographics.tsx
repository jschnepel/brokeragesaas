import type { DemographicsData } from '../lib/types';

interface CommunityDemographicsProps {
  demographics: DemographicsData | null;
}

export function CommunityDemographics({ demographics }: CommunityDemographicsProps) {
  if (!demographics) {
    return (
      <div className="bg-navy p-6">
        <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">
          At a Glance
        </span>
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
            Demographics unavailable
          </span>
        </div>
      </div>
    );
  }

  const items = [
    { label: 'Population', value: demographics.population },
    { label: 'Median Age', value: demographics.medianAge },
    { label: 'College Educated', value: demographics.collegeEducated },
    { label: 'Median Income', value: demographics.householdIncome },
    { label: 'Home Ownership', value: demographics.homeOwnership },
    { label: 'Avg Home Value', value: demographics.avgHomeValue },
  ];

  return (
    <div className="bg-navy p-6">
      <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">
        At a Glance
      </span>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={item.label}
            className={`flex justify-between items-center ${
              i < items.length - 1 ? 'pb-3 border-b border-white/10' : ''
            }`}
          >
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              {item.label}
            </span>
            <span className="text-xl font-serif text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
