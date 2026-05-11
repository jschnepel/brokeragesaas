'use client';

import { useMemo, useState } from 'react';
import { CapsLabel } from '@/components/shared/CapsLabel';

type MortgageEstimatorProps = {
  listPrice: number | null;
  taxAnnualAmount: number | null;
  hoaFeeMonthly: number | null;
};

const DEFAULT_DOWN_PCT = 20;
const DEFAULT_RATE = 7.0;
const DEFAULT_TERM_YEARS = 30;
// Homeowners insurance — ARMLS market estimate at ~0.35% of home value
// per year (luxury inventory carries higher premiums than starter homes;
// this is a defensible average). Surfaced as a separate slider would
// add UI complexity without changing the headline much, so we keep it
// fixed and document the assumption next to the breakdown.
const INSURANCE_RATE_ANNUAL = 0.0035;

const DOLLAR = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Standard amortization formula. principal × r(1+r)^n / ((1+r)^n - 1)
 * with r = monthly rate and n = total months.
 */
function monthlyPI(principal: number, ratePct: number, years: number): number {
  if (principal <= 0 || ratePct < 0 || years <= 0) return 0;
  if (ratePct === 0) return principal / (years * 12);
  const r = ratePct / 100 / 12;
  const n = years * 12;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Listing-detail monthly-payment estimator. Stays editorial — single
 * row of sliders + a big headline payment number. Cash buyers in the
 * Phoenix luxury market still hit this regularly to compare carry
 * costs against alternatives, so it earns a slot on the page.
 */
export function MortgageEstimator({
  listPrice,
  taxAnnualAmount,
  hoaFeeMonthly,
}: MortgageEstimatorProps) {
  const seedPrice = typeof listPrice === 'number' && listPrice > 0 ? listPrice : 1_000_000;
  const [price, setPrice] = useState(seedPrice);
  const [downPct, setDownPct] = useState(DEFAULT_DOWN_PCT);
  const [ratePct, setRatePct] = useState(DEFAULT_RATE);
  const [termYears, setTermYears] = useState(DEFAULT_TERM_YEARS);

  const breakdown = useMemo(() => {
    const downAmount = (price * downPct) / 100;
    const principal = price - downAmount;
    const pi = monthlyPI(principal, ratePct, termYears);
    const taxMonthly = taxAnnualAmount ? taxAnnualAmount / 12 : 0;
    const insuranceMonthly = (price * INSURANCE_RATE_ANNUAL) / 12;
    const hoaMonthly = hoaFeeMonthly ?? 0;
    const total = pi + taxMonthly + insuranceMonthly + hoaMonthly;
    return {
      downAmount,
      principal,
      pi,
      taxMonthly,
      insuranceMonthly,
      hoaMonthly,
      total,
    };
  }, [price, downPct, ratePct, termYears, taxAnnualAmount, hoaFeeMonthly]);

  return (
    <section data-track="mortgage-estimator">
      <span aria-hidden="true" className="block w-12 h-px bg-gold/60 mb-6" />
      <CapsLabel as="h2" className="mb-4">Monthly estimate</CapsLabel>
      <p className="font-serif italic text-stone text-xl md:text-2xl mb-10 max-w-3xl leading-snug">
        Carry cost at today's rate, including taxes, insurance, and HOA.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-start">
        {/* Sliders */}
        <div className="space-y-8">
          <SliderRow
            label="Home price"
            value={DOLLAR(price)}
            inputMin={250_000}
            inputMax={Math.max(seedPrice * 1.5, 5_000_000)}
            inputStep={50_000}
            current={price}
            onChange={setPrice}
            ariaLabel="Home price"
          />
          <SliderRow
            label="Down payment"
            value={`${downPct}% · ${DOLLAR(breakdown.downAmount)}`}
            inputMin={0}
            inputMax={50}
            inputStep={1}
            current={downPct}
            onChange={setDownPct}
            ariaLabel="Down payment percent"
          />
          <SliderRow
            label="Interest rate"
            value={`${ratePct.toFixed(2)}%`}
            inputMin={3}
            inputMax={10}
            inputStep={0.125}
            current={ratePct}
            onChange={setRatePct}
            ariaLabel="Interest rate percent"
          />
          <SliderRow
            label="Loan term"
            value={`${termYears} years`}
            inputMin={10}
            inputMax={30}
            inputStep={5}
            current={termYears}
            onChange={setTermYears}
            ariaLabel="Loan term years"
          />
        </div>

        {/* Breakdown */}
        <div className="bg-ink-elevated/40 border border-white/5 p-8">
          <CapsLabel as="div" className="text-stone/60 text-[10px] mb-3">
            Estimated monthly
          </CapsLabel>
          <p className="font-serif text-4xl md:text-5xl text-gold tabular-nums mb-6">
            {DOLLAR(breakdown.total)}
          </p>
          <dl className="space-y-3 text-sm">
            <Row label="Principal &amp; Interest" value={DOLLAR(breakdown.pi)} />
            <Row label="Property taxes (est.)" value={DOLLAR(breakdown.taxMonthly)} />
            <Row label="Homeowners insurance (est.)" value={DOLLAR(breakdown.insuranceMonthly)} />
            <Row label="HOA dues" value={DOLLAR(breakdown.hoaMonthly)} />
          </dl>
          <p className="caps text-[10px] tracking-widest text-stone/45 mt-8 leading-relaxed">
            Estimate only · Insurance modeled at 0.35% of value annually ·
            Verify all costs with your lender.
          </p>
        </div>
      </div>
    </section>
  );
}

function SliderRow({
  label,
  value,
  inputMin,
  inputMax,
  inputStep,
  current,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: string;
  inputMin: number;
  inputMax: number;
  inputStep: number;
  current: number;
  onChange: (next: number) => void;
  ariaLabel: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <CapsLabel as="div" className="text-stone/60 text-[10px]">
          {label}
        </CapsLabel>
        <div className="text-stone text-base tabular-nums">{value}</div>
      </div>
      <input
        type="range"
        min={inputMin}
        max={inputMax}
        step={inputStep}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        className="w-full accent-gold"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
      <dt className="text-stone/70">{label}</dt>
      <dd className="text-stone tabular-nums">{value}</dd>
    </div>
  );
}
