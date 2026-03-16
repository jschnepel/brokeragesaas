'use client';

import Link from 'next/link';

interface BottomCTAProps {
  className?: string;
}

export function BottomCTA({ className = '' }: BottomCTAProps) {
  return (
    <section className={`bg-cream-alt py-20 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-content-lg px-8 lg:px-20 text-center">
        <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
          Next Steps
        </span>
        <h2 className="text-3xl lg:text-4xl font-serif text-navy tracking-tight max-w-xl mx-auto">
          Ready to Make Your Move?
        </h2>
        <div className="w-12 h-0.5 bg-gold mt-6 mx-auto mb-8" />
        <p className="text-navy/60 leading-relaxed max-w-lg mx-auto mb-10" style={{ fontSize: 15 }}>
          Whether you are relocating from out of state or exploring a new part of Arizona,
          personalized guidance makes all the difference.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact"
            data-testid="cta-contact-btn"
            className="bg-gold text-white px-8 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-navy transition-all"
          >
            Contact Yong
          </Link>
          <Link
            href="/phoenix"
            data-testid="cta-explore-btn"
            className="border border-navy/25 text-navy px-8 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-navy hover:text-white transition-all"
          >
            Explore Communities
          </Link>
        </div>
      </div>
    </section>
  );
}
