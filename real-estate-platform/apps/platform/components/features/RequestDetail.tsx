'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { StatusBadge, RushBadge, SLAIndicator, SectionHeader } from '@/components/primitives';
import type { RequestStatus } from '@/components/primitives';
import { ChatThread } from './chat/ChatThread';
import type { ChatMessage } from './chat/ChatThread';
import { ChatInput } from './chat/ChatInput';

interface FullRequest {
  id: string;
  title: string;
  materialType: string;
  status: RequestStatus;
  isRush: boolean;
  designerName?: string;
  requesterName: string;
  submittedAt: string;
  dueDate?: string;
  slaDeadline: string | null;
  slaBreached: boolean;
  brief?: string;
  referenceFiles?: Array<{ url: string; fileName: string }>;
}

interface RequestDetailProps {
  request: FullRequest | null;
  currentUser: { id: string; name: string; initials: string; role: string };
  onClose: () => void;
  onCancel: (request: FullRequest) => void;
  onStatusChange?: (requestId: string, newStatus: RequestStatus) => void;
  messages?: ChatMessage[];
  onSendMessage?: (content: string) => void;
  sendingMessage?: boolean;
}

const MOCK_STATUS_LOG = [
  { status: 'submitted',   changedBy: 'Yong Choi',   at: '2026-03-01T09:14:00Z' },
  { status: 'assigned',    changedBy: 'Lex Baum',    at: '2026-03-01T11:30:00Z' },
  { status: 'in_progress', changedBy: 'Marcus Webb', at: '2026-03-02T08:00:00Z' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function RequestDetail({
  request,
  currentUser,
  onClose,
  onCancel,
  onStatusChange,
  messages = [],
  onSendMessage,
  sendingMessage = false,
}: RequestDetailProps) {
  const [briefOpen, setBriefOpen] = useState(true);
  const isOpen = !!request;

  return (
    <Sheet open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[640px] p-0 flex flex-col"
      >
        {request && (
          <>
            {/* Hidden accessible title */}
            <SheetTitle className="sr-only">{request.title}</SheetTitle>
            <SheetDescription className="sr-only">Request detail panel</SheetDescription>

            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--brand-primary)', lineHeight: 1.3, marginBottom: 6 }}>
                  {request.title}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <StatusBadge status={request.status} />
                  {request.isRush && <RushBadge />}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 28, height: 28, borderRadius: 'var(--brand-radius)',
                  background: 'var(--brand-surface-alt)', border: '1px solid var(--color-border)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: '#9CA3AF', flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* Metadata grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px 16px', padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)', flexShrink: 0,
            }}>
              <MetaItem label="Material Type" value={request.materialType} />
              <MetaItem label="Designer" value={request.designerName || 'Unassigned'} accent={!request.designerName} />
              <MetaItem label="Requester" value={request.requesterName} />
              <MetaItem label="Submitted" value={formatDate(request.submittedAt)} />
              <MetaItem label="Due Date" value={request.dueDate || '—'} />
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C4B9AA', marginBottom: 2 }}>SLA</div>
                <SLAIndicator deadline={request.slaDeadline} />
              </div>
            </div>

            {/* Action row */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
              {currentUser.role === 'agent' && request.status !== 'completed' && request.status !== 'cancelled' && (
                <Button variant="destructive" size="sm" onClick={() => onCancel(request)}>Cancel Request</Button>
              )}
              {currentUser.role === 'marketing_manager' && (
                <>
                  <Select onValueChange={v => onStatusChange?.(request.id, v as RequestStatus)}>
                    <SelectTrigger style={{ width: 160 }}>
                      <SelectValue placeholder="Assign designer..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lex">Lex Baum</SelectItem>
                      <SelectItem value="marcus">Marcus Webb</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => onStatusChange?.(request.id, 'in_progress')}>Start Work</Button>
                  <Button size="sm" variant="outline" onClick={() => onStatusChange?.(request.id, 'completed')}>Complete</Button>
                </>
              )}
              {currentUser.role === 'designer' && (
                <>
                  {request.status === 'assigned' && (
                    <Button size="sm" onClick={() => onStatusChange?.(request.id, 'in_progress')}>Start Work</Button>
                  )}
                  {request.status === 'in_progress' && (
                    <Button size="sm" variant="outline" onClick={() => onStatusChange?.(request.id, 'in_review')}>Mark Review</Button>
                  )}
                  {request.status === 'in_review' && (
                    <Button size="sm" variant="accent" onClick={() => onStatusChange?.(request.id, 'completed')}>Complete</Button>
                  )}
                </>
              )}
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Brief */}
              {request.brief && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: briefOpen ? 8 : 0 }}
                    onClick={() => setBriefOpen(v => !v)}
                  >
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>
                      Brief
                    </span>
                    <span style={{ fontSize: 10, color: '#9CA3AF', transform: briefOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>▶</span>
                  </div>
                  {briefOpen && (
                    <div style={{ fontSize: 12, color: 'var(--brand-primary)', lineHeight: 1.6 }}>
                      {request.brief}
                    </div>
                  )}
                </div>
              )}

              {/* Reference Files */}
              {request.referenceFiles && request.referenceFiles.length > 0 && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                  <SectionHeader title="Reference Files" count={request.referenceFiles.length} />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {request.referenceFiles.map((f, i) => (
                      <a
                        key={i}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: 64, height: 64, borderRadius: 'var(--brand-radius)',
                          overflow: 'hidden', border: '1px solid var(--color-border)',
                          background: f.url ? `url(${f.url}) center/cover` : 'var(--brand-surface-alt)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                      >
                        {!f.url && <span style={{ fontSize: 10, color: '#9CA3AF' }}>📄</span>}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <SectionHeader title="Status Timeline" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {MOCK_STATUS_LOG.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 12 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: i === MOCK_STATUS_LOG.length - 1 ? 'var(--brand-accent)' : 'var(--color-border)',
                          flexShrink: 0,
                        }} />
                        {i < MOCK_STATUS_LOG.length - 1 && (
                          <div style={{ width: 1, flex: 1, background: 'var(--color-border)', marginTop: 4 }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)', textTransform: 'capitalize' }}>
                          {entry.status.replace('_', ' ')}
                        </div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                          {entry.changedBy} · {formatDate(entry.at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
                <div style={{ padding: '12px 20px 0' }}>
                  <SectionHeader title="Thread" />
                </div>
                <ChatThread messages={messages} />
              </div>
            </div>

            {/* Chat input pinned to bottom */}
            {onSendMessage && (
              <ChatInput
                onSend={onSendMessage}
                sending={sendingMessage}
                placeholder={`Message as ${currentUser.name}...`}
              />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MetaItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C4B9AA', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: accent ? '#D97706' : 'var(--brand-primary)' }}>{value}</div>
    </div>
  );
}
