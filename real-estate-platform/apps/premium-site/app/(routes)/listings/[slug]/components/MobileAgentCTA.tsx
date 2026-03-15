'use client';

import Link from 'next/link';

interface MobileAgentCTAProps {
  phone: string;
  contactHref: string;
}

export function MobileAgentCTA({ phone, contactHref }: MobileAgentCTAProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-navy/10">
      <div className="flex h-14">
        <a
          href={`tel:${phone.replace(/[^+\d]/g, '')}`}
          className="flex-1 flex items-center justify-center bg-gold text-white text-label uppercase tracking-md font-bold hover:bg-white hover:text-navy transition-all duration-500"
        >
          Call {phone}
        </a>
        <Link
          href={contactHref}
          className="flex-1 flex items-center justify-center border border-navy/20 text-navy text-label uppercase tracking-md font-bold hover:bg-navy hover:text-white transition-all duration-500"
        >
          Schedule Showing
        </Link>
      </div>
    </div>
  );
}
