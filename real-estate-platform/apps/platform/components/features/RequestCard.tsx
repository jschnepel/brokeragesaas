'use client';

import { motion } from 'framer-motion';
import { StatusBadge, RushBadge, SLAIndicator } from '@/components/primitives';
import type { RequestStatus } from '@/components/primitives';
import { fadeIn } from '@/lib/motion';

interface RequestCardRequest {
  id: string;
  title: string;
  materialType: string;
  status: RequestStatus;
  isRush: boolean;
  designerName?: string;
  requesterName: string;
  submittedAt: string;
  slaDeadline: string | null;
  slaBreached: boolean;
  referenceFiles?: Array<{ url: string }>;
  lastMessage?: { preview: string; time: string };
  feasibilityFlag?: boolean;
}

interface RequestCardProps {
  request: RequestCardRequest;
  onClick: (request: RequestCardRequest) => void;
  onCancel?: (request: RequestCardRequest) => void;
  compact?: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RequestCard({ request, onClick, onCancel, compact = false }: RequestCardProps) {
  const isCancelled = request.status === 'cancelled';
  const thumbnail = request.referenceFiles?.find(f => f.url)?.url;
  const unassigned = !request.designerName;

  const borderLeft = request.slaBreached
    ? '4px solid #DC2626'
    : unassigned
    ? '4px solid #D97706'
    : '4px solid transparent';

  if (compact) {
    return (
      <motion.div {...fadeIn}>
        <div
          onClick={() => !isCancelled && onClick(request)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '10px 14px',
            background: 'white',
            border: '1px solid var(--color-border)',
            borderLeft,
            borderRadius: 'var(--brand-radius)',
            cursor: isCancelled ? 'default' : 'pointer',
            opacity: isCancelled ? 0.55 : 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!isCancelled) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--brand-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {request.title}
          </span>
          <span style={{ fontSize: 10, color: '#9CA3AF', width: 80, flexShrink: 0 }}>{request.materialType}</span>
          <span style={{ fontSize: 10, color: unassigned ? '#D97706' : 'var(--brand-primary)', width: 90, flexShrink: 0 }}>
            {request.designerName || 'Unassigned'}
          </span>
          <StatusBadge status={request.status} size="sm" />
          <SLAIndicator deadline={request.slaDeadline} size="sm" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...fadeIn}>
      <div
        style={{
          background: 'white',
          border: '1px solid var(--color-border)',
          borderLeft,
          borderRadius: 'var(--brand-radius)',
          overflow: 'hidden',
          opacity: isCancelled ? 0.55 : 1,
          transition: 'all 0.15s',
          position: 'relative',
          cursor: isCancelled ? 'default' : 'pointer',
        }}
        onClick={() => !isCancelled && onClick(request)}
        onMouseEnter={e => {
          if (!isCancelled) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Cancel button */}
        {onCancel && !isCancelled && request.status !== 'completed' && (
          <button
            onClick={e => { e.stopPropagation(); onCancel(request); }}
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 2,
              width: 24, height: 24, borderRadius: 'var(--brand-radius)',
              background: 'rgba(255,255,255,0.9)', border: '1px solid var(--color-border)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#9CA3AF', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            ×
          </button>
        )}

        {/* Top row: thumbnail + title + badges */}
        <div style={{ display: 'flex', gap: 12, padding: '14px 14px 0' }}>
          {/* Thumbnail */}
          <div style={{
            width: 72, height: 72, borderRadius: 'var(--brand-radius)', flexShrink: 0, overflow: 'hidden',
            background: thumbnail ? `url(${thumbnail}) center/cover no-repeat` : 'linear-gradient(135deg, var(--brand-primary) 0%, #1E3D6B 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {!thumbnail && (
              <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                {request.requesterName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            )}
          </div>

          {/* Title + badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: 'var(--brand-primary)', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6,
              paddingRight: onCancel ? 20 : 0,
            }}>
              {request.title}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <StatusBadge status={request.status} />
              {request.isRush && <RushBadge />}
            </div>
          </div>
        </div>

        {/* 2×2 detail grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px',
          padding: '12px 14px',
        }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C4B9AA', marginBottom: 2 }}>Type</div>
            <div style={{ fontSize: 11, color: 'var(--brand-primary)' }}>{request.materialType}</div>
          </div>
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C4B9AA', marginBottom: 2 }}>Designer</div>
            <div style={{ fontSize: 11, color: unassigned ? '#D97706' : 'var(--brand-primary)' }}>
              {request.designerName || 'Unassigned'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C4B9AA', marginBottom: 2 }}>Submitted</div>
            <div style={{ fontSize: 11, color: 'var(--brand-primary)' }}>{timeAgo(request.submittedAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C4B9AA', marginBottom: 2 }}>SLA</div>
            <SLAIndicator deadline={request.slaDeadline} />
          </div>
        </div>

        {/* Last message preview */}
        {request.lastMessage && (
          <div style={{
            margin: '0 14px 14px',
            padding: '6px 8px',
            background: 'var(--brand-surface)',
            border: '1px solid var(--color-border)',
            borderLeft: '2px solid var(--brand-accent)',
          }}>
            <div style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {request.lastMessage.preview}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
