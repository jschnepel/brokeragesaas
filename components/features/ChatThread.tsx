"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CHAT_POLL_INTERVAL } from "@/lib/constants";
import { getMessages } from "@/actions/intake";
import { ChatInput } from "./ChatInput";
import type { MessageDTO } from "@/lib/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ChatThreadProps {
  requestId: string;
  currentUserId: string;
  className?: string;
}

export function ChatThread({ requestId, currentUserId, className }: ChatThreadProps) {
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await getMessages(requestId);
      setMessages(msgs);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [requestId]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Polling
  useEffect(() => {
    const interval = setInterval(fetchMessages, CHAT_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-xs text-[var(--muted)] py-8">
            No messages yet
          </p>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex flex-col max-w-[80%]", isOwn ? "ml-auto items-end" : "items-start")}
            >
              <span className="mb-0.5 text-[10px] font-medium text-[var(--muted)]">
                {msg.senderName}
              </span>
              <div
                className={cn(
                  "rounded-xl px-3 py-2 text-sm",
                  isOwn
                    ? "bg-[var(--accent)] text-white rounded-br-sm"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-sm",
                )}
              >
                {msg.body}
              </div>
              <span className="mt-0.5 text-[10px] text-[var(--muted)]">
                {formatTime(msg.createdAt)}
              </span>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-3">
        <ChatInput requestId={requestId} onSent={fetchMessages} />
      </div>
    </div>
  );
}
