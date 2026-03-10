// app/api/events/stream/route.ts

import { auth } from "@/auth";
import { connectionManager } from "@/lib/sse/connection-manager";
import { formatSSE } from "@/lib/sse/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role ?? "agent";

  let controllerRef: ReadableStreamDefaultController | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      connectionManager.addConnection(userId, role, controller);

      // Send initial connection confirmation
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(formatSSE({ type: "heartbeat", timestamp: Date.now() }))
      );

      // Heartbeat every 30s to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(formatSSE({ type: "heartbeat", timestamp: Date.now() }))
          );
        } catch {
          // Stream closed
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 30_000);
    },
    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (controllerRef) {
        connectionManager.removeConnection(userId, controllerRef);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
