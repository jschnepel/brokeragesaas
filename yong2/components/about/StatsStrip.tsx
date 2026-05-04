import { yongBio } from '@/content/yong';

export function StatsStrip() {
  return (
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 pt-8 mt-8 border-t border-white/10">
      {yongBio.stats.map((s) => (
        <div key={s.label}>
          <dt className="caps">{s.label}</dt>
          <dd className="font-serif text-3xl text-gold mt-2">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
