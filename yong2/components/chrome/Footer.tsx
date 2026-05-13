import Link from 'next/link';
import { siteContent } from '@/content/site';
import { SothebysLockup } from './SothebysLockup';
import { HairlineDivider } from '@/components/shared/HairlineDivider';

export function Footer() {
  return (
    <footer className="mt-24 pt-20 pb-10 border-t border-white/5 bg-ink-surface text-stone">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <div className="font-serif text-2xl tracking-tight">{siteContent.brand.name}</div>
          <p className="text-sm text-mute mt-3 max-w-xs leading-relaxed">
            Private representation across the Phoenix Metro&rsquo;s most coveted addresses.
          </p>
          <SothebysLockup className="mt-6" />
        </div>
        <div>
          <div className="caps mb-4">Navigation</div>
          <ul className="space-y-2.5">
            {siteContent.nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-stone/80 hover:text-gold text-sm">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="caps mb-4">Contact</div>
          <ul className="space-y-2.5 text-sm">
            {siteContent.contact.primaryPhoneHref && siteContent.contact.primaryPhone ? (
              <li>
                <a href={siteContent.contact.primaryPhoneHref} className="hover:text-gold">
                  {siteContent.contact.primaryPhone}
                </a>
              </li>
            ) : null}
            <li><a href={`mailto:${siteContent.contact.email}`} className="hover:text-gold">{siteContent.contact.email}</a></li>
            <li className="text-mute">{siteContent.contact.office}</li>
            <li><a href={siteContent.contact.instagramHref} className="hover:text-gold">{siteContent.contact.instagram}</a></li>
          </ul>
        </div>
      </div>
      <HairlineDivider className="mt-14 mb-6 max-w-[1400px] mx-auto" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 space-y-4">
        <nav aria-label="Privacy" className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-mute">
          <Link href="/privacy/policy" className="hover:text-gold">Privacy</Link>
          <span aria-hidden>·</span>
          <Link href="/privacy/cookies" className="hover:text-gold">Cookies</Link>
          <span aria-hidden>·</span>
          <Link href="/privacy/preferences" className="hover:text-gold">Manage Preferences</Link>
          <span aria-hidden>·</span>
          {/* CCPA: this link must exist whether or not we sell data. It routes to the
              same preferences page since disabling analytics is the available remedy. */}
          <Link href="/privacy/preferences" className="hover:text-gold">Do Not Sell My Personal Information</Link>
        </nav>
        <div className="text-[11px] text-mute leading-relaxed space-y-2">
          <div>{siteContent.legal.mlsDisclaimer}</div>
          <div>{siteContent.legal.fairHousing}</div>
          <div>{siteContent.legal.copyright}</div>
        </div>
      </div>
    </footer>
  );
}
