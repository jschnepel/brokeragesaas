import { CapsLabel } from '@/components/shared/CapsLabel';

type ListingFinancialDetailsProps = {
  taxAnnualAmount: number | null;
  associationYn: boolean;
  associationFee: number | null;
  associationFeeFrequency: string | null;
  parcelNumber: string | null;
  county: string | null;
};

const DOLLAR = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/**
 * Financial / legal details — HOA, tax, parcel, county. Compact
 * sidebar block beneath ListingFactSheet. Filtered to non-null
 * only; renders nothing if everything is missing.
 */
export function ListingFinancialDetails(props: ListingFinancialDetailsProps) {
  const { taxAnnualAmount, associationYn, associationFee, associationFeeFrequency, parcelNumber, county } = props;
  const rows: { label: string; value: string }[] = [];
  if (associationYn) {
    rows.push({
      label: 'HOA',
      value:
        associationFee != null
          ? `${DOLLAR(associationFee)} / ${associationFeeFrequency ?? 'mo'}`
          : 'Yes',
    });
  }
  if (taxAnnualAmount != null) rows.push({ label: 'Tax', value: `${DOLLAR(taxAnnualAmount)} / yr` });
  if (county) rows.push({ label: 'County', value: county });
  if (parcelNumber) rows.push({ label: 'Parcel', value: parcelNumber });
  if (rows.length === 0) return null;

  return (
    <div className="bg-ink-elevated/30 p-6 md:p-8">
      <CapsLabel as="h3" className="mb-5">Financial &amp; Legal</CapsLabel>
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
