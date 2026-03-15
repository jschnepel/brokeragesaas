'use client';

import { FactorIndicator } from './FactorIndicator';
import type { FactorData } from '../data';

interface FactorRowProps {
  factor: FactorData;
  className?: string;
}

export function FactorRow({ factor, className = '' }: FactorRowProps) {
  return (
    <div className={`py-3 ${className}`}>
      <FactorIndicator rating={factor.rating} className="mb-1.5" />
      <p className="text-navy/70 text-[13px] leading-relaxed">
        {factor.description}
      </p>
    </div>
  );
}
