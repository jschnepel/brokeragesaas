/**
 * Dense analytics dashboard widget primitives.
 * Tableau-density building blocks: metric cards, sparklines, rank lists, section dividers.
 */
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrendDirection } from '../../../models/types';

// ── SparkLine (inline SVG trend) ────────────────────
export const SparkLine: React.FC<{
  points: number[];
  color?: string;
  w?: number;
  h?: number;
}> = ({ points, color = '#Bfa67a', w = 48, h = 16 }) => {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 2) - 1;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="shrink-0 opacity-60">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Metric Card ─────────────────────────────────────
interface MetricProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDir?: TrendDirection;
  bar?: number;
  spark?: number[];
  sub?: string;
  className?: string;
}

export const Metric: React.FC<MetricProps> = ({
  label, value, trend, trendDir, bar, spark, sub, className = '',
}) => {
  const tc =
    trendDir === 'up' ? 'text-emerald-500' :
    trendDir === 'down' ? 'text-rose-500' : 'text-gray-400';
  return (
    <div className={`bg-white border border-gray-100 p-2.5 ${className}`}>
      <div className="flex items-start justify-between gap-1 mb-0.5">
        <span className="text-[7px] uppercase tracking-[0.15em] text-gray-400 font-bold leading-tight truncate">
          {label}
        </span>
        {spark && <SparkLine points={spark} />}
      </div>
      <span className="text-base font-serif text-[#0C1C2E] leading-tight block">{value}</span>
      <div className="flex items-center gap-2 mt-0.5">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${tc}`}>
            {trendDir === 'up' ? <TrendingUp size={8} /> :
             trendDir === 'down' ? <TrendingDown size={8} /> :
             <Minus size={8} />}
            {trend}
          </span>
        )}
        {sub && <span className="text-[7px] text-gray-400 truncate">{sub}</span>}
      </div>
      {bar !== undefined && (
        <div className="mt-1 h-[3px] bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#Bfa67a]/60"
            style={{ width: `${Math.min(bar, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ── Dark Metric (for navy sections) ─────────────────
export const MetricDark: React.FC<MetricProps> = ({
  label, value, trend, trendDir, bar, spark, sub,
}) => {
  const tc =
    trendDir === 'up' ? 'text-emerald-400' :
    trendDir === 'down' ? 'text-rose-400' : 'text-white/40';
  return (
    <div className="bg-white/5 border border-white/10 p-2.5">
      <div className="flex items-start justify-between gap-1 mb-0.5">
        <span className="text-[7px] uppercase tracking-[0.15em] text-white/40 font-bold leading-tight truncate">
          {label}
        </span>
        {spark && <SparkLine points={spark} color="#Bfa67a" />}
      </div>
      <span className="text-base font-serif text-white leading-tight block">{value}</span>
      <div className="flex items-center gap-2 mt-0.5">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${tc}`}>
            {trendDir === 'up' ? <TrendingUp size={8} /> :
             trendDir === 'down' ? <TrendingDown size={8} /> :
             <Minus size={8} />}
            {trend}
          </span>
        )}
        {sub && <span className="text-[7px] text-white/30 truncate">{sub}</span>}
      </div>
      {bar !== undefined && (
        <div className="mt-1 h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#Bfa67a]/60"
            style={{ width: `${Math.min(bar, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ── Rank List ───────────────────────────────────────
interface RankItem {
  name: string;
  value: string | number;
  sub?: string;
  bar?: number;
}

export const RankList: React.FC<{
  title: string;
  items: RankItem[];
  limit?: number;
}> = ({ title, items, limit = 5 }) => (
  <div className="bg-white border border-gray-100 p-2.5">
    <span className="text-[7px] uppercase tracking-[0.15em] text-[#0C1C2E] font-bold block mb-1.5">
      {title}
    </span>
    <div className="space-y-0.5">
      {items.slice(0, limit).map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-[3px] border-b border-gray-50 last:border-0"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[#Bfa67a] font-serif text-[9px] w-3 shrink-0 text-right">
              {i + 1}
            </span>
            <div className="min-w-0">
              <span className="text-[11px] text-[#0C1C2E] block truncate leading-tight">
                {item.name}
              </span>
              {item.sub && (
                <span className="text-[8px] text-gray-400 leading-tight">{item.sub}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[11px] font-serif text-[#0C1C2E]">{item.value}</span>
            {item.bar !== undefined && (
              <div className="w-10 h-[3px] bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#Bfa67a]/50"
                  style={{ width: `${Math.min(item.bar, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Section Divider (thin rule + tier badge) ────────
type Tier = 'idx' | 'vow' | 'mixed';

const TIER: Record<Tier, { text: string; light: string; dark: string }> = {
  idx:   { text: 'IDX',     light: 'bg-emerald-500/15 text-emerald-700', dark: 'bg-emerald-500/20 text-emerald-400' },
  vow:   { text: 'VOW',     light: 'bg-amber-500/15 text-amber-700',    dark: 'bg-amber-500/20 text-amber-400' },
  mixed: { text: 'IDX+VOW', light: 'bg-sky-500/15 text-sky-700',        dark: 'bg-sky-500/20 text-sky-400' },
};

export const Divider: React.FC<{
  label: string;
  tier: Tier;
  dark?: boolean;
}> = ({ label, tier, dark }) => {
  const s = TIER[tier];
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <span
        className={`text-[7px] uppercase tracking-[0.2em] font-bold whitespace-nowrap ${
          dark ? 'text-white/30' : 'text-gray-300'
        }`}
      >
        {label}
      </span>
      <div className={`flex-1 h-px ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
      <span
        className={`text-[7px] uppercase tracking-[0.1em] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap ${
          dark ? s.dark : s.light
        }`}
      >
        {s.text}
      </span>
    </div>
  );
};

// ── Indicator Pill ──────────────────────────────────
export const IndicatorPill: React.FC<{ value: string }> = ({ value }) => {
  const l = value.toLowerCase();
  const c =
    l === 'high' || l === 'strong' || l === 'excellent'
      ? 'bg-emerald-100 text-emerald-700'
      : l === 'moderate' || l.includes('%')
        ? 'bg-amber-100 text-amber-700'
        : 'bg-rose-100 text-rose-700';
  return (
    <span className={`text-[7px] uppercase tracking-[0.1em] font-bold px-1.5 py-0.5 rounded-sm ${c}`}>
      {value}
    </span>
  );
};

// ── Gauge Mini (donut ring) ─────────────────────────
export const GaugeMini: React.FC<{
  score: number;
  label: string;
  size?: number;
  dark?: boolean;
}> = ({ score, label, size = 40, dark }) => {
  const pct = score / 100;
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const color =
    score >= 70 ? '#10B981' :
    score >= 55 ? '#F59E0B' :
    score >= 40 ? '#3B82F6' : '#EF4444';
  return (
    <div className="flex items-center gap-1.5">
      <svg width={size} height={size} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <span className={`text-xs font-serif block leading-tight ${dark ? 'text-white' : 'text-[#0C1C2E]'}`}>{score}</span>
        <span className={`text-[6px] uppercase tracking-widest font-bold ${dark ? 'text-white/40' : 'text-gray-400'}`}>{label}</span>
      </div>
    </div>
  );
};

// ── Stat Strip (horizontal label:value row) ─────────
export const StatStrip: React.FC<{
  items: { label: string; value: string | number }[];
  dark?: boolean;
}> = ({ items, dark }) => (
  <div className={`flex items-center divide-x ${dark ? 'divide-white/10' : 'divide-gray-200'} overflow-x-auto`}>
    {items.map((item, i) => (
      <div key={i} className="px-3 py-1.5 first:pl-0 last:pr-0 min-w-0">
        <span className={`text-[7px] uppercase tracking-[0.15em] font-bold block truncate ${dark ? 'text-white/40' : 'text-gray-400'}`}>
          {item.label}
        </span>
        <span className={`text-sm font-serif block leading-tight ${dark ? 'text-white' : 'text-[#0C1C2E]'}`}>
          {item.value}
        </span>
      </div>
    ))}
  </div>
);
