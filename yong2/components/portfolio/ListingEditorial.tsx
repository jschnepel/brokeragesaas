import { CapsLabel } from '@/components/shared/CapsLabel';

export type EditorialEntry = {
  heading: string;
  body: string;
};

type ListingEditorialProps = {
  entries: ReadonlyArray<EditorialEntry>;
};

/**
 * Optional editorial sub-sections — italic-serif heading + body
 * paragraph. Modeled on Jeane's listing detail editorial pattern
 * (Jeane/jeane-site/app/listings/[slug] lines 77-90).
 *
 * Used to add narrative depth to top listings: siting, materials,
 * program, presentation. Hand-curated by Yong / listing-prep team
 * for hero properties only — most listings will pass `entries: []`
 * and this component renders nothing.
 */
export function ListingEditorial({ entries }: ListingEditorialProps) {
  if (entries.length === 0) return null;

  return (
    <section data-track="editorial" className="border-t border-white/10 pt-10">
      <CapsLabel as="h2" className="mb-8">A closer look</CapsLabel>
      <div className="space-y-10 max-w-2xl">
        {entries.map((entry) => (
          <div key={entry.heading}>
            <p className="font-serif italic text-gold text-xl md:text-2xl leading-snug">
              {entry.heading}.
            </p>
            <p className="mt-3 text-stone/85 leading-relaxed text-base md:text-lg">
              {entry.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
