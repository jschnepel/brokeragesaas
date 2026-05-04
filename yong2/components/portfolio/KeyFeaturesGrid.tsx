import { CapsLabel } from '@/components/shared/CapsLabel';

export type FeatureGroup = {
  /** Caps label rendered to the left of the chip row (e.g. "Interior"). */
  label: string;
  /** Chip texts. */
  items: ReadonlyArray<string>;
};

type KeyFeaturesGridProps = {
  groups: ReadonlyArray<FeatureGroup>;
};

/**
 * Editorial features chip grid — caps gold label on the left, chip
 * cards flowing to the right. Yong Premium uses this exact pattern
 * (apps/premium-site/listings/[slug] line 285+) to surface the
 * 13 ARMLS feature jsonb arrays without overwhelming the page.
 *
 * Empty / undefined groups are filtered upstream — render nothing
 * if the caller passes none.
 */
export function KeyFeaturesGrid({ groups }: KeyFeaturesGridProps) {
  const visible = groups.filter((g) => g.items.length > 0);
  if (visible.length === 0) return null;

  return (
    <section data-track="features" className="border-t border-white/10 pt-10">
      <CapsLabel as="h2" className="mb-6">Features &amp; Amenities</CapsLabel>
      <div className="space-y-4">
        {visible.map((group) => (
          <div key={group.label} className="flex flex-wrap items-start gap-2">
            <span className="caps text-gold py-1.5 pr-3 shrink-0 min-w-[110px]">
              {group.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="inline-block bg-ink-elevated/40 border border-white/10 text-stone/85 text-xs px-3 py-1.5"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
