import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { getAllListings } from './listings/data';
import { resolveAgentConfig } from '../agent-config';

const agent = resolveAgentConfig();

export const metadata: Metadata = {
  title: `${agent.name} | Luxury Real Estate in Scottsdale & Paradise Valley`,
  description: agent.seo.description,
};

const LIFESTYLE_COLLECTIONS = [
  {
    id: 'golf',
    title: 'Alpine & Golf',
    description:
      'Elevated living in the high Sonoran desert. Championship courses and club exclusivity.',
    enclaves: [
      {
        name: 'Desert Mountain',
        img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600',
        link: '/phoenix',
      },
      {
        name: 'Silverleaf',
        img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600',
        link: '/phoenix',
      },
      {
        name: 'Estancia',
        img: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=600',
        link: '/phoenix',
      },
      {
        name: 'Troon North',
        img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600',
        link: '/phoenix',
      },
    ],
  },
  {
    id: 'estate',
    title: 'Historic & Estate',
    description:
      'Timeless architecture on sprawling irrigated lots in the heart of the valley.',
    enclaves: [
      {
        name: 'Paradise Valley',
        img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=600',
        link: '/phoenix',
      },
      {
        name: 'Arcadia',
        img: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&q=80&w=600',
        link: '/phoenix',
      },
      {
        name: 'Biltmore',
        img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=600',
        link: '/phoenix',
      },
    ],
  },
  {
    id: 'urban',
    title: 'Urban Luxury',
    description:
      'Vertical living and modern penthouses in the cultural center.',
    enclaves: [
      {
        name: 'Downtown Phoenix',
        img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=600',
        link: '/phoenix',
      },
      {
        name: 'Old Town Scottsdale',
        img: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=600',
        link: '/phoenix',
      },
    ],
  },
];

