import type { Employer, EconomicStat } from '../lib/types';

interface CommunityEconomyProps {
  employers: Employer[];
  economicStats: EconomicStat[];
}

export function CommunityEconomy({ employers, economicStats }: CommunityEconomyProps) {
  if (employers.length === 0 && economicStats.length === 0) return null;

  return (
    <div className="col-span-12 bg-navy p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Economic Stats */}
        {economicStats.length > 0 && (
          <div className="col-span-12 lg:col-span-4">
            <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold mb-4 block">
              Economic Indicators
            </span>
            <div className="grid grid-cols-2 gap-4">
              {economicStats.map((stat, i) => (
                <div key={i}>
                  <span className="text-2xl font-serif text-white block">{stat.value}</span>
                  <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employers */}
        {employers.length > 0 && (
          <div className="col-span-12 lg:col-span-8">
            <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold mb-4 block">
              Major Employers
            </span>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {employers.map((employer, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors group"
                >
                  <p className="text-white font-bold text-sm group-hover:text-gold transition-colors truncate">
                    {employer.name}
                  </p>
                  <p className="text-gray-500 text-[9px]">{employer.sector}</p>
                  <p className="text-gold font-bold text-xs mt-1">{employer.employees}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
