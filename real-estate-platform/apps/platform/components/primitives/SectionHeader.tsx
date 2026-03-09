interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: React.ReactNode;
}

export function SectionHeader({ title, count, action }: SectionHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--brand-primary)',
          fontFamily: 'var(--font-body)',
        }}>
          {title}
        </span>
        {count !== undefined && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            background: 'var(--brand-surface-alt)',
            color: '#9CA3AF',
            padding: '1px 6px',
            borderRadius: 'var(--brand-radius)',
            fontFamily: 'var(--font-mono)',
          }}>
            {count}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
