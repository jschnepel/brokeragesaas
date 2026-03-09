'use client';

export type RequestStatus =
  | 'draft' | 'submitted' | 'in_review' | 'assigned'
  | 'in_progress' | 'awaiting_materials' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<RequestStatus, { label: string; bg: string; color: string; border: string }> = {
  draft:               { label: 'Draft',              bg: '#F9FAFB',  color: '#6B7280', border: '#E5E7EB' },
  submitted:           { label: 'Submitted',          bg: '#EFF6FF',  color: '#1D4ED8', border: '#BFDBFE' },
  in_review:           { label: 'In Review',          bg: '#FFFBEB',  color: '#D97706', border: '#FDE68A' },
  assigned:            { label: 'Assigned',           bg: '#F0F9FF',  color: '#0369A1', border: '#BAE6FD' },
  in_progress:         { label: 'In Progress',        bg: '#F0FDF4',  color: '#15803D', border: '#BBF7D0' },
  awaiting_materials:  { label: 'Awaiting Materials', bg: '#FFF7ED',  color: '#C2410C', border: '#FED7AA' },
  completed:           { label: 'Completed',          bg: '#F8F5F0',  color: 'var(--brand-primary)', border: 'rgba(201,169,110,0.3)' },
  cancelled:           { label: 'Cancelled',          bg: '#F9FAFB',  color: '#9CA3AF', border: '#E5E7EB' },
};

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'default';
}

export function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: size === 'sm' ? 8 : 9,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: size === 'sm' ? '1px 5px' : '2px 7px',
      borderRadius: 'var(--brand-radius)',
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-body)',
    }}>
      {cfg.label}
    </span>
  );
}
