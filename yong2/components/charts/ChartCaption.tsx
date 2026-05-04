import type { NarrativeBlock } from '@/lib/narrative';

type ChartCaptionProps = {
  block: NarrativeBlock;
};

/**
 * Compact auto-generated caption rendered beneath each chart. Derives
 * a one-sentence "read" from the chart's data, plus an optional detail line.
 */
export function ChartCaption({ block }: ChartCaptionProps) {
  return (
    <div className="mt-8 pt-6 border-t border-[color:var(--hairline)] max-w-3xl">
      <p className="caps text-[10px]" style={{ color: 'var(--gold)' }}>
        {block.label} · auto
      </p>
      <p className="mt-3 text-base md:text-lg text-stone leading-relaxed">
        {block.headline}
      </p>
      {block.detail && (
        <p className="mt-2 text-sm text-mute leading-relaxed">
          {block.detail}
        </p>
      )}
    </div>
  );
}
