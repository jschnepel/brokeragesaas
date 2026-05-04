'use client';

import { useEffect, useRef, useState } from 'react';

type ReportStatCounterProps = {
  value: string;
  label: string;
  durationMs?: number;
};

/**
 * Animates the numeric portion of a market-report stat from 0 → target on
 * scroll-into-view. Works for values like "$4.9M", "+8.2%", "47",
 * "22 days", "3.4×". Respects prefers-reduced-motion.
 */
export function ReportStatCounter({
  value,
  label,
  durationMs = 1600,
}: ReportStatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(value);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const match = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!match) return;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(/,/g, ''));
    if (!Number.isFinite(target)) return;
    const decimals = (numStr.split('.')[1] || '').length;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / durationMs, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;
          const formatted =
            decimals > 0
              ? current.toFixed(decimals)
              : Math.round(current).toLocaleString();
          setRendered(`${prefix}${formatted}${suffix}`);
          if (progress < 1) window.requestAnimationFrame(tick);
          else setRendered(value);
        };
        setRendered(
          `${prefix}${decimals > 0 ? (0).toFixed(decimals) : '0'}${suffix}`,
        );
        window.requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return (
    <div ref={ref} className="border-t border-[color:var(--hairline)] pt-6">
      <dt className="caps text-[10px] leading-relaxed" style={{ color: 'var(--mute)' }}>
        {label}
      </dt>
      <dd className="mt-4 font-serif text-3xl md:text-4xl text-stone tabular-nums">
        {rendered}
      </dd>
    </div>
  );
}
