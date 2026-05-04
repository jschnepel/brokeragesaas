import { yongBio } from '@/content/yong';

/**
 * Stats / proof-points band — sits between the hero and HomeIntro.
 *
 * Industry pattern: tier-1 luxury sites (David Parnes, Compass, Sotheby's)
 * keep the hero quiet (kicker + headline + single CTA) and place credibility
 * stats in a dedicated thin band one scroll below the hero. This solves
 * two problems the previous in-hero stats had: (1) competing with the
 * headline for fold space at mobile widths and (2) wrapping awkwardly
 * when stats overflow horizontally on narrow viewports.
 *
 * Three stats max, divided by hairline at md+, stacked at mobile.
 */
export function StatsBand() {
  const { stats } = yongBio;
  const items = stats.slice(0, 3);
  return (
    <section
      aria-label="Career proof points"
      className="bg-ink-elevated border-y border-white/5"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-10 md:py-14">
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-y-8 md:gap-y-0">
          {items.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center text-center md:px-8 ${
                i > 0 ? 'md:border-l md:border-white/10' : ''
              }`}
            >
              <dd className="font-serif text-4xl md:text-5xl text-stone leading-none">
                {s.value}
              </dd>
              <dt className="caps mt-3 text-stone/70 text-[10px] md:text-xs">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
