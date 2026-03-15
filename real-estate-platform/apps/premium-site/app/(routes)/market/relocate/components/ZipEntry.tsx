'use client';

import { useState } from 'react';

interface ZipEntryProps {
  onSubmit: (zip: string) => void;
  className?: string;
}

export function ZipEntry({ onSubmit, className = '' }: ZipEntryProps) {
  const [zip, setZip] = useState('');
  const isValid = /^\d{5}$/.test(zip);

  return (
    <div className={`text-center ${className}`}>
      <h2 className="font-serif text-navy text-2xl lg:text-3xl mb-3">
        Where are you now?
      </h2>
      <p className="text-navy/60 text-[14px] mb-8">
        Enter your ZIP code so we can compare your area to Arizona lifestyles.
      </p>
      <div className="flex items-center justify-center gap-3">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter ZIP code"
          data-testid="zip-input"
          className="w-40 border-b-2 border-navy/20 bg-transparent text-center text-navy text-xl font-serif py-2 outline-none focus:border-gold transition-colors placeholder:text-navy/30"
        />
        <button
          onClick={() => onSubmit(zip)}
          disabled={!isValid}
          data-testid="zip-submit-btn"
          className="bg-gold text-white px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-navy transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
