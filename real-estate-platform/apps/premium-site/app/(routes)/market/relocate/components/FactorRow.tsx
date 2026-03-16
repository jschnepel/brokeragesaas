'use client';

import { FactorIndicator } from './FactorIndicator';
import type { FactorData } from '../data';

interface FactorRowProps {
  factor: FactorData;
  label: string;
  className?: string;
}

export function FactorRow({ factor, label, className = '' }: FactorRowProps) {
  return (
    <div className={`py-3 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-[0.1em] text-navy/40 font-medium">
          {label}
        </p>
        <FactorIndicator rating={factor.rating} />
      </div>
      <p className="text-navy/60 text-[12px] leading-relaxed">
        {factor.description}
      </p>
    </div>
  );
}
