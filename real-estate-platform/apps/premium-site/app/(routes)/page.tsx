import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Yong Choi | Luxury Real Estate in Scottsdale & Paradise Valley',
  description: 'Find your dream home in Scottsdale, Paradise Valley, and Greater Phoenix with Yong Choi at Russ Lyon Sotheby\'s International Realty.',
};

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-navy text-white">
        <div className="mx-auto max-w-content-lg px-8 lg:px-20 py-24 lg:py-36">
          <div className="max-w-2xl">
            <span className="text-label uppercase tracking-xl text-gold font-bold block mb-6">
              Russ Lyon Sotheby&apos;s International Realty
            </span>
            <h1 className="text-4xl font-serif font-medium tracking-tight sm:text-5xl lg:text-7xl leading-tight">
              Luxury Real Estate in Greater Phoenix
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/70">
              Work with Yong Choi to find the perfect property in Scottsdale,
              Paradise Valley, and the surrounding luxury communities.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/phoenix"
                className="bg-gold px-8 py-3 text-label uppercase tracking-md font-bold text-white hover:bg-gold/90 transition-colors duration-300"
              >
                Explore Communities
              </Link>
              <Link
                href="/contact"
                className="text-sm font-semibold text-white/80 hover:text-gold transition-colors duration-300"
              >
                Contact Me <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section className="bg-cream py-20 lg:py-28">
        <div className="mx-auto max-w-content-lg px-8 lg:px-20">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            <div>
              <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
                Your Agent
              </span>
              <h2 className="text-3xl font-serif font-medium tracking-tight text-navy lg:text-4xl">
                About Yong Choi
              </h2>
              <p className="mt-6 text-narrative text-navy/70 leading-relaxed">
                With years of experience in the Greater Phoenix luxury market,
                Yong Choi is dedicated to helping clients find the perfect home.
                Whether buying or selling, every step is guided with expertise
                and personalized attention.
              </p>
              <div className="mt-4">
                <p className="text-sm text-navy/50">
                  Russ Lyon Sotheby&apos;s International Realty
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-72 w-72 rounded-full bg-navy/5 flex items-center justify-center">
                <span className="text-meta uppercase tracking-widest text-navy/20 font-bold">
                  Portrait
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20">
        <div className="mx-auto max-w-content-lg px-8 lg:px-20 text-center">
          <h2 className="text-3xl font-serif font-medium tracking-tight text-white lg:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Contact Yong today to begin your real estate journey.
          </p>
          <div className="mt-10">
            <Link
              href="/contact"
              className="bg-gold px-8 py-3 text-label uppercase tracking-md font-bold text-white hover:bg-gold/90 transition-colors duration-300"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
