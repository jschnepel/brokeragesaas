// lib/sse/events.ts

export type SSEEventType =
  | "request:submitted"
  | "request:assigned"
  | "request:resumed"
  | "request:updated"
  | "heartbeat";

export interface SSEEvent {
  type: SSEEventType;
  requestId: string;
  title: string;
  message: string;
  /** The request URL path for navigation */
  href: string;
}

export interface SSEHeartbeat {
  type: "heartbeat";
  timestamp: number;
}

export type SSEPayload = SSEEvent | SSEHeartbeat;

export function formatSSE(event: SSEPayload): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
