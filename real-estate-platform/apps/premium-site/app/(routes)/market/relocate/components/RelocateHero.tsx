'use client';

interface RelocateHeroProps {
  onOpenQuiz: () => void;
  className?: string;
}

export function RelocateHero({ onOpenQuiz, className = '' }: RelocateHeroProps) {
  return (
    <section className={`text-center py-20 lg:py-28 ${className}`}>
      <p className="text-gold text-[10px] uppercase tracking-[0.3em] font-bold mb-4">
        Arizona Relocation Guide
      </p>
      <h1 className="font-serif text-navy text-3xl lg:text-5xl leading-tight mb-6 max-w-3xl mx-auto">
        Find Your Arizona Lifestyle
      </h1>
      <p className="text-navy/60 text-[15px] lg:text-base leading-relaxed max-w-2xl mx-auto mb-10">
        From mountain retreats to desert luxury, urban energy to suburban comfort —
        compare four distinct ways to live in Arizona and discover which one fits you.
      </p>
      <button
        onClick={onOpenQuiz}
        data-testid="hero-compare-btn"
        className="bg-gold text-white px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-navy transition-colors"
      >
        Compare Your Area
      </button>
    </section>
  );
}
