import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Yong Choi',
  description: 'Learn about Yong Choi, luxury real estate specialist serving Scottsdale, Paradise Valley, and Greater Phoenix.',
};

export default function AboutPage() {
  return (
    <main className="bg-cream min-h-screen">
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-content-lg px-8 lg:px-20">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            {/* Portrait placeholder */}
            <div className="flex justify-center">
              <div className="h-[500px] w-full max-w-md rounded-lg bg-navy/5 flex items-center justify-center">
                <span className="text-label uppercase tracking-xl text-navy/30 font-bold">
                  Agent Portrait
                </span>
              </div>
            </div>

            {/* Agent info */}
            <div>
              <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
                About
              </span>
              <h1 className="text-4xl font-serif font-medium tracking-tight text-navy lg:text-5xl">
                Yong Choi
              </h1>
              <p className="mt-2 text-lg text-navy/60">
                Russ Lyon Sotheby&apos;s International Realty
              </p>

              <div className="mt-10 space-y-6">
                <p className="text-narrative text-navy/80 leading-relaxed">
                  With extensive experience in the Greater Phoenix luxury market,
                  Yong Choi is dedicated to providing exceptional service to every client.
                  Specializing in Scottsdale, Paradise Valley, and the surrounding
                  communities, Yong brings market expertise and a commitment to
                  understanding each client&apos;s unique goals.
                </p>
                <p className="text-narrative text-navy/80 leading-relaxed">
                  Whether buying a first home, upgrading to a luxury estate, or
                  selling a current residence, Yong guides clients through every
                  step with attention to detail, deep market knowledge, and skilled
                  negotiation.
                </p>
              </div>

              {/* Contact details */}
              <div className="mt-12 border-t border-navy/10 pt-10">
                <h2 className="text-label uppercase tracking-xl text-gold font-bold mb-6">
                  Get in Touch
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-meta uppercase tracking-widest text-navy/40 font-bold">Email</dt>
                    <dd className="mt-1">
                      <a href="mailto:yong.choi@russlyon.com" className="text-navy hover:text-gold transition-colors duration-300">
                        yong.choi@russlyon.com
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-meta uppercase tracking-widest text-navy/40 font-bold">Phone</dt>
                    <dd className="mt-1">
                      <a href="tel:+14805551234" className="text-navy hover:text-gold transition-colors duration-300">
                        (480) 555-1234
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-meta uppercase tracking-widest text-navy/40 font-bold">Brokerage</dt>
                    <dd className="mt-1 text-navy">Russ Lyon Sotheby&apos;s International Realty</dd>
                  </div>
                </dl>
              </div>

              {/* CTA */}
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center bg-navy px-8 py-3 text-label uppercase tracking-md font-bold text-white hover:bg-navy/90 transition-colors duration-300"
                >
                  Schedule a Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
