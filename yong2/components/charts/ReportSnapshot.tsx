import type { NarrativeBlock } from '@/lib/narrative';

type ReportSnapshotProps = {
  blocks: NarrativeBlock[];
  /** Heading text above the grid. Defaults to "The numbers in plain language". */
  heading?: string;
  /** Kicker label above the heading. */
  kicker?: string;
  /** Long-form intro below the heading. */
  intro?: string;
};

/**
 * Snapshot — grid of auto-generated narrative blocks derived from the
 * report's chart data. Rendered near the top of the detail page to give
 * a machine-backed read beside Yong's editorial copy.
 */
export function ReportSnapshot({
  blocks,
  heading = 'The numbers in plain language',
  kicker = 'Auto-generated snapshot',
  intro = 'Findings derived from the underlying transaction data, composed directly from the charts below.',
}: ReportSnapshotProps) {
  if (blocks.length === 0) return null;

  return (
    <section className="py-20 md:py-28 px-6 md:px-12 lg:px-20 border-b border-[color:var(--hairline)]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <p className="caps" style={{ color: 'var(--gold)' }}>
            {kicker}
          </p>
          <h2 className="display-lg mt-6 text-stone">
            {heading}
          </h2>
          {intro && (
            <p className="mt-5 text-base md:text-lg text-mute leading-relaxed">
              {intro}
            </p>
          )}
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 md:gap-y-12">
          {blocks.map((b, i) => (
            <li
              key={`${b.label}-${i}`}
              className="border-t border-[color:var(--hairline)] pt-6"
            >
              <p className="caps text-[10px]" style={{ color: 'var(--gold)' }}>
                {String(i + 1).padStart(2, '0')} — {b.label}
              </p>
              <p className="mt-4 text-base md:text-lg text-stone leading-relaxed">
                {b.headline}
              </p>
              {b.detail && (
                <p className="mt-3 text-sm text-mute leading-relaxed">
                  {b.detail}
                </p>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-14 text-[10px] opacity-70 max-w-2xl" style={{ color: 'var(--mute)' }}>
          Narrative blocks are generated deterministically from the data — no
          speculation. Every claim is derived from the figures surfaced in the
          charts below.
        </p>
      </div>
    </section>
  );
}
