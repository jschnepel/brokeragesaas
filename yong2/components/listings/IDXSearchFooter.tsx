import Image from 'next/image';

/**
 * IDX compliance footer for the /listings (Home Search) page.
 *
 * Per ARMLS rules + docs/compliance/idx-compliance.md (real-estate-
 * platform repo), every IDX-display surface must carry:
 *   1. ARMLS IDX logo (≥1:1 aspect, near the data)
 *   2. Source attribution + period
 *   3. Broker reciprocity notice
 *   4. Last-updated timestamp
 *   5. ≥12px font, WCAG AA contrast on all attribution
 *
 * The companion `IDXComplianceFooter` (in components/portfolio/) is
 * for single-listing detail pages where listing-specific fields
 * (agent, office, contact phones) attach. This footer is the
 * search-page variant — no per-listing attribution; results show
 * those inline on each card.
 *
 * @compliance IDX (ARMLS): Mandatory. Removing or styling below
 *   12px is a rules violation (~$21K/occurrence).
 */
type IDXSearchFooterProps = {
  /** Newest modificationTimestamp across the visible result set —
   *  drives the freshness indicator + the >12h staleness warning. */
  lastSyncISO?: string | null;
  /** Brokerage running the IDX surface (for the reciprocity notice). */
  brokerage?: string;
};

const STALE_THRESHOLD_HOURS = 12;

function hoursSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / 3_600_000;
}

function formatRelative(hours: number): string {
  if (hours < 1) return 'less than an hour ago';
  if (hours < 2) return 'about an hour ago';
  if (hours < 48) return `${Math.round(hours)} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function IDXSearchFooter({
  lastSyncISO = null,
  brokerage = "Russ Lyon Sotheby's International Realty",
}: IDXSearchFooterProps) {
  const ageHours = hoursSince(lastSyncISO);
  const isStale = ageHours != null && ageHours > STALE_THRESHOLD_HOURS;
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-white/10 bg-ink-elevated/60 py-8 px-4 md:px-6"
      aria-label="ARMLS IDX compliance and broker attribution"
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-start">
        {/* Official ARMLS IDX wordmark — required near the IDX
         *  result data. Light-mode panel under the dark footer so the
         *  crimson trademark color stays accurate. */}
        <div className="bg-stone/95 rounded-sm px-4 py-3 inline-flex items-center self-start">
          <Image
            src="/images/armls-idx-logo.png"
            alt="ARMLS — Arizona Regional Multiple Listing Service"
            width={140}
            height={35}
            unoptimized
            priority={false}
          />
        </div>

        <div className="space-y-3 text-[13px] text-stone/75 leading-[1.6]">
          {ageHours != null && (
            <p
              className={isStale ? 'text-[#E0A06A]' : 'text-stone/85'}
              data-testid="idx-staleness"
            >
              {isStale ? (
                <>
                  <span className="caps text-[10px] tracking-[0.32em] text-[#E0A06A] mr-2">
                    Data lag
                  </span>
                  Listing data last refreshed {formatRelative(ageHours)} —
                  exceeds the {STALE_THRESHOLD_HOURS}-hour ARMLS guideline.
                  Verify with the listing brokerage before acting.
                </>
              ) : (
                <>
                  <span className="caps text-[10px] tracking-[0.32em] text-stone/65 mr-2">
                    Data freshness
                  </span>
                  Updated {formatRelative(ageHours)} from ARMLS.
                </>
              )}
            </p>
          )}
          <p>
            Listing information © {year} Arizona Regional Multiple Listing
            Service (ARMLS). All rights reserved.
          </p>
          <p>
            <span className="text-stone font-medium">Broker Reciprocity:</span>{' '}
            The data relating to real estate for sale on this website comes in
            part from the Arizona Regional Multiple Listing Service. Real estate
            listings held by brokerage firms other than {brokerage} are marked
            with the ARMLS IDX logo. All information is believed accurate but is
            not guaranteed and should be independently verified. IDX information
            is provided exclusively for personal, non-commercial use and may not
            be used for any purpose other than to identify prospective properties
            consumers may be interested in purchasing.
          </p>
        </div>
      </div>
    </footer>
  );
}
