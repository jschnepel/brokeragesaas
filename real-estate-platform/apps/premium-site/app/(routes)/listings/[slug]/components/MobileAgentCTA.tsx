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
          className="flex-1 flex items-center justify-center bg-gold text-white text-[10px] uppercase tracking-[0.25em] font-bold"
        >
          Call {phone}
        </a>
        <Link
          href={contactHref}
          className="flex-1 flex items-center justify-center bg-navy text-white text-[10px] uppercase tracking-[0.25em] font-bold"
        >
          Schedule Showing
        </Link>
      </div>
    </div>
  );
}
