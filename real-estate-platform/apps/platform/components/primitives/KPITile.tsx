interface KPITileProps {
  label: string;
  value: string | number;
  accent: string;
  barPct: number;
  signal: string;
  target: string;
}

export function KPITile({ label, value, accent, barPct, signal, target }: KPITileProps) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--brand-radius)',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 300, color: accent, lineHeight: 1, marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ height: 2, background: 'var(--brand-surface-alt)', borderRadius: 1, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${barPct}%`, background: accent, borderRadius: 1, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 9, color: '#6B7280', fontFamily: 'var(--font-body)' }}>{signal}</span>
        <span style={{ fontSize: 8, color: '#9CA3AF', letterSpacing: '0.06em' }}>{target}</span>
      </div>
    </div>
  );
}
