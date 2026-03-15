import Link from 'next/link';
import type { ListingDetail } from '@platform/database/src/queries/listings';

interface IdxFooterProps {
  listing: ListingDetail;
  brokerageName: string;
}

export function IdxFooter({ listing, brokerageName }: IdxFooterProps) {
  return (
    <footer className="border-t border-navy/10 py-6 bg-cream-alt">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-20 space-y-4">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/armls-idx-logo.png" alt="ARMLS IDX" className="h-10 w-auto shrink-0" />
          <div className="space-y-2">
            <p className="text-xs text-navy/60">
              Listing information &copy; {new Date().getFullYear()} Arizona Regional Multiple Listing Service (ARMLS). All rights reserved.
              Last updated: {new Date(listing.modification_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
            </p>
            <p className="text-xs text-navy/60">
              Broker Reciprocity: The data relating to real estate for sale on this website comes in part from the
              Arizona Regional Multiple Listing Service. Real estate listings held by brokerage firms other than {brokerageName} are
              marked with the ARMLS IDX logo. All information is believed accurate but is not guaranteed and should be
              independently verified. IDX information is provided exclusively for personal, non-commercial use
              and may not be used for any purpose other than to identify prospective properties consumers may be interested in purchasing.
            </p>
            <p className="text-xs text-navy/60">
              <span className="font-bold text-navy">Listed by</span>{' '}
              {listing.list_agent_full_name ?? 'Agent'}, {listing.list_office_name}
              {(listing.agent_cell_phone ?? listing.list_office_phone) && (
                <span className="ml-2">
                  {listing.agent_cell_phone && <span>Agent: {listing.agent_cell_phone}</span>}
                  {listing.list_office_phone && (
                    <span>{listing.agent_cell_phone ? ' · ' : ''}Office: {listing.list_office_phone}</span>
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-2 border-t border-navy/8">
          <Link
            href="/listings"
            className="text-xs text-navy/40 hover:text-gold transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Listings
          </Link>
          <Link href="/contact" className="text-xs text-navy/40 hover:text-gold transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
