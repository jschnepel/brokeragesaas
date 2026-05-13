import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { PrivateInventoryForm } from '@/components/private-inventory/PrivateInventoryForm';
import { breadcrumbListSchema } from '@/lib/jsonld';
import { JsonLdScript } from '@/components/shared/JsonLdScript';
import { siteUrl } from '@/lib/seo';

// ISR — hourly. The page is essentially evergreen (copy + form);
// periodic rebuilds protect against the 1-year `s-maxage` default of
// fully-static prerenders.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Private Inventory · Off-market access',
  description:
    'Off-market introductions across Scottsdale, Paradise Valley, Silverleaf, Desert Mountain, and the Valley’s pre-MLS pipeline. Private representation by Yong Choi of Russ Lyon Sotheby’s International Realty.',
  alternates: { canonical: siteUrl('/private-inventory') },
  openGraph: {
    type: 'website',
    title: 'Private Inventory · Off-market access',
    description:
      'A subscription path to off-market introductions across the Phoenix Metro’s most coveted addresses.',
    url: siteUrl('/private-inventory'),
    siteName: 'Yong Choi',
  },
};

export default function PrivateInventoryPage() {
  const breadcrumbs = breadcrumbListSchema([
    { name: 'Home', url: siteUrl('/') },
    { name: 'Private Inventory', url: siteUrl('/private-inventory') },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbs} />
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/portfolio-az.jpg"
        kicker="Private Inventory"
        headline="A different door into"
        headlineItalic="the Phoenix luxury market."
        sub="Roughly a third of $10M+ trades close off-market in the Valley. Subscribe to the private side of Yong&rsquo;s pipeline."
      />
      <main>
        <SectionFrame className="py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 md:gap-16">
            {/* Left rail — the persuasion */}
            <div>
              <CapsLabel as="div">How it works</CapsLabel>
              <h2 className="display-lg mt-4 text-balance text-stone">
                The MLS shows what&rsquo;s available. The market shows what&rsquo;s actually
                trading.
              </h2>
              <div className="mt-8 space-y-5 text-base md:text-lg leading-relaxed text-stone/80 max-w-xl">
                <p>
                  Across the Valley&rsquo;s top tier, sellers increasingly skip the public
                  listing entirely. Membership transfers, architectural commissions, and
                  long-tenure family estates change hands by introduction. The buyer pool that
                  sees these transactions is the buyer pool that gets in the room.
                </p>
                <p>
                  Yong&rsquo;s practice runs a quiet registry of these introductions —
                  pocket-listed homes the Russ Lyon Sotheby&rsquo;s International Realty network
                  is aware of, club memberships changing hands at close, and estates being
                  considered for private trade. The list is shared by phone and email; never
                  posted, never bulk-mailed.
                </p>
                <p>
                  Request a conversation below. We&rsquo;ll talk through what you&rsquo;re
                  looking for, and you&rsquo;ll start receiving introductions that fit.
                </p>
              </div>

              <dl className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
                <PromiseBlock
                  label="01"
                  title="Private by default"
                  body="Introductions are made personally. No public posting, no bulk distribution lists, no shared subscriber rosters."
                />
                <PromiseBlock
                  label="02"
                  title="Fit-first"
                  body="You&rsquo;ll only hear from us when a property matches the budget, timing, and communities you&rsquo;ve indicated."
                />
                <PromiseBlock
                  label="03"
                  title="Two-way"
                  body="If you have a specific address or membership you&rsquo;d value an introduction to, we&rsquo;ll explore whether one can be made."
                />
                <PromiseBlock
                  label="04"
                  title="Reversible"
                  body="Unsubscribe anytime by replying to any message — or just stop responding. Either is honored."
                />
              </dl>
            </div>

            {/* Right rail — the form */}
            <div>
              <PrivateInventoryForm />
            </div>
          </div>
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}

function PromiseBlock({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="caps text-[10px] tracking-[0.32em] text-gold/70 tabular-nums">{label}</p>
      <p className="font-serif text-stone mt-2 text-lg leading-tight">{title}</p>
      <p className="mt-2 text-sm text-stone/65 leading-relaxed">{body}</p>
    </div>
  );
}
