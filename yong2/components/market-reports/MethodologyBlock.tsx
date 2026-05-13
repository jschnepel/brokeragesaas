/**
 * Methodology section — "Three inputs" copy lifted from the legacy
 * /market-reports index. Reused on weekly + monthly detail pages so
 * each report carries its own evidence-of-method footer.
 *
 * Copy is intentionally evergreen (no per-period interpolation) and
 * lives co-located with the components that render it. Update here
 * if the data sourcing changes.
 */

export function MethodologyBlock() {
  return (
    <section className="py-16 md:py-20 px-6 md:px-12 lg:px-20 border-t border-[color:var(--hairline)]">
      <div className="max-w-3xl mx-auto">
        <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
        <p className="caps">How we read the market</p>
        <h2 className="display-lg mt-4 text-stone tracking-[-0.005em] max-w-2xl">
          Three inputs.
        </h2>

        <ol className="mt-12 space-y-8 md:space-y-10">
          <MethodInput
            num="01"
            label="ARMLS recorded transactions"
            meta="1.84M Valley records · refreshed every 4 hours"
            body="The full set of MLS-listed transactions. Source-of-record for headline volume + closed-price stats."
          />
          <MethodInput
            num="02"
            label="Public deed filings"
            meta="County recorder · weekly cross-reference"
            body="Captures recorded transactions that didn’t pass through the MLS — including off-market trades, intra-family transfers, and entity-to-entity sales."
          />
          <MethodInput
            num="03"
            label="Private RLSIR registry"
            meta="Off-market trades facilitated by the network"
            body="Yong’s and the Russ Lyon Sotheby’s International Realty network’s direct knowledge of pocket trades, club-membership-driven transfers, and pre-MLS introductions."
          />
        </ol>

        <p className="mt-12 pt-8 border-t border-[color:var(--hairline)] text-sm text-stone/55 leading-relaxed">
          Weekly cadence reports the supply pulse (new-listing cadence + rolling averages) at metro
          granularity. Monthly cadence reports the full stat suite: median price-per-sqft, median
          days-on-market, transaction volume, and inventory tier breakdown. Adjustments are noted
          inline where applicable.
        </p>
      </div>
    </section>
  );
}

function MethodInput({
  num,
  label,
  meta,
  body,
}: {
  num: string;
  label: string;
  meta: string;
  body: string;
}) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-5 md:gap-8 items-start">
      <span className="caps text-[10px] tracking-[0.32em] text-gold/70 tabular-nums pt-1">
        {num}
      </span>
      <div>
        <p className="caps text-[11px] tracking-[0.32em] text-stone">{label}</p>
        <p className="mt-2 caps text-[10px] tracking-[0.3em] text-stone/45">{meta}</p>
        <p className="mt-4 text-base leading-relaxed text-mute">{body}</p>
      </div>
    </li>
  );
}
