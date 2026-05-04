import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { ContactForm, type ContactFormInitialValues } from '@/components/contact/ContactForm';
import { siteContent } from '@/content/site';
import { breadcrumbListSchema } from '@/lib/jsonld';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Begin a conversation with Yong Choi.',
  alternates: { canonical: siteUrl('/contact') },
};

type SearchParams = Promise<{ listing?: string; interest?: string }>;

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  const interestParam = params.interest;
  const validInterests = ['Buying', 'Selling', 'Both'] as const;
  const seededInterest = validInterests.find((i) => i === interestParam);

  const initialValues: ContactFormInitialValues = {};
  if (seededInterest) initialValues.interest = seededInterest;
  if (params.listing) {
    initialValues.message = `I'd like to schedule a private tour of ${params.listing}.`;
  }

  const breadcrumbs = breadcrumbListSchema([
    { name: 'Home', url: siteUrl('/') },
    { name: 'Contact', url: siteUrl('/contact') },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify of an internal Schema.org object; XSS not applicable.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/contact.jpg"
        kicker="An Invitation"
        headline="Begin"
        headlineItalic="a conversation."
        sub="Whether you're months or years from a move, every engagement starts with a conversation."
      />
      <main>
        <SectionFrame className="py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h1 className="display-xl"><em className="font-light">Begin</em> a conversation.</h1>
              <p className="mt-6 text-stone/85 leading-relaxed max-w-md">
                Whether you&rsquo;re months or years from a move, every engagement starts with a conversation. Messages are read personally and replied to within 24 hours.
              </p>
              <dl className="mt-10 space-y-3">
                {[
                  { k: 'Mobile', v: <a href={siteContent.contact.mobileHref} className="hover:text-gold">{siteContent.contact.mobile}</a> },
                  { k: 'Email', v: <a href={`mailto:${siteContent.contact.email}`} className="hover:text-gold">{siteContent.contact.email}</a> },
                  { k: 'Office', v: <span className="text-mute">{siteContent.contact.office}</span> },
                  { k: 'Instagram', v: <a href={siteContent.contact.instagramHref} className="hover:text-gold">{siteContent.contact.instagram}</a> },
                ].map((row) => (
                  <div key={row.k} className="flex justify-between border-b border-white/10 py-3 text-sm">
                    <dt className="caps">{row.k}</dt>
                    <dd>{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <ContactForm initialValues={initialValues} />
          </div>
        </SectionFrame>
      </main>
      <Footer />
    </>
  );
}
