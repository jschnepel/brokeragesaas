import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { SectionFrame } from '@/components/shared/SectionFrame';
import { PageHero } from '@/components/shared/PageHero';
import { AboutSplit } from '@/components/about/AboutSplit';
import { TestimonialsSection } from '@/components/testimonials/TestimonialsSection';
import { realEstateAgentSchema, breadcrumbListSchema } from '@/lib/jsonld';
import { siteUrl } from '@/lib/seo';

// ISR — hourly. Page is essentially evergreen but periodic rebuilds
// guarantee any future tweak to the testimonials data, JSON-LD
// schema, or copy reaches every CloudFront PoP within an hour
// rather than persisting at the 1-year `s-maxage` default.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'About Yong Choi',
  description: 'Over two decades representing clients from Paradise Valley to Desert Mountain.',
  alternates: { canonical: siteUrl('/about') },
};

export default function AboutPage() {
  const breadcrumbs = breadcrumbListSchema([
    { name: 'Home', url: siteUrl('/') },
    { name: 'About', url: siteUrl('/about') },
  ]);
  return (
    <>
      {/* Detailed RealEstateAgent schema lives on /about so it doesn't repeat across every route. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstateAgentSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <Navigation initialTransparent />
      <PageHero
        imageSrc="/page-heroes/about.jpg"
        kicker="The Advisor"
        headline="An advisor,"
        headlineItalic="first."
        sub="$1.2 billion in career sales and 34 years navigating Arizona's most prestigious markets."
      />
      <main>
        <SectionFrame className="py-16 md:py-20">
          <AboutSplit />
        </SectionFrame>
        <TestimonialsSection />
      </main>
      <Footer />
    </>
  );
}
