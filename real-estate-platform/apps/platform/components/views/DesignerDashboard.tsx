'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { KPITile, SectionHeader, StatusBadge, RushBadge, SLAIndicator } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { fadeIn, springGentle } from '@/lib/motion';
import {
  DESIGNER_TASKS,
  ACTIVITY_FEED,
  UNIFIED_MESSAGES,
  slaCountdown,
} from '@/lib/mock-data';
import type { RequestDTO } from '@/app/actions/intake';

interface DesignerDashboardProps {
  user: { id: string; name: string; initials: string; role: string };
  requests: RequestDTO[];
  onSelectRequest?: (req: RequestDTO) => void;
}

const ACTIVITY_DOTS: Record<string, { color: string; label: string }> = {
  submit: { color: '#1D4ED8', label: '↑' },
  review: { color: '#7C3AED', label: '⊙' },
  message: { color: '#0891B2', label: '·' },
  work: { color: '#0369A1', label: '▶' },
  assign: { color: '#C9A96E', label: '→' },
  approve: { color: '#15803D', label: '✓' },
};

export function DesignerDashboard({ user, requests, onSelectRequest }: DesignerDashboardProps) {
  const queue = requests.filter(r => !['completed', 'cancelled'].includes(r.status));
  const inProgress = requests.filter(r => r.status === 'in_progress');
  const inReview = requests.filter(r => r.status === 'in_review' || r.status === 'review');
  const breached = requests.filter(r => r.slaBreached && !['completed', 'cancelled'].includes(r.status));

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  return (
    <div style={{ padding: '4px 0 40px' }}>
      {/* Greeting */}
      <motion.div {...fadeIn} style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300, color: 'var(--brand-primary)', letterSpacing: '-0.01em' }}>
          Good {greeting}, {user.name.split(' ')[0]}.
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
          {queue.length} in your queue
          {breached.length > 0 && <> · <strong style={{ color: '#DC2626' }}>{breached.length} SLA breached</strong></>}
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div {...fadeIn} transition={{ ...springGentle, delay: 0.05 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KPITile label="Queue" value={queue.length} accent="var(--brand-primary)" barPct={Math.min(100, (queue.length / 8) * 100)} signal={queue.length > 5 ? '⚠ Heavy load' : '✓ Manageable'} target="Target <6" />
        <KPITile label="In Progress" value={inProgress.length} accent="#0369A1" barPct={Math.min(100, (inProgress.length / 4) * 100)} signal={`${inProgress.length} active`} target="Limit 3" />
        <KPITile label="In Review" value={inReview.length} accent="#7C3AED" barPct={Math.min(100, (inReview.length / 3) * 100)} signal={inReview.length > 0 ? 'Awaiting feedback' : '✓ Clear'} target="" />
        <KPITile label="SLA Breached" value={breached.length} accent="#DC2626" barPct={Math.min(100, (breached.length / 3) * 100)} signal={breached.length > 0 ? '⚠ Needs attention' : '✓ On track'} target="Target 0" />
      </motion.div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Left: Queue + Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Queue Table */}
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionHeader title="My Queue" count={queue.length} />
            </div>
            {queue.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 11 }}>Queue is empty</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--brand-surface-alt)' }}>
                    {['Request', 'Material', 'Status', 'SLA', 'Due'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queue.map((req, i) => {
                    const sla = slaCountdown(req.slaDeadline);
                    return (
                      <tr
                        key={req.id}
                        onClick={() => onSelectRequest?.(req)}
                        style={{ cursor: 'pointer', borderBottom: i < queue.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)' }}>{req.title}</span>
                            {req.isRush && <RushBadge />}
                          </div>
                          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{req.requesterName}</div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 10, color: '#9CA3AF' }}>{req.materialType}</td>
                        <td style={{ padding: '10px 14px' }}><StatusBadge status={req.status as 'submitted' | 'in_progress'} /></td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: sla.urgent ? '#DC2626' : '#9CA3AF' }}>{sla.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 10, color: '#9CA3AF' }}>{req.dueDate ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Messages */}
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <SectionHeader title="Recent Messages" />
            </div>
            {UNIFIED_MESSAGES.slice(0, 4).map((msg, i) => (
              <div key={msg.id} style={{
                padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'flex-start',
                borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: msg.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: msg.avatarText }}>{msg.initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)' }}>{msg.sender}</span>
                    <span style={{ fontSize: 9, color: '#C4B9AA', fontFamily: 'var(--font-mono)' }}>{msg.time}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.preview}</div>
                </div>
                {msg.unread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-accent)', flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Tasks + Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tasks */}
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <SectionHeader title="Tasks" count={DESIGNER_TASKS.length} />
            </div>
            {DESIGNER_TASKS.map((t, i) => (
              <div key={t.id} style={{
                padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: i < DESIGNER_TASKS.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{ width: 16, height: 16, borderRadius: 3, border: '1.5px solid var(--color-border)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 1 }}>{t.text}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF' }}>Due {t.due}</div>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                  background: t.priority === 'high' ? '#FEF2F2' : '#FFFBEB',
                  color: t.priority === 'high' ? '#DC2626' : '#D97706',
                  padding: '2px 7px', borderRadius: 2,
                }}>{t.priority}</span>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <SectionHeader title="Activity" />
            </div>
            {ACTIVITY_FEED.map((a, i) => {
              const dot = ACTIVITY_DOTS[a.type] || { color: '#9CA3AF', label: '·' };
              return (
                <div key={a.id} style={{
                  padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'flex-start',
                  borderBottom: i < ACTIVITY_FEED.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: dot.color + '18', border: `1px solid ${dot.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: dot.color, fontWeight: 700,
                  }}>{dot.label}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--brand-primary)' }}>
                      <strong>{a.actor}</strong> {a.action}
                    </div>
                    <div style={{ fontSize: 9, color: '#C4B9AA', marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
