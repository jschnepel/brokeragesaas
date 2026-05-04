import { CapsLabel } from '@/components/shared/CapsLabel';

type KeyFactsCardProps = {
  hoa?: { fee: number; frequency: string } | null;
  taxAnnualAmount?: number | null;
  county?: string | null;
  parcelNumber?: string | null;
  schools?: {
    elementary?: string | null;
    middle?: string | null;
    highSchoolDistrict?: string | null;
  };
};

const DOLLAR = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/**
 * Consolidated sidebar data card — replaces the v1 trio of
 * Fact Sheet + Financial Details + Schools cards. Single hairline-
 * divided dl with sections demarcated by an extra row of vertical
 * spacing. Editorial restraint: no boxed sub-sections, just rhythm.
 *
 * Rows are filtered to non-null only; an empty card renders nothing.
 */
export function KeyFactsCard({
  hoa,
  taxAnnualAmount,
  county,
  parcelNumber,
  schools,
}: KeyFactsCardProps) {
  type Row = { label: string; value: string };
  const financialRows: Row[] = [];
  if (hoa) financialRows.push({ label: 'HOA', value: `${DOLLAR(hoa.fee)} / ${hoa.frequency}` });
  if (taxAnnualAmount != null) financialRows.push({ label: 'Tax', value: `${DOLLAR(taxAnnualAmount)} / yr` });
  if (county) financialRows.push({ label: 'County', value: county });
  if (parcelNumber) financialRows.push({ label: 'Parcel', value: parcelNumber });

  const schoolRows: Row[] = [];
  if (schools?.elementary) schoolRows.push({ label: 'Elementary', value: schools.elementary });
  if (schools?.middle) schoolRows.push({ label: 'Middle', value: schools.middle });
  if (schools?.highSchoolDistrict) schoolRows.push({ label: 'HS District', value: schools.highSchoolDistrict });

  if (financialRows.length === 0 && schoolRows.length === 0) return null;

  return (
    <div className="bg-ink-elevated/30 p-6 md:p-8 border border-white/5 hover:border-white/15 transition-colors duration-300">
      <CapsLabel as="h3" className="text-[10px] text-stone/60 mb-5 tracking-[0.3em]">Key Facts</CapsLabel>
      <dl className="space-y-0">
        {financialRows.map((r, i) => (
          <Row key={r.label} row={r} isLast={i === financialRows.length - 1 && schoolRows.length === 0} />
        ))}
        {schoolRows.length > 0 && financialRows.length > 0 ? (
          <li aria-hidden="true" className="block h-3" />
        ) : null}
        {schoolRows.map((r, i) => (
          <Row key={r.label} row={r} isLast={i === schoolRows.length - 1} />
        ))}
      </dl>
    </div>
  );
}

function Row({ row, isLast }: { row: { label: string; value: string }; isLast: boolean }) {
  return (
    <div
      className={`flex justify-between items-baseline py-3 text-sm ${
        isLast ? '' : 'border-b border-white/5'
      }`}
    >
      <dt className="caps text-stone/65 text-[10px]">{row.label}</dt>
      <dd className="text-stone text-right">{row.value}</dd>
    </div>
  );
}
