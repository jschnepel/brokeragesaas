'use client';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div style={{
      height: 'var(--topbar-height)',
      background: 'white',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-primary)', lineHeight: 1 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, letterSpacing: '0.04em' }}>
            {subtitle}
          </div>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
