"use client";

import { MessageSquare } from "lucide-react";
import { GlassCard } from "@/components/primitives";
import type { MessageRow } from "@/lib/types";

interface Props {
  messages: MessageRow[];
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function MessagesFeed({ messages }: Props) {
  return (
    <GlassCard>
      <h3
        className="mb-4 text-base font-semibold"
        style={{ fontFamily: "var(--brand-font-display)" }}
      >
        Recent Messages
      </h3>
      {messages.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No recent messages.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-surface-alt)]">
                <MessageSquare className="size-3.5 text-[var(--muted-foreground)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {m.sender_name ?? "Unknown"}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {timeAgo(m.created_at)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]">
                  {m.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
