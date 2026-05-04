import { CapsLabel } from '@/components/shared/CapsLabel';
import { FEATURE_GROUP_LABELS, type FeatureGroup } from '@/lib/listing-narrative';

type KeyFeaturesGridProps = {
  groups: ReadonlyArray<FeatureGroup>;
};

/**
 * Editorial features chip grid — caps gold label on the left, chip
 * cards flowing to the right. Renders only the groups present in
 * the narrative; render order matches FEATURE_GROUP_LABELS so
 * sections appear in the same order across every listing.
 *
 * The narrative workflow produces these groups by mapping the raw
 * ARMLS jsonb arrays (interior_features, exterior_features, etc.)
 * into the fixed FeatureGroupLabel enum. Categorization is
 * deterministic — no per-listing label invention.
 */
export function KeyFeaturesGrid({ groups }: KeyFeaturesGridProps) {
  // Order groups by the canonical enum order so the page reads the
  // same way for every listing (Architecture first, Climate last).
  const ordered = FEATURE_GROUP_LABELS
    .map((label) => groups.find((g) => g.label === label))
    .filter((g): g is FeatureGroup => g != null && g.items.length > 0);

  if (ordered.length === 0) return null;

  return (
    <section data-track="features" className="border-t border-white/10 pt-10">
      <CapsLabel as="h2" className="mb-6">Features &amp; Amenities</CapsLabel>
      <div className="space-y-4">
        {ordered.map((group) => (
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
