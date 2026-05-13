import type { TierBreakdown } from '@/lib/market-reports';

/**
 * Luxury-tier breakdown — one card per band, with active count,
 * median ppsf, median DOM, and a 1-line commentary string.
 *
 * The underlying parquet (`fct_active_by_pricetier`) is a current
 * snapshot — not period-bucketed — so the same numbers ship on every
 * weekly + monthly detail page until the dbt mart gains historical
 * depth. The `asOf` label makes this visible to the reader.
 */
export interface TierBreakdownProps {
  breakdown: TierBreakdown | null;
}

const DOLLAR = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function TierBreakdownSection({ breakdown }: TierBreakdownProps) {
  if (!breakdown || breakdown.tiers.length === 0) {
    return null;
  }

  return (
    <section
      className="py-20 md:py-24 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]"
      style={{ background: 'var(--ink-surface)' }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
            <p className="caps">By the tier</p>
            <h2 className="display-lg mt-4 text-stone tracking-[-0.005em] max-w-2xl">
              Two luxury bands. Two different markets.
            </h2>
          </div>
          <p
            className="caps text-[10px] tracking-[0.32em] max-w-xs md:text-right"
            style={{ color: 'var(--mute)' }}
          >
            Active snapshot · {breakdown.asOf}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {breakdown.tiers.map((t) => (
            <article
              key={t.bandKey}
              className="bg-ink-elevated/40 border border-white/5 hover:border-white/15 transition-colors duration-300 p-7 md:p-8 flex flex-col"
            >
              <p className="caps text-[10px] text-stone/55 tracking-[0.32em]">Price band</p>
              <h3
                className="mt-3 font-serif text-stone tabular-nums tracking-[-0.015em] leading-none"
                style={{ fontSize: 'clamp(28px, 3vw, 36px)' }}
              >
                {t.label}
              </h3>

              <dl className="mt-8 grid grid-cols-3 gap-x-6 gap-y-5">
                <div>
                  <dt className="caps text-[10px] text-stone/45 tracking-[0.3em]">Active</dt>
                  <dd
                    className="mt-2 font-serif text-stone tabular-nums leading-none"
                    style={{ fontSize: 'clamp(24px, 2.4vw, 30px)' }}
                  >
                    {t.active}
                  </dd>
                </div>
                <div>
                  <dt className="caps text-[10px] text-stone/45 tracking-[0.3em]">Median PPSF</dt>
                  <dd
                    className="mt-2 font-serif text-gold tabular-nums leading-none"
                    style={{ fontSize: 'clamp(20px, 2vw, 26px)' }}
                  >
                    {t.medianPpsf != null ? DOLLAR(t.medianPpsf) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="caps text-[10px] text-stone/45 tracking-[0.3em]">Median DOM</dt>
                  <dd
                    className="mt-2 font-serif text-stone tabular-nums leading-none"
                    style={{ fontSize: 'clamp(20px, 2vw, 26px)' }}
                  >
                    {t.medianDom != null ? Math.round(t.medianDom) : '—'}
                    {t.medianDom != null ? (
                      <span className="text-sm text-stone/40 ml-1.5 font-sans">days</span>
                    ) : null}
                  </dd>
                </div>
              </dl>

              <p className="mt-8 pt-6 border-t border-white/5 text-sm text-stone/75 leading-relaxed italic">
                {t.commentary}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
