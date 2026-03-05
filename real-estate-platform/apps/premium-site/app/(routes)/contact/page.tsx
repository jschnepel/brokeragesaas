import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Yong Choi',
  description: 'Get in touch with Yong Choi for luxury real estate inquiries in Scottsdale, Paradise Valley, and Greater Phoenix.',
};

export default function ContactPage() {
  return (
    <main className="bg-cream min-h-screen">
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-content-lg px-8 lg:px-20">
          <div className="mx-auto max-w-2xl">
            <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
              Contact
            </span>
            <h1 className="text-4xl font-serif font-medium tracking-tight text-navy lg:text-5xl">
              Get in Touch
            </h1>
            <p className="mt-4 text-narrative text-navy/70">
              Have questions about buying or selling luxury real estate in
              Greater Phoenix? Reach out directly — I&apos;d love to hear from you.
            </p>

            {/* Contact cards */}
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-navy/10 bg-white p-6">
                <span className="text-meta uppercase tracking-widest text-navy/40 font-bold">Email</span>
                <a
                  href="mailto:yong.choi@russlyon.com"
                  className="mt-2 block text-navy hover:text-gold transition-colors duration-300"
                >
                  yong.choi@russlyon.com
                </a>
              </div>
              <div className="rounded-lg border border-navy/10 bg-white p-6">
                <span className="text-meta uppercase tracking-widest text-navy/40 font-bold">Phone</span>
                <a
                  href="tel:+14805551234"
                  className="mt-2 block text-navy hover:text-gold transition-colors duration-300"
                >
                  (480) 555-1234
                </a>
              </div>
            </div>

            {/* Office info */}
            <div className="mt-8 rounded-lg border border-navy/10 bg-white p-6">
              <span className="text-meta uppercase tracking-widest text-navy/40 font-bold">Office</span>
              <p className="mt-2 text-navy">Russ Lyon Sotheby&apos;s International Realty</p>
              <p className="mt-1 text-sm text-navy/60">Scottsdale, Arizona</p>
            </div>

            {/* Placeholder note for future form */}
            <div className="mt-12 rounded-lg bg-navy/5 p-8 text-center">
              <p className="text-label uppercase tracking-md text-navy/40 font-bold mb-2">
                Contact Form Coming Soon
              </p>
              <p className="text-sm text-navy/50">
                A full contact form with server-side handling will be available in Phase 4.
                For now, please reach out via email or phone.
              </p>
            </div>

            {/* Back link */}
            <div className="mt-10">
              <Link
                href="/"
                className="text-sm text-navy/50 hover:text-gold transition-colors duration-300"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
