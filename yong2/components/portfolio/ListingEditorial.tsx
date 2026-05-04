import { CapsLabel } from '@/components/shared/CapsLabel';
import type { NarrativeEditorial } from '@/lib/listing-narrative';

type ListingEditorialProps = {
  editorial: NarrativeEditorial;
};

/**
 * Optional editorial sub-sections — italic-serif heading + body
 * paragraph. Slot order is fixed: site → materials → program →
 * presentation. Slots the workflow leaves undefined are skipped.
 *
 * Headings are derived from the slot key, not free-form text. This
 * lets the narrative workflow operate against a small enum and
 * guarantees consistent reading rhythm across listings.
 */
const SLOT_HEADINGS: Record<keyof NarrativeEditorial, string> = {
  site: 'The site',
  materials: 'Materials',
  program: 'Program',
  presentation: 'Presentation',
};

const SLOT_ORDER: ReadonlyArray<keyof NarrativeEditorial> = [
  'site',
  'materials',
  'program',
  'presentation',
];

export function ListingEditorial({ editorial }: ListingEditorialProps) {
  const filled = SLOT_ORDER.filter((slot) => editorial[slot]);
  if (filled.length === 0) return null;

  return (
    <section data-track="editorial" className="border-t border-white/10 pt-10">
      <CapsLabel as="h2" className="mb-8">A closer look</CapsLabel>
      <div className="space-y-10 max-w-2xl">
        {filled.map((slot) => (
          <div key={slot}>
            <p className="font-serif italic text-gold text-xl md:text-2xl leading-snug">
              {SLOT_HEADINGS[slot]}.
            </p>
            <p className="mt-3 text-stone/85 leading-relaxed text-base md:text-lg">
              {editorial[slot]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
