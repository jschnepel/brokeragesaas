'use client';

interface SLAIndicatorProps {
  deadline: string | null;
  paused?: boolean;
  size?: 'sm' | 'default';
}

function slaCountdown(deadline: string | null, paused = false) {
  if (!deadline) return { label: '—', urgent: false, paused };
  if (paused)    return { label: 'Paused', urgent: false, paused: true };
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0)          return { label: 'Overdue', urgent: true, paused: false };
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) {
    const m = Math.floor(diff / 60_000);
    return { label: `${m}m`, urgent: true, paused: false };
  }
  if (h < 24) return { label: `${h}h`, urgent: h < 4, paused: false };
  const d = Math.floor(h / 24);
  return { label: `${d}d`, urgent: false, paused: false };
}

export function SLAIndicator({ deadline, paused = false, size = 'default' }: SLAIndicatorProps) {
  const { label, urgent, paused: isPaused } = slaCountdown(deadline, paused);
  const color = isPaused ? '#0891B2' : urgent ? '#DC2626' : '#9CA3AF';
  return (
    <span style={{
      fontSize: size === 'sm' ? 9 : 10,
      fontWeight: 600,
      color,
      fontFamily: 'var(--font-mono)',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
