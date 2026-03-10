"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/actions/intake";

interface ChatInputProps {
  requestId: string;
  onSent?: () => void;
}

export function ChatInput({ requestId, onSent }: ChatInputProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await sendMessage(requestId, text);
      setBody("");
      onSent?.();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a message..."
        disabled={sending}
        className={cn(
          "flex-1 rounded-lg border border-[var(--border)] bg-white/60 px-3 py-2 text-sm outline-none",
          "focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]",
          "disabled:opacity-50",
        )}
      />
      <button
        type="submit"
        disabled={sending || !body.trim()}
        className="flex size-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}
