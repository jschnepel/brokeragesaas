'use client';

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/primitives';

interface AgentProfile {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
  phone?: string;
  title?: string;
  office?: string;
  bio?: string;
  avatarBg?: string;
}

interface ProfileDrawerProps {
  agent: AgentProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_STATS = [
  { label: 'Active Requests', value: '3' },
  { label: 'Completed MTD', value: '12' },
  { label: 'Avg SLA', value: '94%' },
];

const MOCK_ACTIVITY = [
  { action: 'Submitted request', detail: 'Just Listed — 8920 E Pinnacle Peak Rd', time: '2h ago' },
  { action: 'Sent message', detail: 'Please use the twilight photo for the hero image', time: '4h ago' },
  { action: 'Completed request', detail: 'Agent Branding — Spring Social Kit', time: '1d ago' },
];

export function ProfileDrawer({ agent, open, onOpenChange }: ProfileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[400px] p-0 flex flex-col"
      >
        {agent && (
          <>
            {/* Hidden accessible title */}
            <SheetTitle className="sr-only">{agent.name}</SheetTitle>
            <SheetDescription className="sr-only">Agent profile</SheetDescription>

            {/* Header */}
            <div style={{
              background: 'linear-gradient(180deg, var(--brand-sidebar) 0%, var(--brand-dark) 100%)',
              padding: '24px 20px 20px',
              position: 'relative', flexShrink: 0,
            }}>
              {/* Close */}
              <button
                onClick={() => onOpenChange(false)}
                style={{
                  position: 'absolute', top: 14, right: 16,
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  width: 28, height: 28, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.5)', fontSize: 16,
                }}
              >
                ×
              </button>

              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: agent.avatarBg || 'var(--brand-accent-muted)',
                  border: '2px solid rgba(201,169,110,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-accent)' }}>
                    {agent.initials}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 300, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>
                    {agent.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {agent.title && (
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{agent.title}</span>
                    )}
                    <Badge variant="accent" size="sm">{agent.role}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--brand-surface)' }}>
              {/* Contact */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <ContactRow label="Email" value={agent.email} onClick={() => console.log('Copy email:', agent.email)} />
                {agent.phone && (
                  <ContactRow label="Phone" value={agent.phone} onClick={() => console.log('Copy phone:', agent.phone)} />
                )}
                {agent.office && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 2 }}>Office</div>
                    <div style={{ fontSize: 12, color: 'var(--brand-primary)' }}>{agent.office}</div>
                  </div>
                )}
              </div>

              {/* Bio */}
              {agent.bio && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                  <SectionHeader title="About" />
                  <div style={{ fontSize: 12, color: 'var(--brand-primary)', lineHeight: 1.6 }}>
                    {agent.bio}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <SectionHeader title="Stats" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {MOCK_STATS.map(s => (
                    <div key={s.label} style={{
                      background: 'white', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--brand-radius)', padding: '10px 12px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--brand-primary)', lineHeight: 1, marginBottom: 4 }}>
                        {s.value}
                      </div>
                      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF' }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ padding: '16px 20px' }}>
                <SectionHeader title="Recent Activity" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {MOCK_ACTIVITY.map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, padding: '8px 0',
                      borderBottom: i < MOCK_ACTIVITY.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                        background: i === 0 ? 'var(--brand-accent)' : 'var(--color-border)',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 2 }}>
                          {a.action}
                        </div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.detail}
                        </div>
                      </div>
                      <span style={{ fontSize: 9, color: '#C4B9AA', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        {a.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ContactRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--brand-primary)' }}>{value}</div>
      </div>
      <button
        onClick={onClick}
        style={{
          background: 'none', border: '1px solid var(--color-border)',
          borderRadius: 'var(--brand-radius)', padding: '4px 8px',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: '#9CA3AF', cursor: 'pointer', flexShrink: 0,
        }}
      >
        Copy
      </button>
    </div>
  );
}
