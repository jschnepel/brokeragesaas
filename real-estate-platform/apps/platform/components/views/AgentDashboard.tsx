'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { KPITile, SectionHeader, StatusBadge, RushBadge, SLAIndicator } from '@/components/primitives';
import { RequestCard } from '@/components/features';
import { NewRequestModal } from '@/components/features/NewRequestModal';
import { CancelModal } from '@/components/features/CancelModal';
import { Button } from '@/components/ui/button';
import { fadeIn, springGentle } from '@/lib/motion';
import {
  AGENT_TASKS,
  UNIFIED_MESSAGES,
  ACTIVITY_FEED,
  slaCountdown,
} from '@/lib/mock-data';
import type { RequestDTO } from '@/app/actions/intake';

interface AgentDashboardProps {
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

export function AgentDashboard({ user, requests, onSelectRequest }: AgentDashboardProps) {
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<RequestDTO | null>(null);

  const active = requests.filter(r => !['completed', 'cancelled'].includes(r.status));
  const inReview = requests.filter(r => r.status === 'in_review' || r.status === 'review');
  const rushActive = requests.filter(r => r.isRush && !['completed', 'cancelled'].includes(r.status));
  const completed = requests.filter(r => r.status === 'completed');
  const cancelled = requests.filter(r => r.status === 'cancelled');

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  return (
    <div style={{ padding: '4px 0 40px' }}>
      {/* Greeting */}
      <motion.div {...fadeIn} style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300, color: 'var(--brand-primary)', letterSpacing: '-0.01em' }}>
          Good {greeting}, {user.name.split(' ')[0]}.
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
          {active.length} active request{active.length !== 1 ? 's' : ''}
          {rushActive.length > 0 && <> · <strong style={{ color: '#DC2626' }}>{rushActive.length} rush</strong></>}
        </div>
      </motion.div>

      {/* KPI Row */}
      <motion.div {...fadeIn} transition={{ ...springGentle, delay: 0.05 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KPITile label="Active" value={active.length} accent="var(--brand-primary)" barPct={Math.min(100, (active.length / 5) * 100)} signal={`${active.length} in pipeline`} target="Target <5" />
        <KPITile label="In Review" value={inReview.length} accent="#7C3AED" barPct={Math.min(100, (inReview.length / 3) * 100)} signal={inReview.length > 0 ? 'Awaiting approval' : '✓ None'} target="Review ASAP" />
        <KPITile label="Rush Active" value={rushActive.length} accent="#DC2626" barPct={Math.min(100, (rushActive.length / 3) * 100)} signal={rushActive.length > 0 ? `${rushActive.length} active` : '✓ None'} target="Watch closely" />
        <KPITile label="Completed MTD" value={completed.length} accent="var(--brand-accent)" barPct={Math.min(100, (completed.length / 10) * 100)} signal={`${completed.length} this month`} target="Goal 10/mo" />
      </motion.div>

      {/* New Request Button */}
      <div style={{ marginBottom: 24 }}>
        <Button variant="accent" onClick={() => setShowNewRequest(true)}>+ New Request</Button>
      </div>

      {/* Active Requests */}
      {active.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <SectionHeader title="Active Requests" count={active.length} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, marginTop: 8 }}>
            {active.map((req, i) => (
              <motion.div key={req.id} {...fadeIn} transition={{ ...springGentle, delay: i * 0.04 }}>
                <RequestCard
                  request={{
                    id: req.id,
                    title: req.title,
                    materialType: req.materialType,
                    status: req.status as 'submitted' | 'in_progress' | 'in_review',
                    isRush: req.isRush,
                    requesterName: req.requesterName,
                    designerName: req.designerName || undefined,
                    submittedAt: req.submittedAt,
                    slaDeadline: req.slaDeadline,
                    slaBreached: req.slaBreached,
                    referenceFiles: req.files?.map(f => ({ url: f.url || '' })),
                    lastMessage: req.messages.length > 0 ? {
                      preview: req.messages[req.messages.length - 1].body,
                      time: req.messages[req.messages.length - 1].createdAt,
                    } : undefined,
                  }}
                  onClick={() => onSelectRequest?.(req)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column: Tasks + Messages | Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {/* Left: Tasks + Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tasks */}
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <SectionHeader title="Tasks" count={AGENT_TASKS.length} />
            </div>
            {AGENT_TASKS.map((t, i) => (
              <div key={t.id} style={{
                padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: i < AGENT_TASKS.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 3, border: '1.5px solid var(--color-border)',
                  flexShrink: 0,
                }} />
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

          {/* Messages */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)' }}>{msg.sender}</span>
                    <span style={{ fontSize: 9, color: '#C4B9AA', fontFamily: 'var(--font-mono)' }}>{msg.time}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.preview}</div>
                  {msg.context && <div style={{ fontSize: 9, color: '#C4B9AA', marginTop: 2 }}>{msg.context}</div>}
                </div>
                {msg.unread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-accent)', flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Activity */}
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
                    <strong>{a.actor}</strong> {a.action} <span style={{ color: '#9CA3AF' }}>{a.target}</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#C4B9AA', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <div>
          <SectionHeader title="Cancelled" count={cancelled.length} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 8 }}>
            {cancelled.map(req => (
              <RequestCard
                key={req.id}
                request={{
                  id: req.id,
                  title: req.title,
                  materialType: req.materialType,
                  status: 'cancelled',
                  isRush: req.isRush,
                  requesterName: req.requesterName,
                  submittedAt: req.submittedAt,
                  slaDeadline: req.slaDeadline,
                  slaBreached: req.slaBreached,
                }}
                compact
                onClick={() => onSelectRequest?.(req)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <NewRequestModal open={showNewRequest} onOpenChange={setShowNewRequest} onSubmit={() => setShowNewRequest(false)} />
      {cancelTarget && (
        <CancelModal
          request={{ id: cancelTarget.id, title: cancelTarget.title, status: cancelTarget.status as 'submitted' | 'in_progress' | 'in_review' }}
          role="agent"
          open={!!cancelTarget}
          onOpenChange={() => setCancelTarget(null)}
          onConfirm={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
