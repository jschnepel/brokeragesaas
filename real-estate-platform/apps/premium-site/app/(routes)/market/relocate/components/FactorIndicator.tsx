'use client';

interface FactorIndicatorProps {
  rating: number;
  className?: string;
}

const MAX_DOTS = 5;

export function FactorIndicator({ rating, className = '' }: FactorIndicatorProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`${rating} out of ${MAX_DOTS}`}>
      {Array.from({ length: MAX_DOTS }, (_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i < rating ? 'bg-gold' : 'bg-navy/10'
          }`}
        />
      ))}
    </div>
  );
}
