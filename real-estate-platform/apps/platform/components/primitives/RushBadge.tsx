export function RushBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      padding: '2px 5px',
      borderRadius: 'var(--brand-radius)',
      background: '#DC2626',
      color: 'white',
      fontFamily: 'var(--font-body)',
      flexShrink: 0,
    }}>
      RUSH
    </span>
  );
}
