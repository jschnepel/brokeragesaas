'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, sending = false, disabled = false, placeholder = 'Type a message...' }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 80) + 'px';
    }
  }, [value]);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || sending || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-end',
      padding: '10px 12px', borderTop: '1px solid var(--color-border)',
      flexShrink: 0,
    }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={sending || disabled}
        rows={1}
        style={{
          flex: 1, border: '1px solid var(--color-border)',
          borderRadius: 'var(--brand-radius)', padding: '7px 10px',
          fontSize: 12, outline: 'none', background: 'var(--brand-surface)',
          color: 'var(--brand-primary)', fontFamily: 'var(--font-body)',
          resize: 'none', lineHeight: 1.5,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--brand-primary)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; }}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!value.trim() || sending || disabled}
        style={{ flexShrink: 0 }}
      >
        {sending ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
      </Button>
    </div>
  );
}
