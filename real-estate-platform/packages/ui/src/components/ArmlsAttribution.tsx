/**
 * ARMLS Attribution Footer
 * @compliance ARMLS Section 21.1 — Required on all pages displaying ARMLS-derived data.
 * Must include: "Based on information from the Arizona Regional Multiple Listing Service
 * for the period [start date] through [end date]."
 */

export interface ArmlsAttributionProps {
  agentId: string;
  className?: string;
  periodStart: string;
  periodEnd: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function ArmlsAttribution({
  className = '',
  periodStart,
  periodEnd,
}: ArmlsAttributionProps) {
  return (
    <footer className={`border-t border-navy/10 py-6 px-8 ${className}`}>
      <p className="text-xs text-navy/40 leading-relaxed max-w-3xl mx-auto text-center">
        Based on information from the Arizona Regional Multiple Listing Service
        for the period {formatDate(periodStart)} through {formatDate(periodEnd)}.
        All information should be verified by the recipient and none is guaranteed
        as accurate by ARMLS.
      </p>
      <p className="text-[10px] text-navy/25 mt-2 text-center">
        Data supplied by ARMLS. Aggregate statistics derived from MLS data do not
        constitute an offer, solicitation, or recommendation.
      </p>
    </footer>
  );
}
