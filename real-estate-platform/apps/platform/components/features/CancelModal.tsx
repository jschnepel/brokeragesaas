'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { RequestStatus } from '@/components/primitives';

interface CancelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: { id: string; title: string; status: RequestStatus } | null;
  role: 'agent' | 'marketing_manager' | 'designer' | 'executive';
  onConfirm: (reason: string) => void;
  cancelling?: boolean;
}

export function CancelModal({ open, onOpenChange, request, role, onConfirm, cancelling = false }: CancelModalProps) {
  const [reason, setReason] = useState('');

  if (!request) return null;

  const isBlocked = role === 'agent' && request.status === 'in_progress';
  const truncatedTitle = request.title.length > 48 ? request.title.slice(0, 48) + '…' : request.title;
  const canConfirm = reason.length >= 10 && !cancelling;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 400, color: 'var(--brand-primary)' }}>
            Cancel Request
          </DialogTitle>
          <DialogDescription style={{ fontSize: 12 }}>
            {truncatedTitle}
          </DialogDescription>
        </DialogHeader>

        {isBlocked ? (
          <div>
            <div style={{
              display: 'flex', gap: 10, padding: '12px 14px',
              background: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 'var(--brand-radius)', marginBottom: 16,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
              <span style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                This request is in progress and cannot be cancelled. Contact your marketing manager.
              </span>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)} style={{ width: '100%' }}>
              Close
            </Button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4 }}>
                Reason for cancellation
              </div>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain why this request is being cancelled (min 10 characters)..."
                style={{ minHeight: 80 }}
              />
              {reason.length > 0 && reason.length < 10 && (
                <div style={{ fontSize: 10, color: '#DC2626', marginTop: 4 }}>
                  {10 - reason.length} more characters required
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Keep Request</Button>
              <Button
                variant="destructive"
                onClick={() => onConfirm(reason)}
                disabled={!canConfirm}
              >
                {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
