import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { siteUrl } from '@/lib/seo';

// ISR — hourly. Cookie disclosure copy is essentially evergreen but
// periodic rebuilds prevent a bad deploy from being cached at edges
// for the 1-year `s-maxage` default of fully-static prerenders.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Cookie Disclosure',
  description:
    'A complete list of the cookies set by yong-choi.com and the third-party analytics services we use, including their purpose and lifetime.',
  alternates: { canonical: siteUrl('/privacy/cookies') },
};

type CookieRow = {
  name: string;
  vendor: string;
  purpose: string;
  lifetime: string;
};

const NECESSARY: CookieRow[] = [
  { name: 'yong2_consent', vendor: 'yong-choi.com', purpose: 'Stores your cookie choices.', lifetime: '12 months' },
  {
    name: 'yong2_anon_id',
    vendor: 'yong-choi.com',
    purpose: 'Anonymous session id used to stitch pageviews within a visit. Set only after analytics consent.',
    lifetime: '12 months',
  },
];

const ANALYTICS: CookieRow[] = [
  { name: '_clck', vendor: 'Microsoft Clarity', purpose: 'Distinguishes unique visitors.', lifetime: '12 months' },
  { name: '_clsk', vendor: 'Microsoft Clarity', purpose: 'Connects multiple pageviews within a session.', lifetime: '24 hours' },
  { name: 'ph_*', vendor: 'PostHog', purpose: 'Anonymous distinct id and session id for event metrics.', lifetime: '12 months' },
  { name: '_ga', vendor: 'Google Analytics 4', purpose: 'Distinguishes unique visitors for aggregate measurement.', lifetime: '13 months' },
  { name: '_ga_*', vendor: 'Google Analytics 4', purpose: 'Persists session state for a single GA4 property.', lifetime: '13 months' },
  { name: '_vercel_*', vendor: 'Vercel Web Analytics', purpose: 'Performance / pageview measurement (first-party).', lifetime: 'Session' },
];

const MARKETING: CookieRow[] = [];

export default function CookieDisclosurePage() {
  return (
    <>
      <Navigation />
      <main className="pt-24">
        <SectionFrame className="py-20">
          <article className="max-w-4xl mx-auto space-y-12">
            <header className="space-y-4">
              <div className="caps">Privacy</div>
              <h1 className="font-serif italic text-5xl md:text-6xl leading-[1.05] tracking-tight">
                Cookie Disclosure
              </h1>
              <p className="text-stone/80 leading-relaxed max-w-2xl">
                Cookies are small text files saved by your browser. Below is the full list of cookies that
                yong-choi.com may set, grouped by category. Categories other than "Strictly necessary" only
                load after you opt in via the{' '}
                <Link href="/privacy/preferences" className="text-gold underline underline-offset-4">
                  preferences page
                </Link>
                .
              </p>
            </header>

            <CookieGroup title="Strictly necessary" rows={NECESSARY} />
            <CookieGroup title="Analytics (opt-in)" rows={ANALYTICS} />
            <CookieGroup
              title="Marketing"
              rows={MARKETING}
              emptyMessage="No marketing cookies are loaded today."
            />
          </article>
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}

function CookieGroup({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: CookieRow[];
  emptyMessage?: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-stone/70 italic">{emptyMessage ?? 'None.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left caps text-gold/90">
                <th className="border-b border-white/10 py-3 pr-6">Name</th>
                <th className="border-b border-white/10 py-3 pr-6">Vendor</th>
                <th className="border-b border-white/10 py-3 pr-6">Purpose</th>
                <th className="border-b border-white/10 py-3">Lifetime</th>
              </tr>
            </thead>
            <tbody className="text-stone/85">
              {rows.map((r) => (
                <tr key={`${r.vendor}-${r.name}`} className="border-b border-white/5 align-top">
                  <td className="py-3 pr-6 font-mono text-stone">{r.name}</td>
                  <td className="py-3 pr-6">{r.vendor}</td>
                  <td className="py-3 pr-6">{r.purpose}</td>
                  <td className="py-3">{r.lifetime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
