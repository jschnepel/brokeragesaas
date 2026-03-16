'use client';

interface RelocateHeroProps {
  className?: string;
}

export function RelocateHero({ className = '' }: RelocateHeroProps) {
  return (
    <section className={`relative overflow-hidden ${className}`} style={{ minHeight: 400 }}>
      {/* Background image */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&q=80&w=1800"
          alt="Arizona desert landscape at sunset"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(12,28,46,0.85) 0%, rgba(12,28,46,0.4) 50%, rgba(12,28,46,0.25) 100%)' }}
      />

      <div className="relative mx-auto max-w-content-lg px-8 lg:px-20 flex flex-col justify-end" style={{ minHeight: 400, paddingTop: 120, paddingBottom: 64 }}>
        <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
          Arizona Relocation Guide
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white tracking-tight leading-tight max-w-2xl">
          Find Your Arizona Lifestyle
        </h1>
        <div className="w-16 h-0.5 bg-gold mt-6 mb-6" />
        <p className="text-white/70 max-w-xl leading-relaxed" style={{ fontSize: 15 }}>
          From mountain retreats to desert luxury, urban energy to suburban comfort &mdash;
          compare four distinct ways to live in Arizona and discover which one fits you.
        </p>
      </div>
    </section>
  );
}