export default function HomePage() {
  const listings = getAllListings();

  return (
    <main>
      {/* Hero — Full viewport with background image */}
      <header className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2400"
            className="w-full h-full object-cover"
            alt="Scottsdale luxury estate"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 pt-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 leading-tight tracking-tight">
            <span className="block">The Art of</span>
            <span className="block italic font-light">Desert Living</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl font-light max-w-xl mb-12">
            Discover extraordinary properties in the most coveted addresses of
            the Phoenix Metro
          </p>

          <div className="flex gap-6">
            <Link
              href="/phoenix"
              className="bg-gold px-8 py-4 text-label uppercase tracking-md font-bold text-white hover:bg-white hover:text-navy transition-colors duration-300"
            >
              Explore Communities
            </Link>
            <Link
              href="/contact"
              className="border border-white/30 px-8 py-4 text-label uppercase tracking-md font-bold text-white hover:bg-white hover:text-navy transition-colors duration-300"
            >
              Contact Me
            </Link>
          </div>

          <div className="flex gap-6 mt-12">
            <Link
              href="/phoenix"
              className="group flex items-center gap-2 text-white/60 hover:text-white text-meta uppercase tracking-widest transition-colors"
            >
              <span className="w-8 h-px bg-white/30 group-hover:w-12 group-hover:bg-gold transition-all" />
              Explore Map
            </Link>
            <Link
              href="/phoenix"
              className="group flex items-center gap-2 text-white/60 hover:text-white text-meta uppercase tracking-widest transition-colors"
            >
              <span className="w-8 h-px bg-white/30 group-hover:w-12 group-hover:bg-gold transition-all" />
              Communities
            </Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/50">
          <span className="text-meta uppercase tracking-widest">
            Scroll to Explore
          </span>
          <div className="w-px h-16 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </header>

      {/* Social Proof Strip */}
      <section className="bg-white border-b border-navy/10 py-12">
        <div className="mx-auto max-w-content-lg px-8 lg:px-24 flex flex-wrap justify-around gap-8">
          {agent.stats.map((stat, i) => (
            <Fragment key={stat.label}>
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-serif text-gold mb-2">
                  {stat.value}
                </p>
                <p className="text-meta uppercase tracking-widest text-navy/40 font-bold">
                  {stat.label}
                </p>
              </div>
              {i < agent.stats.length - 1 && (
                <div className="hidden sm:flex items-center">
                  <div className="h-12 w-px bg-navy/10" />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </section>

      {/* Agent Profile Section */}
      <section className="bg-navy text-white py-20 lg:py-24 overflow-hidden">
        <div className="mx-auto max-w-content-lg px-8 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            {/* Content */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <span className="text-label uppercase tracking-xl text-gold font-bold block mb-6">
                Your Trusted Advisor
              </span>
              <h2 className="text-3xl lg:text-4xl font-serif mb-6 leading-snug">
                In luxury real estate, the difference between a transaction and a
                legacy is the advisor you choose.
              </h2>
              <div className="h-px w-16 bg-gold mb-6" />
              <p className="text-white/50 text-sm leading-relaxed mb-6 font-light max-w-xl">
                {agent.bio}
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8 text-sm">
                {[
                  'Off-Market Access',
                  'Confidential Transactions',
                  'Global Buyer Network',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                    <span className="text-white/70">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="bg-gold text-white px-8 py-4 text-label uppercase tracking-md font-bold hover:bg-white hover:text-navy transition-colors duration-300 text-center"
                >
                  Schedule Consultation
                </Link>
                <Link
                  href="/about"
                  className="border border-white/30 text-white px-8 py-4 text-label uppercase tracking-md font-bold hover:bg-white hover:text-navy transition-colors duration-300 text-center"
                >
                  View Track Record
                </Link>
              </div>
            </div>

            {/* Portrait */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="relative max-w-[320px] mx-auto lg:mx-0 lg:ml-auto">
                <div className="absolute -top-3 -left-3 w-full h-full border border-gold/40" />
                <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={agent.photoUrl}
                    className="w-full h-full object-cover"
                    alt={agent.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white text-navy px-5 py-3 shadow-card">
                  <p className="font-serif text-lg">{agent.name}</p>
                  <p className="text-meta uppercase tracking-widest text-navy/50">
                    {agent.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="bg-white pt-24 lg:pt-32 pb-12">
        <div className="mx-auto max-w-[1800px] px-8 lg:px-24">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
                Curated Collection
              </span>
              <h2 className="text-4xl lg:text-5xl font-serif text-navy">
                Featured Estates
              </h2>
            </div>
            <Link
              href="/phoenix"
              className="hidden sm:flex items-center gap-3 text-label uppercase tracking-md font-bold text-navy border border-navy/20 px-6 py-3 hover:bg-navy hover:text-white transition-colors duration-300"
            >
              View All Properties
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            {listings.map((item) => (
              <Link
                key={item.slug}
                href={`/listings/${item.slug}`}
                className="group"
              >
                <div className="aspect-[4/5] overflow-hidden relative mb-8 border border-navy/5 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.img}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    alt={item.address}
                  />
                  <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/20 transition-colors duration-500" />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2">
                    <span className="font-serif text-navy text-lg">
                      {item.price}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-meta uppercase tracking-widest text-navy/40 mb-2">
                    {item.area}
                  </p>
                  <h3 className="text-2xl font-serif text-navy mb-2 group-hover:text-gold transition-colors duration-300">
                    {item.address}
                  </h3>
                  <div className="h-px w-8 bg-navy/20 mx-auto my-4 group-hover:w-16 group-hover:bg-gold transition-all duration-500" />
                  <div className="flex justify-center items-center gap-6 text-xs text-navy">
                    <span>{item.beds} Beds</span>
                    <span>{item.baths} Baths</span>
                    <span>{item.sqft} SF</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Lifestyle Collections */}
      <section className="bg-white pt-24 pb-32 lg:pb-40 border-t border-navy/5">
        <div className="mx-auto max-w-[1800px] px-8 lg:px-24">
          <div className="text-center mb-24">
            <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
              Area Expertise
            </span>
            <h2 className="text-4xl lg:text-5xl font-serif text-navy">
              Curated Lifestyles
            </h2>
          </div>

          <div className="space-y-32">
            {LIFESTYLE_COLLECTIONS.map((collection, idx) => (
              <div
                key={collection.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start"
              >
                <div
                  className={`lg:col-span-3 ${idx % 2 === 1 ? 'lg:order-2 lg:text-right' : ''}`}
                >
                  <div
                    className={`flex items-center gap-3 mb-4 text-navy ${idx % 2 === 1 ? 'lg:justify-end' : ''}`}
                  >
                    <h3 className="text-2xl font-serif">{collection.title}</h3>
                  </div>
                  <p
                    className={`text-sm text-navy/50 leading-relaxed font-light mb-8 max-w-xs ${idx % 2 === 1 ? 'lg:ml-auto' : ''}`}
                  >
                    {collection.description}
                  </p>
                  <Link
                    href="/phoenix"
                    className="group text-meta uppercase tracking-widest font-bold text-gold hover:text-navy transition-colors duration-300 inline-flex items-center gap-2"
                  >
                    View All {collection.title}{' '}
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </Link>
                </div>

                <div
                  className={`lg:col-span-9 ${idx % 2 === 1 ? 'lg:order-1' : ''}`}
                >
                  <div
                    className={`grid grid-cols-2 gap-4 ${collection.enclaves.length >= 4 ? 'lg:grid-cols-4' : collection.enclaves.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
                  >
                    {collection.enclaves.map((enclave) => (
                      <Link
                        key={enclave.name}
                        href={enclave.link}
                        className="group"
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-navy/5 mb-4 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={enclave.img}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                            alt={enclave.name}
                          />
                          <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/10 transition-colors" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-meta uppercase tracking-widest">
                              Explore
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="text-sm font-serif text-navy group-hover:text-gold transition-colors duration-300">
                            {enclave.name}
                          </h4>
                          <div className="h-px w-0 bg-gold mx-auto mt-2 group-hover:w-8 transition-all duration-500" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketing & Intel Split */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
        <Link
          href="/about"
          className="relative group overflow-hidden flex items-center justify-center bg-cream py-20"
        >
          <div className="absolute inset-0 bg-navy transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
          <div className="text-center p-12 z-10 relative">
            <h3 className="text-2xl font-serif mb-4 text-navy group-hover:text-white transition-colors duration-300">
              Strategic Marketing
            </h3>
            <p className="text-sm max-w-xs mx-auto mb-8 text-navy/50 group-hover:text-white/60 transition-colors duration-300">
              We leverage our global network to put your property
              in front of the world&apos;s most qualified buyers.
            </p>
            <span className="text-label uppercase tracking-md font-bold border-b pb-1 text-navy group-hover:text-white border-navy group-hover:border-gold transition-colors duration-300">
              Learn More
            </span>
          </div>
        </Link>

        <Link
          href="/blog"
          className="relative group overflow-hidden flex items-center justify-center bg-navy text-white py-20"
        >
          <div className="absolute inset-0 bg-gold transform translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
          <div className="text-center p-12 z-10 relative">
            <h3 className="text-2xl font-serif mb-4 group-hover:text-navy transition-colors duration-300">
              Market Intelligence
            </h3>
            <p className="text-white/50 group-hover:text-navy/70 text-sm max-w-xs mx-auto mb-8 transition-colors duration-300">
              Real-time data and deep-dive analysis on the Phoenix Metro&apos;s
              luxury sector. Empowering smarter decisions.
            </p>
            <span className="text-white group-hover:text-navy text-label uppercase tracking-md font-bold border-b border-gold group-hover:border-navy pb-1 transition-colors duration-300">
              View Reports
            </span>
          </div>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white py-16 lg:py-20">
        <div className="mx-auto max-w-content-lg px-8 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            {/* Brand */}
            <div>
              <h4 className="font-serif text-xl mb-4">{agent.name}</h4>
              <p className="text-white/40 text-sm leading-relaxed">
                {agent.title}
                <br />
                {agent.brokerage}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-meta uppercase tracking-widest text-white/40 font-bold mb-4">
                Explore
              </h5>
              <nav className="flex flex-col gap-3">
                <Link href="/phoenix" className="text-sm text-white/60 hover:text-gold transition-colors">
                  Communities
                </Link>
                <Link href="/about" className="text-sm text-white/60 hover:text-gold transition-colors">
                  About
                </Link>
                <Link href="/blog" className="text-sm text-white/60 hover:text-gold transition-colors">
                  Market Reports
                </Link>
                <Link href="/contact" className="text-sm text-white/60 hover:text-gold transition-colors">
                  Contact
                </Link>
              </nav>
            </div>

            {/* Contact */}
            <div>
              <h5 className="text-meta uppercase tracking-widest text-white/40 font-bold mb-4">
                Contact
              </h5>
              <div className="flex flex-col gap-3 text-sm text-white/60">
                <a href={`mailto:${agent.contact.email}`} className="hover:text-gold transition-colors">
                  {agent.contact.email}
                </a>
                <a href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`} className="hover:text-gold transition-colors">
                  {agent.contact.phone}
                </a>
                <span>{agent.contact.location}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10 mb-8" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/30">
            <p>&copy; {new Date().getFullYear()} {agent.name}. All rights reserved.</p>
            <p>{agent.brokerage}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
