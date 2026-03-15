'use client';

interface BottomCTAProps {
  onOpenQuiz: () => void;
  className?: string;
}

export function BottomCTA({ onOpenQuiz, className = '' }: BottomCTAProps) {
  return (
    <section className={`text-center py-16 lg:py-20 border-t border-navy/5 ${className}`}>
      <h2 className="font-serif text-navy text-2xl lg:text-3xl mb-4">
        Wondering how your area compares?
      </h2>
      <p className="text-navy/60 text-[14px] mb-8 max-w-lg mx-auto">
        Take a quick quiz to find the two Arizona lifestyles that best match your preferences.
      </p>
      <button
        onClick={onOpenQuiz}
        data-testid="bottom-compare-btn"
        className="bg-gold text-white px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-navy transition-colors"
      >
        Compare Your Area
      </button>
    </section>
  );
}
