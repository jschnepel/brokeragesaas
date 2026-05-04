import { CapsLabel } from '@/components/shared/CapsLabel';

type ListingSchoolsBlockProps = {
  elementary: string | null;
  middle: string | null;
  highSchoolDistrict: string | null;
};

/**
 * Schools dl — three rows when present. Filtered to non-null only;
 * renders nothing if all three are missing.
 *
 * Compact sidebar block, paired with FinancialDetails on the right
 * column of the listing detail page.
 */
export function ListingSchoolsBlock({ elementary, middle, highSchoolDistrict }: ListingSchoolsBlockProps) {
  const rows = [
    { label: 'Elementary', value: elementary },
    { label: 'Middle', value: middle },
    { label: 'HS District', value: highSchoolDistrict },
  ].filter((r): r is { label: string; value: string } => r.value != null);
  if (rows.length === 0) return null;

  return (
    <div className="bg-ink-elevated/30 p-6 md:p-8">
      <CapsLabel as="h3" className="mb-5">Schools</CapsLabel>
      <dl>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex justify-between items-baseline py-3 border-b border-white/5 last:border-b-0 text-sm"
          >
            <dt className="caps text-stone/70">{r.label}</dt>
            <dd className="text-stone text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
