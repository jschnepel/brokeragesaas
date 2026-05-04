import { CapsLabel } from '@/components/shared/CapsLabel';
import { FEATURE_GROUP_LABELS, type FeatureGroup } from '@/lib/listing-narrative';

type KeyFeaturesGridProps = {
  groups: ReadonlyArray<FeatureGroup>;
  /**
   * How many feature groups render visibly before the rest collapse
   * behind a `<details>` expand. Default 5 — buyers skim; the long
   * tail is available for those who care.
   */
  visibleCount?: number;
};

/**
 * Compact features list — caps gold label + items joined by middots.
 * Reads as editorial inventory rather than a chip cloud.
 *
 * Renders `visibleCount` groups (default 5) by canonical
 * FEATURE_GROUP_LABELS order. Remaining groups collapse into a
 * native <details> expand — no JS needed. Empty groups skipped.
 */
export function KeyFeaturesGrid({ groups, visibleCount = 5 }: KeyFeaturesGridProps) {
  // Sort groups by canonical enum order so the same categories surface
  // in the same place across every listing.
  const ordered = FEATURE_GROUP_LABELS
    .map((label) => groups.find((g) => g.label === label))
    .filter((g): g is FeatureGroup => g != null && g.items.length > 0);

  if (ordered.length === 0) return null;

  const visible = ordered.slice(0, visibleCount);
  const hidden = ordered.slice(visibleCount);

  return (
    <section data-track="features">
      <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
      <CapsLabel as="h2" className="mb-8">Features</CapsLabel>
      <div className="space-y-4">
        {visible.map((group) => (
          <FeatureRow key={group.label} group={group} />
        ))}
      </div>
      {hidden.length > 0 ? (
        <details className="mt-6 group">
          <summary className="caps text-[10px] text-stone/55 hover:text-gold transition-colors tracking-widest cursor-pointer list-none inline-flex items-center gap-2 select-none">
            <span>
              {hidden.length} more · {hidden.map((g) => g.label).join(' · ')}
            </span>
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">↓</span>
          </summary>
          <div className="space-y-4 mt-6 pt-6 border-t border-white/5">
            {hidden.map((group) => (
              <FeatureRow key={group.label} group={group} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function FeatureRow({ group }: { group: FeatureGroup }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2 md:gap-6">
      <span className="caps text-[10px] text-gold/85 tracking-widest pt-0.5">
        {group.label}
      </span>
      <p className="text-stone/85 leading-relaxed">
        {group.items.join(' · ')}
      </p>
    </div>
  );
}
