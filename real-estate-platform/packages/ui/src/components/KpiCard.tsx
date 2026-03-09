'use client';

/**
 * KPI Card — Single metric display with optional trend indicator.
 * Consumer-facing: uses plain language labels, not jargon.
 */

export interface KpiCardProps {
  agentId: string;
  className?: string;
  label: string;
  value: string;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    value: string;
    favorable?: boolean;
  };
  tooltip?: string;
}

export function KpiCard({
  className = '',
  label,
  value,
  subtitle,
  trend,
  tooltip,
}: KpiCardProps) {
  const trendColor = trend
    ? trend.favorable === undefined
      ? 'text-navy/50'
      : trend.favorable
        ? 'text-emerald-600'
        : 'text-red-500'
    : '';

  const trendArrow = trend
    ? trend.direction === 'up'
      ? '\u2191'
      : trend.direction === 'down'
        ? '\u2193'
        : '\u2192'
    : '';

  return (
    <div className={`bg-white border border-navy/5 p-5 shadow-card ${className}`} title={tooltip}>
      <p className="text-[10px] uppercase tracking-widest text-navy/40 font-bold mb-2">
        {label}
      </p>
      <p
        className="text-2xl lg:text-3xl font-serif text-navy"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </p>
      <div className="flex items-center gap-2 mt-1.5 min-h-[18px]">
        {trend && (
          <span className={`text-xs font-bold ${trendColor}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {trendArrow} {trend.value}
          </span>
        )}
        {subtitle && (
          <span className="text-[10px] text-navy/30">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
