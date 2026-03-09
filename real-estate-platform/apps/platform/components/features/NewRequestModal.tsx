'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { RushBadge } from '@/components/primitives';

interface NewRequestData {
  title: string;
  materialType: string;
  dueDate: string;
  isRush: boolean;
  brief: string;
  notes?: string;
  referenceFiles: File[];
}

interface NewRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewRequestData) => void;
  submitting?: boolean;
}

const MATERIAL_TYPES = [
  'Flyer', 'Social Pack', 'Email Campaign', 'Video Script',
  'Brochure', 'Report', 'Signage', 'Other',
];

export function NewRequestModal({ open, onOpenChange, onSubmit, submitting = false }: NewRequestModalProps) {
  const [title, setTitle] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRush, setIsRush] = useState(false);
  const [brief, setBrief] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = title.trim() && materialType && dueDate && brief.trim() && !submitting;

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    setFiles(prev => [...prev, ...Array.from(incoming)]);
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({ title, materialType, dueDate, isRush, brief, notes: notes || undefined, referenceFiles: files });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--brand-primary)' }}>
            New Marketing Request
          </DialogTitle>
        </DialogHeader>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>
          {/* 1. Title */}
          <div>
            <Label required>Project Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 16020 N Horseshoe Dr — Open House Flyer"
            />
          </div>

          {/* 2. Material Type */}
          <div>
            <Label required>Material Type</Label>
            <Select value={materialType} onValueChange={setMaterialType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Due Date */}
          <div>
            <Label required>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          {/* 4. Rush Toggle */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              background: isRush ? '#FEF3C7' : 'var(--brand-surface)',
              border: `1px solid ${isRush ? '#FDE68A' : 'var(--color-border)'}`,
              borderRadius: 'var(--brand-radius)',
              transition: 'all 0.2s',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: isRush ? '#92400E' : 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                Mark as RUSH
                {isRush && <RushBadge />}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>Prioritizes above standard queue</div>
            </div>
            <button
              type="button"
              onClick={() => setIsRush(v => !v)}
              style={{
                width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
                background: isRush ? '#D97706' : '#D1D5DB', transition: 'background 0.2s',
                position: 'relative', flexShrink: 0, border: 'none',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: isRush ? 20 : 3,
                width: 16, height: 16, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* 5. Brief */}
          <div>
            <Label required>Brief</Label>
            <Textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="Describe what you need..."
              style={{ minHeight: 80 }}
            />
          </div>

          {/* 6. Reference Files */}
          <div>
            <Label>Reference Files</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
              style={{
                border: `2px dashed ${dragging ? 'var(--brand-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--brand-radius)', padding: '20px 16px', textAlign: 'center',
                cursor: 'pointer', background: dragging ? '#F0F4FF' : 'var(--brand-surface)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-primary)' }}>Drop files or click to upload</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>Images, PDFs — any reference material</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={e => handleFiles(e.target.files)}
              />
            </div>
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {files.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '6px 10px', background: 'white',
                    border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)',
                  }}>
                    <span style={{ fontSize: 12 }}>📄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>{(f.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); removeFile(i); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 14, padding: 2, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes for the designer..."
              style={{ minHeight: 60 }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: '#9CA3AF', marginBottom: 4, display: 'flex', gap: 3,
    }}>
      {children}
      {required && <span style={{ color: '#DC2626' }}>*</span>}
    </div>
  );
}
