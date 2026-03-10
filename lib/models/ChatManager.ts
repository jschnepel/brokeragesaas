import type { MessageDTO } from "@/lib/types";
import { CHAT_POLL_INTERVAL } from "@/lib/constants";

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
  senderId: string;
  isOwn: boolean;
  formattedTime: string;
}

export class ChatManager {
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(
    public readonly requestId: string,
    public readonly currentUserId: string,
    private fetchFn: (requestId: string) => Promise<MessageDTO[]>,
    private sendFn: (requestId: string, body: string) => Promise<MessageDTO>,
    private pollInterval: number = CHAT_POLL_INTERVAL,
  ) {}

  /**
   * Transform raw DTOs into display-ready messages
   */
  toDisplayMessages(messages: MessageDTO[]): ChatMessage[] {
    return messages.map((m) => ({
      id: m.id,
      senderName: m.senderName,
      senderRole: m.senderRole,
      body: m.body,
      createdAt: m.createdAt,
      senderId: m.senderId,
      isOwn: m.senderId === this.currentUserId,
      formattedTime: ChatManager.formatTime(m.createdAt),
    }));
  }

  async fetchMessages(): Promise<MessageDTO[]> {
    return this.fetchFn(this.requestId);
  }

  async sendMessage(body: string): Promise<MessageDTO> {
    return this.sendFn(this.requestId, body.trim());
  }

  startPolling(onMessages: (msgs: MessageDTO[]) => void): void {
    this.stopPolling();
    this.interval = setInterval(async () => {
      try {
        const msgs = await this.fetchMessages();
        onMessages(msgs);
      } catch {
        // silently continue polling
      }
    }, this.pollInterval);
  }

  stopPolling(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // ── Static helpers ─────────────────────────────────────────

  static formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  static timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  static initials(name: string): string {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
}
