'use client';

import { useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  content: string;
  sentAt: string;
  isOwn: boolean;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  loading?: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ChatThread({ messages, loading = false }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        {/* Skeleton bubbles */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton className="h-8 w-8" style={{ borderRadius: '50%', flexShrink: 0 }} />
          <Skeleton className="h-12 w-48" style={{ borderRadius: 'var(--brand-radius)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Skeleton className="h-10 w-40" style={{ borderRadius: 'var(--brand-radius)' }} />
          <Skeleton className="h-8 w-8" style={{ borderRadius: '50%', flexShrink: 0 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton className="h-8 w-8" style={{ borderRadius: '50%', flexShrink: 0 }} />
          <Skeleton className="h-16 w-56" style={{ borderRadius: 'var(--brand-radius)' }} />
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#D1C9BC', fontSize: 12, padding: 40 }}>
        No messages yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, overflowY: 'auto', flex: 1 }}>
      {messages.map(msg => (
        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isOwn ? 'flex-end' : 'flex-start' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: msg.isOwn ? 'row-reverse' : 'row' }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: msg.isOwn ? 'var(--brand-primary)' : 'var(--brand-surface-alt)',
              border: msg.isOwn ? 'none' : '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: msg.isOwn ? 'white' : 'var(--brand-primary)',
              }}>
                {msg.senderInitials}
              </span>
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '75%', padding: '8px 12px',
              borderRadius: 'var(--brand-radius)', fontSize: 12, lineHeight: 1.5,
              background: msg.isOwn ? 'var(--brand-primary)' : 'white',
              color: msg.isOwn ? '#F9F6F1' : 'var(--brand-primary)',
              border: msg.isOwn ? 'none' : '1px solid var(--color-border)',
            }}>
              {!msg.isOwn && (
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 2 }}>
                  {msg.senderName}
                </div>
              )}
              {msg.content}
            </div>
          </div>
          <div style={{
            fontSize: 9, color: '#9CA3AF', fontFamily: 'var(--font-mono)',
            marginTop: 3,
            paddingLeft: msg.isOwn ? 0 : 40,
            paddingRight: msg.isOwn ? 40 : 0,
          }}>
            {timeAgo(msg.sentAt)}
          </div>
        </div>
      ))}
      <div ref={scrollRef} />
    </div>
  );
}

export type { ChatMessage };
