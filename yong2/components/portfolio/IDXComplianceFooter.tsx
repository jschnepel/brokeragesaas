type IDXComplianceFooterProps = {
  /** ARMLS modification timestamp from the listing — ISO date string. */
  lastUpdatedISO: string | null;
  /** Listing agent full name from ARMLS. */
  listAgentName: string | null;
  /** Listing office name from ARMLS. */
  listOfficeName: string | null;
  /** Listing agent direct phone (compliance: contact info ≥12px). */
  agentCellPhone?: string | null;
  /** Listing office phone. */
  listOfficePhone?: string | null;
  /** Yong's brokerage name — used in the reciprocity notice. */
  brokerage: string;
};

/**
 * IDX compliance footer — required by ARMLS for any IDX listing
 * display. Three mandatory elements:
 *   1. ARMLS IDX logo (≥1:1 aspect, near the listing data)
 *   2. Listing agent / office attribution with contact info ≥12px
 *   3. Broker reciprocity notice + last-updated timestamp
 *
 * @compliance — Do not modify copy without IDX/legal review.
 * Removing or styling this below 12px is an ARMLS violation that
 * carries up to a $21K fine per occurrence (ref: ARMLS rules § IDX
 * display requirements). yong2 is on this branch *because* yong's
 * existing premium-site has the equivalent footer — we cannot ship
 * the new site without parity.
 */
// UTC-locked formatter so the SSR pass (UTC) and the hydration
// pass (visitor's local TZ) agree on the rendered date string.
// Without timeZone: 'UTC' a timestamp near midnight UTC renders
// as the next/previous day in any TZ east/west of UTC, which
// trips React #418 hydration text mismatch.
const LAST_UPDATED_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function IDXComplianceFooter({
  lastUpdatedISO,
  listAgentName,
  listOfficeName,
  agentCellPhone,
  listOfficePhone,
  brokerage,
}: IDXComplianceFooterProps) {
  const lastUpdatedLabel = lastUpdatedISO
    ? (() => {
        const d = new Date(lastUpdatedISO);
        return Number.isFinite(d.getTime()) ? LAST_UPDATED_FORMATTER.format(d) : null;
      })()
    : null;
  const year = new Date().getFullYear();
  return (
    <footer
      className="border-t border-white/10 bg-ink-elevated/40 py-10 mt-16"
      aria-label="IDX compliance and broker attribution"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-10">
        {/* ARMLS logo placeholder — replace src with /images/armls-idx-logo.png
         * once the asset lands in /public/images. Compliance only requires
         * the logo be present near the data; size and exact treatment are
         * not specified beyond legibility. */}
        <div
          className="caps text-stone/70 text-[10px] tracking-widest border border-stone/30 px-4 py-3 inline-block"
          aria-label="ARMLS IDX"
        >
          ARMLS<br />
          <span className="text-[8px] tracking-wider">IDX</span>
        </div>
        <div className="space-y-3 text-[13px] text-stone/75 leading-[1.6]">
          {(listAgentName || listOfficeName) && (
            <p>
              <span className="text-stone font-medium">Listed by</span>{' '}
              {listAgentName ?? 'Agent'}
              {listOfficeName ? `, ${listOfficeName}` : ''}.
              {(agentCellPhone || listOfficePhone) && (
                <>
                  {' '}
                  {agentCellPhone && <span>Agent: {agentCellPhone}</span>}
                  {agentCellPhone && listOfficePhone ? ' · ' : ''}
                  {listOfficePhone && <span>Office: {listOfficePhone}</span>}
                </>
              )}
            </p>
          )}
          <p>
            Listing information © {year} Arizona Regional Multiple Listing Service (ARMLS).
            All rights reserved.
            {lastUpdatedLabel ? ` Last updated: ${lastUpdatedLabel}.` : ''}
          </p>
          <p>
            Broker Reciprocity: The data relating to real estate for sale on this website comes
            in part from the Arizona Regional Multiple Listing Service. Real estate listings
            held by brokerage firms other than {brokerage} are marked with the ARMLS IDX logo.
            All information is believed accurate but is not guaranteed and should be
            independently verified. IDX information is provided exclusively for personal,
            non-commercial use and may not be used for any purpose other than to identify
            prospective properties consumers may be interested in purchasing.
          </p>
        </div>
      </div>
    </footer>
  );
}
