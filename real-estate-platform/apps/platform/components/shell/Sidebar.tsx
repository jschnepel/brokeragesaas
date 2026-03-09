'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  user?: { name: string; role: string; initials: string };
}

export function Sidebar({ items, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, var(--brand-sidebar) 0%, var(--brand-dark) 100%)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--brand-accent)', fontFamily: 'var(--font-body)' }}>
          Russ Lyon
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
          Sotheby&#39;s International Realty
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 20px',
                margin: '1px 8px',
                borderRadius: 3,
                background: active ? 'linear-gradient(90deg, var(--brand-accent-muted), transparent)' : 'transparent',
                borderLeft: active ? '2px solid var(--brand-accent)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ color: active ? 'var(--brand-accent)' : 'rgba(255,255,255,0.45)', display: 'flex', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  letterSpacing: '0.04em',
                  color: active ? '#F9F6F1' : 'rgba(255,255,255,0.5)',
                }}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--brand-accent-muted)',
            border: '1px solid rgba(201,169,110,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-accent)', fontFamily: 'var(--font-body)' }}>
              {user.initials}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {user.role}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
